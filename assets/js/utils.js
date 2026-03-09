/* ============================================================
   UTILS.JS — Shared utility helpers
   ============================================================ */

/** HTML-escape a string for safe insertion into innerHTML */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Debounce: delay fn execution until after `delay` ms of inactivity */
function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Smart tooltip positioning.
 * Keeps bubble within the viewport; flips below if no room above.
 * Call once after DOM is ready.
 */
function initTooltips() {
  document.querySelectorAll('.tooltip-wrap').forEach(wrap => {
    const bubble = wrap.querySelector('.tooltip-bubble');
    if (!bubble) return;
    wrap.addEventListener('mouseenter', () => {
      bubble.style.display = 'block';
      const icon = wrap.querySelector('.tooltip-icon') || wrap;
      const ir  = icon.getBoundingClientRect();
      const bw  = bubble.offsetWidth;
      const bh  = bubble.offsetHeight;
      const margin = 10;
      let left = ir.left + ir.width / 2 - bw / 2;
      let top  = ir.top  - bh - 10;
      if (left < margin) left = margin;
      if (left + bw > window.innerWidth - margin) left = window.innerWidth - bw - margin;
      if (top < margin) {
        top = ir.bottom + 10;
        bubble.style.setProperty('--arrow-top', 'auto');
      }
      bubble.style.left = left + 'px';
      bubble.style.top  = top  + 'px';
      const arrowLeft = ir.left + ir.width / 2 - left;
      bubble.style.setProperty('--arrow-x', arrowLeft + 'px');
    });
    wrap.addEventListener('mouseleave', () => { bubble.style.display = 'none'; });
  });
}
