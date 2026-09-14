# tool/

One-off generators. None of these run when the site is served — they produce
files that are committed.

## `build_assets.sh`

Turns the raw scans and photos in `~/Documents/Personal Documents` into web
assets. Requires `cwebp` (`brew install webp`) and macOS `sips`. ImageMagick is
**not** used and must not be assumed.

```bash
./tool/build_assets.sh
```

For each certificate it writes a ~1600px `full/` image for the lightbox and a
~480px `thumbs/` image for the grid, and it renames scanner filenames
(`SKMBT_36324052807200_0004.jpg`) to semantic slugs that are fit to appear in a
URL and in alt text.

Two details worth knowing before changing it:

- **It never upscales.** Five sources are narrower than 1600px; those are
  re-encoded at their native size instead of being blown up into blur.
- **It crops white margins** using `crops.tsv`. Several scans were made on a
  flatbed larger than the certificate, leaving 10–20% of empty paper that would
  otherwise shrink the certificate to a stamp inside a grid tile. Each row is
  `slug  left  top  right  bottom` as fractions of the source, and the script
  pads every box by 3% so faint body text is never clipped. A row of `0 0 1 1`
  means the scan is already full-bleed.

To re-measure the crop boxes, load the site and run the ink-density scan over
`assets/certificates/full/*.webp` in the browser console: a row or column counts
as content when at least 1.2% of it is non-paper and the next 8 lines agree
(the run requirement is what stops a single dark scanner edge line registering
as the certificate border).

## `gen_certificates.js`

The certificate list, in one place. Every field was transcribed from the scan
itself rather than from the résumé — where the two disagreed, the scan won.

```bash
node tool/gen_certificates.js headline    # the 6 award tiles
node tool/gen_certificates.js rest        # the 12 in the "view all" grid
node tool/gen_certificates.js catalogue > js/certificates.js   # lightbox metadata
```

Paste the first two into `index.html`. The catalogue is what the lightbox reads
for captions and ordering, so regenerate it whenever the list changes.
