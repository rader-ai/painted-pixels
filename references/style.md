# The style guide

What this style looks like, in one place. Read this first, then open the two sheets with the Read tool: they're worth more than the words.

- `../assets/gallery/style-do-dont.png`: not this, and this. The same things from Lofi Studio's own history, then and now.
- `../assets/gallery/style-palettes.png`: all eight worlds, each with its colours, by how much of the frame they cover.

`rules.md` is the checklist, and `validation.md` is how to run it. The other guides explain how to paint each thing.

## In one sentence

Hi-bit pixel art drawn entirely in code: small pixels, deep colour, and a place you could stay in for an hour.

## What it is, and what it isn't

| It is | It isn't |
|---|---|
| Cozy, quiet and lived in | Busy, neon or arcade |
| Small pixels with deep colour, like Owlboy | Chunky 8-bit with a dozen flat colours |
| Lit from somewhere you can point to | Evenly lit, or glowing all over |
| Soft through dither | Soft through blur |
| Still until something moves it | Everything swaying on a sine wave |
| Small human moments | Bouncing to the beat |
| Now and then, something you didn't expect | Constant spectacle |
| Many small lit parts, shaded as one form | Balls, spheres, stickers |
| Built things with a form, and something on them | A box with a colour in it |

## Five ideas that decide everything else

1. **A place, not a picture.** Someone should be able to stay for an hour.
2. **Light first.** Say where it is before you paint, and let everything read from that.
3. **Build from many small lit parts, and shade the whole as one form.** A tree is a thousand leaves and one crown.
4. **Quiet next to busy.** Detail needs somewhere plain beside it. The more ambitious the scene, the more you leave out.
5. **Rare is rare.** Seeing a whale should feel like luck.

## The grid

| | |
|---|---|
| Scene grid | 320×150. Layouts and backgrounds think in these |
| Canvas | 640×300, twice the grid (`HD = 2`) |
| Smallest mark | One canvas pixel. Scenery is usually two, and people and sprites use one |
| Shown at | A whole number of device pixels to the art pixel, with no smoothing |
| Wider worlds | Change `SW`. A phone crops to the middle, larger, rather than shrinking the lot |

**Things are this big,** in canvas pixels. Keep them in scale, or say why you didn't.

