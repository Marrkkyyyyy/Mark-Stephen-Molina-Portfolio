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

  if (!sections.length) return;

  const marker = document.getElementById('navMarker');

  // Slide the marker under whichever desktop nav link is current. Measured
  // against the list so it survives the links reflowing at different widths.
  const moveMarker = (link) => {
    if (!marker) return;
    const list = marker.parentElement;
    if (!link || !list.contains(link) || !link.offsetParent) {
      marker.style.opacity = '0';
      return;
    }
    marker.style.opacity = '1';
    marker.style.width = `${link.offsetWidth}px`;
    marker.style.transform = `translateX(${link.parentElement.offsetLeft}px)`;
  };

  /* The current section is the LAST one whose top has passed a line halfway
     down the screen, i.e. whichever section owns most of what you see. The
     old rule ("topmost section still inside a band near the top") lost to the
     previous section whenever a few pixels of it were left in the band, which
     is exactly where a nav click lands. At the very bottom of the page the
     last section wins, since a short final section can never reach the line. */
  let current = null;
  const mark = () => {
    // Halfway down the screen, not just under the header: each
    // section starts with ~90px of space above its label, so a line near the
    // header left the previous section active while only the new one showed.
    const header = document.querySelector('.site-header')?.offsetHeight || 64;
    const line = Math.max(header + 40, innerHeight * 0.5);
    let best = null;
    for (const el of sections) {
      if (el.getBoundingClientRect().top <= line) best = el;
    }
    const doc = document.documentElement;
    if (scrollY + innerHeight >= doc.scrollHeight - 2) best = sections[sections.length - 1];
    if (best === current) return;
    current = best;
    const id = best?.id;
    let link = null;
    for (const a of links) {
      if (id && a.getAttribute('href') === `#${id}`) {
        a.setAttribute('aria-current', 'true');
        if (a.classList.contains('nav__link')) link = a;
      } else {
        a.removeAttribute('aria-current');
      }
    }
    moveMarker(link);
  };

  addEventListener('resize', () => {
    current = null;
    mark();
  });

  // Seven getBoundingClientRect calls per scroll event — cheap enough to run
  // directly, and it keeps working in tabs where rAF is throttled.
  addEventListener('scroll', mark, { passive: true });
  mark();
}
