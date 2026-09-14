/* Sticky header, scroll-spy and the mobile menu.
   Scroll-spy uses IntersectionObserver rather than a scroll listener, so
   nothing runs per scrolled pixel. */

export function initNav() {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('navToggle');
  const panel  = document.getElementById('navPanel');
  const links  = [...document.querySelectorAll('.nav__link, .nav-panel a')];

  /* --- shrink/blur the header once scrolled ------------------------------ */
  if (header) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
    document.body.prepend(sentinel);
    new IntersectionObserver(
      ([e]) => header.classList.toggle('is-stuck', !e.isIntersecting)
    ).observe(sentinel);
  }

  /* --- mobile menu ------------------------------------------------------- */
  if (toggle && panel) {
    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
    });
    addEventListener('click', (e) => {
      if (panel.hidden) return;
      if (!panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  /* --- scroll-spy -------------------------------------------------------- */
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter((el, i, arr) => el && arr.indexOf(el) === i);

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const visible = new Set();
  const mark = () => {
    // The topmost section currently on screen wins.
    let best = null;
    for (const el of visible) {
      if (!best || el.offsetTop < best.offsetTop) best = el;
    }
    const id = best?.id;
    for (const a of links) {
      const on = id && a.getAttribute('href') === `#${id}`;
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
    }
    mark();
  }, { rootMargin: '-72px 0px -55% 0px', threshold: 0 });

  sections.forEach((s) => io.observe(s));
}