| Person | Cat | Fox | Deer | Bird | Crab | Rabbit | Dolphin | Whale |
|---|---|---|---|---|---|---|---|---|
| 24×41 | 24×16 | 26×14 | 32×28 | 15×11 | 16×10 | 12×10 | 25×9 | 90×38 (too big on purpose: it's the moment people remember) |

## Colour

**A colour is a ramp, and the hue moves along it.** Use 4 to 7 steps. Shadows lean blue or purple, and lights lean warm. Never multiply a colour to darken it.

**The dark has a colour.** The darkest thing in each of our worlds is a tinted near-black, like `#040518` at the lake or `#22143a` on the beach. Shadows are drawn in the place's `ink`, which comes from its sky.

**One family, and one accent.** The accent is almost always the light, and warm sits against cool. Spend a saturated colour carefully: the red pennants on the castle and the orange tent at the campfire are the only strong colours there that aren't light.

**What good measures.** These are the eight worlds, as the validator sees them. They aren't targets to hit, but if yours is far outside them, look at why.

| World | Family, and accent | Colours | Hue shift | Biggest flat patch | Darkest, brightest | Warm pixels |
|---|---|---|---|---|---|---|
| Castle | Violet night, warm windows | 1,907 | 11° | 2.7% | `#07040f`, `#c0aee8` | 2% |
| Rainy office | Plum and navy, amber lamp | 3,933 | 23° | 2.7% | `#08050b`, `#6e482a` | 24% |
| Corner booth | Warm brown, blue daylight | 2,454 | 16° | 1.7% | `#12090b`, `#619cd8` | 80% |
| Garden | Greens and morning blue, gold sun | 809 | 27° | 2.4% | `#0c1618`, `#d9dae0` | 21% |
| Campfire | Navy, orange fire | 2,389 | 12° | 2.3% | `#020408`, `#6a7cac` | 10% |
| Lake | Deep blue, silver moon | 2,457 | 9° | 1.5% | `#02040e`, `#6678a7` | 2% |
| Park | Greens and sky, pink blossom | 465 | 19° | 2.8% | `#160c12`, `#ffffff` | 8% |
| Beach | Violet sea, gold sun | 1,708 | 25° | 1.7% | `#22143a`, `#fff6fb` | 41% |

Brightest here means the brightest of the 48 colours covering the most frame, so the real sparks go higher. Notice how little warm there is at night: a few percent of warm is what makes it feel like firelight.

More in `look.md`, including the ramps the kit comes with.

## Soft things

**Dither is the only soft we have.** An ordered 4×4 Bayer pattern (`bay`) carries gradients, glows, fading edges and dissolves. A glow is 5 or 6 stepped levels, not a smooth airbrush. Keep the two colours close: if you can see a crosshatch at phone size, they're too far apart. For organic edges, add noise to it.

## Edges

| Thing | Edge |
|---|---|
| People, creatures, flying birds | A dark tinted outline, like `#1a1020` |
| Thin parts: legs, beaks, whiskers | No outline, or they turn into bars |
| Inside a shape | A darker version of its own colour, not ink |
| Trees, clouds, hills, buildings | None. Their form comes from light and shade. An outlined cloud is a sticker |
| Anything far away | None. Nothing that far off has an edge that sharp |

## Light

Four kinds in any scene: the **key** (the sun or moon, which sets the shape of everything), the **sky** (the colour of the dark), **local** lights (a fire, a lamp, which reach only so far), and **bounce** (warm sand under a sunset). A high cool key and a low warm local light is the usual pairing. See `light.md`.

## Depth

| Distance | Colour | Detail | Motion |
|---|---|---|---|
| Very far | Close to the sky, 2 to 4 colours | Silhouette, one rim of light | Barely any |
| Far | Hazy, low contrast | Clumps only | None |
| Middle | The full ramps | Leaves, wood grain, stones | Wind |
| Near | Rich and bright where lit | Separate blades | Quickest sway |
| Very near | Nearly black, one rim | Silhouette again | Passes fastest |

## Motion

| Thing | Pace |
|---|---|
| The wind | Calm about 80% of the time. A gust rolls across at 50 to 120 grid pixels a second |
| A breath | About 4 seconds, one pixel |
| A blink | Every 2 to 6.5 seconds |
| Something a person does | After a pause of 6 to 13 seconds |
| A cloud's shape | Visibly different after 10 to 25 seconds |
| A lit window | On for 2 to 5 minutes, off for 40 seconds to 2 minutes |
| A rare sight | Every 6 seconds to 1.5 minutes, depending on what it is |

**How much moves.** In a run of 24 seconds, between 8% and 49% of the frame moved at some point in a world where nobody walks, and at any one moment it's under 2% of the frame, usually much less. In a world where someone walks, about 80% of the frame passes by. See `depth-and-motion.md`.

## People

Someone in a hoodie with headphones, 24×41 canvas pixels, seen in profile, quarter or front. Up close they're simple: a mouth is 2 or 3 pixels, and a hand is a solid block. Gestures read through the silhouette, so a hand goes above the head, not across the chest. See `people.md`.

## Around the scene

When a scene sits in a page, `../assets/dress.css` gives you the rest of the look: the colours, panels, buttons and stat bars from Lofi Studio. The validator's status screen is built the same way, and it's a good example of how they sit together.

| Token | Colour | For |
|---|---|---|
| `--pp-ink` | `#07040f` | The darkest edge, and text on bright buttons |
| `--pp-night`, `--pp-stone`, `--pp-stone2` | `#120c28`, `#1d1640`, `#2a2058` | Page, panel, raised panel |
| `--pp-edge`, `--pp-edge2` | `#5b4a9e`, `#8a78d6` | Borders |
| `--pp-text`, `--pp-muted` | `#ece6ff`, `#a79dd6` | Text |
| `--pp-gold`, `--pp-torch`, `--pp-torch2` | `#f5c542`, `#e8692c`, `#ffb347` | Titles and main actions |
| `--pp-teal`, `--pp-blood` | `#4fd1c5`, `#c2334d` | Good, bad |

- **Corners are square.** Depth comes from rings of solid colour, never a soft shadow or a radius.
- **Press Start 2P** for titles and short labels, and **VT323** for small text in the interface. Both are in `../assets/fonts/`, under the SIL Open Font License. Don't set anything long in them. For real reading, use a warm, sturdy serif at a comfortable size, such as Alegreya.
- **Icons** are squares on an 8×8 grid, in an SVG with `shape-rendering: crispEdges`.
- **Big titles can be painted like the worlds.** Set the type small, throw away anything that isn't solid, then shade it along a ramp with ordered dither, light it from one side, ink its edge, and give it a thinning dithered shadow.
- **Melt into the page.** Paint the nearest ground in the page's background colour, so that the scene has no bottom edge.
- **Motion on the page answers the person.** The scene already has a life of its own, so the page around it can stay still.

If the page is someone else's, with its own design system, that wins. The scene still follows the rule book.

## How we talk

See `voice.md`. It applies whenever you're using this skill.
