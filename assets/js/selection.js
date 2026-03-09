/* ============================================================
   SELECTION.JS — Card selection UI (shared across pages)

   Convention: pages expose window.PAGE.selectedItems (Set),
   window.PAGE.getFiltered() → array, and call renderGrid() on
   their own to rebuild cards. updateSelectionUI() is called by
   pages after any change.
   ============================================================ */

/**
 * Toggle selection state on a single card element.
 * @param {string} id   – unique item identifier (e.g. item.name)
 * @param {Element} el  – the card DOM element
 */
function toggleSelect(id, el) {
  const sel = window.PAGE.selectedItems;
  if (sel.has(id)) {
    sel.delete(id);
    el.classList.remove('selected');
    const ind = el.querySelector('.select-indicator');
    if (ind) ind.innerHTML = '';
  } else {
    sel.add(id);
    el.classList.add('selected');
    const ind = el.querySelector('.select-indicator');
    if (ind) ind.innerHTML = '&#10003;';
  }
  updateSelectionUI();
}

/** Select every currently-visible card in #card-grid */
function selectAllVisible() {
  const sel = window.PAGE.selectedItems;
  if (typeof window.PAGE.getFiltered === 'function') {
    window.PAGE.getFiltered().forEach(item => sel.add(item.name));
  }
  document.querySelectorAll('#card-grid .item-card, #card-grid .spell-card, #card-grid .mon-card, #card-grid .beast-card').forEach(el => {
    el.classList.add('selected');
    const ind = el.querySelector('.select-indicator');
    if (ind) ind.innerHTML = '&#10003;';
  });
  updateSelectionUI();
}

/** Deselect all cards */
function clearSelection() {
  const sel = window.PAGE.selectedItems;
  sel.clear();
  document.querySelectorAll('.item-card.selected, .spell-card.selected, .mon-card.selected, .beast-card.selected').forEach(el => {
    el.classList.remove('selected');
    const ind = el.querySelector('.select-indicator');
    if (ind) ind.innerHTML = '';
  });
  updateSelectionUI();
}

/** Sync selection count badge and button disabled states */
function updateSelectionUI() {
  const count       = window.PAGE.selectedItems.size;
  const visibleCount = document.querySelectorAll('#card-grid > *').length;
  const badge = document.getElementById('selection-count');
  if (badge) badge.textContent = `${count} selected`;
  const btnPrint = document.getElementById('btn-print');
  const btnClear = document.getElementById('btn-clear');
  const btnAll   = document.getElementById('btn-select-all');
  if (btnPrint) btnPrint.disabled = count === 0;
  if (btnClear) btnClear.disabled = count === 0;
  if (btnAll)   btnAll.disabled   = visibleCount === 0;
}
