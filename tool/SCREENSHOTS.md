# Adding project screenshots

Drop image files into the right folder and they appear on the site. No code
changes, no rebuild — just reload the page.

## Where files go

```
assets/screenshots/
├── heyjag_customer/   01_home.webp  02_order_tracking.webp  03_checkout.webp
├── heyjag_merchant/   01_dashboard.webp  02_orders.webp  03_analytics.webp
├── heyjag_driver/     01_kyc.webp  02_active_delivery.webp  03_earnings.webp
├── heyjag_provider/   01_bookings.webp  02_availability.webp  03_team.webp
├── fuzion_plus/       01_dashboard.webp
└── farmfinds/         01_marketplace.webp  02_product.webp  03_cart.webp
```

Those exact filenames are the slots declared in `index.html`. A file named
anything else is ignored; to add a slot, add the `<img data-src="…">` in the
matching gallery in `index.html`.

## How to convert a screenshot

Phone screenshots — resize to 1170px wide:

```bash
cwebp -q 80 -resize 1170 0 ~/Desktop/screen.png -o assets/screenshots/heyjag_customer/01_home.webp
```

Desktop screenshots (Fuzion+) — 1600px wide, and the frame expects roughly 16:10:

```bash
cwebp -q 80 -resize 1600 0 ~/Desktop/fuzion.png -o assets/screenshots/fuzion_plus/01_dashboard.webp
```

Expect ~120 KB per phone shot and ~180 KB for the desktop one.

## What happens when files are missing

This is deliberate, and worth knowing so nothing looks broken while you work:

- **A single missing file** — that phone frame is removed and the remaining
  screenshots close up. No gap, no placeholder.
- **A project with no screenshots at all** — the whole image column is removed
  and the case study switches to a full-width text layout. It reads as a
  deliberate design, not as something unfinished.
- **HeyJag specifically** — it has four tabs (Customer / Driver / Merchant / Provider).
  Its gallery only appears once **all four** tabs have at least one screenshot.
  Otherwise switching to an empty tab would leave a hole in the layout, so the
  case study stays in its text-only form until the set is complete.

The site never shows a broken image icon or a "add screenshot here" placeholder.
