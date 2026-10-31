# Depth and motion: layers, walking, wind, stillness

Motion is what separates a place from a picture, and too much of it is the commonest way to ruin one. **Most things are still most of the time. When something moves, something moved it.**

## The order of a frame

Back to front, always. Written out in a comment at the top of each place, because the order is a design decision.

```
sky layer (painted once)
  stars, moon, clouds, things in the sky
far land (painted once)
  far things that move: the moving sky reflected, far boats, windows lighting
ground (painted once)
  edge grass moving
near things (painted once, the `front` layer): trunks, benches, fences
  crowns and bushes moving, flowers, birds, animals
the person
  anything nearer than them: grass at the bottom of the frame, torches on a wall
close-up leaves in the corners
rain
```

Everything that can be painted once is painted once, into `sky`, `bg` and `front`. See "Cost" below.

A question to ask of everything: **is it really in front of that?** A bird's feet on a bench are in front of the bench. A person sits in front of the log but behind the near grass. A whale is behind the pier if the pier is nearer. A torch is in front of the walker.

## Depth sets speed

When the ground moves, everything moves at the speed its distance gives it. Don't choose speeds by eye. Derive them.

On the beach, each thing's speed comes from where it stands on the sand:

```js
const beachF = y => (y - HORIZON) / 62;   // how fast ground at y passes, against the walker's feet
const beachX = (x, f) => wrap(x - scene.scroll * f);
```

| Thing | How fast it passes, relative to the feet |
|---|---|
| The sun | 0 |
| Clouds | .012 to .02, plus their own slow drift |
| Far shore | .022 |
| Things in the water | Their `beachF` |
| Sand at the walker's feet | 1 |
| Dunes and palm trees on our side | More than 1: `beachF(158)` is about 1.3 |

The castle uses fixed factors, since its layers stand at set distances: mountains .04 and .08, the keep .18, mist .3, the wall 1. It took a while to get those: originally the castle moved at nearly half the walkway's speed, and the feedback was that the two felt tied together. Now it's more than 5 times slower.

**The ground passes the walker's feet exactly.** A planted foot moves back at ground speed, so it can't slide. See `people.md`.

**A long loop, with things in it.** "You would eventually walk away from the pier, and new things would appear." The beach is a 1500-pixel loop with a pier, a jetty, a lifeguard's tower, a parasol, surfboards, a rowboat, a sandcastle, driftwood and a bonfire strung along it. Somebody walking for a few minutes should keep seeing new things.

**When they stop, it all stops.** `scene.walk` eases between 0 and 1, and everything multiplies by it. Clouds, waves and birds keep going on their own.

**Sand in bands.** A layer of ground can't scroll as one sheet if near and far are meant to pass at different speeds. The beach cuts its sand into five horizontal bands, each with its own offset.

## Wind

**One wind for the whole world.** Grass, leaves, hair, flags, flames, smoke, sand, palms, reeds, and rain all read the same `WIND(x)`, so a gust visibly travels across the scene from one thing to the next. It's the single most convincing thing in the app. Don't invent a separate sway for anything.

```js
windTick(t, dt);        // once a frame
WIND(x)                 // the wind at x right now, about -1..1 in a good gust
leanAt(x, t, gain)      // the same as a lean in half steps, -2..2, for picking a sprite
```

How it's built:

- Between gusts there's almost no wind: two very slow sines adding up to about ±.18.
- A gust is a front that rolls across at 50 to 120 grid pixels a second. As it arrives at each x, the wind there rises fast, shivers, and decays over .45 to 1.35 seconds.
- Most gusts are small, some are medium, a few are big: 62%, 31%, 7%. They come 1 to 13 seconds apart, with no rhythm.
- The wind swings round to the other direction every 70 to 230 seconds.
- While it rains, everything's multiplied by up to 1.7.

Measured: nearly calm 76 to 80% of the time, strong 7 to 9%. The feedback that led here was "it's a constant state of moving and doesn't feel like a random gust of wind is getting through it".

Sprites that lean (tufts, fronds, flowers, palms) are cached per lean, in half steps, so a gust costs nothing extra. Things drawn fresh (flags, reeds, lavender) just read `WIND(x)`.

