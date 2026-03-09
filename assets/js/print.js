/* ============================================================
   PRINT.JS — Print preview overlay (shared across pages)

   Convention: pages expose:
     window.PAGE.selectedItems  – Set of selected item names
     window.PAGE.getData()      – returns array of all items
     window.PAGE.buildCardHTML(item, forPreview) – returns HTML string

   Pages must have:
     #print-preview-overlay, #print-pages-container,
     #preview-page-count, #print-output in their HTML.
   ============================================================ */

const CARDS_PER_PAGE = 8;

/** Open the print preview modal */
function openPrintPreview() {
  const allData = window.PAGE.getData();
  const items   = allData.filter(item => window.PAGE.selectedItems.has(item.name));
  const pages   = [];
  for (let i = 0; i < items.length; i += CARDS_PER_PAGE) {
    pages.push(items.slice(i, i + CARDS_PER_PAGE));
  }
  const container = document.getElementById('print-pages-container');
  container.innerHTML = '';
  pages.forEach((page, idx) => {
    const lbl = document.createElement('div');
    lbl.className = 'print-preview-page-label';
    lbl.textContent = `Page ${idx + 1} of ${pages.length}`;
    container.appendChild(lbl);
    const pageEl = document.createElement('div');
    pageEl.className = 'print-preview-page';
    pageEl.innerHTML = page.map(item => window.PAGE.buildCardHTML(item, true)).join('');
    container.appendChild(pageEl);
  });
  const countEl = document.getElementById('preview-page-count');
  if (countEl) {
    const n = items.length, p = pages.length;
    countEl.textContent = `${n} card${n !== 1 ? 's' : ''} · ${p} page${p !== 1 ? 's' : ''}`;
  }
  const overlay = document.getElementById('print-preview-overlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/** Close the print preview modal */
function closePrintPreview() {
  const overlay = document.getElementById('print-preview-overlay');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

/** Trigger the browser print dialog using actual print output */
function executePrint() {
  const allData = window.PAGE.getData();
  const items   = allData.filter(item => window.PAGE.selectedItems.has(item.name));
  const pages   = [];
  for (let i = 0; i < items.length; i += CARDS_PER_PAGE) {
    pages.push(items.slice(i, i + CARDS_PER_PAGE));
  }
  const output = document.getElementById('print-output');
  output.innerHTML = pages.map(page =>
    `<div class="print-page">${page.map(item => window.PAGE.buildCardHTML(item, true)).join('')}</div>`
  ).join('');
  closePrintPreview();
  setTimeout(() => {
    window.print();
    setTimeout(() => { output.innerHTML = ''; }, 1500);
  }, 100);
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePrintPreview(); });
