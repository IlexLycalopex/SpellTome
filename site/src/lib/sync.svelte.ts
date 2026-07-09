/**
 * tomeSync v2 — Supabase sync driver ported from assets/js/sync.js to a
 * Svelte 5 reactive module. Semantics preserved exactly:
 *   - local-first: reads are synchronous from localStorage
 *   - debounced push of dirty synced collections (last-write-wins)
 *   - pull on start; dirty local collections win until pushed
 *   - vault model: one campaigns row per group; invite claim on sign-in
 *
 * TRANSITION NOTE: while the old site (at /) and this one (at /next/) are
 * both live they must share one server model, so this driver still syncs
 * whole-collection blobs into tome_collections. The flip to the normalized
 * tool_state table + scripts/migrate-tool-state.ts happens at cutover.
 */
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { REGISTRY, onSet, type CollectionName } from './store';

const META_KEY = 'tome_sync_meta_v1';
const PUSH_DEBOUNCE_MS = 2000;

export type SyncState = 'init' | 'unavailable' | 'signedout' | 'syncing' | 'synced' | 'error';

interface SyncMeta {
  vaultId?: string;
  adminVaultId?: string;
  synced?: Record<string, string>;
  dirty?: string[];
}

function loadMeta(): SyncMeta {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? '') || {};
  } catch {
    return {};
  }
}

class TomeSync {
  state = $state<SyncState>('init');
  user = $state<User | null>(null);
  vaultId = $state<string | null>(null);
  isGm = $state(false);
  isAdmin = $state(false);
  lastSyncAt = $state<string | null>(null);
  errorDetail = $state('');

  private dirty = new Set<string>(loadMeta().dirty ?? []);
  private pushTimer: ReturnType<typeof setTimeout> | undefined;
  private started = false;

