# The sky: gradient, stars, moon, clouds, weather

The sky is its own layer, so that it can keep moving behind everything else. A place has a `sky(p)` painter for what never changes and draws everything that moves over it each frame, then lays the land on top of that:

```js
k.img(placeSky('forest'), 0, 0);      // painted once: the gradient
starField(...); moonOrb(...); cloudDeck(...); rare(...);
k.img(placeBg('forest'), 0, 0);       // painted once, transparent where the sky shows through
```

`bg` starts out transparent, so you can just leave the sky out of it. When something has to be painted over the sky first (a lake's reflection needs the sky to reflect), take `p.snapshot()` after the sky, and call `p.cutTo(bare, maxY)` afterwards to remove whatever is still bare sky.

## Gradient

`p.sky(colours, y0, y1)`: 6 to 8 colours, top to bottom, with dithered steps between them. The horizon is always lighter and warmer than the top, day or night. A night sky is not black: the forest goes from `#02041a` to `#1a2652`. A sunset is a long journey: deep violet, plum, rose, coral, orange, gold.

A very faint **river of stars** can be painted into the sky layer: a diagonal band with noise, at a strength of about .05. You shouldn't really see it, only feel that the sky has depth. See the top of `forest.sky`.

## Stars

`starField(k, t, key, n, maxY, seed, creep)`. Each star has its own twinkle speed; some twinkle hard and most hardly at all. The brightest get a tiny cross. The whole field creeps slowly round, so that if you come back later the sky has moved.

Drawn before the clouds, and only above the horizon. If a star shows in front of a cloud or a mountain, the layer order is wrong.

The feedback that led to this was "no stars or comets, no twinkle or cloud movement, the moon stays the same". A night sky that doesn't change makes a scene feel like a picture.

## Moon and sun

- `moonOrb(k, x, y, r, glow)` draws a shaded disc with craters and a two-part dithered glow. It drifts very slowly on a long loop: `60 + Math.sin(t / 260) * 7`. The trees are lit from where the moon sits, so keep the drift small or they'd stop agreeing.
- The glow dims when a cloud really covers it.
- A **sun** is a pale disc in a broad glow (`p.glow` + `p.circle`, in `sky`). A low sun is cut into bands near the horizon, with faint rays in the haze (`sunRays`), and its glare washes out the hills nearest it.
- When someone walks, the sun doesn't move, because it's so far away. The moon and clouds only move on their own.

## Clouds

**A cloud isn't a shape. It's thickness that keeps changing.** Look at `../assets/gallery/clouds.png`, and at `clouds-over-time.png` for how they change.

This took a long time to get right, and each version taught us something:

1. **A pile of circles,** each shaded like its own ball: "too many spheres attached together".
2. **One mass over a flat base,** shaded as a whole. Better, but: "more wispy, less consistent, less full circles, less flat on the bottom. They need to morph and change and dissipate or increase, like clouds do". Anything painted once and moved around can't do that, however good the painting.
3. **Density, repainted a few times a second.** That's what we have now.

**How it works** (`cloudDeck`, `newCloud`, `cloudDensity`, `cloudShade`):

- **Density:** each cloud is a small field of numbers. A rough outline says how much cloud there is where: a lumpy top, an uneven underside and a middle that wanders, so nothing lines up along one row. Then noise is added on top, strongly enough to tear the outline apart.
- **Change:** the noise is two layers sliding through each other in opposite directions, with a third slowly pushing one of them around, which curdles the edge instead of just waving it. No single pattern is ever seen moving, so the cloud seems to boil and reshape rather than scroll.
- **Its life:** a cloud has an age. Young or dying, it has less density to go round, so only its thickest parts show, and those break into scraps. So it can gather from nothing, swell or thin as its size wanders, and dissolve, while another forms somewhere else. Clouds also drift in from upwind.
- **Light:** one pass from the light's side, where each pixel takes in how much cloud lies between it and the light. So the bright side is always wherever the light is, on whatever shape the cloud has at that moment. The slope of the density toward the light adds the roll inside it.
- **Thin cloud shows sky:** strength is rounded to five levels and dithered, so a wisp's colour blends with whatever sky is behind it.

**The kinds, which share a sky.** Variety is most of what makes a sky look real.

| Kind | Looks like | Used for |
|---|---|---|
| `puff` | Heaped, lumpy on top, uneven below | The big shapes |
| `bank` | A long low layer, broken along the top, ragged underneath | Sunset and night layers |
| `wisp` | Long thin streaks along a curve, sometimes with a hook at the end | High up, and always somewhere |
| `tuft` | A scrap | Short-lived; gives you something changing all the time |

```js
cloudDeck(k, t, dt, 'forestClouds', {mix: [.2, .3, .4, .1], n: 5, y0: 2, y1: 34, w0: 56, w1: 130, speed: 1.3,
  cols: C_MOONLIT, seed: 5, tall: .14, moon: {x: mx, y: my, r: 7}});
```

- `mix` is the share of puff, bank, wisp and tuft. Days can take more puffs; nights and sunsets want more banks and wisps. The default is `[.34, .2, .34, .12]`.
- `speed` is in grid pixels a second, and it's slow: 1 to 2.
- `parallax` is how much walking moves them, and it's tiny: .012 to .02.
- `tall` (height for width) sets the mood: .24 is a fat summer cloud, .12 a long thin night bank.
- `moon: {x, y, r}` or `sun: {x, y, r}` lights each cloud from wherever the source hangs, so one left of the sun is lit on its right and one right of it on its left. Thin edges shine with a dark heart close by, and the moon dims with distance. It returns how much of the source is really covered, so pass that to `skyDim` and the land dims with it.
- For a sun below the clouds, pass `light`: `{under: 1, sunX: 160}` at sunset.
- Use `C_DAY`, `C_SUNSET` or `C_MOONLIT`. Palette and light go together.

**Each cloud is on its own little canvas** (`c.cv`), so a lake can draw it flipped for its reflection, and `cloudShadows` can throw a shadow from the thick ones.

**Cost:** one repaint is about half a millisecond on a laptop, and only one cloud repaints in any frame: whichever has waited longest. Taking them in list order starved the last ones on a slow phone, and they popped in from nothing when their turn finally came. Empty pixels skip the noise, and everything's read from precomputed tables.

**Getting the pacing right:** measure how much changes. A layer that slides by whole pixels makes 10 or 15% of the cloud's pixels change all at once, about once a second, which reads as a pulse. Everything slides by fractions of a pixel instead, read between table cells, so the same change is spread evenly: about 2% per repaint.

**Traps we fell into on the way:**

- **Long pointed tips and a crease along the middle:** top and bottom met along one straight row. Let the middle wander, and round the density through it.
- **A straight line along the bottom, again:** two separate causes. Noise pushed density past the edge of the cloud's canvas (so it now drains away before the edge). And the edge softness switched at one row, which hid everything below it on a dark sky (so it now changes gradually, following the wandering middle).
- **Noise too weak to matter:** scaled by its rare extremes, it hardly moved the outline. Scale it by its spread.
- **Rocks:** shading from the raw density looks like stone. Blur it a little first.
- **Square turrets:** value noise has a grid. Turn the sampling by about 20 degrees.
- **Mountains at sunset:** a strong sideways slope on an upward light. Keep sunset light mostly from below.

## Things that cross the sky

These are the place's rare sights; see `creatures.md`. A shooting star is quick (`shootingStars`, under a second, every 12 to 45 s). A comet is the opposite: it hangs in the sky for 40 seconds, creeping along, so that noticing it feels like a discovery (`cometSight`). Bats, an owl across the moon, a dragon far off, a plane, a kite, a lost balloon: pick what belongs to the place.

## Weather

**Rain outdoors**, `outdoorRain(k, dt, key, lands)`:

- A grey wash over everything, heaviest overhead.
- Streaks slant with the wind, and those falling nearer to us are longer and brighter.
- Each drop lands on something, and `lands` says what is at each height: `[[78, 112, 'water'], [112, 150, 'ground']]`. Spray on the ground, a ring on water.
- The wind picks up while it rains (`windy` eases toward 1.7), so everything else in the place responds without being told.

**Rain seen through a window** is different: `rainIn` for the streaks, plus slow beads running down the glass, avoiding the window bars. Clip it to the window.

Rain isn't on by default. It's a choice the person listening makes, so a place has to look right both ways.
