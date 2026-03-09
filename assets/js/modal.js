/* ============================================================
   MODAL.JS — Generic modal open/close (shared across all pages)
   Requires: #modal-overlay and #modal-box in the page HTML.
   openModal() is page-specific — defined in each page's JS.
   ============================================================ */

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

/** Close modal when clicking outside the modal box */
function handleOverlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
