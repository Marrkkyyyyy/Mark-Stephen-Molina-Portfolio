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
  "Cumlaude.png|cum-laude-distinction-2024"
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

echo "==> desk photos"
# Three shots picked as a progression. HEIC goes through sips first because
# cwebp does not read it; the JPEG can go straight in.
DESK="$ROOT/assets/img/setup"
mkdir -p "$DESK"
mkdir -p "$DESK/full"
desk() {   # src slug
  local src="$1" slug="$2" tmp keep=0
  if [ ! -f "$src" ]; then echo "  !! missing: $src" >&2; return 0; fi
  case "$src" in
    *.HEIC|*.heic)
      tmp="$(mktemp -t deskXXXX).jpg"
      sips -s format jpeg -Z 3000 "$src" --out "$tmp" >/dev/null 2>&1
      keep=1 ;;
    *) tmp="$src" ;;
  esac
  cwebp -quiet -q 80 -m 6 -resize 1000 0 "$tmp" -o "$DESK/$slug.webp"
  cwebp -quiet -q 80 -m 6 -resize 1800 0 "$tmp" -o "$DESK/full/$slug.webp"
  [ "$keep" = 1 ] && rm -f "$tmp"
  printf '  %-14s %5sKB -> grid %3sKB / full %4sKB\n' "$slug" \
    "$(( $(stat -f%z "$src") / 1024 ))" \
    "$(( $(stat -f%z "$DESK/$slug.webp") / 1024 ))" \
    "$(( $(stat -f%z "$DESK/full/$slug.webp") / 1024 ))"
}
DESK_SRC="$ROOT/assets/desktop"
# Chronological. Slugs carry the order, so adding one in the middle renumbers
# the ones after it — the files are generated, so that is cheap.
desk "$DESK_SRC/56d284bafca53ae68eea50c7396c4b09.JPEG" "desk-01-first"
desk "$DESK_SRC/IMG_0747.HEIC"                          "desk-02-ultrawide"
desk "$DESK_SRC/IMG_1250.heic"                          "desk-03-build"
desk "$DESK_SRC/IMG_3346.HEIC"                          "desk-04-now"

echo "==> graduation photo"
# Both medals and the Cum Laude certificate are legible in this one frame, so it
# is shown uncropped. The source is already a 960px phone export - never upscale
# it; the "full" copy is the native size and the page copy is 760 wide.
GRAD="$ROOT/assets/img/grad"
mkdir -p "$GRAD/full"
GRAD_SRC="$ROOT/assets/originals/graduation-2024.jpg"
if [ -f "$GRAD_SRC" ]; then
  cwebp -quiet -q 72 -m 6 -sharp_yuv -resize 760 0 "$GRAD_SRC" -o "$GRAD/graduation-2024.webp"
  cwebp -quiet -q 74 -m 6 -sharp_yuv                "$GRAD_SRC" -o "$GRAD/full/graduation-2024.webp"
  printf '  %-16s %5sKB -> page %3sKB / full %3sKB\n' "graduation-2024" \
    "$(( $(stat -f%z "$GRAD_SRC") / 1024 ))" \
    "$(( $(stat -f%z "$GRAD/graduation-2024.webp") / 1024 ))" \
    "$(( $(stat -f%z "$GRAD/full/graduation-2024.webp") / 1024 ))"
else
  echo "  !! missing: $GRAD_SRC" >&2
fi

echo "==> award photo"
# The plaque and certificate together, cropped to the 16:9 band that holds both
# and drops the ceiling and the tabletop. Source is a 3456x4608 phone shot.
AWARD="$ROOT/assets/img/awards"
mkdir -p "$AWARD/full"
AWARD_SRC="$ROOT/assets/originals/hackforgov-2023.jpg"
if [ -f "$AWARD_SRC" ]; then
  for pair in "1000 $AWARD/hackforgov-2023.webp" "1800 $AWARD/full/hackforgov-2023.webp"; do
    set -- $pair
    cwebp -quiet -q 76 -m 6 -sharp_yuv -crop 42 1340 2890 1626 -resize "$1" 0 "$AWARD_SRC" -o "$2"
  done
  printf '  %-16s %5sKB -> page %3sKB / full %3sKB\n' "hackforgov-2023" \
    "$(( $(stat -f%z "$AWARD_SRC") / 1024 ))" \
    "$(( $(stat -f%z "$AWARD/hackforgov-2023.webp") / 1024 ))" \
    "$(( $(stat -f%z "$AWARD/full/hackforgov-2023.webp") / 1024 ))"
