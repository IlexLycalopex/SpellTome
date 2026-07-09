<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '@lib/supabase';
  import { tomeSync } from '@lib/sync.svelte';
  import { RULESET_LIST, RULESETS, type RulesetId } from '@rulesets/index';

  interface Entry {
    id?: string;
    ruleset_id: RulesetId;
    entry_type: string;
    slug: string;
    name: string;
    data: Record<string, unknown>;
  }

  let rulesetId = $state<RulesetId>('vaesen');
  let entryType = $state('');
  let entries = $state<Entry[]>([]);
  let draft = $state<Entry | null>(null);
  let dataText = $state('{}');
  let bulkText = $state('');
  let showBulk = $state(false);
  let message = $state('');

  const types = $derived(RULESETS[rulesetId].compendiumTypes);

  onMount(() => {
    tomeSync.init();
    entryType = types[0]?.type ?? '';
    void load();
  });

  async function load() {
    if (!entryType) return;
    const { data, error } = await getSupabase()
      .from('compendium_entries')
      .select('id,ruleset_id,entry_type,slug,name,data')
      .eq('ruleset_id', rulesetId)
      .eq('entry_type', entryType)
      .order('name');
    if (error) {
      message = error.message;
      return;
    }
    entries = (data ?? []) as Entry[];
  }

  function pickRuleset(id: RulesetId) {
    rulesetId = id;
    entryType = RULESETS[id].compendiumTypes[0]?.type ?? '';
    draft = null;
    void load();
  }

  const slugify = (s: string) =>
    s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

  function newEntry() {
    draft = { ruleset_id: rulesetId, entry_type: entryType, slug: '', name: '', data: { summary: '', description: '' } };
    dataText = JSON.stringify(draft.data, null, 2);
    message = '';
  }
  function editEntry(e: Entry) {
    draft = { ...e };
    dataText = JSON.stringify(e.data, null, 2);
    message = '';
  }

  async function save() {
    if (!draft) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(dataText);
    } catch {
      message = 'The data field is not valid JSON.';
      return;
    }
    const row = { ...draft, data: parsed, slug: draft.slug || slugify(draft.name) };
    const { error } = await getSupabase()
      .from('compendium_entries')
      .upsert(row, { onConflict: 'ruleset_id,entry_type,slug' });
    if (error) {
      message = `Save failed: ${error.message}`;
      return;
    }
    message = `Saved ${row.name}.`;
    draft = null;
    await load();
  }

  async function remove() {
    if (!draft?.id) return;
    if (!confirm(`Delete "${draft.name}" permanently?`)) return;
    const { error } = await getSupabase().from('compendium_entries').delete().eq('id', draft.id);
    if (error) {
      message = error.message;
      return;
    }
    draft = null;
    await load();
  }

  /** Bulk import: a JSON array of {name, slug?, ...data fields}. */
  async function bulkImport() {
    let items: Record<string, unknown>[];
    try {
      items = JSON.parse(bulkText);
      if (!Array.isArray(items)) throw new Error('not an array');
    } catch {
      message = 'Bulk import expects a JSON array of objects with at least a "name".';
      return;
    }
    const rows = items.map((it) => {
      const { name, slug, ...rest } = it as { name: string; slug?: string } & Record<string, unknown>;
      return {
        ruleset_id: rulesetId,
        entry_type: entryType,
        slug: slug || slugify(String(name)),
        name: String(name),
        data: rest,
      };
    });
    const { error } = await getSupabase()
      .from('compendium_entries')
      .upsert(rows, { onConflict: 'ruleset_id,entry_type,slug' });
    if (error) {
      message = `Import failed: ${error.message}`;
      return;
    }
    message = `Imported ${rows.length} entries.`;
    bulkText = '';
    showBulk = false;
    await load();
  }
</script>

{#if tomeSync.state === 'signedout' || tomeSync.state === 'init'}
  <p class="muted">Sign in from the <a href="../">hub</a> as the site admin to manage compendium content.</p>
{:else if !tomeSync.isAdmin}
  <p class="muted">Content curation is limited to the site admin.</p>
{:else}
  <div class="chip-row" style="margin-bottom:.8rem;">
    {#each RULESET_LIST as rs (rs.id)}
      <button class="chip" class:on={rs.id === rulesetId} onclick={() => pickRuleset(rs.id)}>
        <span class="dot"></span>{rs.name}
      </button>
    {/each}
  </div>
  <div class="row head">
    <select bind:value={entryType} onchange={() => { draft = null; void load(); }} aria-label="Entry type">
      {#each types as t (t.type)}
        <option value={t.type}>{t.label}{t.public ? '' : ' (gated)'}</option>
      {/each}
    </select>
    <button class="btn" onclick={newEntry}>New entry</button>
    <button class="btn ghost" onclick={() => (showBulk = !showBulk)}>Bulk import</button>
    <span class="muted num">{entries.length} entries</span>
  </div>

  {#if showBulk}
    <div class="card editor">
      <p class="muted hint">
        Paste a JSON array — each object needs a <code>name</code>; every other field is stored as the
        entry's data. Existing entries with the same slug are updated.
      </p>
      <textarea rows="8" bind:value={bulkText} aria-label="Bulk JSON"></textarea>
      <div class="row"><button class="btn" onclick={bulkImport}>Import into {entryType}</button></div>
    </div>
  {/if}

  {#if draft}
    <div class="card editor">
      <div class="row">
        <label class="grow">Name <input type="text" bind:value={draft.name} /></label>
        <label>Slug <input type="text" bind:value={draft.slug} placeholder={slugify(draft.name) || 'auto'} /></label>
      </div>
      <label class="col">Data (JSON — use "summary" for search/list text)
        <textarea rows="12" bind:value={dataText}></textarea>
      </label>
      <div class="row">
        {#if draft.id}<button class="btn ghost danger" onclick={remove}>Delete</button>{/if}
        <span style="flex:1"></span>
        <button class="btn quiet" onclick={() => (draft = null)}>Cancel</button>
        <button class="btn" onclick={save}>Save</button>
      </div>
    </div>
  {:else}
    <div class="bento">
      {#each entries as e (e.id)}
        <button class="card entry" onclick={() => editEntry(e)}>
          <h3>{e.name}</h3>
          <p class="muted">{String(e.data['summary'] ?? '')}</p>
        </button>
      {:else}
        <p class="muted">No {entryType} entries yet for {RULESETS[rulesetId].name}.</p>
      {/each}
    </div>
  {/if}
{/if}
{#if message}<p class="msg" role="status">{message}</p>{/if}

<style>
  .row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .head { margin-bottom: 1rem; }
  .chip { cursor: pointer; }
  .editor { gap: .7rem; margin-bottom: 1rem; }
  .row label, .col { display: flex; align-items: center; gap: .4rem; font-size: .82rem; color: var(--ink-muted); }
  .col { flex-direction: column; align-items: stretch; }
  .grow { flex: 1; }
  .grow input { flex: 1; }
  textarea { font-family: var(--font-mono); font-size: .82rem; width: 100%; resize: vertical; }
  .entry { cursor: pointer; font: inherit; text-align: left; color: var(--ink); }
  .danger { color: var(--danger); border-color: var(--danger); }
  .hint code { background: var(--surface-2); padding: .1em .35em; border-radius: 4px; }
  .msg { color: var(--info); font-size: .85rem; }
</style>
