/* Colour theme. Light is the default, applied by an inline script in <head> so
   there is no flash; this module only handles the toggle afterwards.
   The system preference is deliberately not followed — Mark wants the site to
   open light regardless of the visitor's OS setting. */

const KEY = 'theme';
const root = document.documentElement;

const current = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

function apply(theme) {
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  root.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#fbfcfd' : '#0b0f14');
  try { localStorage.setItem(KEY, theme); } catch {}
}

export function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => apply(current() === 'light' ? 'dark' : 'light'));
}
