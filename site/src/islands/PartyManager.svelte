<script lang="ts">
  import { onMount } from 'svelte';
  import { tomeSync } from '@lib/sync.svelte';
  import { get as storeGet, set as storeSet } from '@lib/store';

  /**
   * Party roster over the same synced `party` collection the old
   * party-manager wrote (field names preserved, incl. `klass`).
   */
  interface Member {
    id: string;
    name: string;
    player: string;
    campaign: string;
    klass: string;
    race: string;
    level: number;
    hp: number | null;
    ac: number | null;
    passivePerception: number | null;
    notes: string;
  }

  let party = $state<Member[]>([]);
  let draft = $state<Member | null>(null);
  let activeCampaign = $state('');
  let filterCampaign = $state('');

  onMount(() => {
    tomeSync.init();
    load();
    activeCampaign = storeGet<string>('activeCampaign', '') ?? '';
    filterCampaign = activeCampaign;
    window.addEventListener('tome:remote-update', load);
  });

  function load() {
    party = storeGet<Member[]>('party', []) ?? [];
  }
  function persist() {
    storeSet('party', party);
  }

  const campaigns = $derived([...new Set(party.map((m) => m.campaign).filter(Boolean))]);
  const visible = $derived(party.filter((m) => !filterCampaign || m.campaign === filterCampaign));

  function newMember() {
    draft = {
      id: crypto.randomUUID(),
      name: '',
      player: '',
      campaign: activeCampaign,
      klass: '',
      race: '',
      level: 1,
      hp: null,
      ac: null,
      passivePerception: null,
      notes: '',
    };
  }

  function save() {
    if (!draft || !draft.name.trim()) return;
    const i = party.findIndex((m) => m.id === draft!.id);
    if (i >= 0) party[i] = draft;
    else party = [...party, draft];
    persist();
    draft = null;
  }

  function remove(id: string) {
    if (!confirm('Remove this character?')) return;
    party = party.filter((m) => m.id !== id);
    persist();
    draft = null;
  }
</script>

<div class="row head">
  <button class="btn" onclick={newMember}>Add character</button>
  {#if campaigns.length > 1}
    <select bind:value={filterCampaign} aria-label="Filter by campaign">
      <option value="">All campaigns</option>
      {#each campaigns as c}<option value={c}>{c}</option>{/each}
    </select>
  {/if}
</div>

{#if draft}
  <div class="card editor">
    <div class="row">
      <label class="grow">Character <input type="text" bind:value={draft.name} /></label>
      <label>Player <input type="text" bind:value={draft.player} /></label>
      <label>Campaign <input type="text" bind:value={draft.campaign} list="camp-names" /></label>
      <datalist id="camp-names">
        {#each campaigns as c}<option value={c}></option>{/each}
      </datalist>
    </div>
    <div class="row">
      <label>Class <input type="text" bind:value={draft.klass} /></label>
      <label>Race / heritage <input type="text" bind:value={draft.race} /></label>
      <label>Level <input type="number" min="1" max="20" bind:value={draft.level} /></label>
      <label>HP <input type="number" bind:value={draft.hp} /></label>
      <label>AC <input type="number" bind:value={draft.ac} /></label>
      <label>Pass. Perc. <input type="number" bind:value={draft.passivePerception} /></label>
    </div>
    <label class="col">Notes <textarea rows="3" bind:value={draft.notes}></textarea></label>
    <div class="row">
      {#if party.some((m) => m.id === draft?.id)}
        <button class="btn ghost danger" onclick={() => remove(draft!.id)}>Remove</button>
      {/if}
      <span style="flex:1"></span>
      <button class="btn quiet" onclick={() => (draft = null)}>Cancel</button>
      <button class="btn" onclick={save}>Save</button>
    </div>
  </div>
{/if}

<div class="bento">
  {#each visible as m (m.id)}
    <article class="card pc">
      <h3>{m.name}</h3>
      <p class="muted line">
        {m.klass ? `${m.klass} · ` : ''}Level {m.level}{m.race ? ` · ${m.race}` : ''}
      </p>
      {#if m.player}<p class="muted line">Played by {m.player}</p>{/if}
      <div class="chip-row stats num">
        {#if m.hp !== null}<span class="chip">HP {m.hp}</span>{/if}
        {#if m.ac !== null}<span class="chip">AC {m.ac}</span>{/if}
        {#if m.passivePerception !== null}<span class="chip">PP {m.passivePerception}</span>{/if}
        {#if m.campaign}<span class="chip">{m.campaign}</span>{/if}
      </div>
      {#if m.notes}<p class="notes">{m.notes}</p>{/if}
      <div class="chip-row actions">
        <button class="chip" onclick={() => (draft = { ...m })}>Edit</button>
      </div>
    </article>
  {:else}
    <p class="muted">No characters yet{filterCampaign ? ` in ${filterCampaign}` : ''}.</p>
  {/each}
</div>

<style>
  .row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .head { margin-bottom: 1rem; }
  .editor { gap: .7rem; margin-bottom: 1rem; }
  .row label, .col { display: flex; align-items: center; gap: .4rem; font-size: .82rem; color: var(--ink-muted); }
  .col { flex-direction: column; align-items: stretch; }
  .grow { flex: 1; }
  .grow input { flex: 1; }
  .row input[type='number'] { width: 4.2rem; }
  .line { margin: 0; font-size: .8rem; }
  .notes { font-size: .82rem; }
  .actions { margin-top: auto; padding-top: .4rem; }
  .chip { cursor: pointer; }
  .stats .chip { cursor: default; }
  .danger { color: var(--danger); border-color: var(--danger); }
</style>
