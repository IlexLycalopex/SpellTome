<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '@lib/supabase';
  import { tomeSync } from '@lib/sync.svelte';
  import { get as storeGet, set as storeSet } from '@lib/store';
  import { RULESETS, RULESET_LIST, type RulesetId } from '@rulesets/index';
  import { rollDie } from '@lib/dice/rng';

  interface Combatant {
    id: string;
    name: string;
    kind: 'pc' | 'ally' | 'enemy';
    init: number;
    hp: number;
    maxHp: number;
    ac: number | null;
    conditions: string[];
    note: string;
  }
  interface CombatState {
    combatants: Combatant[];
    round: number;
    turnIndex: number;
    rulesetId: RulesetId;
  }

  const EMPTY: CombatState = { combatants: [], round: 1, turnIndex: 0, rulesetId: 'dnd5e' };

  // Same synced collection the old tracker used — state carries over and
  // syncs through the vault like before.
  let combat = $state<CombatState>(EMPTY);
  let name = $state('');
  let kind = $state<'pc' | 'ally' | 'enemy'>('enemy');
  let hp = $state(10);
  let ac = $state<number | null>(null);
  let init = $state<number | null>(null);
  let live = $state(false);

  const ruleset = $derived(RULESETS[combat.rulesetId] ?? RULESETS.dnd5e);
  const ordered = $derived(combat.combatants.toSorted((a, b) => b.init - a.init));

  function load() {
    const raw = storeGet<Partial<CombatState>>('combatState', null);
    if (raw && Array.isArray(raw.combatants)) {
      combat = { ...EMPTY, ...raw, rulesetId: (raw.rulesetId as RulesetId) ?? 'dnd5e' };
    }
  }

  onMount(() => {
    tomeSync.init();
    load();
    window.addEventListener('tome:remote-update', (e) => {
      const detail = (e as CustomEvent<{ collections: string[] }>).detail;
      if (detail?.collections?.includes('combatState')) load();
    });

    // Instant updates between devices: watch the vault's combatState row.
    const timer = setInterval(() => {
      if (!tomeSync.vaultId || live) return;
      live = true;
      clearInterval(timer);
      getSupabase()
        .channel('combat-live')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tome_collections',
            filter: `campaign_id=eq.${tomeSync.vaultId}`,
          },
          (payload) => {
            const row = payload.new as { collection?: string; data?: Partial<CombatState> } | null;
            if (row?.collection === 'combatState' && row.data && tomeSync.pendingPush === 0) {
              combat = { ...EMPTY, ...row.data, rulesetId: (row.data.rulesetId as RulesetId) ?? 'dnd5e' };
              try {
                localStorage.setItem('tome_combat_tracker_v1', JSON.stringify(row.data));
              } catch { /* ignore */ }
            }
          },
        )
        .subscribe();
    }, 500);
  });

  function persist() {
    // reassign to trigger reactivity, then write through the synced store
    combat = { ...combat, combatants: [...combat.combatants] };
    storeSet('combatState', combat);
  }

  function add() {
    if (!name.trim()) return;
    combat.combatants.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      kind,
      init: init ?? rollDie(20),
      hp,
      maxHp: hp,
      ac,
      conditions: [],
      note: '',
    });
    name = '';
    init = null;
    persist();
  }

  function damage(c: Combatant, amount: number) {
    c.hp = Math.min(Math.max(c.hp - amount, 0), c.maxHp);
    persist();
  }

  function toggleCondition(c: Combatant, cond: string) {
    c.conditions = c.conditions.includes(cond)
      ? c.conditions.filter((x) => x !== cond)
      : [...c.conditions, cond];
    persist();
  }

  function remove(c: Combatant) {
    combat.combatants = combat.combatants.filter((x) => x.id !== c.id);
    if (combat.turnIndex >= combat.combatants.length) combat.turnIndex = 0;
    persist();
  }

  function nextTurn() {
    if (!ordered.length) return;
    combat.turnIndex += 1;
    if (combat.turnIndex >= ordered.length) {
      combat.turnIndex = 0;
      combat.round += 1;
    }
    persist();
  }

  function reset() {
    if (!confirm('End combat and clear the tracker?')) return;
    combat = { ...EMPTY, rulesetId: combat.rulesetId };
    persist();
  }

  function setRuleset(id: RulesetId) {
    combat.rulesetId = id;
    persist();
  }

  let expanded = $state<string | null>(null);
</script>

