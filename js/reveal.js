/* Fade sections in as they enter the viewport. Never leaves content hidden:
   if IntersectionObserver is missing or motion is reduced, everything is shown. */

export function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;   // leave them visible

  // Only now do the .reveal elements start hidden — see css/layout.css.
  document.documentElement.classList.add('js-reveal');

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);   // reveal once, never re-trigger
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach((el) => io.observe(el));
}
