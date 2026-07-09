<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '@lib/supabase';
  import { tomeSync } from '@lib/sync.svelte';
  import { renderMarkdown } from '@lib/markdown';
  import { RULESETS, type RulesetId } from '@rulesets/index';

  interface Props {
    rulesetId: RulesetId;
  }
  const { rulesetId }: Props = $props();
  const ruleset = RULESETS[rulesetId];

  interface Entry {
    id: string;
    entry_type: string;
    slug: string;
    name: string;
    data: Record<string, unknown>;
  }

  let entries = $state<Entry[]>([]);
  let entryType = $state(ruleset.compendiumTypes[0]?.type ?? '');
  let search = $state('');
  let openId = $state<string | null>(null);
  let loaded = $state(false);
  let error = $state('');

  onMount(() => {
    tomeSync.init();
  });

  // load once signed in
  $effect(() => {
    if ((tomeSync.state === 'synced' || tomeSync.state === 'syncing') && !loaded) {
      loaded = true;
      void load();
    }
  });

  async function load() {
    const { data, error: err } = await getSupabase()
      .from('compendium_entries')
      .select('id,entry_type,slug,name,data')
      .eq('ruleset_id', rulesetId)
      .order('name');
    if (err) {
      error = err.message;
      return;
    }
    entries = (data ?? []) as Entry[];
  }

  const visible = $derived(
    entries.filter(
      (e) =>
        e.entry_type === entryType &&
        (!search || e.name.toLowerCase().includes(search.toLowerCase()) ||
          String(e.data['summary'] ?? '').toLowerCase().includes(search.toLowerCase())),
    ),
  );
</script>

{#if tomeSync.state === 'signedout' || tomeSync.state === 'init'}
  <div class="card notice">
    <h3>Members only</h3>
    <p class="muted">
      {ruleset.name} reference content is licensed material and isn't published openly. Sign in from the
      <a href="../">hub</a> — any member of the group's campaigns can read it.
    </p>
  </div>
{:else if error}
  <p class="muted" role="alert">Could not load entries: {error}</p>
{:else}
  <div class="row" style="margin-bottom:1rem;">
    <div class="chip-row">
      {#each ruleset.compendiumTypes as t (t.type)}
        <button class="chip" class:on={entryType === t.type} onclick={() => { entryType = t.type; openId = null; }}>
          {t.label}
        </button>
      {/each}
    </div>
    <input type="search" placeholder="Search…" bind:value={search} aria-label="Search entries" />
  </div>

  <div class="bento">
    {#each visible as e (e.id)}
      <article class="card" class:span-2={openId === e.id}>
        <button class="head" onclick={() => (openId = openId === e.id ? null : e.id)} aria-expanded={openId === e.id}>
          {e.name}
        </button>
        {#if e.data['summary']}<p class="muted">{String(e.data['summary'])}</p>{/if}
        {#if openId === e.id}
          <div class="detail">
            {#if typeof e.data['description'] === 'string'}
              <!-- eslint-disable-next-line svelte/no-at-html-tags — sanitized -->
              {@html renderMarkdown(e.data['description'])}
            {/if}
            {#each Object.entries(e.data) as [k, v]}
              {#if k !== 'summary' && k !== 'description' && (typeof v === 'string' || typeof v === 'number')}
                <p class="kv"><b>{k}.</b> {v}</p>
              {/if}
            {/each}
          </div>
        {/if}
      </article>
    {:else}
      <p class="muted">Nothing here yet — the site admin adds {ruleset.name} content from the admin console.</p>
    {/each}
  </div>
{/if}

<style>
  .notice { max-width: 560px; }
  .row { display: flex; gap: .8rem; flex-wrap: wrap; align-items: center; }
  .row input { flex: 1; min-width: 140px; }
  .chip { cursor: pointer; }
  .head { background: none; border: 0; padding: 0; font: inherit; font-weight: 600; color: var(--ink); cursor: pointer; text-align: left; }
  .detail { border-top: 1px solid var(--edge); padding-top: .5rem; font-size: .88rem; }
  .kv { margin: .25rem 0; }
</style>
