#!/bin/bash
# Rebuilds the README's pictures from the running app, so they can't drift from what the art really
# looks like. Every clip is a recording of Lofi Studio on a stepped clock, with its moment asked for
# by name. Needs Node, Chrome, ImageMagick and img2webp, and `npm install` in scripts/. Nothing plays
# out loud: the browser runs muted.
#   bash docs/make.sh path/to/lofi-studio/index.html [just these clips]
set -euo pipefail
[ $# -ge 1 ] || { echo "Usage: bash docs/make.sh path/to/lofi-studio/index.html [clips]" >&2; exit 1; }
PAGE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; shift
ONLY=" $* "
cd "$(dirname "$0")"
OUT="$PWD/media"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# name, the frame that makes the still for people who prefer no motion, then what to record
clip(){
  local name=$1 still=$2; shift 2
  [ "$ONLY" = "  " ] || [[ "$ONLY" == *" $name "* ]] || return 0
  node ../scripts/look.mjs clip --page "$PAGE" --seed 2026 --out "$TMP/$name" "$@" >/dev/null
  if declare -F "dress_$name" >/dev/null; then "dress_$name" "$TMP/$name"; fi
  img2webp -loop 0 ${MODE:--lossless} -m 6 -min_size -d 60 "$TMP/$name"/*.png -o "$OUT/$name.webp" 2>/dev/null
  magick "$TMP/$name/$still.png" -strip -define webp:lossless=true "$OUT/$name-still.webp"
  printf '%-16s %s\n' "$name" "$(du -h "$OUT/$name.webp" | cut -f1)"
}
# the hero wears the title, in the part of the sky the moon leaves empty
dress_hero(){ find "$1" -name '*.png' -print0 | xargs -0 -P 8 -I{} magick {} "$OUT/title.png" -gravity northeast -geometry +14+14 -composite {}; }

if [ "$ONLY" = "  " ]; then node plates.mjs "$OUT"; fi

# a fox trots into the firelight while the marshmallow goes up
clip hero 0060 --place forest --at 2 --sight forestEdge:fox --skip 5 --act smoreFire --actat 5.2 --seconds 7.2 --loop 8 --zoom 2

# light on things that move, and a cloud crossing the sun at four times real speed
clip fox-firelight 0060 --place forest --at 2 --sight forestEdge:fox --skip 3 --seconds 9.6 --loop 8 --crop 200,170,440,100 --zoom 2
clip beach-shadows 0060 --place beach --at 53 --seconds 8 --loop 5 --crop 0,180,640,120 --zoom 2
# every layer of the castle scrolls, which is the one thing lossless can't keep small
MODE="-mixed -q 84" clip torch-walker 0060 --place castle --at 4 --seconds 9 --loop 5 --crop 30,150,300,110 --zoom 2
clip cloud-sun 0055 --place park --at 62 --gap .24 --seconds 30 --loop 8

# things with lives of their own: clouds at eight times real speed, a wave, a whale
clip clouds-night 0040 --place forest --at 20 --gap .48 --seconds 48 --loop 8 --crop 0,0,640,130
clip clouds-day 0040 --place park --at 96 --gap .48 --seconds 48 --loop 8 --crop 0,0,640,130
clip surf 0060 --place beach --at 6 --seconds 9 --loop 5 --crop 340,195,280,65 --zoom 2
clip whale 0034 --place beach --at 2 --sight beachSea:whale --skip 5.8 --seconds 5.4 --loop 5 --crop 0,60,640,160

# small human moments
clip marshmallow 0060 --place forest --at 3 --act smoreFire --actat 5.5 --seconds 15 --loop 8 --crop 290,170,170,90 --zoom 2
clip fishing 0048 --place lake --at 16 --act fish --actat 11.5 --seconds 6.6 --loop 8 --crop 240,110,340,180 --zoom 2
clip wink 0016 --place garden --who girl --at 2 --act wink --seconds 2.6 --loop 4 --crop hero --zoom 2
clip yawn 0034 --place garden --who guy --at 2 --act yawn --seconds 4.8 --loop 4 --crop hero --zoom 2
clip sneeze 0026 --place garden --who girl --at 2 --act sneeze --seconds 3.8 --loop 4 --crop hero --zoom 2
clip hair 0010 --place garden --who girl --at 2 --act hair --seconds 3.8 --loop 4 --crop hero --zoom 2
clip stretch 0020 --place garden --who guy --at 2 --act stretch --seconds 4.2 --loop 4 --crop hero --zoom 2
clip cough 0010 --place garden --who guy --at 2 --act cough --seconds 2.6 --loop 4 --crop hero --zoom 2

# the referee's own status screens: the forest on the day it got a scene of its own, and the forest now
if [ "$ONLY" = "  " ] || [[ "$ONLY" == *" status "* ]]; then
  git -C "$(dirname "$PAGE")" show f152449:index.html > "$TMP/then.html"
  node ../scripts/validate.mjs --page "$TMP/then.html" --place forest --out "$TMP/then" >/dev/null || true
  node ../scripts/validate.mjs --page "$PAGE" --place forest --out "$TMP/now" >/dev/null || true
  magick "$TMP/then/status.png" -strip -define webp:lossless=true "$OUT/status-then.webp"
  magick "$TMP/now/status.png" -strip -define webp:lossless=true "$OUT/status-now.webp"
  # what it saved when it caught a cloud appearing from nothing, on the version before that was fixed
  git -C "$(dirname "$PAGE")" show 51503c3:index.html > "$TMP/starved.html"
  node ../scripts/validate.mjs --page "$TMP/starved.html" --place garden --out "$TMP/starved" >/dev/null || true
  if [ -f "$TMP/starved/jump-1.png" ]; then magick "$TMP/starved/jump-1.png" -strip -define webp:lossless=true "$OUT/jump-cloud.webp"; fi
fi

# the whole beach, for the before and after
if [ "$ONLY" = "  " ]; then node ../scripts/look.mjs shot --page "$PAGE" --seed 2026 --place beach --at 57 --zoom 2 --out "$OUT/after-beach.png" >/dev/null; fi

du -sh "$OUT"
