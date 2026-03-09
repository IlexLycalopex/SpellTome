/* ============================================================
   NAV.JS — Hamburger nav drawer (shared across all pages)
   ============================================================ */

function openNav() {
  document.getElementById('nav-drawer').classList.add('open');
  document.getElementById('nav-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeNav() {
  document.getElementById('nav-drawer').classList.remove('open');
  document.getElementById('nav-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
