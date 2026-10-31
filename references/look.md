# The look: grid, colour, dither, outlines

Hi-bit pixel art: small pixels, deep colour ramps, and the richness of a game like Owlboy, painted entirely in code. It still obeys every rule of pixel art. The moment a blurred edge, an off-ramp colour or a smooth gradient gets in, it stops looking like a painted game and starts looking like a web page.

Look at `../assets/gallery/tree-crowns.png` and `../assets/gallery/light-park.png` to calibrate before reading on.

## The grid

- Scenes are laid out on a **320×150 grid** and painted at **2×**, on a **640×300 canvas** (`SW`, `SH`, `HD`, `DW`, `DH`). A half unit on the grid is one real pixel. Backgrounds think in grid units. People and sprites think in canvas pixels.
- `imageSmoothingEnabled = false` on every context, and `image-rendering: pixelated` on the canvas.
- Round every position before drawing: `Math.round(x * HD)`. A sprite drawn at x = 10.3 smears in some browsers and shimmers as it moves.
- Don't use `ctx.arc`, `lineTo`, `fillText` or `ctx.rotate` for art. All of them anti-alias, and those in-between pixels are the first thing that breaks the look. Use `p.circle`, `p.ellipse`, `k.circle`, the `line` pattern (many small rects along a path), and `tippedSprite` for rotation.

## Composition: where does the eye go?

Decide this before any detail, because detail can't fix it.

**Put the subject against the cleanest contrast in the frame.** Whoever's sitting there is 15×26 points on a phone. Their silhouette has to land on something plain and light, or plain and dark, and never on something busy. We've painted the same rooftop twice. One sat the person on a ledge, in the middle, with their head against the brightest part of the city's glow; its author lowered the horizon and added a dark park behind them to clear the way. You find them in a second. The other was a much stronger idea, with real height and an avenue falling away under their feet, but it had them at the edge against busy city, and the whole picture took longer to read.

**Big shapes first.** Block the frame as 3 to 5 flat masses, light against dark: sky, far, middle, near. Look at that at phone size. If it doesn't read as a place now, no amount of detail will make it read later.

**Quiet next to busy.** Detail needs somewhere plain beside it, and the plain parts are what let the eye rest. The more ambitious the scene, the more you have to leave out. Keep the brightest light and the strongest colour for what matters, and if something takes a sentence to explain, cut it.

**The check:** at phone size, can you name the main things in the frame? Can you find the person in a second? Could you recognise this world from a thumbnail?

## Colour ramps

**A colour is never just darkened. It moves along a ramp, and the hue moves with it: shadows lean blue or purple, lights lean warm.** That one habit does most of the work of looking painted.

```js
const R_WOOD = ['#22140f','#3a2218','#56341f','#734a2a','#93643a','#b8844e'];
const pick = (rp, v, X, Y) => rp[clampIndex(Math.floor(v * rp.length + bay(X, Y)))];
```

`pick` turns a brightness from 0 to 1 into a ramp step, with dither at the boundary. Shade with a brightness number, not with colour arithmetic. Use 4 to 7 steps. Fewer looks flat; more turns to mush at this size.

Each material has its own ramps, and **a ramp belongs to a light**. A daylight ramp under the moon breaks a scene faster than anything else: `PAL_BARK` is warm orange-brown, and a tree painted with it at night glows like it's lit by a campfire that isn't there. When a scene's light changes, make new ramps: dim them, mix them toward the scene's ambient colour, and keep a highlight in the light's own colour. `PAL_GRASS` against `PAL_GRASS_NIGHT`, and the four `PAL_FROND` variants, show how far apart they end up.

| Ramp | For |
|---|---|
| `R_LEAF`, `PAL_LEAF`, `PAL_LEAF2` | Sunlit leaves (crevice, dark, mid, light, highlight, glint) |
| `PAL_BLOSS`, `PAL_BLOSS2` | Blossom |
| `PAL_FAR` | Distant trees: hazy teal, close to the sky |
| `PAL_IVY` | Ivy on a dark wall |
| `PAL_BARK`, `R_WOOD`, `R_WOODL` | Bark, dark wood, light wood (all daylight or lamplight) |
| `R_STONE`, `R_IRON`, `R_SAND` | Stone, iron, sand |
| `PAL_GRASS`, `PAL_GRASS_NIGHT`, `PAL_DUNE` | Lawn and blades (deep, dark, mid, light, bright, tip) |
| `PAL_FROND`, `_NIGHT`, `_GREEN`, `_DUSK` | Near-black leaves close to us |
| `C_DAY`, `C_SUNSET`, `C_NIGHT`, `C_MOONLIT` | Clouds in each light |

## Each place has a key

A place has one family of colours and one accent, and the accent is almost always its light. Warm against cool is what makes the light feel like light. Name these two before painting anything.

| World | Family | Accent, and where it comes from |
|---|---|---|
| Castle | Violet night | Warm torches and windows; the moon up on the right |
| Rainy office | Dark plum room, navy window | Amber desk lamp, teal monitor |
| Coffee shop | Warm brown room | Blue daylight through the street window |
| Garden | Fresh greens, morning blue | White-gold sun, up on the left |
| Park | Greens, teal far hills | White sun, up on the right; pink blossom |
| Campfire | Navy night | Orange fire, low; silver moon, high on the left |
| Lake | Deep blue night | Silver moon on the right; one warm lamp on the dock |
| Beach | Violet sea, sunset sky | Gold sun, dead ahead, on the horizon |

A saturated accent is spent carefully. The red pennants on the castle and the orange tent at the campfire are the only strong colours that aren't light, and they work because nothing else competes.

