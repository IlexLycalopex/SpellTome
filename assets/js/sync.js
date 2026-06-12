/* ============================================================
   SYNC.JS — tomeSync: Supabase sync driver (shared)

   Local-first sync for every tomeStore collection with scope
   'synced'. Reads stay synchronous from localStorage; this module
   pushes changed collections to Supabase in the background and
   pulls newer server state on page load.

   Server model (docs/BACKEND_PLAN.md): one shared "vault" row in
   public.campaigns holds the whole group's data; the first member
   to sign in creates it (becoming GM via trigger) and invites the
   rest by email (campaign_members.invited_email binds to their
   account at first sign-in). All synced collections live in
   public.tome_collections keyed by (vault id, collection name),
   protected by row-level security.

   Degrades silently: signed out, offline, or with the supabase-js
   CDN script blocked, every page works exactly as before.
   ============================================================ */

const tomeSync = (() => {
  const SUPABASE_URL = 'https://edmeogmkquhslpvjelyq.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbWVvZ21rcXVoc2xwdmplbHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDc4NDAsImV4cCI6MjA5Njc4Mzg0MH0.xOnV3Jt8CI3owyUMhFrpoKfQz7VLG2vRI63iCu6CvaU';
  // Each group gets its own vault; the name is informational only.
  function defaultVaultName() {
    return 'Vault \u2014 ' + (user && user.email ? user.email : 'group');
  }
  const META_KEY = 'tome_sync_meta_v1';     // { vaultId, synced: { collection: iso } }
  const PUSH_DEBOUNCE_MS = 2000;

  let client = null;
  let user = null;
  let vaultId = null;
  let isGm = false;
  let isAdmin = false;
  let pushTimer = null;
  let lastSyncAt = null;
  let state = 'init';                        // init|unavailable|signedout|syncing|synced|error
  const dirty = new Set(loadMeta().dirty || []);

  /* ── meta ──────────────────────────────────────────────────── */
  function loadMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveMeta(patch) {
    const meta = Object.assign(loadMeta(), patch, { dirty: [...dirty] });
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
    return meta;
  }

  function syncedNames() {
    return Object.keys(tomeStore.REGISTRY).filter(n => tomeStore.REGISTRY[n].scope === 'synced');
  }

  function setState(next, detail) {
    state = next;
    try {
      window.dispatchEvent(new CustomEvent('tome:sync-state', { detail: { state, user, isGm, isAdmin, vaultId, lastSyncAt, detail } }));
    } catch (e) {}
  }

  /* ── init / auth ───────────────────────────────────────────── */
  function init() {
    if (typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) {
      setState('unavailable');
      return;
    }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.addEventListener('tome:set', e => {
      if (e.detail && e.detail.scope === 'synced') markDirty(e.detail.name);
    });
    client.auth.onAuthStateChange((event, session) => {
      const nextUser = session ? session.user : null;
      const changed = (nextUser && nextUser.id) !== (user && user.id);
      user = nextUser;
      if (changed) {
        if (user) { void start(); }
        else { vaultId = null; isGm = false; setState('signedout'); }
      }
    });
    client.auth.getSession().then(({ data }) => {
      user = data.session ? data.session.user : null;
      if (user) void start();
      else setState('signedout');
    }).catch(() => setState('error', 'auth'));
  }

  async function signIn(email) {
    if (!client) throw new Error('Sync is unavailable in this browser session.');
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split('#')[0] }
    });
    if (error) throw error;
  }

  async function signOut() {
    if (client) await client.auth.signOut();
  }

  /* ── vault ─────────────────────────────────────────────────── */
  async function start() {
    try {
      setState('syncing');
      await detectAdmin();
      await claimInvitations();
      await ensureVault();
      await pullAll();
      await pushDirty();
      lastSyncAt = new Date().toISOString();
      setState('synced');
    } catch (error) {
      setState('error', String(error && error.message || error));
    }
  }

  // Bind any invitation rows matching this account's email.
  async function claimInvitations() {
    const email = user && user.email;
    if (!email) return;
    await client.from('campaign_members')
      .update({ user_id: user.id })
      .is('user_id', null)
      .eq('invited_email', email);
  }

  async function detectAdmin() {
    try {
      const { data } = await client.rpc('am_i_admin');
      isAdmin = data === true;
    } catch (e) { isAdmin = false; }
  }

  // Vault resolution: the vaults this user belongs to come first (an admin
  // can see every tenant, but must not silently adopt someone else's).
  // Admins may pin any vault via switchVault(); the choice persists.
  async function ensureVault() {
    const meta = loadMeta();
    const memberships = await client.from('campaign_members')
      .select('campaign_id,role').eq('user_id', user.id);
    if (memberships.error) throw memberships.error;
    const mine = memberships.data || [];

    if (isAdmin && meta.adminVaultId) {
      vaultId = meta.adminVaultId;
    } else if (mine.length) {
      const preferred = mine.find(m => m.campaign_id === meta.vaultId) || mine[0];
      vaultId = preferred.campaign_id;
    } else {
      const ins = await client.from('campaigns')
        .insert({ name: defaultVaultName(), description: 'Shared data vault for The Tome' })
        .select('id').single();
      if (ins.error) throw ins.error;
      vaultId = ins.data.id;
    }
    const me = mine.find(m => m.campaign_id === vaultId);
    isGm = Boolean(me && me.role === 'gm') || (!me && isAdmin) || (!mine.length);
    saveMeta({ vaultId });
  }

  /** All vaults this user can see (admins: every tenant). */
  async function listVaults() {
    const { data, error } = await client.from('campaigns').select('id,name,created_at');
    if (error) throw error;
    return data || [];
  }

  /**
   * Point this device at another vault (admin repair work, or a player in
   * two groups). Clears local sync bookkeeping so the target vault's data
   * is pulled fresh; un-pushed local changes are deliberately dropped
   * rather than written into the wrong tenant.
   */
  async function switchVault(id) {
    dirty.clear();
    saveMeta({ vaultId: id, adminVaultId: isAdmin ? id : undefined, synced: {} });
    vaultId = id;
    setState('syncing');
    await pullAll();
    lastSyncAt = new Date().toISOString();
    setState('synced');
  }

  /* ── pull / push ───────────────────────────────────────────── */
  function readRawLocal(name) {
    const entry = tomeStore.REGISTRY[name];
    try { return localStorage.getItem(entry.key); } catch (e) { return null; }
  }

  function writeRawLocal(name, jsonbValue) {
    const entry = tomeStore.REGISTRY[name];
    const raw = entry.raw ? String(jsonbValue) : JSON.stringify(jsonbValue);
    try { localStorage.setItem(entry.key, raw); return true; } catch (e) { return false; }
  }

  async function pullAll() {
    const { data, error } = await client.from('tome_collections')
      .select('collection,data,updated_at').eq('campaign_id', vaultId);
    if (error) throw error;
    const meta = loadMeta();
    const synced = meta.synced || {};
    const applied = [];
    (data || []).forEach(row => {
      const name = row.collection;
      if (!tomeStore.REGISTRY[name]) return;
      if (dirty.has(name)) return;                       // local change wins until pushed
      if (synced[name] && row.updated_at <= synced[name]) return;
      if (writeRawLocal(name, row.data)) {
        synced[name] = row.updated_at;
        applied.push(name);
      }
    });
    saveMeta({ synced });
    if (applied.length) {
      try { window.dispatchEvent(new CustomEvent('tome:remote-update', { detail: { collections: applied } })); } catch (e) {}
    }
  }

  function markDirty(name) {
    dirty.add(name);
    saveMeta({});
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { void pushDirty(); }, PUSH_DEBOUNCE_MS);
  }

  async function pushDirty() {
    if (!client || !user || !vaultId || dirty.size === 0) return;
    const names = [...dirty];
    const now = new Date().toISOString();
    const rows = names.map(name => {
      const entry = tomeStore.REGISTRY[name];
      const raw = readRawLocal(name);
      if (raw === null) return null;
      let data;
      if (entry.raw) data = raw;
      else { try { data = JSON.parse(raw); } catch (e) { return null; } }
      return { campaign_id: vaultId, collection: name, data, updated_at: now, updated_by: user.id };
    }).filter(Boolean);
    if (!rows.length) { names.forEach(n => dirty.delete(n)); saveMeta({}); return; }
    const { error } = await client.from('tome_collections')
      .upsert(rows, { onConflict: 'campaign_id,collection' });
    if (error) { setState('error', error.message); return; }
    const meta = loadMeta();
    const synced = meta.synced || {};
    names.forEach(n => { dirty.delete(n); synced[n] = now; });
    saveMeta({ synced });
    lastSyncAt = now;
    setState('synced');
  }

  /* ── membership (GM) ───────────────────────────────────────── */
  async function inviteMember(email, role) {
    if (!vaultId) throw new Error('Not connected to the vault yet.');
    const { error } = await client.from('campaign_members').insert({
      campaign_id: vaultId,
      invited_email: String(email).trim().toLowerCase(),
      role: role === 'gm' ? 'gm' : 'player',
      display_name: ''
    });
    if (error) throw error;
  }

  async function listMembers() {
    if (!vaultId) return [];
    const { data, error } = await client.from('campaign_members')
      .select('display_name,invited_email,role,user_id').eq('campaign_id', vaultId);
    if (error) throw error;
    return data || [];
  }

  function status() {
    return { state, user, isGm, isAdmin, vaultId, lastSyncAt, pendingPush: dirty.size };
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  return { signIn, signOut, status, inviteMember, listMembers, listVaults, switchVault, pushDirty, init };
})();
