# Adding project screenshots

Drop image files into the right folder and they appear on the site. No code
changes, no rebuild — just reload the page.

## Where files go

```
assets/screenshots/
├── heyjag_customer/   01_home 02_browse 03_restaurant 04_hours 05_menu
│                       06_item 07_checkout 08_heroes 09_rides 10_account  (.webp)
├── heyjag_merchant/   01_dashboard.webp  02_menu.webp  03_financials.webp
├── heyjag_driver/     01_kyc.webp  02_active_delivery.webp  03_earnings.webp
├── heyjag_provider/   01_bookings.webp  02_workers.webp  03_team.webp
├── tropiland/         01_dashboard … 06_products.webp  +  full/
├── fuzion_plus/       01_dashboard.webp                    (none yet)
└── farmfinds/         01_marketplace.webp  02_product.webp  03_cart.webp   (none yet)
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

## Where the customer shots came from

Mark's own iPhone 17 Pro simulator captures, 1206×2622, in `~/Desktop/Customer`. Raw app
screens — no marketing composite, nothing to crop around:

```bash
cwebp -q 80 -m 6 -resize 1170 0 ~/Desktop/Customer/<shot>.png \
  -o assets/screenshots/heyjag_customer/01_home.webp
```

1206×2622 is 0.4600 against the frame's 0.4615, so `object-fit: cover` trims about 0.3% — no
crop box needed. Ten of them, in journey order: home, browse, restaurant, hours, menu, item, checkout,
Heroes, rides, account. The rail scroll-snaps, so the count is not limited by layout.
Two of the twelve are left out on purpose — an empty "nothing in progress" activity state
and the login wall.

**Prefer this route for the other three apps.** Simulator captures beat the App Store crops on
every axis; the store listings were only used because those apps need an authenticated account
per role and the customer app is the one Mark could sign into.

## Where the merchant, driver and provider shots came from

Not from the simulator. All four apps hit a login wall on first launch and need
a real authenticated account per role, so the screenshots are cropped out of the
published App Store listings — his own apps, his own marketing assets.

```bash
curl -s "https://itunes.apple.com/lookup?id=<trackId>" \
  | node -e '…json.results[0].screenshotUrls…'   # then swap the size suffix for /9999x0w.png
```

| App | trackId | Native source |
| --- | --- | --- |
| Hey JAG | 6739027383 | 1320×2868 |
| JAG Merchant | 6739029277 | 1320×2868 |
| JAG Driver | 6739028664 | 1320×2868 |
| JAG Provider | 6762231255 | 1284×2778 |

Each is a **marketing composite** — promo headline, a stock model, product
renders — with the real app UI inside a rendered iPhone. Only the screen is
shipped. The screen sits in the same place in every image of a set, measured by
detecting the dark bezel either side of it:

```bash
# Hey JAG / JAG Merchant / JAG Driver
cwebp -q 80 -m 6 -crop 303 660 713 1544 store/customer-06.png -o assets/screenshots/heyjag_customer/01_explore.webp
# JAG Provider
cwebp -q 80 -m 6 -crop 295 637 694 1501 store/provider-05.png -o assets/screenshots/heyjag_provider/01_bookings.webp
```

The crop box is already narrowed to the frame's 9:19.5, so `object-fit: cover`
has nothing left to trim. It also starts **below the iOS status bar** — the
render carries a Dynamic Island, and `.phone__notch` draws its own pill over
the top, so including it gives you two.

Two things to watch when picking shots: several composites have props (a
scooter, food boxes, shop illustrations) drawn **over** the phone screen, and
`customer-03` uses a different phone render entirely. Check each crop before
shipping it.

Filenames follow what the shot actually shows, not what the slot was originally
called — six were renamed for exactly that reason.

## Where the Tropiland shot came from

Captured from the running app, which needs no credentials — it seeds its own
demo data. It does have a login gate, so a headless run has to get past it:

1. Proxy the app so a seed page can be same-origin (its localStorage key is
   `tropiland-os-demo`; setting `state.userId` to the owner is enough, and
   Zustand's merge keeps the seeded `db`).
2. `chrome --headless=new --user-data-dir=P --screenshot` on the seed page.
3. Same profile, `--window-size=1600,1000 --force-device-scale-factor=2` on
   the target route → a 3200×2000 capture, exactly the 16:10 `.window__body`
   wants.

**Client data is blurred in the page before capture.** The demo seed is the
client's real records, so the proxy injects a script that wraps the owner's
name, client company names and addresses, truck plates and every peso amount
in a `filter: blur(6px)` span (chart axis labels included). Six screens ship:
dashboard, deliveries, statements, purchase orders, clients, products. Expenses
was left out because it renders an empty month.

**Not shipped, on purpose:** the statement-of-account and print views are the
most impressive screens in that app, but the letterhead carries the client's
real TeleFax number and a personal email address. Blank those in the demo seed
and they are safe to add.

## Regenerating the social preview image

`assets/img/og-image.png` had its text baked in and went stale — it said "three-app
marketplace", listed three client regions, used a headline the site had replaced, and was dark
after the site switched to opening light. None of that is visible to anyone reading the HTML.

`tool/og-card.html` is now the source. Serve it (so `../css` and `../assets` resolve) and
capture:

```bash
chrome --headless=new --user-data-dir=/tmp/ogprof --disable-gpu --hide-scrollbars \
       --force-device-scale-factor=1 --virtual-time-budget=6000 --window-size=1200,630 \
       --screenshot=assets/img/og-image.png http://localhost:8347/tool/og-card.html
```

1200x630 must match `og:image:width`/`og:image:height` in index.html. Redo it after any
change to the hero headline, the app count or the client list.
