# Mark Stephen Molina — portfolio

A single-page portfolio site. Plain HTML, CSS and JavaScript: no framework, no
bundler, no build step. What is in this repo is exactly what gets served.

**Live:** https://marrkkyyyyy.github.io/

## Running it locally

ES modules need a real origin, so open it through a server rather than
double-clicking the file:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Layout

```
index.html          the entire site — all content lives here, not in JS
404.html
css/
  tokens.css        design tokens (colour, type, space, radius, motion)
  base.css          reset, element defaults, focus, reduced-motion
  layout.css        container, section rhythm, scroll reveals, grids
  components.css    header, buttons, chips, cards, device frames, lightbox
  sections.css      hero, about, timeline, case studies, credentials, contact
js/
  main.js           entry point; everything else is imported from here
  theme.js          dark/light toggle
  nav.js            sticky header, scroll-spy, mobile menu
  reveal.js         fade sections in on scroll
  project-tabs.js   HeyJag Customer/Merchant/Driver switcher
  gallery.js        screenshot loading and graceful absence
  lightbox.js       certificate viewer
  certificates.js   GENERATED — see tool/gen_certificates.js
assets/
  certificates/     full/ (lightbox) and thumbs/ (grid), as WebP
  screenshots/      drop project screenshots here — see tool/SCREENSHOTS.md
  img/              profile photo, favicon, Open Graph image
  docs/             résumé PDF
tool/               one-off generators; not part of serving the site
```

## Editing content

Almost everything is plain markup in `index.html` — edit it directly.

Two things are generated, and both commit their output:

| To change | Edit | Then run |
| --- | --- | --- |
| Certificates (titles, issuers, dates, tiers) | `tool/gen_certificates.js` | `node tool/gen_certificates.js headline` / `rest`, paste into `index.html`; `node tool/gen_certificates.js catalogue > js/certificates.js` |
| Certificate images | `tool/build_assets.sh` | `./tool/build_assets.sh` |

## Adding screenshots

See **[tool/SCREENSHOTS.md](tool/SCREENSHOTS.md)**. Short version: drop files
into `assets/screenshots/<project>/` using the documented filenames and they
appear. Nothing renders as broken while they're missing.

## Deploying

GitHub Pages serves this directly — there is no workflow to run.

1. Create a **public** repo named `Marrkkyyyyy.github.io`.
2. `git remote add origin git@github.com:Marrkkyyyyy/Marrkkyyyyy.github.io.git`
3. `git push -u origin main`
4. Repo → **Settings → Pages → Source → Deploy from a branch**, branch `main`,
   folder `/ (root)`.

`.nojekyll` is committed so Pages serves the files as-is.

For a custom domain: add a `CNAME` file containing the domain, then set it under
Settings → Pages.

## Notes

- Fonts come from Google Fonts. To remove that third-party request, convert the
  TTFs with `npx wawoff2` and self-host them with `@font-face`.
- The phone number is a public `tel:` link. Delete that block in the contact
  section if you'd rather not publish it; it is deliberately left out of the
  JSON-LD structured data either way.
