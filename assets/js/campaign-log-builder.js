const STORAGE_KEY = 'spelltome-campaign-log-builder-v1';

const sampleState = {
  campaign: "Storm King's Thunder",
  ruleset: 'D&D 5e',
  session: '15',
  date: '2026-02-13',
  gm: 'Matthew Rogers',
  synopsis: 'Battle at the north walls of Goldenfields. Gimbletrump got thrown by a tree, then by an ogre-trebuchet. The team won. Got a pendant to take to Waterdeep.',
  webStatus: 'Published',
  players: ['Jamie Watts', 'Alex Stratford', 'Paul Schofield', 'Nick Johnson'],
  recap: [
    '[[Lob the giant]], defeated by [[Leeferlas]], was locked in the stables.',
    'Noise of battle at the North walls summons the party',
    '[[Leeferlas]] throws [[Gimbletrump]] into battle, takes huge damage but survives. [[Gimbletrump]] now dressed as a goblin - kills and maims. Tinkering with equipment he decapitates an ogre with the internal clockwork of a launcher.',
    '[[Gwithian]] moves a moonbeam around the battlefield',
    '[[Kelvar]] mostly shoots arrows',
    '[[Leeferlas]] thows a chunk of palisade wall into battle - does 79 damage!',
    'an Ogre launches [[Gimbletrump]] back into the fields.',
    'Player-NPCs all take part, and survive.',
    'Team wins battle. [[Gimbletrump]] survives.',
    'The launchers are not Ogre technology - but something else.',
    'All go to tavern to celebrate.',
    '[[Caulder Marskyl]] - head butler of [[House of Thann]] gives party a pendant and tells them to take it to [[Waterdeep]] and swap it for a reward.'
  ],
  events: [
    { type: 'important', title: 'Milestone', body: 'BATTLE was won!' }
  ],
  npcs: [
    { mode: 'New NPC', type: 'info', name: 'Caulder Marskyl', status: 'Allied', notes: 'Head Butler of [[House of Thann]]' },
    { mode: 'NPC Update', type: 'warning', name: 'Leeferlas', status: 'Allied', notes: 'Is an absolute tank and can do massive throwing damage!' }
  ],
  locations: ['Goldenfields'],
  threads: [
    {
      title: 'The Nightstone is Missing',
      body: 'Nightstone was stolen from the town of [[Nightstone]]. Is part of a magical rod - made by [[Miska]] (a wolf spider?). The rod broke into 7 parts with Miska inside.\nThe Nighstone appears to ward off dragons. When near bits of the rod they shimmer.\nIt appears to be part of "The Sundering" - where [[Tiamat]] rose up. Now there is disorder in the giant hierarchy and the giants are "egohurt".',
      aside: 'The giants appear to want to get the bit together.'
    },
    {
      title: 'Pendant to return to the [[House of Thann]] in [[Waterdeep]]',
      body: 'Not sure why...',
      aside: ''
    }
  ],
  milestones: ['Level up to level 4!']
};

const emptyState = () => ({
  campaign: "Storm King's Thunder",
  ruleset: 'D&D 5e',
  session: '16',
  date: new Date().toISOString().slice(0, 10),
  gm: 'Matthew Rogers',
  synopsis: '',
  webStatus: 'Published',
  players: ['Jamie Watts'],
  recap: [''],
  events: [{ type: 'important', title: 'Milestone', body: '' }],
  npcs: [{ mode: 'New NPC', type: 'info', name: '', status: '', notes: '' }],
  locations: [''],
  threads: [{ title: '', body: '', aside: '' }],
  milestones: ['']
});

let state = loadState();

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
            <input type="text" data-bind="players.${index}" value="${escapeAttr(value)}" placeholder="Jamie Watts">
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
            <input type="text" data-bind="events.${index}.title" value="${escapeAttr(value.title)}" placeholder="Milestone">
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
            <input type="text" data-bind="npcs.${index}.name" value="${escapeAttr(value.name)}" placeholder="Caulder Marskyl">
          </label>
          <label class="field">
            <span>Status</span>
            <input type="text" data-bind="npcs.${index}.status" value="${escapeAttr(value.status)}" placeholder="Allied">
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
          <input type="text" data-bind="locations.${index}" value="${escapeAttr(value)}" placeholder="Goldenfields">
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
          <input type="text" data-bind="threads.${index}.title" value="${escapeAttr(value.title)}" placeholder="Pendant to return to [[Waterdeep]]">
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
          <input type="text" data-bind="milestones.${index}" value="${escapeAttr(value)}" placeholder="Level up to level 4!">
        </label>
      </div>`
  }
};

document.addEventListener('DOMContentLoaded', () => {
  bindScalarFields();
  bindToolbar();
  bindPreviewTabs();
  render();
});

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
      render();
    });
    el.addEventListener('change', () => {
      state[key] = el.value;
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
    render();
    setStatus('Draft reset');
  });

  document.getElementById('load-example-btn').addEventListener('click', () => {
    state = deepClone(sampleState);
    render();
    setStatus('Example session loaded');
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
  return options.map(option => `<option value="${escapeAttr(option)}" ${option === selected ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('');
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
    html += `<div class="callout ${escapeAttr(callout.type)}"><div class="callout-title">${escapeHtml(callout.title)}</div>${callout.lines.map(line => `<p>${inlineMarkdown(line)}</p>`).join('')}</div>`;
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
  const session = String(state.session || '').padStart(3, '0');
  return `SKT - ${session}.md`;
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyState();
    return { ...emptyState(), ...JSON.parse(stored) };
  } catch (error) {
    return emptyState();
  }
}

function setStatus(message) {
  document.getElementById('status-text').textContent = message;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setAtPath(target, path, value) {
  const parts = path.split('.');
  let current = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeDoubleQuotes(value) {
  return String(value ?? '').replace(/"/g, '\\"');
}
