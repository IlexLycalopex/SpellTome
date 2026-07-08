/**
 * tomeStore v2 — the same central storage adapter the old site used
 * (assets/js/store.js), ported to TypeScript. localStorage keys are
 * IDENTICAL to the old site's so nothing is lost at cutover: both sites
 * share the same origin, so /next/ and / read the same storage.
 */

export type Scope = 'synced' | 'device';

interface RegistryEntry {
  key: string;
  scope: Scope;
  label: string;
  raw?: boolean;
}

export const REGISTRY = {
  campaigns: { key: 'tome_campaigns_v1', scope: 'synced', label: 'Campaign registry' },
  party: { key: 'tome_party_v1', scope: 'synced', label: 'Party roster' },
  characterCards: { key: 'tome_character_cards_v1', scope: 'synced', label: 'Character cards' },
  activeCampaign: { key: 'tome_active_campaign_v1', scope: 'synced', label: 'Selected campaign', raw: true },
  combatState: { key: 'tome_combat_tracker_v1', scope: 'synced', label: 'Combat tracker state' },
  encounters: { key: 'tome_encounters_v1', scope: 'synced', label: 'Saved encounters' },
  mapMarkers: { key: 'tome_map_markers_v1', scope: 'synced', label: 'Campaign map markers' },
  diceSaved: { key: 'diceSaved_v1', scope: 'synced', label: 'Saved dice rolls' },
  combatQueue: { key: 'tome_combat_queue_v1', scope: 'device', label: 'Combat import queue' },
  npcQueue: { key: 'tome_npc_queue_v1', scope: 'device', label: 'NPC handoff queue' },
  npcHistory: { key: 'tome_npc_history_v1', scope: 'device', label: 'NPC generator history' },
  lootHistory: { key: 'tome_loot_history_v1', scope: 'device', label: 'Loot generator history' },
  diceHistory: { key: 'diceHistory_v2', scope: 'device', label: 'Dice roll history' },
  logDraft: { key: 'spelltome-campaign-log-builder-v1', scope: 'device', label: 'Log builder draft' },
  theme: { key: 'tome-theme', scope: 'device', label: 'Theme preference', raw: true },
} satisfies Record<string, RegistryEntry>;

export type CollectionName = keyof typeof REGISTRY;

type Listener = (name: CollectionName, scope: Scope) => void;
const listeners = new Set<Listener>();

/** Subscribe to writes (the sync driver uses this to mark dirty). */
export function onSet(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function get<T = unknown>(name: CollectionName, fallback: T | null = null): T | null {
  const e = REGISTRY[name];
  try {
    const value = localStorage.getItem(e.key);
    if (value === null) return fallback;
    return ('raw' in e && e.raw ? value : JSON.parse(value)) as T;
  } catch {
    return fallback;
  }
}

export function set(name: CollectionName, value: unknown): boolean {
  const e = REGISTRY[name];
  try {
    localStorage.setItem(e.key, 'raw' in e && e.raw ? String(value) : JSON.stringify(value));
  } catch {
    return false;
  }
  for (const fn of listeners) fn(name, e.scope);
  // Keep the old site's event contract alive while both sites coexist.
  try {
    window.dispatchEvent(new CustomEvent('tome:set', { detail: { name, scope: e.scope } }));
  } catch {
    /* non-browser */
  }
  return true;
}

export function remove(name: CollectionName): void {
  try {
    localStorage.removeItem(REGISTRY[name].key);
  } catch {
    /* ignore */
  }
}