  private saveMeta(patch: Partial<SyncMeta> = {}) {
    const meta = { ...loadMeta(), ...patch, dirty: [...this.dirty] };
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
      /* ignore */
    }
    return meta;
  }

  /** Call once from a browser context (island onMount). Safe to re-call. */
  init() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    const client = getSupabase();
    onSet((name, scope) => {
      if (scope === 'synced') this.markDirty(name);
    });
    // Old-site pages fire the same event; harmless double-marking.
    client.auth.onAuthStateChange((_event, session: Session | null) => {
      const next = session?.user ?? null;
      const changed = next?.id !== this.user?.id;
      this.user = next;
      if (changed) {
        if (next) void this.start();
        else {
          this.vaultId = null;
          this.isGm = false;
          this.state = 'signedout';
        }
      }
    });
    client.auth
      .getSession()
      .then(({ data }) => {
        this.user = data.session?.user ?? null;
        if (this.user) void this.start();
        else this.state = 'signedout';
      })
      .catch(() => {
        this.state = 'error';
        this.errorDetail = 'auth';
      });
  }

  async signIn(email: string) {
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split('#')[0] },
    });
    if (error) throw error;
  }

  async signOut() {
    await getSupabase().auth.signOut();
  }

  private async start() {
    try {
      this.state = 'syncing';
      await this.detectAdmin();
      await this.claimInvitations();
      await this.ensureVault();
      await this.pullAll();
      await this.pushDirty();
      this.lastSyncAt = new Date().toISOString();
      this.state = 'synced';
    } catch (error) {
      this.state = 'error';
      this.errorDetail = error instanceof Error ? error.message : String(error);
    }
  }

  private async claimInvitations() {
    const email = this.user?.email;
    if (!email) return;
    await getSupabase()
      .from('campaign_members')
      .update({ user_id: this.user!.id })
      .is('user_id', null)
      .eq('invited_email', email);
  }

  private async detectAdmin() {
    try {
      const { data } = await getSupabase().rpc('am_i_admin');
      this.isAdmin = data === true;
    } catch {
      this.isAdmin = false;
    }
  }

  private async ensureVault() {
    const client = getSupabase();
    const meta = loadMeta();
    const memberships = await client
      .from('campaign_members')
      .select('campaign_id,role')
      .eq('user_id', this.user!.id);
    if (memberships.error) throw memberships.error;
    const mine = memberships.data ?? [];

    if (this.isAdmin && meta.adminVaultId) {
      this.vaultId = meta.adminVaultId;
    } else if (mine.length) {
      const preferred = mine.find((m) => m.campaign_id === meta.vaultId) ?? mine[0]!;
      this.vaultId = preferred.campaign_id;
    } else {
      const ins = await client
        .from('campaigns')
        .insert({
          name: `Vault — ${this.user?.email ?? 'group'}`,
          description: 'Shared data vault for The Tome',
        })
        .select('id')
        .single();
      if (ins.error) throw ins.error;
      this.vaultId = ins.data.id;
    }
    const me = mine.find((m) => m.campaign_id === this.vaultId);
    this.isGm = me?.role === 'gm' || (!me && this.isAdmin) || mine.length === 0;
    this.saveMeta({ vaultId: this.vaultId ?? undefined });
  }

  async listVaults() {
    const { data, error } = await getSupabase().from('campaigns').select('id,name,created_at');
    if (error) throw error;
    return data ?? [];
  }

  /** Point this device at another vault; unpushed local changes are dropped. */
  async switchVault(id: string) {
    this.dirty.clear();
    this.saveMeta({ vaultId: id, adminVaultId: this.isAdmin ? id : undefined, synced: {} });
    this.vaultId = id;
    this.state = 'syncing';
    await this.pullAll();
    this.lastSyncAt = new Date().toISOString();
    this.state = 'synced';
  }

  private readRawLocal(name: string): string | null {
    const entry = REGISTRY[name as CollectionName];
    try {
      return localStorage.getItem(entry.key);
    } catch {
      return null;
    }
  }

  private writeRawLocal(name: string, jsonbValue: unknown): boolean {
    const entry = REGISTRY[name as CollectionName];
    const raw = 'raw' in entry && entry.raw ? String(jsonbValue) : JSON.stringify(jsonbValue);
    try {
      localStorage.setItem(entry.key, raw);
      return true;
    } catch {
      return false;
    }
  }

  private async pullAll() {
    const { data, error } = await getSupabase()
      .from('tome_collections')
      .select('collection,data,updated_at')
      .eq('campaign_id', this.vaultId!);
    if (error) throw error;
    const meta = loadMeta();
    const synced = meta.synced ?? {};
    const applied: string[] = [];
    for (const row of data ?? []) {
      const name = row.collection as string;
      if (!(name in REGISTRY)) continue;
      if (this.dirty.has(name)) continue; // local change wins until pushed
      if (synced[name] && row.updated_at <= synced[name]!) continue;
      if (this.writeRawLocal(name, row.data)) {
        synced[name] = row.updated_at;
        applied.push(name);
      }
    }
    this.saveMeta({ synced });
    if (applied.length) {
      try {
        window.dispatchEvent(new CustomEvent('tome:remote-update', { detail: { collections: applied } }));
      } catch {
        /* ignore */
      }
    }
  }

  private markDirty(name: string) {
    this.dirty.add(name);
    this.saveMeta();
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.pushDirty(), PUSH_DEBOUNCE_MS);
  }

  async pushDirty() {
    if (!this.user || !this.vaultId || this.dirty.size === 0) return;
    const names = [...this.dirty];
    const now = new Date().toISOString();
    const rows = names
      .map((name) => {
        const entry = REGISTRY[name as CollectionName];
        const raw = this.readRawLocal(name);
        if (raw === null) return null;
        let data: unknown;
        if ('raw' in entry && entry.raw) data = raw;
        else {
          try {
            data = JSON.parse(raw);
          } catch {
            return null;
          }
        }
        return { campaign_id: this.vaultId, collection: name, data, updated_at: now, updated_by: this.user!.id };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (!rows.length) {
      names.forEach((n) => this.dirty.delete(n));
      this.saveMeta();
      return;
    }
    const { error } = await getSupabase()
      .from('tome_collections')
      .upsert(rows, { onConflict: 'campaign_id,collection' });
    if (error) {
      this.state = 'error';
      this.errorDetail = error.message;
      return;
    }
    const meta = loadMeta();
    const synced = meta.synced ?? {};
    names.forEach((n) => {
      this.dirty.delete(n);
      synced[n] = now;
    });
    this.saveMeta({ synced });
    this.lastSyncAt = now;
    this.state = 'synced';
  }

  async inviteMember(email: string, role: 'gm' | 'player') {
    if (!this.vaultId) throw new Error('Not connected to the vault yet.');
    const { error } = await getSupabase().from('campaign_members').insert({
      campaign_id: this.vaultId,
      invited_email: email.trim().toLowerCase(),
      role,
      display_name: '',
    });
    if (error) throw error;
  }

  async listMembers() {
    if (!this.vaultId) return [];
    const { data, error } = await getSupabase()
      .from('campaign_members')
      .select('display_name,invited_email,role,user_id')
      .eq('campaign_id', this.vaultId);
    if (error) throw error;
    return data ?? [];
  }

  get pendingPush() {
    return this.dirty.size;
  }
}

export const tomeSync = new TomeSync();
