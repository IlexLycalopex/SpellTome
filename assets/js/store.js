/* ============================================================
   STORE.JS — tomeStore: central storage adapter (shared)

   All Tome data flows through this module instead of raw
   localStorage calls. Today it wraps localStorage; the planned
   Supabase backend will slot in behind the same get/set API
   (see docs/BACKEND_PLAN.md). The registry is also what powers
   whole-site backup/restore on the hub.

   scope 'synced'  — campaign data destined for the shared backend
   scope 'device'  — personal/transient state that stays local
   raw true        — stored as a plain string, not JSON
   ============================================================ */

const tomeStore = (() => {

  const REGISTRY = {
    party:          { key: 'tome_party_v1',                      scope: 'synced', label: 'Party roster' },
    activeCampaign: { key: 'tome_active_campaign_v1',            scope: 'synced', label: 'Selected campaign', raw: true },
    combatState:    { key: 'tome_combat_tracker_v1',             scope: 'synced', label: 'Combat tracker state' },
    encounters:     { key: 'tome_encounters_v1',                 scope: 'synced', label: 'Saved encounters' },
    mapMarkers:     { key: 'tome_map_markers_v1',                scope: 'synced', label: 'Campaign map markers' },
    diceSaved:      { key: 'diceSaved_v1',                       scope: 'synced', label: 'Saved dice rolls' },
    combatQueue:    { key: 'tome_combat_queue_v1',               scope: 'device', label: 'Combat import queue' },
    npcQueue:       { key: 'tome_npc_queue_v1',                  scope: 'device', label: 'NPC handoff queue' },
    npcHistory:     { key: 'tome_npc_history_v1',                scope: 'device', label: 'NPC generator history' },
    lootHistory:    { key: 'tome_loot_history_v1',               scope: 'device', label: 'Loot generator history' },
    diceHistory:    { key: 'diceHistory_v2',                     scope: 'device', label: 'Dice roll history' },
    logDraft:       { key: 'spelltome-campaign-log-builder-v1',  scope: 'device', label: 'Log builder draft' },
    theme:          { key: 'tome-theme',                         scope: 'device', label: 'Theme preference', raw: true }
  };

  function entry(name) {
    const e = REGISTRY[name];
    if (!e) throw new Error('tomeStore: unknown collection "' + name + '"');
    return e;
  }

  /** Read a collection. Returns `fallback` when missing or unreadable. */
  function get(name, fallback = null) {
    const e = entry(name);
    try {
      const value = localStorage.getItem(e.key);
      if (value === null) return fallback;
      return e.raw ? value : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  /** Write a collection. Returns false when storage is unavailable/full. */
  function set(name, value) {
    const e = entry(name);
    try {
      localStorage.setItem(e.key, e.raw ? String(value) : JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function remove(name) {
    const e = entry(name);
    try { localStorage.removeItem(e.key); } catch (error) {}
  }

  /* ── BACKUP / RESTORE ──────────────────────────────────────── */

  /** Snapshot every known key as its raw stored string (exact round-trip). */
  function exportAll() {
    const data = {};
    Object.values(REGISTRY).forEach(e => {
      try {
        const value = localStorage.getItem(e.key);
        if (value !== null) data[e.key] = value;
      } catch (error) {}
    });
    return {
      app: 'the-tome',
      format: 1,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  function downloadBackup() {
    const snapshot = exportAll();
    const count = Object.keys(snapshot.data).length;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tome-backup-' + snapshot.exportedAt.slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return count;
  }

  /**
   * Restore a backup object produced by exportAll(). Only keys present in
   * the registry are written — unknown keys in the file are ignored.
   * Returns { restored, skipped } or throws on an invalid file.
   */
  function importBackup(snapshot) {
    if (!snapshot || snapshot.app !== 'the-tome' || typeof snapshot.data !== 'object' || snapshot.data === null) {
      throw new Error('Not a Tome backup file.');
    }
    const known = new Set(Object.values(REGISTRY).map(e => e.key));
    let restored = 0;
    let skipped = 0;
    Object.entries(snapshot.data).forEach(([key, value]) => {
      if (!known.has(key) || typeof value !== 'string') { skipped += 1; return; }
      try {
        localStorage.setItem(key, value);
        restored += 1;
      } catch (error) {
        skipped += 1;
      }
    });
    return { restored, skipped };
  }

  return { get, set, remove, exportAll, downloadBackup, importBackup, REGISTRY };
})();
