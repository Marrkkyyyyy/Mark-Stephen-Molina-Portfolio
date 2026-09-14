/* Colour theme. The initial value is applied by an inline script in <head> so
   there is no flash; this module only handles the toggle afterwards. */

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

  // Follow the system until the visitor states a preference of their own.
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch {}
    if (!stored) apply(e.matches ? 'light' : 'dark');
  });
}
