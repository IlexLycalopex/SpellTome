<script lang="ts">
  import guide from '../data/dnd5e/level-guide.json';

  const GUIDE = guide as Record<string, Record<string, string[]>>;
  const CLASSES = Object.keys(GUIDE);
  const HIT_DIE: Record<string, number> = {
    barbarian: 12, bard: 8, cleric: 8, druid: 8, fighter: 10, monk: 8,
    paladin: 10, ranger: 10, rogue: 8, sorcerer: 6, warlock: 8, wizard: 6,
  };

  let klass = $state('barbarian');
  let level = $state(2);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const features = $derived(GUIDE[klass]?.[String(level)] ?? []);
  const hitDie = $derived(HIT_DIE[klass] ?? 8);
  const avgHp = $derived(Math.floor(hitDie / 2) + 1);
</script>

<div class="card panel">
  <div class="row">
    <label>Class
      <select bind:value={klass}>
        {#each CLASSES as c}<option value={c}>{cap(c)}</option>{/each}
      </select>
    </label>
    <label>New level
      <select bind:value={level}>
        {#each Array.from({ length: 19 }, (_, i) => i + 2) as l}<option value={l}>{l}</option>{/each}
      </select>
    </label>
  </div>

  <h2>{cap(klass)} — level {level}</h2>

  <div class="steps">
    <section>
      <h3>1 · Hit points</h3>
      <p>
        Roll <b class="num">1d{hitDie}</b> (or take <b class="num">{avgHp}</b>) and add your Constitution
        modifier. Add the result to your maximum HP.
      </p>
    </section>
    <section>
      <h3>2 · New features</h3>
      {#if features.length}
        <ul>
          {#each features as f}<li>{f}</li>{/each}
        </ul>
      {:else}
        <p class="muted">No new class features at this level — check your subclass.</p>
      {/if}
    </section>
    <section>
      <h3>3 · Housekeeping</h3>
      <ul>
        <li>Update your proficiency bonus if it changed (levels 5, 9, 13, 17).</li>
        <li>Spellcasters: update spell slots, and prepared/known spells.</li>
        <li>Ability Score Improvement levels: raise scores or take a feat.</li>
      </ul>
    </section>
  </div>
</div>

<style>
  .panel { gap: .9rem; max-width: 720px; }
  .row { display: flex; gap: 1rem; flex-wrap: wrap; }
  .row label { display: flex; align-items: center; gap: .5rem; font-size: .85rem; color: var(--ink-muted); }
  h2 { margin: 0; font-size: 1.15rem; }
  .steps { display: flex; flex-direction: column; gap: .9rem; }
  h3 { font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); margin: 0 0 .3rem; }
  ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: .3rem; font-size: .88rem; }
  p { margin: 0; font-size: .88rem; }
</style>
