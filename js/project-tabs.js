/* ARIA tabs for the HeyJag app switcher. Swaps the feature panel and, when
   screenshots exist, the matching gallery. Full keyboard support: arrows,
   Home and End, per the WAI-ARIA tabs pattern. */

export function initTabs() {
  document.querySelectorAll('[role="tablist"]').forEach(setup);
}

function setup(list) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  if (!tabs.length) return;

  const select = (tab, focus = true) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;

      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;

      // Galleries are outside the panel (different column), matched by id.
      document
        .querySelectorAll(`[data-panel="${t.getAttribute('aria-controls')}"]`)
        .forEach((g) => { g.hidden = !on; });
    }
    if (focus) tab.focus();
  };

  list.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) select(tab, false);
  });

  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(tabs[(keys[e.key] + tabs.length) % tabs.length]);
  });
}
