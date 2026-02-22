/* ============================================================
   SPELL TOME — D&D 5e Spell Card Application
   app.js — Main controller
   ============================================================ */

// ============================================================
// CONSTANTS
// ============================================================
const SCHOOLS = {
  Abjuration:    '#4DC8D0',
  Enchantment:   '#C4306A',
  Conjuration:   '#6A3A8A',
  Illusion:      '#3A4A8A',
  Transmutation: '#6AAA2A',
  Divination:    '#BCAA20',
  Necromancy:    '#7A3A2A',
  Evocation:     '#2A8A6A'
};

const SOURCE_BOOKS = {
  PHB: { label: "Player's Handbook",         abbr: 'PHB', color: '#8B2FC9' },
  XGE: { label: "Xanathar's Guide",          abbr: 'XGE', color: '#1e7a6e' },
  TCE: { label: "Tasha's Cauldron",          abbr: 'TCE', color: '#c97020' },
  FTD: { label: "Fizban's Treasury",         abbr: 'FTD', color: '#8a2020' },
  SCC: { label: "Strixhaven",                abbr: 'SCC', color: '#3a6e8a' }
};

const ALL_CLASSES = ['Bard','Cleric','Druid','Paladin','Ranger','Sorcerer','Warlock','Wizard'];
const LEVEL_LABELS = ['Cantrip','1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];

const SPELL_SLOT_TABLE = {
  fullCaster:  {1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:4,9:5,10:5,11:6,12:6,13:7,14:7,15:8,16:8,17:9,18:9,19:9,20:9},
  halfCaster:  {1:0,2:1,3:1,4:1,5:2,6:2,7:2,8:2,9:3,10:3,11:3,12:3,13:3,14:3,15:4,16:4,17:4,18:4,19:4,20:5},
  warlock:     {1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:4,9:5,10:5,11:5,12:5,13:5,14:5,15:5,16:5,17:5,18:5,19:5,20:5}
};

const CLASS_TYPE = {
  Bard:'fullCaster', Cleric:'fullCaster', Druid:'fullCaster',
  Sorcerer:'fullCaster', Wizard:'fullCaster',
  Paladin:'halfCaster', Ranger:'halfCaster', Warlock:'warlock'
};

// ============================================================
// STATE
// ============================================================
const state = {
  selectedClass: '',
  selectedLevel: 0,
  activeLevels: new Set(),
  activeSchools: new Set(Object.keys(SCHOOLS)),
  activeBooks: new Set(Object.keys(SOURCE_BOOKS)),
  searchText: '',
  selectedSpells: new Set()
};

// ============================================================
// HELPERS
// ============================================================
function getSpellBook(spell) {
  return spell.source.split(' ')[0];
}

// ============================================================
// SCHOOL ICONS (SVG strings, colour via currentColor)
// ============================================================
const SCHOOL_ICONS = {
  Abjuration: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="1.1"/>
    <path d="M20 3 L20 37 M3 20 L37 20 M6.5 6.5 L33.5 33.5 M33.5 6.5 L6.5 33.5" stroke="currentColor" stroke-width="0.6" opacity="0.45"/>
    <circle cx="20" cy="9" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="20" cy="31" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="9" cy="20" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="31" cy="20" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,
  Enchantment: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="20" cy="20" r="5" fill="currentColor" opacity="0.6"/>
    <path d="M20 3 A17 17 0 0 1 37 20 A17 17 0 0 1 20 37" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <path d="M20 3 A17 17 0 0 0 3 20 A17 17 0 0 0 20 37" fill="none" stroke="currentColor" stroke-width="0.7" stroke-dasharray="3 2.5"/>
    <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="0.7" stroke-dasharray="2 3"/>
    <path d="M7 7 L33 33 M33 7 L7 33" stroke="currentColor" stroke-width="0.5" opacity="0.35"/>
  </svg>`,
  Conjuration: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <polygon points="20,5 34,29 6,29" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <polygon points="20,35 6,11 34,11" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.55"/>
    <circle cx="20" cy="20" r="4.5" fill="none" stroke="currentColor" stroke-width="1.1"/>
    <circle cx="20" cy="20" r="1.5" fill="currentColor" opacity="0.7"/>
  </svg>`,
  Illusion: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <path d="M3 20 Q11 6 20 20 Q29 34 37 20" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <path d="M3 20 Q11 34 20 20 Q29 6 37 20" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.5"/>
    <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="0.6" stroke-dasharray="1.5 3.5"/>
    <ellipse cx="20" cy="20" rx="7" ry="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
  </svg>`,
  Transmutation: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <polygon points="20,7 31,27 9,27" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="1.1"/>
    <line x1="20" y1="7" x2="20" y2="27" stroke="currentColor" stroke-width="0.8" opacity="0.55"/>
    <line x1="9" y1="27" x2="31" y2="27" stroke="currentColor" stroke-width="0.8" opacity="0.55"/>
    <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.65"/>
  </svg>`,
  Divination: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <path d="M20 3 L20 14 M20 26 L20 37 M3 20 L14 20 M26 20 L37 20" stroke="currentColor" stroke-width="1.2"/>
    <path d="M7 7 L14 14 M26 26 L33 33 M33 7 L26 14 M14 26 L7 33" stroke="currentColor" stroke-width="0.8" opacity="0.5"/>
    <circle cx="20" cy="20" r="2.5" fill="currentColor" opacity="0.75"/>
  </svg>`,
  Necromancy: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="13" cy="14" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="27" cy="14" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M10 28 Q13 22 20 22 Q27 22 30 28" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <line x1="20" y1="22" x2="20" y2="30" stroke="currentColor" stroke-width="1"/>
    <path d="M7 7 L33 33 M33 7 L7 33" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
    <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="0.6" stroke-dasharray="2 3"/>
  </svg>`,
  Evocation: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <polygon points="20,4 24,16 37,16 27,24 31,37 20,30 9,37 13,24 3,16 16,16" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <circle cx="20" cy="20" r="5" fill="none" stroke="currentColor" stroke-width="1"/>
    <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.7"/>
  </svg>`
};

// ============================================================
// COMPONENT ICONS
// ============================================================
const COMPONENT_ICONS = {
  V: `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="10" cy="10" rx="6" ry="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M7 7 Q10 12 13 7" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M6 10 Q10 16 14 10" fill="none" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,
  S: `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 15 L8 8 L12 14 L15 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="5" cy="15" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="4" r="1.5" fill="currentColor"/>
  </svg>`,
  M: `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6 Q4 3 7 3 L13 3 Q16 3 16 6 L16 15 Q16 18 13 18 L7 18 Q4 18 4 15 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M8 3 L8 5 Q10 7 12 5 L12 3" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <line x1="7" y1="9" x2="13" y2="9" stroke="currentColor" stroke-width="1"/>
    <line x1="7" y1="12" x2="11" y2="12" stroke="currentColor" stroke-width="1"/>
  </svg>`
};

// ============================================================
// SPELL SLOT HELPERS
// ============================================================
function getMaxSpellLevel(cls, charLevel) {
  const t = CLASS_TYPE[cls];
  if (!t) return 0;
  return SPELL_SLOT_TABLE[t][charLevel] || 0;
}

function isAvailable(spell, cls, charLevel) {
  if (!spell.classes.includes(cls)) return false;
  if (spell.level === 0) return true;
  return spell.level <= getMaxSpellLevel(cls, charLevel);
}

// Check if spell passes all active filters (book, level, school, search)
function passesFilters(spell, cls, lv) {
  if (!isAvailable(spell, cls, lv)) return false;
  if (!state.activeLevels.has(spell.level)) return false;
  if (!state.activeSchools.has(spell.school)) return false;
  if (!state.activeBooks.has(getSpellBook(spell))) return false;
  const search = state.searchText;
  if (search && !spell.name.toLowerCase().includes(search) && !spell.description.toLowerCase().includes(search)) return false;
  return true;
}

// ============================================================
// UI EVENT HANDLERS
// ============================================================
function onClassChange() {
  const cls = document.getElementById('class-select').value;
  state.selectedClass = cls;
  state.selectedLevel = 0;

  const levelSel = document.getElementById('level-select');
  levelSel.disabled = !cls;
  levelSel.value = '';

  state.activeLevels = new Set();
  document.getElementById('spell-level-pills').innerHTML = '';
  document.getElementById('school-pills').innerHTML = '';
  document.getElementById('book-pills').innerHTML = '';
  document.getElementById('results-bar').style.display = 'none';
  document.getElementById('card-grid').style.display = 'none';
  document.getElementById('empty-state').style.display = cls ? 'flex' : 'flex';

  if (!cls) {
    document.getElementById('empty-state').querySelector('h2').textContent = 'Choose Your Class & Level';
    document.getElementById('empty-state').querySelector('p').textContent = 'Select a class and character level to reveal your available spells.';
  } else {
    document.getElementById('empty-state').querySelector('h2').textContent = `${cls} Selected`;
    document.getElementById('empty-state').querySelector('p').textContent = 'Now choose your character level.';
  }
}

function onLevelChange() {
  const cls = state.selectedClass;
  const lv = parseInt(document.getElementById('level-select').value) || 0;
  if (!lv || !cls) return;

  state.selectedLevel = lv;

  // Determine available spell levels
  const maxSL = getMaxSpellLevel(cls, lv);
  const availableLevels = [];
  if (SPELLS.some(s => s.level === 0 && s.classes.includes(cls))) availableLevels.push(0);
  for (let i = 1; i <= maxSL; i++) {
    if (SPELLS.some(s => s.level === i && s.classes.includes(cls))) availableLevels.push(i);
  }

  // Default: all available levels active
  state.activeLevels = new Set(availableLevels);

  // Build level pills
  const pillsEl = document.getElementById('spell-level-pills');
  pillsEl.innerHTML = '';
  availableLevels.forEach(sl => {
    const p = document.createElement('span');
    p.className = 'pill level-pill active';
    p.textContent = LEVEL_LABELS[sl];
    p.dataset.level = sl;
    p.onclick = () => toggleLevelPill(p, sl);
    pillsEl.appendChild(p);
  });

  // Build school pills — only schools that appear in available spells
  const schoolsUsed = new Set(
    SPELLS.filter(s => isAvailable(s, cls, lv)).map(s => s.school)
  );
  state.activeSchools = new Set(schoolsUsed);

  const schoolEl = document.getElementById('school-pills');
  schoolEl.innerHTML = '';
  Object.keys(SCHOOLS).forEach(sch => {
    if (!schoolsUsed.has(sch)) return;
    const color = SCHOOLS[sch];
    const p = document.createElement('span');
    p.className = 'pill school-pill active';
    p.textContent = sch;
    p.dataset.school = sch;
    p.style.background = color;
    p.style.borderColor = color;
    p.onclick = () => toggleSchoolPill(p, sch, color);
    schoolEl.appendChild(p);
  });

  // Build book pills — only books that appear in available spells
  const booksUsed = new Set(
    SPELLS.filter(s => isAvailable(s, cls, lv)).map(s => getSpellBook(s))
  );
  state.activeBooks = new Set(booksUsed);

  const bookEl = document.getElementById('book-pills');
  bookEl.innerHTML = '';
  Object.entries(SOURCE_BOOKS).forEach(([key, book]) => {
    if (!booksUsed.has(key)) return;
    const p = document.createElement('span');
    p.className = 'pill book-pill active';
    p.textContent = book.abbr;
    p.title = book.label;
    p.dataset.book = key;
    p.style.background = book.color;
    p.style.borderColor = book.color;
    p.onclick = () => toggleBookPill(p, key, book.color);
    bookEl.appendChild(p);
  });

  renderGrid();
}

function toggleLevelPill(el, level) {
  if (state.activeLevels.has(level)) {
    state.activeLevels.delete(level);
    el.classList.remove('active');
  } else {
    state.activeLevels.add(level);
    el.classList.add('active');
  }
  renderGrid();
}

function toggleSchoolPill(el, school, color) {
  if (state.activeSchools.has(school)) {
    state.activeSchools.delete(school);
    el.classList.remove('active');
    el.style.background = 'rgba(255,255,255,0.04)';
    el.style.borderColor = '#2a2a4a';
    el.style.color = '#9a9ab0';
  } else {
    state.activeSchools.add(school);
    el.classList.add('active');
    el.style.background = color;
    el.style.borderColor = color;
    el.style.color = '#fff';
  }
  renderGrid();
}

function toggleBookPill(el, book, color) {
  if (state.activeBooks.has(book)) {
    state.activeBooks.delete(book);
    el.classList.remove('active');
    el.style.background = 'rgba(255,255,255,0.04)';
    el.style.borderColor = '#2a2a4a';
    el.style.color = '#9a9ab0';
  } else {
    state.activeBooks.add(book);
    el.classList.add('active');
    el.style.background = color;
    el.style.borderColor = color;
    el.style.color = '#fff';
  }
  renderGrid();
}

// ============================================================
// RENDER GRID
// ============================================================
function renderGrid() {
  const { selectedClass: cls, selectedLevel: lv } = state;
  const search = document.getElementById('search-input').value.toLowerCase().trim();
  state.searchText = search;

  if (!cls || !lv) return;

  const filtered = SPELLS.filter(s => passesFilters(s, cls, lv));

  // Sort: level asc, then alpha
  filtered.sort((a, b) => a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name));

  const grid = document.getElementById('card-grid');
  const empty = document.getElementById('empty-state');
  const resultsBar = document.getElementById('results-bar');

  if (filtered.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    empty.querySelector('h2').textContent = 'No Spells Found';
    empty.querySelector('p').textContent = 'Try adjusting your filters or search term.';
    resultsBar.style.display = 'none';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';
  resultsBar.style.display = 'block';
  resultsBar.textContent = `${filtered.length} spell${filtered.length !== 1 ? 's' : ''} available${state.selectedSpells.size > 0 ? ` · ${state.selectedSpells.size} selected` : ''}`;

  grid.innerHTML = '';
  filtered.forEach(spell => {
    grid.appendChild(buildCard(spell, cls, true));
  });

  updateSelectionUI();
}

// ============================================================
// BUILD CARD ELEMENT
// ============================================================
function buildCard(spell, currentClass, interactive) {
  const color = SCHOOLS[spell.school] || '#888';
  const isSelected = state.selectedSpells.has(spell.id);

  const card = document.createElement('div');
  card.className = `spell-card${isSelected ? ' selected' : ''}`;
  card.dataset.id = spell.id;
  card.style.setProperty('--school-color', color);

  if (interactive) {
    card.onclick = () => toggleCard(spell.id, card);
  }

  // Level label
  const levelLabel = spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}`;

  // Class list HTML
  const classListHtml = ALL_CLASSES.map(c => {
    const hasAccess = spell.classes.includes(c);
    const isCurrent = c === currentClass;
    let cls2 = 'class-item';
    if (hasAccess) cls2 += ' has-access';
    if (isCurrent) cls2 += ' is-current';
    const tick = hasAccess ? ' &#x2502;' : '';
    return `<span class="${cls2}">${c}${tick}</span>`;
  }).join('');

  // Components
  const compHtml = ['V','S','M'].map(c => {
    if (!spell.components.includes(c)) return '';
    return `<span class="component-icon" title="${c === 'V' ? 'Verbal' : c === 'S' ? 'Somatic' : 'Material'}">${COMPONENT_ICONS[c]}</span>`;
  }).join('');

  const ritualHtml = spell.ritual ? `<span class="badge">Ritual</span>` : '';
  const concHtml = spell.concentration ? `<span class="badge">Concentration</span>` : '';

  const flavorHtml = spell.flavor_text
    ? `<div class="card-flavor" style="background:${color}">${spell.flavor_text}</div>`
    : '';

  const higherHtml = spell.higher_levels
    ? `<div class="higher-levels"><strong>At Higher Levels.</strong> ${spell.higher_levels}</div>`
    : '';

  // Source with book colour indicator
  const bookKey = getSpellBook(spell);
  const bookInfo = SOURCE_BOOKS[bookKey];
  const bookDot = bookInfo ? `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${bookInfo.color};margin-right:4px;vertical-align:middle;"></span>` : '';

  card.innerHTML = `
    <div class="select-indicator">${isSelected ? '&#10003;' : ''}</div>
    <div class="card-header" style="background:${color}">
      <span class="card-school-icon">${SCHOOL_ICONS[spell.school] || ''}</span>
      <span class="card-title">${spell.name}</span>
      <span class="card-level">${levelLabel}</span>
    </div>
    <div class="card-stats">
      <div class="stats-left">
        <div class="stat-row"><span class="stat-label">Range</span><span class="stat-value">${spell.range}</span></div>
        <div class="stat-row"><span class="stat-label">Duration</span><span class="stat-value">${spell.duration}</span></div>
        <div class="stat-row"><span class="stat-label">Casting Time</span><span class="stat-value">${spell.casting_time}</span></div>
      </div>
      <div class="class-list">${classListHtml}</div>
    </div>
    <div class="card-components">${compHtml}${ritualHtml}${concHtml}</div>
    ${flavorHtml}
    <div class="card-description">${spell.description}${higherHtml}</div>
    <div class="card-source">${bookDot}${spell.source}</div>
  `;

  return card;
}

