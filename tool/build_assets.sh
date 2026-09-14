#!/usr/bin/env bash
# Converts the raw scans/photos in ~/Documents/Personal Documents into web assets.
# Run once. Output is committed; this script exists for regeneration, not for the build.
#
# Requires: cwebp (brew install webp), sips (macOS built-in). ImageMagick NOT required.
set -euo pipefail

SRC="${SRC:-/Users/newbie/Documents/Personal Documents}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_SRC="$SRC/certificate"
FULL="$ROOT/assets/certificates/full"
THUMB="$ROOT/assets/certificates/thumbs"
IMG="$ROOT/assets/img"

mkdir -p "$FULL" "$THUMB" "$IMG" "$ROOT/assets/docs"

FULL_W=1600
THUMB_W=480

# Crop boxes as fractions of the source, one row per slug:
#   slug <TAB> left <TAB> top <TAB> right <TAB> bottom
# Flatbed scans sit on a larger platen, so several carry 10-20% of white margin
# that would otherwise shrink the certificate to nothing in a grid tile. The
# boxes were measured from the ink density of each scan; see tool/README.md.
CROPS="$(dirname "${BASH_SOURCE[0]}")/crops.tsv"

crop_args() {   # slug srcW srcH -> "-crop x y w h", or empty for a full-bleed scan
  local slug="$1" w="$2" h="$3"
  # PAD re-adds a small margin: the density scan finds where the ink gets dense,
  # which can sit just inside faint body text. 3% is enough to never clip a line.
  awk -v slug="$slug" -v W="$w" -v H="$h" -v PAD=0.03 '
    $1 == slug {
      l = $2 - PAD; t = $3 - PAD; r = $4 + PAD; b = $5 + PAD;
      if (l < 0) l = 0; if (t < 0) t = 0; if (r > 1) r = 1; if (b > 1) b = 1;
      x = int(l * W); y = int(t * H);
      cw = int((r - l) * W); ch = int((b - t) * H);
      if (cw >= W - 2 && ch >= H - 2) exit          # nothing to trim
      if (cw < W * 0.3 || ch < H * 0.3) exit        # implausible, leave it alone
      printf "-crop %d %d %d %d", x, y, cw, ch
    }' "$CROPS"
}

# Emit a webp at the target width: crop the margins, then resize — but never
# upscale a source that is already narrower than the target.
encode() {
  local src="$1" out="$2" target="$3" quality="$4" slug="$5"
  local w h crop
  w=$(sips -g pixelWidth  "$src" 2>/dev/null | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight "$src" 2>/dev/null | awk '/pixelHeight/{print $2}')
  if [ -z "$w" ] || [ -z "$h" ]; then echo "  !! cannot read dimensions: $src" >&2; return 1; fi

  crop=""
  if [ -n "$slug" ] && [ -f "$CROPS" ]; then crop="$(crop_args "$slug" "$w" "$h")"; fi
  # After cropping, the width that matters is the cropped width.
  if [ -n "$crop" ]; then w=$(echo "$crop" | awk '{print $4}'); fi

  if [ "$w" -gt "$target" ]; then
    cwebp -quiet -q "$quality" -m 6 $crop -resize "$target" 0 "$src" -o "$out"
  else
    cwebp -quiet -q "$quality" -m 6 $crop "$src" -o "$out"
  fi
}

# source filename | slug
# Slugs become public URLs and alt text, so they are semantic, not scanner dumps.
# SKMBT_..._0010 is deliberately omitted: it is the same seminar as _0009 with a
# different guest speaker, and two near-identical certificates read as padding.
CERTS=(
  # ---- tier 1: headline awards ----
  "SKMBT_36324052807200_0004.jpg|champion-psit-programming-2023"
  "SKMBT_36324052807200_0005.jpg|hackforgov-3rd-place-2023"
  "SKMBT_36324052807200_0002.jpg|deans-list-academic-excellence-2023"
  "National_IT_Skills.jpg|national-it-skills-c-2024"
  "362936832_1005910017428349_6324341490872991060_n.jpg|yfc-provincial-eligibility-2023"
  "370220939_7149334175079100_7143109382919852519_n.png|yfc-business-pitching-regional-2023"
  # ---- tier 2: participation / seminars ----
  "SKMBT_36324052807200_0003.jpg|hackforgov-participation-2023"
  "SKMBT_36324052807200_0006.jpg|seminar-python-programming-2023"
  "SKMBT_36324052807200_0007.jpg|seminar-web-development-2023"
  "SKMBT_36324052807200_0008.jpg|seminar-leadership-strategic-planning-2023"
  "SKMBT_36324052807200_0009.jpg|seminar-mobile-computing-2023"
  "SKMBT_36324052807200_0001.jpg|hackathon-2023-appreciation"
  "2024-05-28 133345.png|psits-12th-convention-innotech-2024"
  "Slide3.PNG|seminar-ai-in-education-2023"
  "Slide3 (1).PNG|seminar-student-to-ceo-2023"
  "Slide3 (2).PNG|seminar-mugna-insider-tech-2023"
  "Slide3 (3).PNG|seminar-hitchhikers-guide-tech-2023"
  "Slide6.PNG|psits-11th-convention-participation-2023"
)

echo "==> certificates (${#CERTS[@]})"
for entry in "${CERTS[@]}"; do
  file="${entry%%|*}"; slug="${entry##*|}"
  if [ ! -f "$CERT_SRC/$file" ]; then echo "  !! missing source: $file" >&2; continue; fi
  encode "$CERT_SRC/$file" "$FULL/$slug.webp"  "$FULL_W"  78 "$slug"
  encode "$CERT_SRC/$file" "$THUMB/$slug.webp" "$THUMB_W" 70 "$slug"
  printf '  %-46s %5sKB -> %4sKB / %3sKB\n' "$slug" \
    "$(( $(stat -f%z "$CERT_SRC/$file") / 1024 ))" \
    "$(( $(stat -f%z "$FULL/$slug.webp") / 1024 ))" \
    "$(( $(stat -f%z "$THUMB/$slug.webp") / 1024 ))"
done

echo "==> profile photo"
PHOTO="$SRC/Mark Stephen B. Molina.jpg"
cwebp -quiet -q 82 -m 6 -resize  900 0 "$PHOTO" -o "$IMG/profile.webp"
cwebp -quiet -q 78 -m 6 -resize 1800 0 "$PHOTO" -o "$IMG/profile@2x.webp"

echo "==> resume"
cp "$SRC/Mark_Stephen_Molina_Resume.pdf" "$ROOT/assets/docs/Mark_Stephen_Molina_Resume.pdf"

echo
echo "==> totals"
du -sh "$FULL" "$THUMB" "$IMG" "$ROOT/assets/docs"
