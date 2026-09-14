import { initTheme }     from './theme.js';
import { initNav }       from './nav.js';
import { initReveal }    from './reveal.js';
import { initTabs }      from './project-tabs.js';
import { initGalleries } from './gallery.js';
import { initLightbox }  from './lightbox.js';
import { initCounters }  from './counters.js';

initTheme();
initNav();
initReveal();
initTabs();
initLightbox();
initCounters();
initGalleries();

document.getElementById('year').textContent = new Date().getFullYear();