// ============================================================
// SELECTION
// ============================================================
function toggleCard(spellId, cardEl) {
  if (state.selectedSpells.has(spellId)) {
    state.selectedSpells.delete(spellId);
    cardEl.classList.remove('selected');
    cardEl.querySelector('.select-indicator').innerHTML = '';
  } else {
    state.selectedSpells.add(spellId);
    cardEl.classList.add('selected');
    cardEl.querySelector('.select-indicator').innerHTML = '&#10003;';
  }
  updateSelectionUI();
}

function clearSelection() {
  state.selectedSpells.clear();
  document.querySelectorAll('.spell-card.selected').forEach(c => {
    c.classList.remove('selected');
    const ind = c.querySelector('.select-indicator');
    if (ind) ind.innerHTML = '';
  });
  updateSelectionUI();
}

function updateSelectionUI() {
  const count = state.selectedSpells.size;
  document.getElementById('selection-count').textContent = `${count} selected`;
  document.getElementById('btn-print').disabled = count === 0;
  document.getElementById('btn-clear').disabled = count === 0;

  // Update results bar
  const resultsBar = document.getElementById('results-bar');
  if (resultsBar.style.display !== 'none') {
    const total = document.querySelectorAll('#card-grid .spell-card').length;
    resultsBar.textContent = `${total} spell${total !== 1 ? 's' : ''} available${count > 0 ? ` · ${count} selected` : ''}`;
  }
}

