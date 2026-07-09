<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '@lib/supabase';
  import { tomeSync } from '@lib/sync.svelte';
  import { renderMarkdown } from '@lib/markdown';
  import { RULESETS, type RulesetId } from '@rulesets/index';

  interface CampaignRow {
    id: string;
    name: string;
    ruleset_id: RulesetId;
  }
  interface LogRow {
    id?: string;
    campaign_id: string;
    session_number: number;
    title: string;
    session_date: string | null;
    gm: string;
    players_present: string[];
    synopsis: string;
    body_md: string;
    published: boolean;
  }

  let campaigns = $state<CampaignRow[]>([]);
  let campaignId = $state('');
  let sessions = $state<LogRow[]>([]);
  let draft = $state<LogRow | null>(null);
  let playersText = $state('');
  let preview = $state(false);
  let message = $state('');
  let busy = $state(false);

  const campaign = $derived(campaigns.find((c) => c.id === campaignId) ?? null);
  const canEdit = $derived(tomeSync.isGm || tomeSync.isAdmin);

  onMount(() => {
    tomeSync.init();
    void loadCampaigns();
  });

  async function loadCampaigns() {
    const { data, error } = await getSupabase().from('campaigns').select('id,name,ruleset_id');
    if (error) {
      message = error.message;
      return;
    }
    campaigns = (data ?? []) as CampaignRow[];
    if (campaigns.length && !campaignId) campaignId = campaigns[0]!.id;
    if (campaignId) await loadSessions();
  }

  async function loadSessions() {
    const { data, error } = await getSupabase()
      .from('play_logs')
      .select('id,campaign_id,session_number,title,session_date,gm,players_present,synopsis,body_md,published')
      .eq('campaign_id', campaignId)
      .order('session_number', { ascending: false });
    if (error) {
      message = error.message;
      return;
    }
    sessions = (data ?? []) as LogRow[];
  }

  function templateBody(): string {
    const ruleset = campaign ? RULESETS[campaign.ruleset_id] : RULESETS.dnd5e;
    return ruleset.logTemplate
      .map((s) => `## ${s.label}\n\n${s.placeholder ? `<!-- ${s.placeholder} -->\n` : ''}`)
      .join('\n');
  }

  function newSession() {
    const next = (sessions[0]?.session_number ?? -1) + 1;
    draft = {
      campaign_id: campaignId,
      session_number: next,
      title: '',
      session_date: new Date().toISOString().slice(0, 10),
      gm: '',
      players_present: [],
      synopsis: '',
      body_md: templateBody(),
      published: false,
    };
    playersText = '';
    preview = false;
    message = '';
  }

  function editSession(s: LogRow) {
    draft = { ...s };
    playersText = s.players_present.join(', ');
    preview = false;
    message = '';
  }

  async function save() {
    if (!draft) return;
    busy = true;
    message = '';
    draft.players_present = playersText.split(',').map((p) => p.trim()).filter(Boolean);
    draft.synopsis = draft.synopsis || draft.title;
    const { error } = await getSupabase()
      .from('play_logs')
      .upsert(draft, { onConflict: 'campaign_id,session_number' });
    busy = false;
    if (error) {
      message = `Save failed: ${error.message}`;
      return;
    }
    message = draft.published ? 'Saved and published.' : 'Saved as draft.';
    await loadSessions();
  }

  async function remove() {
    if (!draft?.id) return;
    if (!confirm(`Delete session ${draft.session_number} permanently?`)) return;
    const { error } = await getSupabase().from('play_logs').delete().eq('id', draft.id);
    if (error) {
      message = `Delete failed: ${error.message}`;
      return;
    }
    draft = null;
    await loadSessions();
  }

  /** Rebuild the Obsidian-style markdown file as a download (backup format). */
  function exportMarkdown() {
    if (!draft || !campaign) return;
    const fm = [
      '---',
      `campaign: ${campaign.name}`,
      `ruleset: ${RULESETS[campaign.ruleset_id].name}`,
      `session: "${draft.session_number}"`,
      `date: ${draft.session_date ?? ''}`,
      `gm: "${draft.gm}"`,
      'players_present:',
      ...draft.players_present.map((p) => `  - "${p}"`),
      `synopsis: ${draft.synopsis}`,
      `web_status: ${draft.published ? 'Published' : 'Draft'}`,
      '---',
      '',
    ].join('\n');
    const blob = new Blob([fm + draft.body_md + '\n'], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${campaign.name.replace(/[^\w]+/g, '-')} - ${String(draft.session_number).padStart(3, '0')}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
</script>

{#if tomeSync.state === 'signedout' || tomeSync.state === 'init'}
  <p class="muted">Sign in from the <a href="../">hub</a> to edit session logs. The public chronicle is readable without an account.</p>
{:else if !canEdit}
  <p class="muted">Editing the chronicle is limited to the campaign GM. You can still read everything in the chronicle.</p>
{:else}
  <div class="row head">
    <select bind:value={campaignId} onchange={() => { draft = null; void loadSessions(); }} aria-label="Campaign">
      {#each campaigns as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
    </select>
    <button class="btn" onclick={newSession} disabled={!campaignId}>New session</button>
  </div>

  {#if !draft}
    <ol class="list">
      {#each sessions as s (s.id)}
        <li>
          <button class="card entry" onclick={() => editSession(s)}>
            <span class="num no">{s.session_number}</span>
            <span class="t">{s.title || '(untitled)'}</span>
            <span class="chip" class:on={s.published}>{s.published ? 'Published' : 'Draft'}</span>
          </button>
        </li>
      {:else}
        <p class="muted">No sessions yet — create the first one.</p>
      {/each}
    </ol>
  {:else}
    <div class="editor card">
      <div class="row">
        <label>Session <input type="number" min="0" bind:value={draft.session_number} /></label>
        <label>Date <input type="date" bind:value={draft.session_date} /></label>
        <label class="grow">Title <input type="text" bind:value={draft.title} placeholder="One line that names the night" /></label>
      </div>
      <div class="row">
        <label>GM <input type="text" bind:value={draft.gm} /></label>
        <label class="grow">Players <input type="text" bind:value={playersText} placeholder="comma, separated, names" /></label>
      </div>

      <div class="row">
        <button class="chip" class:on={!preview} onclick={() => (preview = false)}>Write</button>
        <button class="chip" class:on={preview} onclick={() => (preview = true)}>Preview</button>
      </div>

      {#if preview}
        <div class="preview">
          <!-- eslint-disable-next-line svelte/no-at-html-tags — sanitized in renderMarkdown -->
          {@html renderMarkdown(draft.body_md)}
        </div>
      {:else}
        <textarea rows="18" bind:value={draft.body_md} aria-label="Session log markdown"></textarea>
      {/if}

      <div class="row actions">
        <label class="pub"><input type="checkbox" bind:checked={draft.published} /> Published (visible to everyone)</label>
        <span style="flex:1"></span>
        <button class="btn ghost" onclick={exportMarkdown}>Export .md</button>
        {#if draft.id}<button class="btn ghost danger" onclick={remove}>Delete</button>{/if}
        <button class="btn quiet" onclick={() => (draft = null)}>Back</button>
        <button class="btn" onclick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  {/if}
{/if}
{#if message}<p class="msg" role="status">{message}</p>{/if}

<style>
  .head { margin-bottom: 1rem; }
  .row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .row label { display: flex; align-items: center; gap: .4rem; font-size: .82rem; color: var(--ink-muted); }
  .row .grow { flex: 1; }
  .row .grow input { flex: 1; }
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
  .entry { display: flex; flex-direction: row; align-items: center; gap: .8rem; width: 100%; cursor: pointer; font: inherit; color: var(--ink); text-align: left; }
  .no { flex: none; width: 2.2rem; height: 2.2rem; display: grid; place-items: center; border-radius: var(--radius-sm); background: var(--accent-soft); font-weight: 700; }
  .t { flex: 1; font-weight: 600; }
  .editor { gap: .8rem; }
  .chip { cursor: pointer; }
  textarea { width: 100%; font-family: var(--font-mono); font-size: .85rem; line-height: 1.6; resize: vertical; }
  .preview { border: 1px solid var(--edge); border-radius: var(--radius-sm); padding: .8rem 1rem; min-height: 10rem; }
  .preview :global(h2) { font-size: 1rem; border-bottom: 1px solid var(--edge); padding-bottom: .25rem; }
  .actions { border-top: 1px solid var(--edge); padding-top: .7rem; }
  .pub { font-size: .82rem; color: var(--ink-muted); display: flex; gap: .4rem; align-items: center; }
  .danger { color: var(--danger); border-color: var(--danger); }
  .msg { color: var(--info); font-size: .85rem; }
</style>
