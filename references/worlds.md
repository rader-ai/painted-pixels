# The eight worlds, and how to add one

Worked examples. When you start something new, find the closest one here, then read its code in `index.html` (`PLACES.forest`, and so on), which is at https://github.com/rader-ai/lofi-studio/blob/main/index.html if you're in another project. The comment at the top of a place lists its layers. `../assets/examples/cabin.html` is a ninth example, made outside the app with this skill: a snowy cabin at dusk.

## Adding a world to Lofi Studio

1. **`PLACES.name`**, with `sky(p)`, `bg(p)`, optional `front(p)`, and `draw(g, t, dt, k)`.
2. **`LIGHTS.name`:** write this first. Its `id` is a unique letter, since palettes are cached by it. It says where the sun, moon, fire and lamps are, and everything else reads from it. See `light.md`.
3. **`LOCAL.name`:** what someone does here. **`CHAR_FOR.name`:** `'guy'` or `'girl'`. If they walk rather than sit, add it to **`WALKERS`**.
4. **Reach it** through an album or a vibe.
   - **Album:** `{id, title, scene: 'name', coverX: 40, blurb, tracks}` in `ALBUMS`. `coverX` is where its square cover is cropped. Add a line for it to `SPLASH_LINES`. This works on desktop and on phones.
   - **Vibe:** it needs all three of `PRESETS['Name']`, `VIBE_INFO['Name'] = {ic, ds}` and `VIBE_PLACE['Name'] = 'name'`. Without `VIBE_INFO`, the whole control panel comes up empty, with only a console error. A vibe only changes the world on phones: on desktop the scene stays on the castle unless an album is open.
5. **Stage its best moment** in `docs/readme/tools/scenes.mjs` (`stage()`) if it goes in the README.

In any other project, steps 1 to 3 are the whole job: call `runPlace(canvas, 'name', {who, seated, walking})`. See `../assets/starter.html`.

## The worlds

**Castle** (night, violet; the guy walks the wall). `gallery/castle.png`
- **Light:** moon on the right at (262, 28); every stone and ridge lit from that side. Warm windows and torches are the accent.
- **Layers:** sky, stars, clouds; mountains (.04), ridge (.08), keep (.18), mist, wall (1), walker, torches in front. All wrapping.
- **Moves:** windows lit and put out over minutes, pennants in the wind, flames.
- **Rare:** dragon crossing the moon, comet, black cat on the wall. Reads while walking.

**Rainy office** (night, plum and navy; the girl at her desk). `gallery/office.png`
- **Light:** amber lamp, teal monitor, string of bulbs. The moon's only in the window.
- **Layers:** sky and city seen through the window, room, things outside clipped to the window, rain on the glass, window bars redrawn, lamp cone, person, cat.
- **Moves:** beads running down the glass, far windows, headlights, steam, a monitor's bars with the music.
- **Rare:** plane, lightning. The cat comes down from the shelf and sits on the keyboard.

**Coffee shop** (day inside, warm brown; the guy in a booth). `gallery/cafe.png`
- **Light:** pendant lamps; blue daylight from the street. It's one of the warmest and calmest scenes because the street does the moving.
- **Moves:** clouds and people in the window, barista, steam, a wall clock showing the real time, cat on the ledge, a chalkboard with the music on it.
- **Rare:** car, bus, cyclist (it's a street, so they come often). Sips from a mug that's otherwise on the table.

**Garden** (morning; the girl on a crate). `gallery/people-life.png`
- **Light:** sun up on the left. Lawn in shade along the fence.
- **Layers:** sky, far crowns over the fence, fence and shed, lawn, hedge of roses, lavender, border flowers, sunflowers, vegetable beds, person, birds, bugs, green fronds.
- **Moves:** everything in the wind, bees, butterflies, birds landing on picket tops.
- **Rare:** squirrel along the fence. A butterfly comes to her finger.

**Campfire** (night, navy; the guy on a log). `gallery/light-campfire.png`
- **Light:** moon, high on the left, silvers the trees. Fire at (208, 122) warms what's within 92 pixels. Clouds crossing the moon dim everything.
- **Layers:** sky; far pines, a dark band, near pines; lawn, tent, log, fire pit, huge black pines at the edges; owl; animals; fire; person; grass; fronds.
- **Moves:** stars, moon, clouds, fire, owl, fireflies, eyes in the dark.
- **Rare:** three lanes: sky (comet, bats, owl), edge (fox, deer), near (rabbit). Roasts a marshmallow that may catch fire; opens a laptop.

**Lake** (night, deep blue; the girl on a dock). `gallery/lake.png`
- **Light:** moon on the right, its road on the water; one warm lamp at the end of the dock.
- **Layers:** sky; far hills, a keep with one window, pines, water gradient, reflection, lily pads, dock; `cutTo` to let the sky through. Over that: clouds in the water, the moon's road, ripples, fireflies, reeds.
- **Rare:** comet, bats; ducklings, frog, heron. Fishes with a catch and release; skips stones.

**Park** (day; the guy on a bench). `gallery/light-park.png`
- **Light:** sun high on the right, so shade falls left of each trunk. Clouds drop shadows on the lawn.
- **Layers:** sky; far hill with observatory and hazy trees; lawn with tree shade, path; edge grass; `front` (trunks, bench, lamp); crowns; flowers; petals; birds; person; strollers; near grass; plum fronds.
- **Moves:** wind, falling petals, flowers along the front that grow with the music.
- **Rare:** kite, lost balloon, squirrel. Feeds pigeons, and they come to the crumbs.

**Beach** (sunset; the girl walking). `gallery/whale.png`
- **Light:** low sun dead ahead, on the horizon; clouds lit from below; surf takes its colour near the sun.
- **Layers:** sky, clouds, far shore, sea, road of light, swells, boats, sea creatures, things in water, sand in bands, surf, litter, footprints, things on sand, sand animals, blown sand, walker, dunes with grass, palms.
- **Moves:** by depth (`beachF`), on a 1500-pixel loop: pier, jetty, lifeguard's tower, parasol, surfboards, rowboat, sandcastle, bonfire.
- **Rare:** sky (pelicans), sea (whale, dolphins), sand (crab, sandpipers). Takes a photo; shades their eyes to watch the whale.
