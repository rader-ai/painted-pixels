#!/bin/bash
# Runs the validator over Lofi Studio's own history, to see whether its numbers mean anything: what people
# complained about should fail, and what they liked should pass. The table in references/validation.md comes
# from this. Each version takes about a minute, in muted headless Chrome.
#   bash docs/calibrate.sh path/to/lofi-studio out-folder [commit ...]
set -euo pipefail
REPO="$(cd "$1" && pwd)"; OUT="$2"; shift 2
HERE="$(cd "$(dirname "$0")" && pwd)"
COMMITS=("$@")
[ ${#COMMITS[@]} -gt 0 ] || COMMITS=(45030b1 f152449 85e7961 02222d4 93e0785 df0ba6b 87455fb 6a61202 c9ee540 51503c3 b61438b HEAD)
mkdir -p "$OUT"
for c in "${COMMITS[@]}"; do
  mkdir -p "$OUT/$c"
  git -C "$REPO" show "$c:index.html" > "$OUT/$c/index.html"
  # the first versions have one scene, or keep the castle outside their list of places
  for place in $(grep -q 'PLACES = {' "$OUT/$c/index.html" && echo all castle || echo castle); do
    node "$HERE/../scripts/validate.mjs" --page "$OUT/$c/index.html" --place "$place" --quick --workers 4 --out "$OUT/$c/quest$( [ "$place" = castle ] && echo /castle )" > "$OUT/$c/$place.log" 2>&1 || true
  done
  echo "$c done"
done
python3 - "$OUT" "${COMMITS[@]}" <<'PY'
import glob, json, os, sys
out, commits = sys.argv[1], sys.argv[2:]
places = ['castle', 'office', 'cafe', 'garden', 'forest', 'lake', 'park', 'beach']
print('world'.ljust(8) + ''.join(c[:7].ljust(9) for c in commits))
for p in places:
    row = p.ljust(8)
    for c in commits:
        f = f'{out}/{c}/quest/{p}/report.json'
        if os.path.exists(f):
            r = json.load(open(f)); fails = [x['id'] for x in r['results'] if x['status'] == 'fail']
            row += f"{r['rank']} {len(fails)}".ljust(9)
        else: row += '-'.ljust(9)
    print(row)
print()
for c in commits:
    seen = {}
    for f in glob.glob(f'{out}/{c}/quest/*/report.json'):
        for x in json.load(open(f))['results']:
            if x['status'] == 'fail': seen[x['id']] = seen.get(x['id'], 0) + 1
    print(c[:7], ' '.join(f'{k}x{v}' for k, v in sorted(seen.items())))
PY