## Dither

Ordered dither (`bay(x, y)`, a 4×4 Bayer matrix) is how anything changes gradually:

- **Gradients:** `p.sky` adds two in-between colours for each pair you give it, then dithers between them. Never use a canvas gradient for art.
- **Glows:** `p.glow` and `k.glow` round their strength to 5 or 6 levels and dither between them, so a lamp's light has the texture of pixel art rather than a smooth airbrush.
- **Ramps:** `pick` adds it at each step, so bands don't end in straight lines.
- **Edges of things that fade:** a thinning cloud, the wet sand behind a wave, mist, the shadow of a cloud on a lawn.

Keep it fine. Dither reads as texture when the two colours are close and as a screen door when they aren't. If you can see a crosshatch at phone size, the colours are too far apart.

Dither is regular, so for organic edges add noise to it, as in the wet sand's edge in `drawSurf`.

**Exceptions that use real alpha:** fading a very small particle, and cross-fading a moving sprite in or out.

## Outlines

Selective, and never pure black.

- **Outlined:** things that must read against a busy background: people, creatures, flying birds. The colour is a very dark, tinted ink like `#1a1020`, chosen to suit the scene.
- **Not outlined:** scenery. Trees, clouds, hills and buildings get their form from light and shade. An outlined cloud looks like a sticker, and that's one of the versions of the cloud we threw away.
- **Thin parts skip the outline:** legs, beaks, whiskers (the `thin` argument to `shapeSprite`). Outlined, they turn into thick black bars.
- **Inside a shape, the outline changes colour:** an arm crossing the chest is edged in darker hoodie, not ink, so it doesn't look cut out and pasted on (`sleeveEdge`).
- **Far things have no outline at all**, because nothing that far away has an edge that sharp.

## Detail follows distance

| Distance | Colour | Detail | Motion |
|---|---|---|---|
| Very far (ridges, far shore) | Close to the sky, 2 to 4 colours | Silhouette, one rim of light | Barely any |
| Far (tree lines) | Hazy, low contrast | Clumps only | None; they're too far to sway |
| Middle (the setting) | The full ramps | Individual leaves, wood grain, stones | Wind |
| Near (fringe of grass) | Rich and bright where lit | Separate blades | Quickest sway |
| Very near (frond corners, palms) | Nearly black, one rim | Silhouette again | Passes fastest |

The eye reads this falling-off as depth, even in a still frame. It also means you never need more detail than the distance calls for, which saves time and frame budget.

## Ways of making a shape

| Method | Use it for | Tool |
|---|---|---|
| Procedural painter | Anything natural or big | `painter()` methods |
| Rows of letters + a palette | Small rigid things up to about 20 pixels: a bag, a window, a bat | `p.pixels`, `rowSprite`, `k.sprite` |
| Rows, upscaled with EPX | Faces and small sprites that need smooth diagonals | `epx`, `scaled` |
| A function from a point to a colour letter | Animals and any curved creature | `shapeSprite`, with `inE`, `nearSeg` |
| Tubes through joints | Arms and legs, anything that bends | `rigTube`, `rigJoint` |
| Tipping by a few degrees | Rotating a sprite without wrecking it | `tippedSprite`, `rigHead` (upscale, rotate, sample back down) |

Long hand-typed pixel arrays are a trap: slow to write, impossible to vary and hard to light. Prefer a shape function or a painter, so a palette or a pose can change later.

## Same every time, different everywhere

Everything painted once is **seeded** (`mulberry32(seed)`, `hash2`, `vnoise`), so a scene looks the same on every visit and a fix to one tree doesn't reshuffle the forest. `Math.random` belongs only to live behaviour: when a gust comes, which way the crab runs.

Nothing should repeat visibly. Vary size, lean, spacing and shade through noise, and give repeated things a `variant`. If you can spot a period, or a row of near-identical shapes, it isn't finished. A comb of identical flames and a row of equally spaced grass tufts both failed this test.

## On a web page

When a scene lives on a real page, rather than in an app with a fixed frame:

- **Whole-number scale.** Every art pixel should be a whole number of device pixels, or the dither goes uneven: `scale = Math.round(width * devicePixelRatio / DW)`. `width: 100%` gives you 1.6 or 1.83, which looks soft and blotchy. `starter.html` does this properly. (Lofi Studio's own layout can't always manage it on phones, where the frame's size is set by the screen, and we've accepted that there.)
- **Crop rather than shrink.** A phone should see the middle of the world larger, not all of it smaller. Keep what matters in the middle, and make the world wider than most screens need.
- **Melt into the page.** Paint the nearest ground in the page's own background colour, so that the scene has no bottom edge.
- **Hold the space.** Give the canvas its height before it paints, so nothing below it jumps.
- **Rest when nobody's looking.** Stop drawing when it's off screen (`IntersectionObserver`) or the tab is hidden.
- **Reduced motion** gets a single still frame that looks finished.
- **One file:** paste `kit.js` into an inline script. That's fine.
- **Slow machines:** throttle the CPU 4 to 6 times in the browser and look at it again.

`assets/examples/cabin.html` does all of this, and `runPlace` doesn't: when you need any of it, write your own frame loop (it's short).

## Finishing touches

- `p.vignette(.4 to .55)` on night scenes and rooms, as the last call in `bg`. It pulls the eye inward and hides the corners.
- `drawFronds` in the bottom corners of outdoor scenes: the near-black framing that makes the rest feel deep.
- A shadow under everything that stands on something: a flat dark ellipse, tinted, not black. It's what glues objects to the ground.
