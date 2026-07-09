<script lang="ts">
  import races from '../data/dnd5e/tables/npc-races.json';
  import occupations from '../data/dnd5e/tables/npc-occupations.json';
  import traits from '../data/dnd5e/tables/npc-traits.json';
  import mannerisms from '../data/dnd5e/tables/npc-mannerisms.json';
  import bonds from '../data/dnd5e/tables/npc-bonds.json';
  import flaws from '../data/dnd5e/tables/npc-flaws.json';
  import voices from '../data/dnd5e/tables/npc-voices.json';
  import hooks from '../data/dnd5e/tables/npc-hooks.json';
  import builds from '../data/dnd5e/tables/npc-appearance-build.json';
  import details from '../data/dnd5e/tables/npc-appearance-detail.json';

  interface RaceEntry {
    label: string;
    male: string[];
    female: string[];
    surname: string[];
  }
  const RACES = races as Record<string, RaceEntry>;

  interface Npc {
    name: string;
    race: string;
    gender: string;
    occupation: string;
    appearance: string;
    trait: string;
    mannerism: string;
    voice: string;
    bond: string;
    flaw: string;
    hook: string;
  }

  const HISTORY_KEY = 'tome_npc_history_v1'; // same key as the old site

  let raceKey = $state('any');
  let gender = $state('any');
  let npc = $state<Npc | null>(null);
  let history = $state<Npc[]>(loadHistory());

  function loadHistory(): Npc[] {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

  function generate() {
    const rk = raceKey === 'any' ? pick(Object.keys(RACES)) : raceKey;
    const race = RACES[rk]!;
    const g = gender === 'any' ? pick(['male', 'female']) : gender;
    const first = pick(g === 'male' ? race.male : race.female);
    npc = {
      name: `${first} ${pick(race.surname)}`,
      race: race.label,
      gender: g,
      occupation: pick(occupations as string[]),
      appearance: `${pick(builds as string[])}, ${pick(details as string[])}.`,
      trait: pick(traits as string[]),
      mannerism: pick(mannerisms as string[]),
      voice: pick(voices as string[]),
      bond: pick(bonds as string[]),
      flaw: pick(flaws as string[]),
      hook: pick(hooks as string[]),
    };
    history = [npc, ...history].slice(0, 20);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* storage full */
    }
  }

  function copyNpc() {
    if (!npc) return;
    const text = [
      `${npc.name} — ${npc.race} ${npc.occupation}`,
      `Appearance: ${npc.appearance}`,
      `Trait: ${npc.trait}`,
      `Mannerism: ${npc.mannerism}`,
      `Voice: ${npc.voice}`,
      `Bond: ${npc.bond}`,
      `Flaw: ${npc.flaw}`,
      `Hook: ${npc.hook}`,
    ].join('\n');
    void navigator.clipboard.writeText(text);
  }
</script>

<div class="card panel">
  <div class="row">
    <label>Race
      <select bind:value={raceKey}>
        <option value="any">Any</option>
        {#each Object.entries(RACES) as [k, r]}<option value={k}>{r.label}</option>{/each}
      </select>
    </label>
    <label>Gender
      <select bind:value={gender}>
        <option value="any">Any</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </label>
    <button class="btn" onclick={generate}>Generate NPC</button>
  </div>

  {#if npc}
    <article class="npc">
      <h2>{npc.name}</h2>
      <p class="muted">{npc.race} · {npc.occupation}</p>
      <dl>
        <div><dt>Appearance</dt><dd>{npc.appearance}</dd></div>
        <div><dt>Trait</dt><dd>{npc.trait}</dd></div>
        <div><dt>Mannerism</dt><dd>{npc.mannerism}</dd></div>
        <div><dt>Voice</dt><dd>{npc.voice}</dd></div>
        <div><dt>Bond</dt><dd>{npc.bond}</dd></div>
        <div><dt>Flaw</dt><dd>{npc.flaw}</dd></div>
        <div><dt>Hook</dt><dd>{npc.hook}</dd></div>
      </dl>
      <div class="row">
        <button class="btn ghost" onclick={copyNpc}>Copy to clipboard</button>
      </div>
    </article>
  {/if}
</div>

{#if history.length > 1}
  <h2 class="hist-title">Recent NPCs</h2>
  <div class="bento">
    {#each history.slice(1) as h}
      <button class="card past" onclick={() => (npc = h)}>
        <h3>{h.name}</h3>
        <p class="muted">{h.race} · {h.occupation}</p>
      </button>
    {/each}
  </div>
{/if}

<style>
  .panel { gap: 1rem; }
  .row { display: flex; gap: .8rem; flex-wrap: wrap; align-items: center; }
  .row label { display: flex; align-items: center; gap: .45rem; font-size: .85rem; color: var(--ink-muted); }
  .npc h2 { margin: 0; }
  .npc > .muted { margin: .1rem 0 .8rem; }
  dl { margin: 0; display: flex; flex-direction: column; gap: .45rem; }
  dt { font-size: .68rem; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
  dd { margin: 0; font-size: .9rem; }
  .hist-title { font-size: .9rem; margin: 1.4rem 0 .6rem; color: var(--ink-muted); }
  .past { cursor: pointer; font: inherit; text-align: left; color: var(--ink); }
</style>
