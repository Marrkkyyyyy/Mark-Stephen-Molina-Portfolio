/* Certificate viewer.
 *
 * Built on <dialog>.showModal(), which gives the focus trap, the ::backdrop
 * and Esc-to-close for free. Adds zoom/pan, arrow-key browsing, a counter and
 * neighbour preloading so next/prev is instant.
 */

import { CERTIFICATES } from './certificates.js';

const FULL  = (slug) => `assets/certificates/full/${slug}.webp`;
const MAX_SCALE = 4;

let index = 0;
let scale = 1;
let tx = 0, ty = 0;
let opener = null;
let el = {};

export function initLightbox() {
  el = {
    dialog: document.getElementById('lightbox'),
    stage:  document.getElementById('lbStage'),
    img:    document.getElementById('lbImg'),
    title:  document.getElementById('lbTitle'),
    meta:   document.getElementById('lbMeta'),
    count:  document.getElementById('lbCount'),
    prev:   document.getElementById('lbPrev'),
    next:   document.getElementById('lbNext'),
    close:  document.getElementById('lbClose'),
  };
  if (!el.dialog || typeof el.dialog.showModal !== 'function') return;

  // Anything with data-cert opens the viewer: the tiles, the "View certificate"
  // buttons on award cards, and the FarmFinds award chip.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-cert]');
    if (!trigger) return;
    const i = CERTIFICATES.findIndex((c) => c.slug === trigger.dataset.cert);
    if (i < 0) return;
    e.preventDefault();
    open(i, trigger);
  });

  el.prev.addEventListener('click', () => go(-1));
  el.next.addEventListener('click', () => go(1));
  el.close.addEventListener('click', () => el.dialog.close());

  el.dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === '0')          { e.preventDefault(); zoomTo(1); }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(scale * 1.5); }
    if (e.key === '-')          { e.preventDefault(); zoomTo(scale / 1.5); }
  });

  // Click the backdrop (i.e. the stage, but not the image) to dismiss.
  el.stage.addEventListener('click', (e) => {
    if (e.target === el.img) { zoomTo(scale > 1 ? 1 : 2); return; }
    el.dialog.close();
  });

  el.stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomTo(scale * (e.deltaY < 0 ? 1.12 : 0.89));
  }, { passive: false });

  initPan();

  el.dialog.addEventListener('close', () => {
    zoomTo(1);
    opener?.focus();
    opener = null;
  });
}

function open(i, trigger) {
  opener = trigger;
  render(i);
  el.dialog.showModal();
}

function go(step) {
  const next = index + step;
  if (next < 0 || next >= CERTIFICATES.length) return;
  render(next);
}

function render(i) {
  index = i;
  const c = CERTIFICATES[i];
  zoomTo(1);

  el.img.src = FULL(c.slug);
  el.img.alt = `Certificate: ${c.title}, ${c.issuer}, ${c.date}`;
  el.title.textContent = c.title;
  el.meta.textContent = c.detail
    ? `${c.issuer} · ${c.date} — ${c.detail}`
    : `${c.issuer} · ${c.date}`;
  el.count.textContent = `${i + 1} / ${CERTIFICATES.length}`;
  el.prev.disabled = i === 0;
  el.next.disabled = i === CERTIFICATES.length - 1;

  // Preload the neighbours so browsing feels instant.
  for (const j of [i - 1, i + 1]) {
    if (CERTIFICATES[j]) new Image().src = FULL(CERTIFICATES[j].slug);
  }
}

function zoomTo(next) {
  scale = Math.min(MAX_SCALE, Math.max(1, next));
  if (scale === 1) { tx = 0; ty = 0; }
  el.stage.classList.toggle('is-zoomed', scale > 1);
  paint();
}

function paint() {
  el.img.style.setProperty('--lb-scale', scale);
  el.img.style.setProperty('--lb-x', `${tx}px`);
  el.img.style.setProperty('--lb-y', `${ty}px`);
}

function initPan() {
  let dragging = false, startX = 0, startY = 0, originX = 0, originY = 0;

  el.stage.addEventListener('pointerdown', (e) => {
    if (scale <= 1) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    originX = tx; originY = ty;
    el.stage.classList.add('is-panning');
    el.stage.setPointerCapture(e.pointerId);
  });

  el.stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    tx = originX + (e.clientX - startX) / scale;
    ty = originY + (e.clientY - startY) / scale;
    paint();
  });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    el.stage.classList.remove('is-panning');
    el.stage.releasePointerCapture?.(e.pointerId);
  };
  el.stage.addEventListener('pointerup', end);
  el.stage.addEventListener('pointercancel', end);
}
