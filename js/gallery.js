/* Screenshot galleries.
 *
 * Markup declares the slots with data-src and every case study starts in its
 * text-only layout. We try to load each declared image; slots that 404 are
 * removed, and a gallery that ends up empty is removed with them. Only when a
 * project has enough real screenshots does its case study leave the text-only
 * layout. So a missing screenshot is invisible rather than a placeholder
 * telling visitors the site is unfinished, and dropping a file into
 * assets/screenshots/<project>/ is all it takes to light the gallery up.
 */

const load = (img) => new Promise((resolve) => {
  const src = img.dataset.src;
  if (!src) return resolve(false);
  const probe = new Image();
  probe.onload = () => {
    img.src = src;
    img.loading = 'lazy';
    img.decoding = 'async';
    resolve(true);
  };
  probe.onerror = () => resolve(false);
  probe.src = src;
});

export async function initGalleries() {
  const cases = [...document.querySelectorAll('[data-case]')];

  // Remember which tab panels declared a gallery before any pruning happens.
  const declaredPanels = new Map(cases.map((c) => [
    c,
    new Set([...c.querySelectorAll('[data-gallery][data-panel]')].map((g) => g.dataset.panel)),
  ]));

  await Promise.all([...document.querySelectorAll('[data-gallery]')].map(async (gallery) => {
    const imgs = [...gallery.querySelectorAll('img[data-src]')];
    const found = await Promise.all(imgs.map(load));

    imgs.forEach((img, i) => {
      if (found[i]) return;
      (img.closest('.phone, .window') || img).remove();   // drop the frame, not just the img
    });

    if (found.some(Boolean)) gallery.dataset.ready = 'true';
    else gallery.remove();
  }));

  for (const el of cases) {
    const panels = declaredPanels.get(el);
    const ready = [...el.querySelectorAll('[data-gallery]')];

    // A tabbed case study only shows its media column when EVERY tab has
    // screenshots. Otherwise switching to an unillustrated tab would leave a
    // hole in the layout — worse than showing no gallery at all.
    const complete = panels.size
      ? panels.size === ready.filter((g) => panels.has(g.dataset.panel)).length
      : ready.length > 0;

    if (complete) {
      el.classList.remove('is-textonly');
    } else {
      ready.forEach((g) => g.remove());
      el.classList.add('is-textonly');
    }

    const media = el.querySelector('.case__media');
    if (media && !media.querySelector('[data-gallery]')) media.remove();
  }
}
