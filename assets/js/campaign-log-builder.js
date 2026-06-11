const GITHUB_USER = 'IlexLycalopex';
const GITHUB_REPO = 'SpellTome';
const SESSIONS_PATH = 'playlog';
const API_BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`;
const DEFAULT_PLAYERS = ['Jamie Watts', 'Alex Stratford', 'Paul Schofield', 'Nick Johnson'];

const emptyState = () => ({
  campaign: "Storm King's Thunder",
  ruleset: 'D&D 5e',
  session: '',
  date: new Date().toISOString().slice(0, 10),
  gm: 'Matthew Rogers',
  synopsis: '',
  webStatus: 'Published',
  players: [...DEFAULT_PLAYERS],
  recap: [''],
  events: [{ type: 'important', title: 'Milestone', body: '' }],
  npcs: [{ mode: 'New NPC', type: 'info', name: '', status: '', notes: '' }],
  locations: [''],
  threads: [{ title: '', body: '', aside: '' }],
  milestones: ['']
});

const hasStoredDraft = (() => {
  try {
    return tomeStore.get('logDraft') !== null;
  } catch (error) {
    return false;
  }
})();

let state = loadState();
let sessionManuallyEdited = hasStoredDraft && Boolean(String(state.session || '').trim());
let editingFile = null;   // filename in playlog/ when editing an existing session
let repoBranch = 'main';

const listConfig = {
  players: {
    create: () => '',
    label: index => `Player ${index + 1}`,
    renderItem: (value, index) => `
      <div class="stack-item" data-list="players" data-index="${index}">
        <div class="stack-item-head">
          <div class="stack-item-title">${listConfig.players.label(index)}</div>
          ${renderItemActions('players', index)}
        </div>
        <div class="stack-grid">
          <label class="field">
            <span>Player name</span>
            <input type="text" data-bind="players.${index}" value="${escapeHtml(value)}" placeholder="Jamie Watts">
          </label>
        </div>
      </div>`
  },
  recap: {
    create: () => '',
    label: index => `Recap ${index + 1}`,
    renderItem: (value, index) => `
      <div class="stack-item" data-list="recap" data-index="${index}">
        <div class="stack-item-head">
          <div class="stack-item-title">${listConfig.recap.label(index)}</div>
          ${renderItemActions('recap', index)}
        </div>
        <label class="field">
          <span>Bullet text</span>
          <textarea rows="3" data-bind="recap.${index}" placeholder="Write one recap beat. Wiki links like [[Waterdeep]] are preserved.">${escapeHtml(value)}</textarea>
        </label>
      </div>`
  },
  events: {
    create: () => ({ type: 'important', title: 'Milestone', body: '' }),
    label: index => `Event ${index + 1}`,
    renderItem: (value, index) => `
      <div class="stack-item" data-list="events" data-index="${index}">
        <div class="stack-item-head">
          <div class="stack-item-title">${listConfig.events.label(index)}</div>
          ${renderItemActions('events', index)}
        </div>
        <div class="stack-grid two-up">
          <label class="field">
            <span>Callout type</span>
            <select data-bind="events.${index}.type">
              ${renderOptions(['important', 'info', 'warning', 'question'], value.type)}
            </select>
          </label>
          <label class="field">
            <span>Callout title</span>
            <input type="text" data-bind="events.${index}.title" value="${escapeHtml(value.title)}" placeholder="Milestone">
          </label>
        </div>
        <label class="field">
          <span>Body</span>
          <textarea rows="3" data-bind="events.${index}.body" placeholder="What happened and why does it matter?">${escapeHtml(value.body)}</textarea>
        </label>
      </div>`
  },
  npcs: {
    create: () => ({ mode: 'New NPC', type: 'info', name: '', status: '', notes: '' }),
    label: index => `NPC ${index + 1}`,
    renderItem: (value, index) => `
      <div class="stack-item" data-list="npcs" data-index="${index}">
        <div class="stack-item-head">
          <div class="stack-item-title">${listConfig.npcs.label(index)}</div>
          ${renderItemActions('npcs', index)}
        </div>
        <div class="stack-grid two-up">
          <label class="field">
            <span>Mode</span>
            <select data-bind="npcs.${index}.mode">
              ${renderOptions(['New NPC', 'NPC Update'], value.mode)}
            </select>
          </label>
          <label class="field">
            <span>Callout type</span>
            <select data-bind="npcs.${index}.type">
              ${renderOptions(['info', 'warning', 'important', 'question'], value.type)}
            </select>
          </label>
          <label class="field">
            <span>Name</span>
            <input type="text" data-bind="npcs.${index}.name" value="${escapeHtml(value.name)}" placeholder="Caulder Marskyl">
          </label>
          <label class="field">
            <span>Status</span>
            <input type="text" data-bind="npcs.${index}.status" value="${escapeHtml(value.status)}" placeholder="Allied">
          </label>
        </div>
        <label class="field">
          <span>Notes</span>
          <textarea rows="3" data-bind="npcs.${index}.notes" placeholder="Head Butler of [[House of Thann]]">${escapeHtml(value.notes)}</textarea>
        </label>
      </div>`
  },
  locations: {
    create: () => '',
    label: index => `Location ${index + 1}`,
    renderItem: (value, index) => `
      <div class="stack-item" data-list="locations" data-index="${index}">
        <div class="stack-item-head">
          <div class="stack-item-title">${listConfig.locations.label(index)}</div>
          ${renderItemActions('locations', index)}
        </div>
        <label class="field">
          <span>Location</span>
          <input type="text" data-bind="locations.${index}" value="${escapeHtml(value)}" placeholder="Goldenfields">
        </label>
      </div>`
  },
  threads: {
    create: () => ({ title: '', body: '', aside: '' }),
    label: index => `Thread ${index + 1}`,
    renderItem: (value, index) => `
      <div class="stack-item" data-list="threads" data-index="${index}">
        <div class="stack-item-head">
          <div class="stack-item-title">${listConfig.threads.label(index)}</div>
          ${renderItemActions('threads', index)}
        </div>
        <label class="field">
          <span>Hook title</span>
          <input type="text" data-bind="threads.${index}.title" value="${escapeHtml(value.title)}" placeholder="Pendant to return to [[Waterdeep]]">
        </label>
        <label class="field">
          <span>Main body</span>
          <textarea rows="4" data-bind="threads.${index}.body" placeholder="Describe the unresolved thread.">${escapeHtml(value.body)}</textarea>
        </label>
        <label class="field">
          <span>Indented note</span>
          <textarea rows="2" data-bind="threads.${index}.aside" placeholder="Optional extra line shown as a nested note.">${escapeHtml(value.aside)}</textarea>
        </label>
      </div>`
  },
  milestones: {
    create: () => '',
    label: index => `Milestone ${index + 1}`,
    renderItem: (value, index) => `
      <div class="stack-item" data-list="milestones" data-index="${index}">
        <div class="stack-item-head">
          <div class="stack-item-title">${listConfig.milestones.label(index)}</div>
          ${renderItemActions('milestones', index)}
        </div>
        <label class="field">
          <span>Milestone text</span>
          <input type="text" data-bind="milestones.${index}" value="${escapeHtml(value)}" placeholder="Level up to level 4!">
        </label>
      </div>`
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const campaignOptions = document.getElementById('campaign-options');
  if (campaignOptions && typeof tomeStore !== 'undefined') {
    campaignOptions.innerHTML = tomeStore.campaignNames()
      .map(name => `<option value="${escapeHtml(name)}"></option>`).join('');
  }
  bindScalarFields();
  bindToolbar();
  bindPreviewTabs();
  importNpcQueue();
  render();
  void initializeSuggestedSessionNumber();
});

// NPCs sent over from the NPC Generator (npc-generator.html) wait in this
// queue; absorb them into the draft's NPC list on load.
function importNpcQueue() {
  let queue;
  try {
    queue = tomeStore.get('npcQueue');
    tomeStore.remove('npcQueue');
  } catch (error) { return; }
  if (!Array.isArray(queue) || !queue.length) return;
  const incoming = queue
    .filter(item => item && hasText(item.name))
    .map(item => ({ mode: 'New NPC', type: 'info', name: String(item.name), status: '', notes: String(item.notes || '') }));
  if (!incoming.length) return;
  const existing = state.npcs.filter(item => hasText(item.name) || hasText(item.notes));
  state.npcs = existing.concat(incoming);
  setStatus(`${incoming.length} NPC${incoming.length === 1 ? '' : 's'} imported from the NPC Generator`);
}

function bindScalarFields() {
  const map = {
    campaign: 'campaign',
    ruleset: 'ruleset',
    session: 'session',
    date: 'date',
    gm: 'gm',
    synopsis: 'synopsis',
    'web-status': 'webStatus'
  };

  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      state[key] = el.value;
      if (key === 'session') sessionManuallyEdited = true;
      render();
    });
    el.addEventListener('change', () => {
      state[key] = el.value;
      if (key === 'session') sessionManuallyEdited = true;
      render();
    });
  });
}

function bindToolbar() {
  document.body.addEventListener('input', handleListInput);
  document.body.addEventListener('click', handleBodyClick);

  document.getElementById('save-btn').addEventListener('click', () => {
    saveState();
    setStatus('Draft saved locally');
  });

  document.getElementById('download-btn').addEventListener('click', () => {
    downloadMarkdown();
  });

  document.getElementById('copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown(state));
      setStatus('Markdown copied to clipboard');
    } catch (error) {
      setStatus('Clipboard access failed');
    }
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    state = emptyState();
    sessionManuallyEdited = false;
    editingFile = null;
    updateEditingUI();
    render();
    void initializeSuggestedSessionNumber(true);
    setStatus('Draft reset');
  });

  document.getElementById('load-btn').addEventListener('click', () => {
    void toggleSessionPicker();
  });

  document.getElementById('load-select').addEventListener('change', event => {
    if (event.target.value) void loadSession(event.target.value);
  });

  document.getElementById('submit-btn').addEventListener('click', () => {
    void submitToGitHub();
  });
}

function bindPreviewTabs() {
  document.querySelectorAll('[data-preview-tab]').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.previewTab;
      document.querySelectorAll('[data-preview-tab]').forEach(other => other.classList.toggle('active', other === button));
      document.getElementById('rendered-preview').classList.toggle('is-hidden', tab !== 'rendered');
      document.getElementById('markdown-preview').style.display = tab === 'markdown' ? 'block' : 'none';
    });
  });
}

function handleBodyClick(event) {
  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    const listName = addButton.dataset.add;
    state[listName].push(listConfig[listName].create());
    render();
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;

  const listName = actionButton.dataset.list;
  const index = Number(actionButton.dataset.index);
  const action = actionButton.dataset.action;
  const list = state[listName];
  if (!Array.isArray(list)) return;

  if (action === 'delete' && list.length > 1) {
    list.splice(index, 1);
  }

  if (action === 'up' && index > 0) {
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
  }

  if (action === 'down' && index < list.length - 1) {
    [list[index + 1], list[index]] = [list[index], list[index + 1]];
  }

  render();
}

function handleListInput(event) {
  const target = event.target;
  const path = target.dataset.bind;
  if (!path) return;
  setAtPath(state, path, target.value);
  renderPreview();
  updateMeta();
  updateCompletion();
  saveState();
}

function render(save = true) {
  syncScalarFields();
  renderList('players', 'players-list');
  renderList('recap', 'recap-list');
  renderList('events', 'events-list');
  renderList('npcs', 'npcs-list');
  renderList('locations', 'locations-list');
  renderList('threads', 'threads-list');
  renderList('milestones', 'milestones-list');
  renderPreview();
  updateMeta();
  updateCompletion();
  if (save) saveState();
}

function syncScalarFields() {
  document.getElementById('campaign').value = state.campaign;
  document.getElementById('ruleset').value = state.ruleset;
  document.getElementById('session').value = state.session;
  document.getElementById('date').value = state.date;
  document.getElementById('gm').value = state.gm;
  document.getElementById('synopsis').value = state.synopsis;
  document.getElementById('web-status').value = state.webStatus;
}

function renderList(listName, containerId) {
  const container = document.getElementById(containerId);
  const items = state[listName] || [];
  if (!items.length) {
    container.innerHTML = '<div class="empty-state">Nothing here yet. Use the add button to create the first entry.</div>';
    return;
  }
  container.innerHTML = items.map((item, index) => listConfig[listName].renderItem(item, index)).join('');
}

function renderPreview() {
  const markdown = generateMarkdown(state);
  document.getElementById('markdown-preview').value = markdown;
  document.getElementById('rendered-preview').innerHTML = renderMarkdown(markdown);
}

function updateMeta() {
  document.getElementById('filename-preview').textContent = getFilename();
}

function updateCompletion() {
  const sections = [
    state.synopsis.trim(),
    state.recap.some(hasText),
    state.events.some(item => hasText(item.title) || hasText(item.body)),
    state.npcs.some(item => hasText(item.name) || hasText(item.notes)),
    state.locations.some(hasText),
    state.threads.some(item => hasText(item.title) || hasText(item.body))
  ];
  const count = sections.filter(Boolean).length;
  document.getElementById('completion-text').textContent = `${count} of 6 sections complete`;
}

function renderItemActions(listName, index) {
  const list = state[listName];
  return `
    <div class="stack-item-actions">
      <button type="button" class="icon-btn" data-action="up" data-list="${listName}" data-index="${index}" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
      <button type="button" class="icon-btn" data-action="down" data-list="${listName}" data-index="${index}" ${index === list.length - 1 ? 'disabled' : ''}>&darr;</button>
      <button type="button" class="icon-btn" data-action="delete" data-list="${listName}" data-index="${index}" ${list.length === 1 ? 'disabled' : ''}>&times;</button>
    </div>`;
}

function renderOptions(options, selected) {
  return options.map(option => `<option value="${escapeHtml(option)}" ${option === selected ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('');
}

