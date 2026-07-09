<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '@lib/supabase';
  import { tomeSync } from '@lib/sync.svelte';
  import { get as storeGet, set as storeSet } from '@lib/store';
  import { RULESETS, RULESET_LIST, type RulesetId } from '@rulesets/index';

  /**
   * The campaign registry stays in the synced `campaigns` tomeStore
   * collection (same shape the old campaign-manager wrote), enriched
   * live with session stats from play_logs.
   */
  interface Campaign {
    id: string;
    name: string;
    gm: string;
    ruleset: string;
    rulesetId?: RulesetId;
    status: 'active' | 'planned' | 'hiatus' | 'completed';
    description: string;
  }
  interface Stats {
    sessions: number;
    latestDate: string | null;
    latestSynopsis: string;
  }

  let campaigns = $state<Campaign[]>([]);
  let statsByName = $state<Record<string, Stats>>({});
  let draft = $state<Campaign | null>(null);
  let activeCampaign = $state('');

  const STATUS_COLORS: Record<string, string> = {
    active: 'var(--ok)', planned: 'var(--info)', hiatus: 'var(--warn)', completed: 'var(--ink-faint)',
  };

  onMount(() => {
    tomeSync.init();
    campaigns = storeGet<Campaign[]>('campaigns', []) ?? [];
    activeCampaign = storeGet<string>('activeCampaign', '') ?? '';
    window.addEventListener('tome:remote-update', () => {
      campaigns = storeGet<Campaign[]>('campaigns', []) ?? [];
    });
    void loadStats();
  });

  async function loadStats() {
    // Public data: join names via the chronicle view, stats via play_logs.
    const client = getSupabase();
    const [namesRes, logsRes] = await Promise.all([
      client.from('chronicle_campaigns').select('id,name'),
      client
        .from('play_logs')
        .select('campaign_id,session_number,session_date,synopsis')
        .eq('published', true)
        .order('session_number', { ascending: false }),
    ]);
    if (namesRes.error || logsRes.error) return;
    const nameById = new Map((namesRes.data ?? []).map((c) => [c.id, c.name]));
    const stats: Record<string, Stats> = {};
    for (const row of logsRes.data ?? []) {
      const name = nameById.get(row.campaign_id);
      if (!name) continue;
      stats[name] ??= { sessions: 0, latestDate: null, latestSynopsis: row.synopsis };
      stats[name].sessions += 1;
      if (!stats[name].latestDate && row.session_date) stats[name].latestDate = row.session_date;
    }
    statsByName = stats;
  }

  function persist() {
    storeSet('campaigns', campaigns);
  }

  function newCampaign() {
    draft = {
      id: crypto.randomUUID(),
      name: '',
      gm: '',
      ruleset: 'D&D 5e',
      rulesetId: 'dnd5e',
      status: 'active',
      description: '',
    };
  }

  function save() {
    if (!draft || !draft.name.trim()) return;
    draft.ruleset = RULESETS[draft.rulesetId ?? 'dnd5e'].name;
    const i = campaigns.findIndex((c) => c.id === draft!.id);
    if (i >= 0) campaigns[i] = draft;
    else campaigns = [...campaigns, draft];
    persist();
    draft = null;
  }

  function remove(id: string) {
    if (!confirm('Remove this campaign from the registry? (Play logs are unaffected.)')) return;
    campaigns = campaigns.filter((c) => c.id !== id);
    persist();
    draft = null;
  }

  function setActive(c: Campaign) {
    activeCampaign = c.name;
    storeSet('activeCampaign', c.name);
    const skin = RULESETS[c.rulesetId ?? 'dnd5e'].skin;
    document.documentElement.dataset.skin = skin;
    localStorage.setItem('tome-active-skin', skin);
  }
</script>

<div class="row head">
  <button class="btn" onclick={newCampaign}>New campaign</button>
  {#if activeCampaign}<span class="muted">Active: <b>{activeCampaign}</b></span>{/if}
</div>

{#if draft}
  <div class="card editor">
    <div class="row">
      <label class="grow">Name <input type="text" bind:value={draft.name} /></label>
      <label>GM <input type="text" bind:value={draft.gm} /></label>
    </div>
    <div class="row">
      <label>System
        <select bind:value={draft.rulesetId}>
          {#each RULESET_LIST as rs (rs.id)}<option value={rs.id}>{rs.name}</option>{/each}
        </select>
      </label>
      <label>Status
        <select bind:value={draft.status}>
          <option value="active">Active</option>
          <option value="planned">Planned</option>
          <option value="hiatus">On hiatus</option>
          <option value="completed">Completed</option>
        </select>
      </label>
    </div>
    <label class="col">Description <textarea rows="3" bind:value={draft.description}></textarea></label>
    <div class="row">
      {#if campaigns.some((c) => c.id === draft?.id)}
        <button class="btn ghost danger" onclick={() => remove(draft!.id)}>Remove</button>
      {/if}
      <span style="flex:1"></span>
      <button class="btn quiet" onclick={() => (draft = null)}>Cancel</button>
      <button class="btn" onclick={save}>Save</button>
    </div>
  </div>
{/if}

<div class="bento">
  {#each campaigns as c (c.id)}
    <article class="card camp" class:current={c.name === activeCampaign}>
      <h3>
        {c.name}
        <span class="chip" style={`color:${STATUS_COLORS[c.status]};border-color:${STATUS_COLORS[c.status]}`}>{c.status}</span>
      </h3>
      <p class="muted line">{RULESETS[c.rulesetId ?? 'dnd5e'].name}{c.gm ? ` · GM ${c.gm}` : ''}</p>
      {#if c.description}<p class="desc">{c.description}</p>{/if}
      {#if statsByName[c.name]}
        <p class="muted line num">
          {statsByName[c.name]!.sessions} sessions
          {#if statsByName[c.name]!.latestDate}· last {statsByName[c.name]!.latestDate}{/if}
        </p>
        <p class="muted synopsis">{statsByName[c.name]!.latestSynopsis}</p>
      {/if}
      <div class="chip-row actions">
        <button class="chip" onclick={() => setActive(c)}>Set active</button>
        <button class="chip" onclick={() => (draft = { ...c })}>Edit</button>
        <a class="chip" href="../chronicle">Chronicle</a>
      </div>
    </article>
  {:else}
    <p class="muted">No campaigns yet — create the first one.</p>
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
  .camp.current { border-color: var(--accent); }
  .line { margin: 0; font-size: .8rem; }
  .desc { font-size: .85rem; }
  .synopsis { font-size: .78rem; font-style: italic; }
  .actions { margin-top: auto; padding-top: .5rem; }
  .chip { cursor: pointer; }
  a.chip:hover { text-decoration: none; background: var(--surface-3); }
  .danger { color: var(--danger); border-color: var(--danger); }
</style>
