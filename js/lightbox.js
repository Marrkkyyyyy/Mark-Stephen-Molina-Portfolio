/* Image viewer.
 *
 * Built on <dialog>.showModal(), which gives the focus trap, the ::backdrop
 * and Esc-to-close for free. Adds zoom/pan, arrow-key browsing, a counter and
 * neighbour preloading so next/prev is instant.
 *
 * Works on named COLLECTIONS so arrow-keys never wander between unrelated sets
 * of images: browsing certificates stays inside the 18 certificates, browsing
 * desk photos stays inside the three desks. Each item is
 * { src, title, meta, alt }.
 */

import { CERTIFICATES } from './certificates.js';

const FULL  = (slug) => `assets/certificates/full/${slug}.webp`;
const MAX_SCALE = 4;

const collections = {};
let items = [];
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

  collections.certificate = CERTIFICATES.map((c) => ({
    src: FULL(c.slug),
    title: c.title,
    meta: c.detail ? `${c.issuer} · ${c.date} — ${c.detail}` : `${c.issuer} · ${c.date}`,
    alt: `Certificate: ${c.title}, ${c.issuer}, ${c.date}`,
  }));

  // The desk photos are read straight out of the DOM rather than duplicated in
  // a data file, so their captions can only ever say what the page says. The
  // "01 /" prefix on each step is a CSS ::before, so textContent is already
  // clean.
  const photoTriggers = [...document.querySelectorAll('[data-photo]')];
  collections.photo = photoTriggers.map((btn) => {
    const figure = btn.closest('figure');
    const caption = figure?.querySelector('figcaption');
    const text = caption
      ? [...caption.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim()
      : '';
    return {
      src: btn.dataset.photo,
      title: figure?.querySelector('.setup__step')?.textContent.trim() || '',
      meta: text,
      alt: btn.querySelector('img')?.alt || '',
    };
  });

  // data-cert: certificate tiles, "View certificate" buttons, the FarmFinds
  // award chip. data-photo: the desk photos.
  document.addEventListener('click', (e) => {
    const cert = e.target.closest('[data-cert]');
    if (cert) {
      const i = CERTIFICATES.findIndex((c) => c.slug === cert.dataset.cert);
      if (i < 0) return;
      e.preventDefault();
      open('certificate', i, cert);
      return;
    }
    const photo = e.target.closest('[data-photo]');
    if (photo) {
      const i = photoTriggers.indexOf(photo);
      if (i < 0) return;
      e.preventDefault();
      open('photo', i, photo);
    }
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
    // Deferred on purpose: during the 'close' event the dialog is still in the
    // top layer, so focusing an element outside it is ignored and focus is left
    // stranded on the dialog's own close button. A timer rather than
    // requestAnimationFrame because rAF does not fire in a backgrounded tab,
    // which would leave focus stranded exactly when nobody is watching.
    const trigger = opener;
    opener = null;
    if (trigger) setTimeout(() => trigger.focus(), 0);
  });
}

function open(collection, i, trigger) {
  items = collections[collection] || [];
  if (!items.length) return;
  opener = trigger;
  render(i);
  el.dialog.showModal();
}

function go(step) {
  const next = index + step;
  if (next < 0 || next >= items.length) return;   // never leaves the collection
  render(next);
}

function render(i) {
  index = i;
  const item = items[i];
  if (!item) return;
  zoomTo(1);

  el.img.src = item.src;
  el.img.alt = item.alt;
  el.title.textContent = item.title;
  el.meta.textContent = item.meta;
  // A single-item collection has nothing to count through.
  el.count.textContent = items.length > 1 ? `${i + 1} / ${items.length}` : '';
  el.prev.disabled = i === 0;
  el.next.disabled = i === items.length - 1;
  el.prev.hidden = el.next.hidden = items.length < 2;

  // Preload the neighbours so browsing feels instant.
  for (const j of [i - 1, i + 1]) {
    if (items[j]) new Image().src = items[j].src;
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