function generateMarkdown(data) {
  const lines = [];
  lines.push('---');
  lines.push(`campaign: ${yamlText(data.campaign)}`);
  lines.push(`ruleset: ${yamlText(data.ruleset)}`);
  lines.push(`session: "${String(data.session || '').trim()}"`);
  lines.push(`date: ${data.date || ''}`);
  lines.push(`gm: "${escapeDoubleQuotes(asWikiLink(data.gm))}"`);
  lines.push('players_present:');
  cleanList(data.players).forEach(player => {
    lines.push(`  - "${escapeDoubleQuotes(asWikiLink(player))}"`);
  });
  lines.push(`synopsis: ${yamlText(data.synopsis)}`);
  lines.push(`web_status: ${yamlText(data.webStatus)}`);
  lines.push('---');
  lines.push('## Session Recap');
  lines.push('');
  cleanList(data.recap).forEach(item => lines.push(`- ${item}`));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Key Events');
  lines.push('');
  cleanObjects(data.events, item => item.title || item.body).forEach(item => {
    lines.push(`> [!${(item.type || 'important').trim()}] ${item.title || 'Milestone'}`);
    toQuoteLines(item.body).forEach(line => lines.push(`>  ${line}`));
    lines.push('');
  });
  lines.push('---');
  lines.push('');
  lines.push('## NPCs Encountered');
  lines.push('');
  cleanObjects(data.npcs, item => item.name || item.notes).forEach(item => {
    lines.push(`> [!${(item.type || 'info').trim()}] ${(item.mode || 'New NPC').trim()}: ${asWikiLink(item.name)}`);
    if (hasText(item.status)) lines.push(`> **Status:** ${item.status.trim()}`);
    toQuoteLines(item.notes).forEach(line => lines.push(`> ${line}`));
    lines.push('');
  });
  lines.push('---');
  lines.push('');
  lines.push('## Locations Visited');
  lines.push('');
  cleanList(data.locations).forEach(item => lines.push(`- ${asWikiLink(item)}`));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Open Threads');
  lines.push('');
  cleanObjects(data.threads, item => item.title || item.body).forEach(item => {
    lines.push(`> [!question] Hook: ${item.title.trim()}`);
    toQuoteLines(item.body).forEach(line => lines.push(`> ${line}`));
    if (hasText(item.aside)) {
      toQuoteLines(item.aside).forEach(line => lines.push(`>  >  ${line}`));
    }
    lines.push('');
  });
  lines.push('---');
  lines.push('');
  lines.push('## Milestones');
  lines.push('');
  cleanList(data.milestones).forEach(item => lines.push(`- **Milestone reached:** ${item}`));
  lines.push('');
  return lines.join('\n');
}