## The stillness budget

For anything you're about to animate, ask: **what moves it, and what is it doing when nothing's moving it?**

| Moves it | Examples | Timing |
|---|---|---|
| Wind | Grass, leaves, hair, flags, smoke | As above |
| Walking | The ground, near things, footprints | At ground speed |
| Its own life | Blinks, breath, birds, bugs, clouds that gather and dissolve | Each on its own clock |
| Rare events | Comets, whales, foxes | Long waits, one at a time |
| The music | A monitor, an LED string, a road of light, a head nod, a foot tap | Small and occasional |

**Sine waves are a smell.** `Math.sin(t)` on something that's meant to be natural makes it move forever, at a constant rhythm. Use `sin` for things with a real period, like a breath, and noise (`vnoise(t * rate, id, 1, seed)`) or a state machine for anything else.

**Give every repeating thing its own clock.** Each with its own period and phase, and no shared multiples. If two things ever blink together, people notice.

**Real timings from the app, as a sense of pace:**

| Thing | Pace |
|---|---|
| A breath | About 4 seconds, one pixel |
| A blink | .13 s, every 2 to 6.5 s, and 18% of them come in doubles |
| An action (yawn, stretch) | Every 6 to 13 s |
| Castle windows | On for 2 to 5 minutes, off for 1 to 2 |
| A fire's pop | Every 3 to 14 s |
| A bird on a perch | 6 to 20 s, then off, then 6 to 20 s away |
| A cloud's shape | Visibly different after 10 to 25 seconds |
| A cloud's whole life | 1 to 5 minutes; scraps less than 1 |
| A rare sight | Every 6 s to 1.5 minutes, depending on the lane |

## The music rule

**Nothing bounces to the beat.** Characters don't bob, sunflowers don't bop, and the scene doesn't pulse. We had all of those at one point. Music touches the world only where a real thing might respond to it, and then only a little: LEDs on a string, bars on a monitor, runes on a wall, flowers along the very front that grow with the spectrum, a head nod for a few bars when a song starts.

There's one useful hidden link: on each quarter note the stride is nudged a little so that a foot lands with it (`scene.nudge`). You feel it, but you don't see it.

## Reduced motion, LED mode, covers

- `reduceMotion`: wind stops, the clock freezes for surf, rare sights don't start, and the person only blinks. Everything must still look right as a still image, and it's worth checking that it does.
- `ledMode`/`flashy()`: nothing flashes with the beat.
- `k.live`: false when a place is drawn for cover art. `rare` skips itself, so a whale doesn't appear on an album cover at random.
- Everything uses `dt`, clamped (`Math.min(.1, ...)`), so a tab coming back from the background doesn't make things jump.

## Cost

Budget: **under 5 ms a frame on a laptop** so that an older phone holds its frame rate with the audio running. The app's worlds run from about 1.5 ms (the office) to about 5 (the park, right at the limit). One measurement is shaky: run it twice with nothing else busy.

- Paint once whatever doesn't move. Painting a background is slow; drawing the finished canvas is almost free.
- Cache sprites in a `Map`, keyed by everything that changes them: `leafClump`, `tuftSprite`, `glowSprite`, `rigFrame`. One clump, a thousand times.
- Hold a limit on anything keyed by continuous values: round first (leans to half steps, poses to pixels, sprite tilts to 6 degrees), or the cache grows forever. `POSES` is an LRU of 160.
- Per-pixel work belongs only in a limited area, with noise precomputed: the surf is one band, and clouds repaint one at a time, a few times a second each.
- Key a cache by what's really drawn, in whole pixels, never by a raw float. A fire's flickering radius made a new cached glow every frame until we caught it.
- Watch out for anything that re-creates a list each frame: `pst.thing ||= fringe(...)` keeps it. A cone of light that re-painted every frame once cost 5 ms by itself, until it was cached.
- Measure with `node scripts/look.mjs perf`. Then run `soak`, which catches anything that keeps growing. A cache that never stops growing doesn't throw an error: eventually every canvas on the page just goes blank.

Keep state in `pst` (`drifting(key, n, make)` is the usual way), so each place has its own, and it survives leaving and returning.
