<script lang="ts">
  import monsters from '../data/dnd5e/monsters.json';

  interface Monster {
    name: string;
    size: string;
    type: string;
    cr: number | string;
    ac: number | string;
    hp: number | string;
    speed: string;
    str: number; dex: number; con: number; int: number; wis: number; cha: number;
    senses?: string;
    dmgImmune?: string[];
    dmgResist?: string[];
    dmgVuln?: string[];
    condImmune?: string[];
    savingThrows?: string;
    skills?: string;
    abilities?: { n: string; t: string }[];
    actions?: { n: string; t: string }[];
    legendary?: { n: string; t: string }[];
  }

  const ALL = monsters as unknown as Monster[];
  const TYPES = [...new Set(ALL.map((m) => m.type))].sort();

  let search = $state('');
  let activeTypes = $state(new Set<string>());
  let maxCr = $state(30);
  let openName = $state<string | null>(null);

  const crValue = (cr: number | string) => (typeof cr === 'number' ? cr : cr === '1/8' ? 0.125 : cr === '1/4' ? 0.25 : cr === '1/2' ? 0.5 : Number(cr) || 0);
  const crLabel = (cr: number | string) => (typeof cr === 'number' && cr < 1 && cr > 0 ? { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' }[cr] ?? String(cr) : String(cr));
  const mod = (score: number) => {
    const m = Math.floor((score - 10) / 2);
    return m >= 0 ? `+${m}` : String(m);
  };

  function toggleType(t: string) {
    const next = new Set(activeTypes);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    activeTypes = next;
  }

  const filtered = $derived(
    ALL.filter((m) => {
      if (activeTypes.size && !activeTypes.has(m.type)) return false;
      if (crValue(m.cr) > maxCr) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).toSorted((a, b) => crValue(a.cr) - crValue(b.cr) || a.name.localeCompare(b.name)),
  );
</script>

<div class="filters card">
  <div class="row">
    <input type="search" placeholder="Search monsters…" bind:value={search} aria-label="Search monsters" />
    <label class="cr">Max CR <input type="number" min="0" max="30" bind:value={maxCr} /></label>
    <span class="muted num count">{filtered.length} / {ALL.length}</span>
  </div>
  <div class="chip-row">
    {#each TYPES as t}
      <button class="chip" class:on={activeTypes.has(t)} onclick={() => toggleType(t)}>{t}</button>
    {/each}
  </div>
</div>

<div class="grid">
  {#each filtered as m (m.name)}
    <article class="card mon" class:open={openName === m.name}>
      <button class="head" onclick={() => (openName = openName === m.name ? null : m.name)} aria-expanded={openName === m.name}>
        <span class="name">{m.name}</span>
        <span class="chip">CR {crLabel(m.cr)}</span>
      </button>
      <p class="muted meta">{m.size} {m.type} · AC {m.ac} · HP {m.hp} · {m.speed}</p>
      {#if openName === m.name}
        <div class="detail">
          <div class="abilities num">
            {#each [['STR', m.str], ['DEX', m.dex], ['CON', m.con], ['INT', m.int], ['WIS', m.wis], ['CHA', m.cha]] as [label, score]}
              <span><b>{label}</b> {score} ({mod(score as number)})</span>
            {/each}
          </div>
          {#if m.savingThrows}<p><b>Saves.</b> {m.savingThrows}</p>{/if}
          {#if m.skills}<p><b>Skills.</b> {m.skills}</p>{/if}
          {#if m.dmgImmune?.length}<p><b>Damage immunities.</b> {m.dmgImmune.join(', ')}</p>{/if}
          {#if m.dmgResist?.length}<p><b>Resistances.</b> {m.dmgResist.join(', ')}</p>{/if}
          {#if m.dmgVuln?.length}<p><b>Vulnerabilities.</b> {m.dmgVuln.join(', ')}</p>{/if}
          {#if m.condImmune?.length}<p><b>Condition immunities.</b> {m.condImmune.join(', ')}</p>{/if}
          {#if m.senses}<p><b>Senses.</b> {m.senses}</p>{/if}
          {#if m.abilities?.length}
            <h4>Traits</h4>
            {#each m.abilities as a}<p><b>{a.n}.</b> {a.t}</p>{/each}
          {/if}
          {#if m.actions?.length}
            <h4>Actions</h4>
            {#each m.actions as a}<p><b>{a.n}.</b> {a.t}</p>{/each}
          {/if}
          {#if m.legendary?.length}
            <h4>Legendary actions</h4>
            {#each m.legendary as a}<p><b>{a.n}.</b> {a.t}</p>{/each}
          {/if}
        </div>
      {/if}
    </article>
  {:else}
    <p class="muted">No monsters match.</p>
  {/each}
</div>

<style>
  .filters { gap: .7rem; margin-bottom: 1.2rem; }
  .row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .row input[type='search'] { flex: 1; min-width: 150px; }
  .cr { display: flex; align-items: center; gap: .4rem; font-size: .82rem; color: var(--ink-muted); }
  .cr input { width: 4.5rem; }
  .count { margin-left: auto; font-size: .8rem; }
  .chip { cursor: pointer; }

  .grid { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); grid-auto-flow: dense; }
  .mon { gap: .3rem; }
  .mon.open { grid-column: 1 / -1; }
  .head { display: flex; align-items: center; gap: .6rem; background: none; border: 0; padding: 0; cursor: pointer; color: var(--ink); font: inherit; font-weight: 600; width: 100%; text-align: left; }
  .head .name { flex: 1; }
  .meta { margin: 0; font-size: .78rem; }
  .detail { border-top: 1px solid var(--edge); margin-top: .5rem; padding-top: .6rem; font-size: .88rem; }
  .detail p { margin: .3rem 0; }
  .detail h4 { margin: .8rem 0 .2rem; font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
  .abilities { display: flex; gap: .9rem; flex-wrap: wrap; padding: .4rem .6rem; background: var(--surface-2); border-radius: var(--radius-sm); font-size: .8rem; }
</style>