// ============================================================
// PRINT PREVIEW
// ============================================================
function openPrintPreview() {
  const selectedIds = Array.from(state.selectedSpells);
  const selectedSpells = SPELLS
    .filter(s => selectedIds.includes(s.id))
    .sort((a, b) => a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name));

  const pages = chunkArray(selectedSpells, 8);

  // Build preview
  const container = document.getElementById('print-pages-container');
  container.innerHTML = '';

  pages.forEach((pageSpells, idx) => {
    const lbl = document.createElement('div');
    lbl.className = 'page-label';
    lbl.textContent = `Page ${idx + 1} of ${pages.length}`;
    container.appendChild(lbl);

    const page = document.createElement('div');
    page.className = 'print-page-preview';
    pageSpells.forEach(spell => {
      page.appendChild(buildCard(spell, state.selectedClass, false));
    });
    container.appendChild(page);
  });

  document.getElementById('preview-page-count').textContent =
    `${selectedSpells.length} card${selectedSpells.length !== 1 ? 's' : ''} · ${pages.length} page${pages.length !== 1 ? 's' : ''}`;

  document.getElementById('print-preview-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePrintPreview() {
  document.getElementById('print-preview-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function executePrint() {
  const selectedIds = Array.from(state.selectedSpells);
  const selectedSpells = SPELLS
    .filter(s => selectedIds.includes(s.id))
    .sort((a, b) => a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name));

  const pages = chunkArray(selectedSpells, 8);
  const printOutput = document.getElementById('print-output');
  printOutput.innerHTML = '';

  pages.forEach(pageSpells => {
    const page = document.createElement('div');
    page.className = 'print-page';
    pageSpells.forEach(spell => {
      page.appendChild(buildCard(spell, state.selectedClass, false));
    });
    printOutput.appendChild(page);
  });

  closePrintPreview();

  // Open print dialog then clear the hidden DOM so cards don't render on screen
  setTimeout(() => {
    window.print();
    setTimeout(() => { printOutput.innerHTML = ''; }, 1500);
  }, 100);
}

// ============================================================
// UTILITIES
// ============================================================
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
