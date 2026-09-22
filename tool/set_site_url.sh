#!/usr/bin/env bash
# Rewrites the site's absolute URLs. They appear in six places across three
# files; miss one and search engines index an address that does not exist.
#
#   tool/set_site_url.sh https://marrkkyyyyy.github.io/Mark-Stephen-Molina-Portfolio/
#   tool/set_site_url.sh https://marrkkyyyyy.github.io/        # if the repo is renamed
set -euo pipefail
NEW="${1:?usage: set_site_url.sh <base-url-with-trailing-slash>}"
[[ "$NEW" == */ ]] || { echo "base URL must end in /" >&2; exit 1; }
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OLD="$(grep -o 'https://[^"<]*' "$ROOT/sitemap.xml" | head -1)"
[ -n "$OLD" ] || { echo "could not read the current URL from sitemap.xml" >&2; exit 1; }
echo "  $OLD"
echo "  -> $NEW"
for f in index.html sitemap.xml robots.txt; do
  [ -f "$ROOT/$f" ] || continue
  n=$(grep -c "$OLD" "$ROOT/$f" || true)
  [ "$n" = 0 ] && continue
  sed -i '' "s|$OLD|$NEW|g" "$ROOT/$f"
  printf '  %-14s %s replaced\n' "$f" "$n"
done
