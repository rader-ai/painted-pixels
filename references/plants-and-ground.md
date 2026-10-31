# Plants and ground: trees, grass, flowers, earth, sand

Everything here is built from small things that each catch the light: a crown from leaves, a lawn from blades, sand from speckle. When it's built from a big shape with noise on top, it looks like a texture.

## Trees

**A crown is a mass of leaf clumps held up by real limbs. Not balls on a stick.**

Look at `../assets/gallery/tree-crowns.png` next to `../assets/gallery/before-trees.png`. The feedback on the early version: "the trees just look like balls/spheres connected... they don't feel like they are coming from one source."

- **Leaves:** each clump (`leafClump`) is a pile of small leaves, and each leaf is lit on its own. So sunlit clumps glitter with lime highlights over dark seams, and the shaded side settles into deep teal.
- **One form:** clumps on the sunny side of the crown are a touch brighter and those on the far side darker (`shadeClumps`), so the crown reads as one lit shape.
- **One source:** a curved trunk with a root flare, a leader running up into the top lobe, side limbs leaving the trunk at staggered heights, twigs inside the lobes. Sky and branches show through the gaps between lobes. Those gaps are what stop it looking like broccoli.
- **No floaters:** a clump that touches nothing is pulled in toward the middle (`crownClumps` does this).

```js
const tree = treeModel({x: 252, y: 112, h: 21, rx: 28, ry: 18, pal: PAL_BLOSS, pal2: PAL_BLOSS2, seed: 5, lean: -2, sun: 1});
paintTree(p, tree);                    // in bg or front, painted once: shade, roots, limbs, trunk
drawClumps(k, tree.clumps, t, still);  // every frame: leaves, so they can sway
```

`sun` is -1 for light from the left, 1 from the right, and it must match the place. Tops of crowns sway most, and the leaves are drawn after the trunk so they pass in front.

A trunk's shade falls on the lawn, on the side away from the sun: pass it through `p.lawn`'s `light(x, y)` (see `park.bg`). A thin thing like a lamp post throws a long thin shadow, which you can paint with `line`.

**At night**, don't use the daylight palettes. `paintTree` always uses `PAL_BARK`, which glows warm in the dark. Stroke the limbs yourself in a night ramp, and pick a moonlit leaf palette:

```js
const BARK_NIGHT = ['#06080e', '#0c1018', '#141a26', '#1e2838', '#2e3c52'].map(rgb);
for (const part of [...tree.branches, ...tree.roots, tree.trunk]) stroke(p, part, BARK_NIGHT, -1);
```

