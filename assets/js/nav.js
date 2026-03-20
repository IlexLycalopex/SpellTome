/* ============================================================
   NAV.JS - Hamburger nav drawer + theme toggle (shared)
   ============================================================ */

const THEME_STORAGE_KEY = 'tome-theme';

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

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function getPreferredTheme() {
  const stored = getStoredTheme();
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme, persist = true) {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // Ignore storage failures.
    }
  }
  syncThemeToggles(theme);
}

function syncThemeToggles(theme) {
  document.querySelectorAll('.theme-toggle').forEach(toggle => {
    toggle.classList.toggle('is-light', theme === 'light');
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
    toggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
  });
}

function createThemeToggle() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle';
  button.innerHTML = `
    <span class="theme-toggle-symbol theme-toggle-sun" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2.5"></path>
        <path d="M12 19.5V22"></path>
        <path d="M4.93 4.93l1.77 1.77"></path>
        <path d="M17.3 17.3l1.77 1.77"></path>
        <path d="M2 12h2.5"></path>
        <path d="M19.5 12H22"></path>
        <path d="M4.93 19.07l1.77-1.77"></path>
        <path d="M17.3 6.7l1.77-1.77"></path>
      </svg>
    </span>
    <span class="theme-toggle-track" aria-hidden="true">
      <span class="theme-toggle-thumb"></span>
    </span>
    <span class="theme-toggle-symbol theme-toggle-moon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a9 9 0 1 0 11 11Z"></path>
      </svg>
    </span>
  `;
  button.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
  return button;
}

function mountThemeToggle() {
  const hamburger = document.querySelector('.hamburger-btn');
  if (!hamburger || document.querySelector('.theme-toggle')) return;
  const toggle = createThemeToggle();
  hamburger.insertAdjacentElement('beforebegin', toggle);
  syncThemeToggles(getPreferredTheme());
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getPreferredTheme(), false);
  mountThemeToggle();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeNav();
});


