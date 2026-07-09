<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '@lib/supabase';
  import { renderMarkdown } from '@lib/markdown';

  interface Campaign {
    id: string;
    name: string;
    ruleset_id: string;
  }
  interface LogRow {
    id: string;
    campaign_id: string;
    session_number: number;
    title: string;
    session_date: string | null;
    gm: string;
    players_present: string[];
    synopsis: string;
    body_md: string;
  }

  let campaigns = $state<Campaign[]>([]);
  let logs = $state<LogRow[]>([]);
  let activeCampaign = $state<string | null>(null);
  let openLog = $state<LogRow | null>(null);
  let loading = $state(true);
  let error = $state('');

  const visibleLogs = $derived(
    logs
      .filter((l) => !activeCampaign || l.campaign_id === activeCampaign)
      .toSorted((a, b) => b.session_number - a.session_number),
  );

  onMount(async () => {
    try {
      const client = getSupabase();
      const [c, l] = await Promise.all([
        client.from('chronicle_campaigns').select('id,name,ruleset_id'),
        client
          .from('play_logs')
          .select('id,campaign_id,session_number,title,session_date,gm,players_present,synopsis,body_md')
          .eq('published', true)
          .order('session_number', { ascending: false }),
      ]);
      if (c.error) throw c.error;
      if (l.error) throw l.error;
      campaigns = c.data ?? [];
      logs = l.data ?? [];
      if (campaigns.length === 1) activeCampaign = campaigns[0]!.id;
      // deep link: /chronicle#<campaign>/<session>
      const hash = location.hash.slice(1);
      if (hash) {
        const [cid, sn] = hash.split('/');
        const target = logs.find((x) => x.campaign_id === cid && String(x.session_number) === sn);
        if (target) {
          activeCampaign = cid ?? null;
          openLog = target;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  });

  function open(log: LogRow) {
    openLog = log;
    history.replaceState(null, '', `#${log.campaign_id}/${log.session_number}`);
  }
  function close() {
    openLog = null;
    history.replaceState(null, '', location.pathname);
  }
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? '';
</script>

{#if loading}
  <p class="muted">Loading the chronicle…</p>
{:else if error}
  <p class="muted" role="alert">The chronicle could not be loaded: {error}</p>
{:else if openLog}
  <article class="card session">
    <button class="btn quiet back" onclick={close}>← All sessions</button>
    <header>
      <span class="muted eyebrow">
        {campaignName(openLog.campaign_id)} · Session {openLog.session_number}
        {#if openLog.session_date}· {openLog.session_date}{/if}
      </span>
      <h2>{openLog.title}</h2>
      {#if openLog.gm || openLog.players_present.length}
        <p class="muted table-row">
          {#if openLog.gm}GM: {openLog.gm}{/if}
          {#if openLog.players_present.length}
            · At the table: {openLog.players_present.join(', ')}
          {/if}
        </p>
      {/if}
    </header>
    <div class="body">
      <!-- eslint-disable-next-line svelte/no-at-html-tags — sanitized in renderMarkdown -->
      {@html renderMarkdown(openLog.body_md)}
    </div>
  </article>
{:else}
  {#if campaigns.length > 1}
    <div class="chip-row" style="margin-bottom:1rem;">
      <button class="chip" class:on={!activeCampaign} onclick={() => (activeCampaign = null)}>All campaigns</button>
      {#each campaigns as c (c.id)}
        <button class="chip" class:on={activeCampaign === c.id} onclick={() => (activeCampaign = c.id)}>
          <span class="dot"></span>{c.name}
        </button>
      {/each}
    </div>
  {/if}

  {#if !visibleLogs.length}
    <p class="muted">No published sessions yet.</p>
  {/if}

  <ol class="timeline">
    {#each visibleLogs as log (log.id)}
      <li>
        <button class="card entry" onclick={() => open(log)}>
          <span class="num session-no">{log.session_number}</span>
          <span class="what">
            <span class="title">{log.title}</span>
            <span class="muted meta">
              {campaignName(log.campaign_id)}
              {#if log.session_date}· {log.session_date}{/if}
            </span>
          </span>
        </button>
      </li>
    {/each}
  </ol>
{/if}

<style>
  .timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .6rem; }
  .entry {
    display: flex; align-items: center; gap: .9rem; width: 100%;
    text-align: left; cursor: pointer; font: inherit; color: var(--ink);
    flex-direction: row;
  }
  .entry:hover { border-color: var(--accent); }
  .session-no {
    flex: none; width: 2.4rem; height: 2.4rem; display: grid; place-items: center;
    border-radius: var(--radius-sm); background: var(--accent-soft); color: var(--ink);
    font-weight: 700;
  }
  .what { display: flex; flex-direction: column; gap: .15rem; }
  .title { font-weight: 600; }
  .meta { font-size: .78rem; }

  .session { gap: .8rem; max-width: 800px; }
  .back { align-self: flex-start; }
  .eyebrow { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; }
  .session h2 { margin: .2rem 0 0; }
  .table-row { margin: 0; font-size: .82rem; }
  .body { line-height: 1.7; }
  .body :global(h2) { font-size: 1.05rem; margin-top: 1.4rem; border-bottom: 1px solid var(--edge); padding-bottom: .3rem; }
  .body :global(blockquote) {
    margin: .8rem 0; padding: .5rem .9rem;
    border-left: 3px solid var(--accent); background: var(--surface-2);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
  .body :global(hr) { border: 0; border-top: 1px solid var(--edge); }
</style>
