/* Count the stat figures up when they first scroll into view.
 *
 * The figures are not all plain numbers — "15+", "30min" and "Cum Laude" all
 * live in the same class. So we only ever touch the leading text node, and only
 * when it starts with a digit: "15+" animates and keeps its plus, the "min" in
 * "30min" is a child element and is left alone, and "Cum Laude" is skipped
 * entirely rather than mangled.
 */

const DURATION = 1100;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function initCounters() {
  const values = [...document.querySelectorAll('.stat__value')];
  if (!values.length || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = [];

  for (const el of values) {
    const node = el.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) continue;

    const match = node.textContent.match(/^(\d+)(.*)$/s);
    if (!match) continue;                       // "Cum Laude" lands here

    const final = Number(match[1]);
    if (final === 0) continue;

    // No width locking needed: .stat__value is a block inside a grid cell, so
    // its box is sized by the column, not by how many digits are in it.
    // (Measuring it here would return the whole column width and pinning that
    // as a min-width breaks the layout at narrow viewports.)
    targets.push({ el, node, final, suffix: match[2] });
    node.textContent = `0${match[2]}`;
  }

  if (!targets.length) return;

  const started = new Set();

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const target = targets.find((t) => t.el === entry.target);
      if (target && !started.has(target)) { started.add(target); run(target); }
      io.unobserve(entry.target);
    }
  }, { threshold: 0.6 });

  targets.forEach((t) => io.observe(t.el));

  // Watchdog. These are real credentials, so the one outcome that must never
  // happen is the page sitting there showing "0" because a callback did not
  // arrive. Anything still untouched after a few seconds just gets its number.
  setTimeout(() => {
    for (const t of targets) {
      if (started.has(t)) continue;
      started.add(t);
      t.node.textContent = `${t.final}${t.suffix}`;
    }
  }, 5000);
}

function run({ node, final, suffix }) {
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / DURATION);
    const value = Math.round(easeOutExpo(progress) * final);
    node.textContent = `${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
    else node.textContent = `${final}${suffix}`;   // land exactly on the real number
  };
  requestAnimationFrame(tick);
}
