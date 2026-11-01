#!/bin/bash
# Rebuilds assets/gallery: real crops of the running app, zoomed with hard pixels, that show what
# each element should look like. Run after the art changes. Needs ImageMagick, and `npm install` here.
# The before-*.png pictures are old screenshots of the app and example-*.png come from the examples:
# they're kept by hand, and this leaves them alone.
#   bash build-gallery.sh path/to/lofi-studio/index.html
set -euo pipefail
[ $# -ge 1 ] || { echo "Usage: bash build-gallery.sh path/to/lofi-studio/index.html" >&2; exit 1; }
PAGE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
cd "$(dirname "$0")"
OUT=../assets/gallery
mkdir -p "$OUT"
L() { node look.mjs "$@" --page "$PAGE" --seed 2026; }
BARE=(-strip -define png:exclude-chunks=date,time)   # the picture and nothing else
stack() { out=$1; shift; magick "$@" -background '#14101c' -gravity center -append +repage "${BARE[@]}" "$out"; }
side() { out=$1; shift; magick "$@" -background '#14101c' -gravity center +append +repage "${BARE[@]}" "$out"; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# the whole of a world, so a guide can point at how the light falls across it
L shot --place forest --at 12 --sight forestEdge:deer --zoom 2 --out "$OUT/light-campfire.png" &
L shot --place park   --at 8  --zoom 2 --out "$OUT/light-park.png" &
wait

# moving things in the light
L strip --place beach  --at 30 --n 4 --gap 9 --crop 0,180,640,120 --zoom 1 --cols 2 --out "$OUT/light-beach-shadows.png" &
L strip --place castle --at 4 --n 6 --gap 3 --crop 30,190,200,80 --zoom 2 --cols 3 --out "$OUT/light-torch-walker.png" &
L strip --place forest --at 2 --sight forestEdge:fox --n 6 --gap 3.5 --crop 0,180,640,80 --zoom 1 --cols 2 --out "$OUT/light-fox-firelight.png" &
wait

# plants
L shot --place park   --at 6 --crop 430,40,210,190 --zoom 4 --out "$OUT/tree-crowns.png" &
L shot --place park   --at 6 --crop 0,100,640,180  --zoom 2 --out "$OUT/tree-kinds.png" &
L shot --place forest --at 6 --crop 0,100,320,140  --zoom 4 --out "$TMP/pine-left.png" &
L shot --place forest --at 6 --crop 320,100,320,140 --zoom 4 --out "$TMP/pine-right.png" &
L shot --place park   --at 6 --crop 0,200,320,100  --zoom 4 --out "$OUT/grass-flowers.png" &
L shot --place beach  --at 6 --crop 0,230,320,70   --zoom 4 --out "$OUT/dune-grass.png" &
wait
stack "$OUT/pines-moonlit.png" "$TMP/pine-left.png" "$TMP/pine-right.png"

# sky
L shot --place beach  --at 2 --crop 380,10,260,85 --zoom 3 --out "$TMP/cloud-sunset.png" &
L shot --place garden --at 8 --crop 0,0,420,100  --zoom 3 --out "$TMP/cloud-day.png" &
L shot --place forest --at 8 --crop 0,0,420,110  --zoom 3 --out "$TMP/cloud-moon.png" &
wait
stack "$OUT/clouds.png" "$TMP/cloud-moon.png" "$TMP/cloud-sunset.png" "$TMP/cloud-day.png"
L strip --place park  --at 8 --n 3 --gap 25 --crop 0,0,640,130 --zoom 1 --out "$TMP/time-day.png" &
L strip --place beach --at 8 --n 3 --gap 25 --crop 0,0,640,130 --zoom 1 --out "$TMP/time-sunset.png" &
L strip --place forest --at 8 --n 3 --gap 25 --crop 0,0,640,130 --zoom 1 --out "$TMP/time-night.png" &
wait
stack "$OUT/clouds-over-time.png" "$TMP/time-day.png" "$TMP/time-sunset.png" "$TMP/time-night.png"

# water
L strip --place beach --at 6 --n 6 --gap 1.2 --crop 0,180,640,90 --zoom 1 --out "$OUT/surf-over-time.png" &
L shot  --place beach --at 6 --crop 340,195,280,65 --zoom 4 --out "$OUT/surf-close.png" &
L shot  --place lake  --at 6 --crop 200,120,440,180 --zoom 3 --out "$OUT/lake.png" &
L shot  --place beach --at 6 --crop 400,30,240,140 --zoom 3 --out "$OUT/ship-gulls.png" &
wait

# fire
L shot --place forest --at 6 --crop 370,180,100,90 --zoom 6 --out "$OUT/campfire.png" &
L strip --place forest --at 3 --act smoreFire --n 12 --gap 1.75 --crop 290,170,170,90 --zoom 2 --out "$OUT/marshmallow.png" &
wait

# things people built
L shot --place castle --at 6 --crop 30,30,500,250 --zoom 2 --out "$OUT/castle.png" &
L shot --place garden --at 6 --crop 470,60,170,180 --zoom 4 --out "$OUT/shed.png" &
L shot --place office --at 6 --crop 40,0,600,300    --zoom 2 --out "$OUT/office.png" &
L shot --place cafe   --at 6 --zoom 2 --out "$OUT/cafe.png" &
wait

# people
L poses --out "$OUT/people-poses.png" --zoom 4 &
L walk --out "$OUT/people-walk.png" &
L strip --place garden --who girl --at 2 --act yawn --n 6 --gap .7 --crop hero --zoom 3 --out "$TMP/yawn.png" &
L strip --place garden --who girl --at 2 --act sneeze --n 6 --gap .55 --crop hero --zoom 3 --out "$TMP/sneeze.png" &
L strip --place garden --who guy --at 2 --act stretch --n 6 --gap .6 --crop hero --zoom 3 --out "$TMP/stretch.png" &
wait
stack "$OUT/people-life.png" "$TMP/yawn.png" "$TMP/sneeze.png" "$TMP/stretch.png"

# creatures and rare sights
L strip --place beach  --at 2 --sight beachSea:whale --n 12 --gap .95 --crop 0,60,640,160 --zoom 1 --out "$OUT/whale.png" &
L strip --place beach  --at 2 --sight beachSand:crab --n 6 --gap .9 --crop 0,230,320,70 --zoom 2 --out "$OUT/crab.png" &
L strip --place forest --at 2 --sight forestEdge:fox --n 6 --gap 3 --crop 0,170,640,90 --zoom 1 --out "$OUT/fox.png" &
L strip --place park   --at 2 --n 6 --gap 2.5 --crop 260,170,200,110 --zoom 2 --out "$OUT/birds-park.png" &
wait
echo "gallery: $(du -sh "$OUT" | cut -f1)"; ls -la "$OUT" | awk '{print $5, $9}'
