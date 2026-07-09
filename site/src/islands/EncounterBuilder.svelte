<script lang="ts">
  import monsters from '../data/dnd5e/monsters.json';

  interface Monster {
    name: string;
    cr: number | string;
    type: string;
    size: string;
    hp: number | string;
    ac: number | string;
  }
  const ALL = (monsters as Monster[]).toSorted((a, b) => a.name.localeCompare(b.name));

  const XP_BY_CR: Record<string, number> = {
    '0': 10, '0.125': 25, '0.25': 50, '0.5': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
    '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000,
    '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
    '21': 33000, '22': 41000, '23': 50000, '24': 62000,
  };
  // DMG per-character thresholds [easy, medium, hard, deadly]
  const THRESHOLDS: Record<number, [number, number, number, number]> = {
    1: [25, 50, 75, 100], 2: [50, 100, 150, 200], 3: [75, 150, 225, 400],
    4: [125, 250, 375, 500], 5: [250, 500, 750, 1100], 6: [300, 600, 900, 1400],
    7: [350, 750, 1100, 1700], 8: [450, 900, 1400, 2100], 9: [550, 1100, 1600, 2400],
    10: [600, 1200, 1900, 2800], 11: [800, 1600, 2400, 3600], 12: [1000, 2000, 3000, 4500],
    13: [1100, 2200, 3400, 5100], 14: [1250, 2500, 3800, 5700], 15: [1400, 2800, 4300, 6400],
    16: [1600, 3200, 4800, 7200], 17: [2000, 3900, 5900, 8800], 18: [2100, 4200, 6300, 9500],
    19: [2400, 4900, 7300, 10900], 20: [2800, 5700, 8500, 12700],
  };
  const MULT_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 4];

  function multiplierFor(monsterCount: number, partyCount: number): number {
    if (monsterCount === 0) return 1;
    let idx: number;
    if (monsterCount === 1) idx = 1;
    else if (monsterCount === 2) idx = 2;
    else if (monsterCount <= 6) idx = 3;
    else if (monsterCount <= 10) idx = 4;
    else if (monsterCount <= 14) idx = 5;
    else idx = 6;
    if (partyCount >= 6) idx -= 1;
    else if (partyCount < 3) idx += 1;
    return MULT_STEPS[Math.min(Math.max(idx, 0), MULT_STEPS.length - 1)]!;
  }

  const crValue = (cr: number | string) => Number(cr) || 0;
  const crLabel = (cr: number | string) => ({ 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' }[Number(cr)] ?? String(cr));
  const xpFor = (m: Monster) => XP_BY_CR[String(crValue(m.cr))] ?? 10;

  let partySize = $state(4);
  let partyLevel = $state(3);
  let search = $state('');
  let picks = $state<Map<string, number>>(new Map());

  const searchResults = $derived(
    search.trim()
      ? ALL.filter((m) => m.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 12)
      : [],
  );

  function add(name: string) {
    const next = new Map(picks);
    next.set(name, (next.get(name) ?? 0) + 1);
    picks = next;
  }
  function setCount(name: string, count: number) {
    const next = new Map(picks);
    if (count <= 0) next.delete(name);
    else next.set(name, count);
    picks = next;
  }

  const monsterOf = (name: string) => ALL.find((m) => m.name === name)!;
  const monsterCount = $derived([...picks.values()].reduce((a, b) => a + b, 0));
  const rawXp = $derived([...picks.entries()].reduce((sum, [name, n]) => sum + xpFor(monsterOf(name)) * n, 0));
  const adjustedXp = $derived(Math.round(rawXp * multiplierFor(monsterCount, partySize)));
  const budget = $derived.by(() => {
    const t = THRESHOLDS[partyLevel] ?? THRESHOLDS[1]!;
    return { easy: t[0] * partySize, medium: t[1] * partySize, hard: t[2] * partySize, deadly: t[3] * partySize };
  });
  const verdict = $derived.by(() => {
    if (!monsterCount) return { name: '—', color: 'var(--ink-faint)' };
    if (adjustedXp < budget.easy) return { name: 'Trivial', color: 'var(--ink-muted)' };
    if (adjustedXp < budget.medium) return { name: 'Easy', color: 'var(--ok)' };
    if (adjustedXp < budget.hard) return { name: 'Medium', color: 'var(--warn)' };
    if (adjustedXp < budget.deadly) return { name: 'Hard', color: 'var(--danger)' };
    return { name: 'Deadly', color: 'var(--danger)' };
  });
</script>

<div class="layout">
  <div class="card panel">
    <div class="row">
      <label>Party size <input type="number" min="1" max="10" bind:value={partySize} /></label>
      <label>Party level <input type="number" min="1" max="20" bind:value={partyLevel} /></label>
    </div>
    <input type="search" placeholder="Add monsters…" bind:value={search} aria-label="Search monsters" />
    {#if searchResults.length}
      <ul class="results">
        {#each searchResults as m (m.name)}
          <li>
            <button onclick={() => { add(m.name); search = ''; }}>
              <span>{m.name}</span>
              <span class="muted">CR {crLabel(m.cr)} · {xpFor(m).toLocaleString()} XP</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if picks.size}
      <ul class="picked">
        {#each [...picks.entries()] as [name, n] (name)}
          <li>
            <span class="nm">{name}</span>
            <span class="muted">CR {crLabel(monsterOf(name).cr)}</span>
            <span class="qty">
              <button class="icon-btn" onclick={() => setCount(name, n - 1)} aria-label="Fewer">−</button>
              <b class="num">{n}</b>
              <button class="icon-btn" onclick={() => setCount(name, n + 1)} aria-label="More">+</button>
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">Search and add monsters to build the encounter.</p>
    {/if}
  </div>

  <aside class="card math">
    <h2>Difficulty</h2>
    <p class="verdict" style:color={verdict.color}>{verdict.name}</p>
    <dl class="num">
      <div><dt>Raw XP</dt><dd>{rawXp.toLocaleString()}</dd></div>
      <div><dt>Multiplier</dt><dd>×{multiplierFor(monsterCount, partySize)}</dd></div>
      <div><dt>Adjusted XP</dt><dd><b>{adjustedXp.toLocaleString()}</b></dd></div>
    </dl>
    <h3>Party budget</h3>
    <dl class="num">
      <div><dt>Easy</dt><dd>{budget.easy.toLocaleString()}</dd></div>
      <div><dt>Medium</dt><dd>{budget.medium.toLocaleString()}</dd></div>
      <div><dt>Hard</dt><dd>{budget.hard.toLocaleString()}</dd></div>
      <div><dt>Deadly</dt><dd>{budget.deadly.toLocaleString()}</dd></div>
    </dl>
  </aside>
</div>

<style>
  .layout { display: grid; grid-template-columns: 1.4fr .8fr; gap: 1rem; align-items: start; }
  @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }
  .panel { gap: .8rem; }
  .row { display: flex; gap: 1rem; flex-wrap: wrap; }
  .row label { display: flex; align-items: center; gap: .45rem; font-size: .85rem; color: var(--ink-muted); }
  .row input { width: 4.5rem; }

  .results { list-style: none; margin: 0; padding: 0; border: 1px solid var(--edge); border-radius: var(--radius-sm); overflow: hidden; }
  .results button {
    display: flex; justify-content: space-between; gap: 1rem; width: 100%;
    background: var(--surface-2); border: 0; border-bottom: 1px solid var(--edge);
    color: var(--ink); font: inherit; font-size: .85rem; padding: .45rem .7rem; cursor: pointer; text-align: left;
  }
  .results button:hover { background: var(--surface-3); }

  .picked { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .4rem; }
  .picked li { display: flex; align-items: center; gap: .7rem; background: var(--surface-2); border-radius: var(--radius-sm); padding: .4rem .7rem; font-size: .88rem; }
  .picked .nm { flex: 1; font-weight: 600; }
  .qty { display: flex; align-items: center; gap: .5rem; }
  .qty .icon-btn { width: 26px; height: 26px; }

  .math { gap: .5rem; position: sticky; top: 76px; }
  .math h2 { font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); margin: 0; }
  .math h3 { font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); margin: .8rem 0 0; }
  .verdict { font-size: 1.5rem; font-weight: 700; margin: 0; font-family: var(--font-display); }
  dl { margin: 0; display: flex; flex-direction: column; gap: .25rem; }
  dl div { display: flex; justify-content: space-between; font-size: .85rem; }
  dt { color: var(--ink-muted); }
  dd { margin: 0; }
</style>