**Relatives:** `bushModel` (a low crown on the ground), `hedgeModel` (a back and front row, with `blooms` for roses), `p.leaves` (a patch that doesn't sway, for ivy), `p.strands` (hanging vines).

**Far trees:** `paintFarTrees(p, x0, x1, base, PAL_FAR, seed, sun)`. Mounds and a few taller stacks, in a hazy colour close to the sky, painted into the background. They don't sway. Nothing that far away visibly moves.

## Pines

`p.pine(x, baseY, height, ramp, seed, {moon, fire, sun})`: overlapping tiers, each wider than the one above, with a ragged lower edge of drooping needles. Each tier is lit along its top and darker where the next one tucks under it. Look at `../assets/gallery/pines-moonlit.png`.

A forest is rows at different depths: a far row that's paler and bluer, a dark band under it so that no sky shows between trunks, a near row that's darker, and a couple of huge black ones at the frame's edges. That dark band exists because sky showing through at the foot of the trees once looked like a row of odd little arrows along the treeline.

## Grass

**A lawn is thousands of little fans of blades, planted back to front, not a green texture.**

Look at `../assets/gallery/grass-flowers.png`.

`p.lawn(edge, cols, seed, opts)` paints the lawn's body: tiny V's at the back, big two-tone fans at the front, nearer tufts overlapping farther ones. `edge(x)` is its top. Colour follows the light across it: `base`, `fade` (darker toward us), `swell` (gentle patches) and `light(x, y)` for shade and pools. It's painted once.

`fringe(edge, x0, x1, seed, {size, lv, depth, dense})` + `drawTufts(k, list, pal, t, still)` draws a row of blades each frame so that they can move. Use them along **edges** only, where the lawn meets something: the top of the hill, the near edge of a path, the bottom of the frame. That's where movement shows, and you can't afford to animate the whole lawn.

Grass doesn't sway constantly. **It stands still until a gust comes through.** See the wind section of `depth-and-motion.md`. Each tuft feels the gust a little earlier or later, a little harder or softer, which is built into `drawTufts`.

**Long dune grass** is its own thing (`marramSprite`): thin, long, in thick clumps on a mound.

**If someone walks, grass in the foreground has to go past them.** "We are forever walking toward the grass, but it never gets closer" was a real bug: a fixed strip of grass in the foreground of a walking scene. The near ground has to move faster than the walker (see `depth-and-motion.md`).

## Flowers

`flowerPatches(x0, x1, y0, y1, n, kinds, seed, {avoid})` + `drawFlowers`. Five round petals around a heart, a darker crease between each pair, and the petals away from the light in shade. `FLOWER_KINDS`: daisy, peach, pink, blue, butter, poppy.

- They grow in **patches of one kind**, not an even sprinkle.
- They're **bigger toward the front**.
- `avoid(x, y)` keeps them out from under benches and trunks. A flower growing through a bench is the kind of thing people spot.
- A row of little coloured dots along the bottom of the lawn looks like a border of Christmas lights (see `../assets/gallery/before-trees.png`). Don't.

A garden also wants tall things that aren't flowers on a stem: sunflowers on long stalks, lavender as a stack of dots, a climbing rose in a hedge. And things working the flowers: bees and butterflies (see `creatures.md`).

## Close-up leaves

`drawFronds(k, t, still, pal, seeds)`: long blades arcing up out of both bottom corners, nearly black, with one lit upper edge and a dark rib. For one corner only, draw `frondSprite(lean, pal, seed)` yourself. Almost every outdoor scene has them. They're the cheapest way to add depth there is, and they move with the wind. Pick the palette for the place: `PAL_FROND`, `_NIGHT`, `_GREEN`, `_DUSK`.

## Earth, paths and stones

- `p.soil`: a dark bed scattered with lit clods and the odd pebble. Not noise.
- `p.hill(fn, cols, seed, {rim, depth, rough, blades, sunX})`: a ridge. `fn(x)` is its height. Keep these functions around, so what stands on the hill can use them too.
- A **path** is a texture with a lighter worn stretch down the middle and a darker lip where the grass meets it, plus some speckle. Grass hangs over its near edge.
- **Stones** are two ellipses plus a highlight, with a flat dark shadow under them.

## Snow

There's no snow brush in the kit. `assets/examples/cabin.html` paints a whole snowy scene, so read how it does it. What matters most:

- **Snow takes the colour of its light.** It's the clearest case of a ramp belonging to a light: peach where the last sun reaches, blue in shade, gold in a lantern's pool. It's never just white.
- **It sits on top of things:** a rounded, overhanging layer on every upward surface (roofs, boughs, fence rails, the top of a post), with a blue shadow under the lip.
- **A path shows someone lives here:** a trodden trough to the door, darker and bluer than the drifts on either side.
- **Falling snow** is sparse, slow and in no hurry, and it moves with `WIND(x)`. Nearer flakes are bigger and quicker.

## Mountains

`p.hill(fn, cols, seed, {sunX})` lights a ridge by its slopes: whatever faces the light catches it, and whatever faces away falls into shade. For real peaks that isn't enough. A mountain needs a lit face and a shaded face, split along a jagged ridge line, with the snow and rock broken up across both, and its colour moves toward the sky with distance. See the example, which has low sun catching only the highest peaks.

## Sand

`paintBeachSand`: noise, speckle and little ripples the wind has left, damp and darker toward the water. It's a wide wrapping layer, drawn in bands that each scroll at their own speed (see `depth-and-motion.md`). Scatter what the sea leaves behind: shells, a starfish, seaweed, pebbles, driftwood. Early sand looked like gravel because the speckle was too strong and too even.

Footprints stay where a foot came down, and fade: a fixed mark in the ground, placed by the walk's own step count, so it passes behind the walker at ground speed.