else
  echo "  !! missing: $AWARD_SRC" >&2
fi

echo "==> medals flat-lay"
# HEIC first: cwebp cannot read it, and sips bakes the camera orientation on
# the way out, which matters here - the raw buffer is landscape and the pile
# only reads properly that way round. Crop drops the floor tiles and the
# laptop corner at the edges.
MEDALS_SRC="$ROOT/assets/originals/medals-2024.jpg"
if [ ! -f "$MEDALS_SRC" ] && [ -f "$ROOT/assets/originals/medals-2024.heic" ]; then
  sips -s format jpeg "$ROOT/assets/originals/medals-2024.heic" --out "$MEDALS_SRC" >/dev/null 2>&1
fi
if [ -f "$MEDALS_SRC" ]; then
  cwebp -quiet -q 70 -m 6 -sharp_yuv -crop 37 203 5657 3768 -resize 1200 0 "$MEDALS_SRC" -o "$AWARD/medals-2024.webp"
  cwebp -quiet -q 74 -m 6 -sharp_yuv -crop 37 203 5657 3768 -resize 1800 0 "$MEDALS_SRC" -o "$AWARD/full/medals-2024.webp"
  printf '  %-16s %5sKB -> page %3sKB / full %3sKB\n' "medals-2024" \
    "$(( $(stat -f%z "$MEDALS_SRC") / 1024 ))" \
    "$(( $(stat -f%z "$AWARD/medals-2024.webp") / 1024 ))" \
    "$(( $(stat -f%z "$AWARD/full/medals-2024.webp") / 1024 ))"
else
  echo "  !! missing: $MEDALS_SRC" >&2
fi

echo "==> robotics photos"
# 2023 Arduino builds, from portrait phone shots. Each crop box is the 4:3
# landscape region holding the build, measured by eye against the original.
RIG="$ROOT/assets/img/robotics"
mkdir -p "$RIG/full"
rig() {   # slug x y w h
  local src="$ROOT/assets/originals/robotics/$1.jpg"
  if [ ! -f "$src" ]; then echo "  !! missing: $src" >&2; return 0; fi
  cwebp -quiet -q 72 -m 6 -sharp_yuv -crop "$2" "$3" "$4" "$5" -resize 1000 0 "$src" -o "$RIG/$1.webp"
  cwebp -quiet -q 74 -m 6 -sharp_yuv -crop "$2" "$3" "$4" "$5" -resize 1500 0 "$src" -o "$RIG/full/$1.webp"
  printf '  %-22s %5sKB -> page %3sKB / full %3sKB\n' "$1" \
    "$(( $(stat -f%z "$src") / 1024 ))" \
    "$(( $(stat -f%z "$RIG/$1.webp") / 1024 ))" \
    "$(( $(stat -f%z "$RIG/full/$1.webp") / 1024 ))"
}
rig robotics-01-rover    618 1500 1967 1475
rig robotics-02-frame    562 1750 2894 2170
rig robotics-03-floor    731 2917 2248 1687
rig robotics-04-sensors  112 1400 3035 2276
rig robotics-05-boards     0 1124 3456 2585
rig robotics-06-rig      337 1180 3035 2276

echo "==> resume"
cp "$SRC/Mark_Stephen_Molina_Resume.pdf" "$ROOT/assets/docs/Mark_Stephen_Molina_Resume.pdf"

echo
echo "==> totals"
du -sh "$FULL" "$THUMB" "$IMG" "$ROOT/assets/docs"
