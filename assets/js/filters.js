/* ============================================================
   FILTERS.JS — Filter bar toggle and pill toggling (shared)

   Convention: pages must expose window.applyFilters() and
   window.renderGrid() for pill changes to take effect.
   ============================================================ */

/** Toggle the collapsible mobile filter bar */
function toggleFilters() {
  const bar   = document.getElementById('filter-bar');
  const arrow = document.getElementById('toggle-arrow');
  bar.classList.toggle('expanded');
  if (arrow) arrow.textContent = bar.classList.contains('expanded') ? '▲' : '▼';
  // Also toggle btn-filter-toggle open class for arrow rotation
  const btn = document.getElementById('btn-filter-toggle');
  if (btn) btn.classList.toggle('open', bar.classList.contains('expanded'));
}

/**
 * Toggle a filter pill within its group.
 * Expects:
 *   pill      – the <button> element clicked
 *   group     – string key that matches a key in window.PAGE.filters
 *   pillsId   – id of the container element (default: group + '-pills')
 *
 * Pages must set window.PAGE.filters[group] = new Set(['all']) before calling.
 * After updating the set, calls window.renderGrid() if available.
 */
function togglePill(pill, group, pillsId) {
  if (!window.PAGE || !window.PAGE.filters) return;
  const set = window.PAGE.filters[group];
  if (!set) return;
  pillsId = pillsId || (group + '-pills');
  const val = pill.dataset.val;
  if (val === 'all') {
    set.clear(); set.add('all');
  } else {
    set.delete('all');
    if (set.has(val)) { set.delete(val); if (set.size === 0) set.add('all'); }
    else set.add(val);
  }
  document.querySelectorAll(`#${pillsId} .pill`).forEach(p => {
    p.classList.toggle('active', set.has(p.dataset.val));
  });
  if (typeof window.renderGrid === 'function') window.renderGrid();
}

/** Reset all pills in a container to the 'all' state */
function resetPills(containerId) {
  document.querySelectorAll(`#${containerId} .pill`).forEach(p => {
    p.classList.toggle('active', p.dataset.val === 'all');
  });
}