<div class="chip-row" style="margin-bottom:.8rem;">
  {#each RULESET_LIST as rs (rs.id)}
    <button class="chip" class:on={combat.rulesetId === rs.id} onclick={() => setRuleset(rs.id)}>{rs.name}</button>
  {/each}
  {#if live}<span class="chip live"><span class="dot"></span>Live</span>{/if}
</div>

<div class="card adder">
  <div class="row">
    <input type="text" placeholder="Name" bind:value={name} aria-label="Combatant name" onkeydown={(e) => e.key === 'Enter' && add()} />
    <select bind:value={kind} aria-label="Side">
      <option value="enemy">Enemy</option>
      <option value="pc">PC</option>
      <option value="ally">Ally</option>
    </select>
    <label>HP <input type="number" min="1" bind:value={hp} /></label>
    <label>AC <input type="number" bind:value={ac} placeholder="—" /></label>
    <label>Init <input type="number" bind:value={init} placeholder="roll" /></label>
    <button class="btn" onclick={add}>Add</button>
  </div>
</div>

{#if ordered.length}
  <div class="row bar">
    <span class="round num">Round {combat.round}</span>
    <button class="btn" onclick={nextTurn}>Next turn</button>
    <span style="flex:1"></span>
    <button class="btn ghost danger" onclick={reset}>End combat</button>
  </div>

  <ol class="list">
    {#each ordered as c, i (c.id)}
      <li class="card fighter" class:up={i === combat.turnIndex} class:down={c.hp === 0} data-kind={c.kind}>
        <div class="main">
          <span class="init num">{c.init}</span>
          <button class="nm" onclick={() => (expanded = expanded === c.id ? null : c.id)}>{c.name}</button>
          {#if c.ac !== null}<span class="muted num">AC {c.ac}</span>{/if}
          <div class="hpbox">
            <button class="icon-btn" onclick={() => damage(c, 1)} aria-label="1 damage">−</button>
            <span class="hp num" class:hurt={c.hp <= c.maxHp / 2}>{c.hp}/{c.maxHp}</span>
            <button class="icon-btn" onclick={() => damage(c, -1)} aria-label="1 healing">+</button>
          </div>
        </div>
        {#if c.conditions.length}
          <div class="chip-row conds">
            {#each c.conditions as cond}<span class="chip on">{cond}</span>{/each}
          </div>
        {/if}
        {#if expanded === c.id}
          <div class="detail">
            <div class="row">
              <label>Damage/heal
                <input type="number" id={`amt-${c.id}`} value="5" min="1" style="width:4rem" />
              </label>
              <button class="btn quiet" onclick={() => damage(c, Number((document.getElementById(`amt-${c.id}`) as HTMLInputElement).value))}>Damage</button>
              <button class="btn quiet" onclick={() => damage(c, -Number((document.getElementById(`amt-${c.id}`) as HTMLInputElement).value))}>Heal</button>
              <span style="flex:1"></span>
              <button class="btn ghost danger" onclick={() => remove(c)}>Remove</button>
            </div>
            <div class="chip-row">
              {#each ruleset.conditions as cond (cond.name)}
                <button class="chip" class:on={c.conditions.includes(cond.name)} title={cond.effect} onclick={() => toggleCondition(c, cond.name)}>
                  {cond.name}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ol>
{:else}
  <p class="muted">Add PCs and enemies to start tracking initiative. State syncs to your group's vault when signed in.</p>
{/if}

<style>
  .row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .row label { display: flex; align-items: center; gap: .35rem; font-size: .8rem; color: var(--ink-muted); }
  .row input[type='number'] { width: 4.2rem; }
  .adder { margin-bottom: 1rem; }
  .adder input[type='text'] { flex: 1; min-width: 130px; }
  .bar { margin-bottom: .8rem; }
  .round { font-weight: 700; font-size: 1.05rem; }
  .chip { cursor: pointer; }
  .live { color: var(--ok); border-color: var(--ok); }
  .live .dot { background: var(--ok); }

  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
  .fighter { padding: .6rem .8rem; gap: .4rem; border-left: 4px solid var(--edge-strong); }
  .fighter[data-kind='pc'] { border-left-color: var(--info); }
  .fighter[data-kind='ally'] { border-left-color: var(--ok); }
  .fighter[data-kind='enemy'] { border-left-color: var(--danger); }
  .fighter.up { outline: 2px solid var(--accent); }
  .fighter.down { opacity: .55; }
  .main { display: flex; align-items: center; gap: .8rem; }
  .init { width: 2rem; text-align: center; font-weight: 700; background: var(--surface-2); border-radius: var(--radius-sm); }
  .nm { flex: 1; text-align: left; background: none; border: 0; color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
  .hpbox { display: flex; align-items: center; gap: .4rem; }
  .hpbox .icon-btn { width: 26px; height: 26px; }
  .hp.hurt { color: var(--danger); }
  .conds .chip { font-size: .65rem; }
  .detail { border-top: 1px solid var(--edge); padding-top: .5rem; display: flex; flex-direction: column; gap: .5rem; }
  .danger { color: var(--danger); border-color: var(--danger); }
</style>
