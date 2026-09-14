/* Fade sections in as they enter the viewport.
 *
 * The hard requirement is that content is NEVER left permanently hidden. Three
 * layers of protection, because a blank page is far worse than a missing
 * animation:
 *
 *   1. The hiding rule in css/layout.css is scoped to .js-reveal, which this
 *      module adds — so if the script never runs, nothing is ever hidden.
 *   2. Reduced motion, or no IntersectionObserver, and we return before adding
 *      that class at all.
 *   3. If IntersectionObserver exists but never actually delivers a callback —
 *      which really happens in background tabs, headless renders and some
 *      privacy browsers — a watchdog drops to a plain scroll-position fallback.
 */

const VISIBLE = 'is-visible';
const WATCHDOG_MS = 1200;

export function initReveal() {
  const items = [...document.querySelectorAll('.reveal')];
  if (!items.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;   // leave them visible

  // Only now do the .reveal elements start hidden — see css/layout.css.
  document.documentElement.classList.add('js-reveal');

  const pending = new Set(items);
  const show = (el) => { el.classList.add(VISIBLE); pending.delete(el); };

  let delivered = false;

  const io = new IntersectionObserver((entries) => {
    delivered = true;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      show(entry.target);
      io.unobserve(entry.target);     // reveal once, never re-trigger
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach((el) => io.observe(el));

  setTimeout(() => {
    if (delivered) return;
    // The observer is not going to fire here. Fall back to measuring.
    io.disconnect();
    const sweep = () => {
      for (const el of [...pending]) {
        if (el.getBoundingClientRect().top < innerHeight * 0.92) show(el);
      }
      if (!pending.size) {
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onScroll);
      }
    };
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; sweep(); });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    sweep();

    // Last resort: if even rAF is not running (a fully throttled tab), make
    // absolutely sure nothing is left invisible.
    setTimeout(() => pending.forEach(show), 3000);
  }, WATCHDOG_MS);
}