function renderMarkdown(markdown) {
  const sections = markdown.split('\n');
  let html = '';
  let inList = false;
  let callout = null;

  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  const flushCallout = () => {
    if (!callout) return;
    html += `<div class="callout ${escapeHtml(callout.type)}"><div class="callout-title">${escapeHtml(callout.title)}</div>${callout.lines.map(line => `<p>${inlineMarkdown(line)}</p>`).join('')}</div>`;
    callout = null;
  };

  sections.forEach(rawLine => {
    const line = rawLine.trimEnd();
    const calloutStart = line.match(/^>\s*\[!(\w+)\]\s*(.*)$/);

    if (calloutStart) {
      closeList();
      flushCallout();
      callout = { type: calloutStart[1].toLowerCase(), title: calloutStart[2], lines: [] };
      return;
    }

    if (callout && /^>\s?/.test(line)) {
      callout.lines.push(line.replace(/^>\s?/, ''));
      return;
    }

    flushCallout();

    if (!line.trim()) {
      closeList();
      return;
    }

    if (line === '---') {
      closeList();
      html += '<hr>';
      return;
    }

    if (line.startsWith('## ')) {
      closeList();
      html += `<h2>${escapeHtml(line.replace(/^##\s+/, ''))}</h2>`;
      return;
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${inlineMarkdown(line.slice(2))}</li>`;
      return;
    }

    if (line.startsWith('campaign:') || line.startsWith('ruleset:') || line.startsWith('session:') || line.startsWith('date:') || line.startsWith('gm:') || line.startsWith('players_present:') || line.startsWith('synopsis:') || line.startsWith('web_status:') || line.startsWith('  - ')) {
      return;
    }

    closeList();
    html += `<p>${inlineMarkdown(line)}</p>`;
  });

  flushCallout();
  closeList();
  return html;
}

function inlineMarkdown(text) {
  return escapeHtml(stripYamlQuotes(text))
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function stripYamlQuotes(text) {
  return text.replace(/^"|"$/g, '');
}

function yamlText(value) {
  const text = String(value || '').trim();
  if (!text) return '""';
  if (/[:#"'\[\]{}]|^\s|\s$/.test(text)) {
    return `"${escapeDoubleQuotes(text)}"`;
  }
  return text;
}

function asWikiLink(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.startsWith('[[') ? text : `[[${text}]]`;
}

function toQuoteLines(value) {
  return String(value || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function cleanList(list) {
  return (list || []).map(item => String(item || '').trim()).filter(Boolean);
}

function cleanObjects(list, predicate) {
  return (list || []).filter(item => predicate(item || {}));
}

function hasText(value) {
  return String(value || '').trim().length > 0;
}

function getFilename() {
  if (editingFile) return editingFile;
  const session = String(state.session || '000').padStart(3, '0');
  return `SKT - ${session}.md`;
}

// ═══════ EDIT EXISTING SESSIONS ═══════

async function toggleSessionPicker() {
  const select = document.getElementById('load-select');
  if (select.style.display !== 'none') {
    select.style.display = 'none';
    return;
  }
  setStatus('Fetching session list…');
  try {
    const branch = await fetchDefaultBranch();
    repoBranch = branch;
    const tree = await fetchJSON(`${API_BASE}/git/trees/${branch}?recursive=1`);
    const files = tree.tree
      .filter(item => item.type === 'blob' && item.path.startsWith(`${SESSIONS_PATH}/`) && item.path.endsWith('.md'))
      .map(item => item.path.split('/').pop())
      .sort()
      .reverse();
    if (!files.length) {
      setStatus('No sessions found in the vault');
      return;
    }
    select.innerHTML = '<option value="">Select a session…</option>'
      + files.map(file => `<option value="${escapeHtml(file)}">${escapeHtml(file)}</option>`).join('');
    select.style.display = '';
    setStatus(`${files.length} session${files.length === 1 ? '' : 's'} in the vault`);
  } catch (error) {
    setStatus('Could not reach GitHub — check your connection');
  }
}

async function loadSession(filename) {
  setStatus(`Loading ${filename}…`);
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${repoBranch}/${SESSIONS_PATH}/${encodeURIComponent(filename)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    state = parseMarkdownToState(markdown);
    editingFile = filename;
    sessionManuallyEdited = true;
    document.getElementById('load-select').style.display = 'none';
    updateEditingUI();
    render();
    setStatus(`Editing ${filename} — Submit opens GitHub to commit the update`);
  } catch (error) {
    setStatus(`Could not load ${filename}`);
  }
}

function updateEditingUI() {
  document.getElementById('template-label').textContent =
    editingFile ? `Editing ${editingFile}` : "Storm King's Thunder session note";
  document.getElementById('submit-btn').textContent =
    editingFile ? 'Submit Update' : 'Submit to GitHub';
}

/**
 * Parse a session markdown file (as produced by generateMarkdown) back into
 * builder state. Tolerant of hand-edited files: unknown lines are ignored,
 * missing sections keep the template defaults.
 */
function parseMarkdownToState(markdown) {
  const next = emptyState();
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const body = fm ? fm[2] : markdown;

  if (fm) {
    const meta = {};
    let listKey = null;
    fm[1].split('\n').forEach(line => {
      if (listKey && /^\s+-\s+/.test(line)) {
        meta[listKey].push(stripWikiBrackets(yamlUnquote(line.replace(/^\s+-\s+/, '').trim())));
        return;
      }
      const kv = line.match(/^(\w[\w_-]*):\s*(.*)$/);
      if (!kv) { listKey = null; return; }
      const key = kv[1];
      const value = (kv[2] || '').trim();
      if (!value) { meta[key] = []; listKey = key; return; }
      meta[key] = yamlUnquote(value);
      listKey = null;
    });
    if (meta.campaign) next.campaign = meta.campaign;
    if (meta.ruleset) next.ruleset = meta.ruleset;
    if (meta.session != null) next.session = String(meta.session);
    if (meta.date) next.date = meta.date;
    if (meta.gm) next.gm = stripWikiBrackets(meta.gm);
    if (Array.isArray(meta.players_present) && meta.players_present.length) next.players = meta.players_present;
    if (meta.synopsis) next.synopsis = meta.synopsis;
    if (meta.web_status) next.webStatus = meta.web_status;
  }

  const sections = {};
  let current = null;
  body.split('\n').forEach(line => {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) { current = heading[1].trim().toLowerCase(); sections[current] = []; return; }
    if (current) sections[current].push(line);
  });

  const recap = bulletItems(sections['session recap']);
  if (recap.length) next.recap = recap;

  const events = parseCallouts(sections['key events']).map(callout => ({
    type: clampType(callout.type, 'important'),
    title: callout.title,
    body: callout.lines.join('\n')
  }));
  if (events.length) next.events = events;

  const npcs = parseCallouts(sections['npcs encountered']).map(callout => {
    const split = callout.title.match(/^(.*?):\s*(.*)$/);
    const mode = split && split[1].trim() === 'NPC Update' ? 'NPC Update' : 'New NPC';
    const name = stripWikiBrackets(split ? split[2] : callout.title);
    let status = '';
    const notes = [];
    callout.lines.forEach(line => {
      const statusMatch = line.match(/^\*\*Status:\*\*\s*(.*)$/);
      if (statusMatch) status = statusMatch[1].trim();
      else notes.push(line);
    });
    return { mode, type: clampType(callout.type, 'info'), name, status, notes: notes.join('\n') };
  });
  if (npcs.length) next.npcs = npcs;

  const locations = bulletItems(sections['locations visited']).map(stripWikiBrackets);
  if (locations.length) next.locations = locations;

  const threads = parseCallouts(sections['open threads']).map(callout => {
    const bodyLines = [];
    const asideLines = [];
    callout.lines.forEach(line => {
      // Nested quotes (">  >  text" with one level stripped) are asides.
      const aside = line.match(/^>\s*(.*)$/);
      if (aside) asideLines.push(aside[1].trim());
      else bodyLines.push(line);
    });
    return {
      title: callout.title.replace(/^Hook:\s*/i, '').trim(),
      body: bodyLines.join('\n'),
      aside: asideLines.join('\n')
    };
  });
  if (threads.length) next.threads = threads;

  const milestones = bulletItems(sections['milestones'])
    .map(item => item.replace(/^\*\*Milestone reached:\*\*\s*/i, '').trim());
  if (milestones.length) next.milestones = milestones;

  return next;
}

function parseCallouts(lines) {
  if (!lines) return [];
  const callouts = [];
  let current = null;
  lines.forEach(line => {
    const start = line.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
    if (start) {
      current = { type: start[1].toLowerCase(), title: start[2].trim(), lines: [] };
      callouts.push(current);
      return;
    }
    if (current && /^>/.test(line)) {
      const text = line.replace(/^>\s*/, '').trimEnd();
      if (text.trim()) current.lines.push(text);
      return;
    }
    current = null;
  });
  return callouts;
}

function bulletItems(lines) {
  return (lines || [])
    .filter(line => /^-\s+/.test(line))
    .map(line => line.replace(/^-\s+/, '').trim())
    .filter(Boolean);
}

function yamlUnquote(value) {
  const text = String(value || '');
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    return text.slice(1, -1).replace(/\\"/g, '"');
  }
  return text;
}

function clampType(type, fallback) {
  return ['important', 'info', 'warning', 'question'].includes(type) ? type : fallback;
}

function stripWikiBrackets(value) {
  const match = String(value || '').trim().match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  return match ? (match[2] || match[1]).trim() : String(value || '').trim();
}

// ═══════ SUBMIT ═══════

/*
 * Security: submission hands the markdown to github.com instead of
 * committing from this page. A static public site cannot hold write
 * credentials safely — an embedded token would be visible to every
 * visitor, and a user-pasted token kept in localStorage could be
 * exfiltrated by any future XSS bug. Delegating to GitHub's own web UI
 * means the commit happens under the user's existing GitHub session:
 * GitHub enforces authentication, authorisation (collaborators commit
 * directly, anyone else is routed into a fork + pull request), and the
 * commit is attributed and auditable. The markdown is also copied to the
 * clipboard because the /edit page cannot be prefilled and very large
 * files exceed the /new URL length limit.
 */
async function submitToGitHub() {
  const markdown = generateMarkdown(state);
  const filename = getFilename();
  let copied = true;
  try {
    await navigator.clipboard.writeText(markdown);
  } catch (error) {
    copied = false;
  }

  let url;
  if (editingFile) {
    url = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/edit/${repoBranch}/${SESSIONS_PATH}/${encodeURIComponent(filename)}`;
    setStatus(copied
      ? 'Markdown copied — replace the file contents on GitHub and commit'
      : 'Clipboard unavailable — use Copy Markdown, then paste on GitHub');
  } else {
    const base = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/new/${repoBranch}?filename=${encodeURIComponent(`${SESSIONS_PATH}/${filename}`)}`;
    const prefilled = `${base}&value=${encodeURIComponent(markdown)}`;
    if (prefilled.length <= 7500) {
      url = prefilled;
      setStatus('Review the prefilled file on GitHub and commit');
    } else {
      url = base;
      setStatus(copied
        ? 'Note too large to prefill — markdown copied, paste it on GitHub'
        : 'Clipboard unavailable — use Copy Markdown, then paste on GitHub');
    }
  }
  window.open(url, '_blank', 'noopener');
}

function downloadMarkdown() {
  const blob = new Blob([generateMarkdown(state)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`Downloaded ${getFilename()}`);
}

function saveState() {
  tomeStore.set('logDraft', state);
}

function loadState() {
  try {
    const stored = tomeStore.get('logDraft');
    if (!stored || typeof stored !== 'object') return emptyState();
    return { ...emptyState(), ...stored };
  } catch (error) {
    return emptyState();
  }
}

async function fetchJSON(url) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json();
}

async function fetchDefaultBranch() {
  const repo = await fetchJSON(API_BASE);
  return repo.default_branch || 'main';
}

async function fetchNextSessionNumber() {
  const branch = await fetchDefaultBranch();
  const tree = await fetchJSON(`${API_BASE}/git/trees/${branch}?recursive=1`);
  const maxSession = tree.tree
    .filter(item => item.type === 'blob' && item.path.startsWith(`${SESSIONS_PATH}/`) && item.path.endsWith('.md'))
    .map(item => {
      const filename = item.path.split('/').pop();
      const match = filename.match(/(\d+)(?=\.md$)/);
      return match ? Number(match[1]) : null;
    })
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value), 0);
  return String(maxSession + 1);
}

async function initializeSuggestedSessionNumber(force = false) {
  try {
    const nextSession = await fetchNextSessionNumber();
    const shouldApply = force || (!sessionManuallyEdited && !hasStoredDraft);
    if (!shouldApply) return;
    state.session = nextSession;
    render();
    setStatus(`Next session suggested: ${nextSession}`);
  } catch (error) {
    if (!String(state.session || '').trim()) {
      state.session = '1';
      render();
    }
  }
}

function setStatus(message) {
  document.getElementById('status-text').textContent = message;
}

function setAtPath(target, path, value) {
  const parts = path.split('.');
  let current = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (current[parts[i]] == null) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeDoubleQuotes(value) {
  return String(value ?? '').replace(/"/g, '\\"');
}
