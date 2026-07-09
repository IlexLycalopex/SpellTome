<script lang="ts">
  import individual from '../data/dnd5e/tables/loot-individual.json';
  import hoard from '../data/dnd5e/tables/loot-hoard.json';
  import gems from '../data/dnd5e/tables/loot-gems.json';
  import art from '../data/dnd5e/tables/loot-art.json';
  import tableRarity from '../data/dnd5e/tables/loot-magic-rarity.json';

  type CoinEntry = [string, number, number, number]; // denom, n, d, multiplier
  interface IndivRow {
    max: number;
    coins: CoinEntry[];
  }
  interface HoardRow {
    max: number;
    gems?: [number, number, number];
    art?: [number, number, number];
    magic?: [string, string][];
  }
  interface HoardTier {
    base: CoinEntry[];
    rows: HoardRow[];
  }

  const INDIVIDUAL = individual as IndivRow[][];
  const HOARD = hoard as HoardTier[];
  const GEMS = gems as Record<string, string[]>;
  const ART = art as Record<string, string[]>;
  const RARITY = tableRarity as Record<string, string>;
  const TIERS = ['CR 0–4', 'CR 5–10', 'CR 11–16', 'CR 17+'];
  const GP_VALUE: Record<string, number> = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 };

  let tier = $state(0);
  let mode = $state<'individual' | 'hoard'>('individual');
  let count = $state(1);
  let result = $state<{ lines: string[]; totalGp: number } | null>(null);

  const die = (d: number) => Math.floor(Math.random() * d) + 1;
  const dice = (n: number, d: number) => Array.from({ length: n }, () => die(d)).reduce((a, b) => a + b, 0);
  const diceStr = (s: string) => {
    const m = /^(\d+)d(\d+)$/.exec(s);
    return m ? dice(Number(m[1]), Number(m[2])) : Number(s) || 1;
  };

  function rollCoins(entries: CoinEntry[], into: Record<string, number>) {
    for (const [denom, n, d, mult] of entries) into[denom] = (into[denom] ?? 0) + dice(n, d) * mult;
  }
  const coinLine = (coins: Record<string, number>) =>
    ['pp', 'gp', 'ep', 'sp', 'cp'].filter((d) => coins[d]).map((d) => `${coins[d]!.toLocaleString()} ${d}`).join(', ');
  const coinsGp = (coins: Record<string, number>) =>
    Object.entries(coins).reduce((sum, [d, n]) => sum + n * (GP_VALUE[d] ?? 0), 0);

  function generate() {
    const lines: string[] = [];
    let totalGp = 0;

    if (mode === 'individual') {
      const table = INDIVIDUAL[tier]!;
      const combined: Record<string, number> = {};
      for (let i = 0; i < count; i++) {
        const roll = die(100);
        const row = table.find((r) => roll <= r.max) ?? table[table.length - 1]!;
        rollCoins(row.coins, combined);
      }
      lines.push(`Coins (${count} creature${count === 1 ? '' : 's'}): ${coinLine(combined)}`);
      totalGp = coinsGp(combined);
    } else {
      const tierTable = HOARD[tier]!;
      const coins: Record<string, number> = {};
      rollCoins(tierTable.base, coins);
      lines.push(`Coins: ${coinLine(coins)}`);
      totalGp = coinsGp(coins);

      const roll = die(100);
      const row = tierTable.rows.find((r) => roll <= r.max) ?? tierTable.rows[tierTable.rows.length - 1]!;
      if (row.gems) {
        const [n, d, value] = row.gems;
        const qty = dice(n, d);
        const pool = GEMS[String(value)] ?? [];
        const picks = Array.from({ length: qty }, () => pool[Math.floor(Math.random() * pool.length)] ?? 'gemstone');
        lines.push(`${qty} × ${value} gp gems: ${[...new Set(picks)].join(', ')}`);
        totalGp += qty * value;
      }
      if (row.art) {
        const [n, d, value] = row.art;
        const qty = dice(n, d);
        const pool = ART[String(value)] ?? [];
        const picks = Array.from({ length: qty }, () => pool[Math.floor(Math.random() * pool.length)] ?? 'art object');
        lines.push(`${qty} × ${value} gp art objects: ${[...new Set(picks)].join(', ')}`);
        totalGp += qty * value;
      }
      if (row.magic) {
        for (const [countStr, table] of row.magic) {
          const qty = diceStr(countStr);
          lines.push(`${qty} roll${qty === 1 ? '' : 's'} on Magic Item Table ${table} (${RARITY[table] ?? ''})`);
        }
      }
      if (!row.gems && !row.art && !row.magic) lines.push('No gems, art or magic items this time.');
    }
    result = { lines, totalGp: Math.round(totalGp) };
  }
</script>

<div class="card panel">
  <div class="row">
    <div class="seg" role="group" aria-label="Loot mode">
      <button class:on={mode === 'individual'} onclick={() => (mode = 'individual')}>Individual</button>
      <button class:on={mode === 'hoard'} onclick={() => (mode = 'hoard')}>Hoard</button>
    </div>
    <label>Tier
      <select bind:value={tier}>
        {#each TIERS as t, i}<option value={i}>{t}</option>{/each}
      </select>
    </label>
    {#if mode === 'individual'}
      <label>Creatures <input type="number" min="1" max="50" bind:value={count} /></label>
    {/if}
    <button class="btn" onclick={generate}>Roll treasure</button>
  </div>

  {#if result}
    <div class="loot" aria-live="polite">
      <ul>
        {#each result.lines as line}<li>{line}</li>{/each}
      </ul>
      <p class="total num">≈ {result.totalGp.toLocaleString()} gp{mode === 'hoard' ? ' before magic items' : ''}</p>
    </div>
  {/if}
</div>

<style>
  .panel { gap: 1rem; }
  .row { display: flex; gap: .8rem; flex-wrap: wrap; align-items: center; }
  .row label { display: flex; align-items: center; gap: .45rem; font-size: .85rem; color: var(--ink-muted); }
  .row input { width: 4.5rem; }
  .seg { display: flex; border: 1px solid var(--edge); border-radius: var(--radius-sm); overflow: hidden; }
  .seg button { border: 0; background: var(--surface-2); color: var(--ink-muted); font: inherit; font-size: .82rem; font-weight: 600; padding: .45rem .9rem; cursor: pointer; }
  .seg button.on { background: var(--accent); color: var(--accent-ink); }
  .loot ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: .4rem; font-size: .9rem; }
  .total { margin: .6rem 0 0; font-weight: 700; color: var(--accent); }
</style>
