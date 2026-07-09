<script lang="ts">
  import spells2014 from '../data/dnd5e/spells-2014.json';
  import spells2024 from '../data/dnd5e/spells-2024.json';
  import {
    SCHOOLS,
    SOURCE_BOOKS,
    ALL_CLASSES,
    LEVEL_LABELS,
    maxSpellLevel,
    spellBook,
    type Spell,
  } from '@lib/dnd5e-meta';

  type Edition = '2014' | '2024';

  let edition = $state<Edition>('2014');
  let selectedClass = $state('');
  let charLevel = $state(0); // 0 = any
  let activeLevels = $state(new Set<number>());
  let activeSchools = $state(new Set<string>());
  let activeBooks = $state(new Set<string>());
  let search = $state('');
  let openId = $state<string | null>(null);

  const spells = $derived((edition === '2024' ? spells2024 : spells2014) as Spell[]);

  function resetFilters() {
    selectedClass = '';
    charLevel = 0;
    activeLevels = new Set();
    activeSchools = new Set();
    activeBooks = new Set();
    search = '';
    openId = null;
  }

  function setEdition(e: Edition) {
    if (e === edition) return;
    edition = e;
    resetFilters();
  }

  function toggle<T>(set: Set<T>, v: T): Set<T> {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  }

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const maxLvl = selectedClass && charLevel > 0 ? maxSpellLevel(selectedClass, charLevel) : 9;
    return spells.filter((s) => {
      if (selectedClass && !s.classes.includes(selectedClass)) return false;
      if (s.level > maxLvl) return false;
      if (activeLevels.size && !activeLevels.has(s.level)) return false;
      if (activeSchools.size && !activeSchools.has(s.school)) return false;
      if (activeBooks.size && !activeBooks.has(spellBook(s))) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  });
</script>

<div class="filters card">
  <div class="filter-row">
    <div class="edition" role="group" aria-label="Rules edition">
      <button class:on={edition === '2014'} onclick={() => setEdition('2014')}>2014</button>
      <button class:on={edition === '2024'} onclick={() => setEdition('2024')}>2024</button>
    </div>

    <select bind:value={selectedClass} aria-label="Class">
      <option value="">Any class</option>
      {#each ALL_CLASSES as c}<option value={c}>{c}</option>{/each}
    </select>

    <select bind:value={charLevel} aria-label="Character level" disabled={!selectedClass}>
      <option value={0}>Any level</option>
      {#each Array.from({ length: 20 }, (_, i) => i + 1) as lvl}
        <option value={lvl}>Level {lvl}</option>
      {/each}
    </select>

    <input type="search" placeholder="Search spells…" bind:value={search} aria-label="Search spells" />

    <span class="count num">{filtered.length} / {spells.length}</span>
  </div>

  <div class="chip-row">
    {#each LEVEL_LABELS as label, lvl}
      <button class="chip" class:on={activeLevels.has(lvl)} onclick={() => (activeLevels = toggle(activeLevels, lvl))}>
        {label}
      </button>
    {/each}
  </div>

  <div class="chip-row">
    {#each Object.entries(SCHOOLS) as [school, color]}
      <button class="chip" class:on={activeSchools.has(school)} onclick={() => (activeSchools = toggle(activeSchools, school))}>
        <span class="dot" style:background={color}></span>{school}
      </button>
    {/each}
  </div>

  <div class="chip-row">
    {#each Object.entries(SOURCE_BOOKS) as [abbr, book]}
      <button class="chip" class:on={activeBooks.has(abbr)} title={book.label} onclick={() => (activeBooks = toggle(activeBooks, abbr))}>
        <span class="dot" style:background={book.color}></span>{abbr}
      </button>
    {/each}
  </div>
</div>

<div class="grid">
  {#each filtered as s (s.id)}
    <article
      class="spell card"
      class:open={openId === s.id}
      style:--school-color={SCHOOLS[s.school] ?? 'var(--accent)'}
    >
      <button class="spell-head" onclick={() => (openId = openId === s.id ? null : s.id)} aria-expanded={openId === s.id}>
        <span class="school-dot" aria-hidden="true"></span>
        <span class="name">{s.name}</span>
        <span class="lvl num">{s.level === 0 ? 'C' : s.level}</span>
      </button>
      <div class="meta muted">
        {s.school}
        {#if s.ritual}· Ritual{/if}
        {#if s.concentration}· Conc.{/if}
        · {s.casting_time} · {s.range}
      </div>
      {#if openId === s.id}
        <div class="detail">
          <dl>
            <div><dt>Range</dt><dd>{s.range}</dd></div>
            <div><dt>Duration</dt><dd>{s.duration}</dd></div>
            <div><dt>Casting</dt><dd>{s.casting_time}</dd></div>
            <div><dt>Components</dt><dd>{s.components.join(', ')}</dd></div>
          </dl>
          <p>{s.description}</p>
          {#if s.higher_levels}
            <p><strong>At higher levels.</strong> {s.higher_levels}</p>
          {/if}
          <p class="muted src">
            {s.source} · {s.classes.join(', ')}
          </p>
        </div>
      {/if}
    </article>
  {:else}
    <p class="muted">No spells match the current filters.</p>
  {/each}
</div>

<style>
  .filters { gap: .7rem; margin-bottom: 1.2rem; position: sticky; top: 62px; z-index: 10; }
  .filter-row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .filter-row input[type='search'] { flex: 1; min-width: 150px; }
  .count { color: var(--ink-faint); font-size: .8rem; margin-left: auto; }

  .edition { display: flex; border: 1px solid var(--edge); border-radius: var(--radius-sm); overflow: hidden; }
  .edition button {
    border: 0; background: var(--surface-2); color: var(--ink-muted);
    font: inherit; font-size: .82rem; font-weight: 600; padding: .45rem .8rem; cursor: pointer;
  }
  .edition button.on { background: var(--accent); color: var(--accent-ink); }

  .chip { cursor: pointer; }

  .grid {
    display: grid; gap: .8rem;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-auto-flow: dense;
  }
  .spell { padding: .8rem .9rem; gap: .25rem; border-top: 3px solid var(--school-color); }
  .spell.open { grid-column: 1 / -1; }

  .spell-head {
    display: flex; align-items: center; gap: .55rem;
    background: none; border: 0; padding: 0; cursor: pointer;
    color: var(--ink); font: inherit; font-weight: 600; text-align: left; width: 100%;
  }
  .school-dot { width: 10px; height: 10px; border-radius: 3px; background: var(--school-color); flex: none; }
  .name { flex: 1; }
  .lvl {
    flex: none; font-size: .72rem; font-weight: 700;
    border: 1px solid var(--edge-strong); border-radius: 6px;
    padding: .1rem .45rem; color: var(--ink-muted);
  }
  .meta { font-size: .76rem; }

  .detail { border-top: 1px solid var(--edge); margin-top: .5rem; padding-top: .6rem; font-size: .9rem; }
  .detail dl {
    display: flex; gap: 1.2rem; flex-wrap: wrap; margin: 0 0 .4rem;
  }
  .detail dt {
    font-size: .66rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint);
  }
  .detail dd { margin: 0; font-size: .85rem; }
  .detail p { margin: .4rem 0; max-width: 75ch; }
  .src { font-size: .78rem; }
</style>
