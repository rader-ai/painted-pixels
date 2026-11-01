# Water: mirrors, roads of light, surf

Water isn't a colour. It's whatever is above it, moved around a little.

## Still water

Look at `../assets/gallery/lake.png`, and at `before-lake.png` for what a ruled shore looks like.

1. **Paint everything that stands above the water first**, so there's something to reflect. Then `p.reflect(yLine, depth, tint, strength)` mirrors it downward row by row, mixing toward the water's tint and shifting each row sideways by a little for ripple. For a shore that isn't straight, which is nearly all of them, do the same a column at a time, about whichever shore is nearest in that column: see below.
2. Paint the water's own colour first as a `p.sky` gradient (lighter near the far shore), then the reflection over it, then a scatter of faint short horizontal lines.
3. Remember to cut the bare sky back out with `p.snapshot` and `p.cutTo`, so the real moving sky shows behind.

**The far shore isn't a line.** A row of trees all rooted on one row, with the water starting under them, looks like a ruled edge however good the trees are. In the lake (`LAKE_FAR`, `LAKE_LAND`, `lakeShore`, `lakeLand`):

- The far shore runs in and out in bays, and its bank has a top edge of its own. Our first try left that top on one row, and it showed as a line right across the picture.
- Nearer land stands in front of it: a wooded point on each side and a small island, with bigger, darker trees and rocks at the waterline. That's what gives you distance over the water.
- Each one comes out from the far shore and goes back to it gradually, because the mirror line jumps wherever the shore does. An island with a flat edge had a reflection with square corners.
- A little mist on the far water lifts the near land off it.
- Keep what the moon's put on the water's edge dim and broken. A continuous bright thread looks like a line someone drew.

**Land and docks go over the water's moving light.** Moon roads, ripples and rain rings are drawn over the water every frame, so paint what stands in it twice: once underneath, to be mirrored, and once in `front`, over all of that. Otherwise ripples run across the dock's posts and rain lands on the trees.

**Clouds move, so their reflection has to as well:** pass `mirror: true` to `cloudDeck` and draw `c.mir`, clipped to the water, with `globalCompositeOperation = 'lighter'` and a low alpha like .1. Plain alpha turned them into dark lumps on the lake, and a clean flipped copy looks like a second sky. The open sea does this too.

**Anything on the water gets a reflection,** starting at its waterline: `mirrorRows(k, cv, X, waterY, alpha, t, n)`. A duck, a boat, the pier. Work out where a reflection would really land first: someone sitting on the dock is high enough above the water that theirs would fall below the frame, so we don't draw one.

**The road of light** under a moon, sun or lamp: a stack of thin horizontal bars straight below the light, each with its own width and a little sideways wobble. It's one of the most satisfying details in a night scene, and it costs almost nothing. The moon's road dims when a cloud covers the moon. On the lake and the beach its width follows the music, which is one of the few places the music is allowed to touch the world, because water doing that looks like shimmer rather than a beat.

**Lily pads** (`LAKE_PADS`, `lilyPad`, `drawLilies`) aren't scattered. They grow in colonies where it's shallow, by the reeds and the near shore, smaller and flatter the farther off they are. From low down each one's nearly a line: a notch, a pale far rim that holds the sky, and a dark near edge where it meets the water. At night the buds are closed, and a flower or two has stayed open. They shift a pixel in a gust, and a frog hops to a pad near it, not across the lake.

**Small life on it:** ripples that drift with the wind, reeds at the edge (`reedBed`, `drawReeds`), a fish that jumps and leaves rings (`fishJumps`), ducks, a frog, a heron. Rings are drawn as flat ellipses, a third as tall as wide, because you're looking at the water from low down.

## The open sea

Stack these from the horizon toward the shore:

- A far shore, barely moving as you walk, with one bright rim.
- A gradient, lightest at the horizon.
- **Swells:** long thin lines rolling toward us, getting closer together and stronger as they come (`y = horizon + span * d * d`). Fixed sets of lines moving down the screen look like scrolling; this curve gives them perspective.
- The road of light, and a few sparkles that flash at random.

## Surf

**Foam, not a line going up and down.** That was the feedback on the first version, and `../assets/gallery/before-beach.png` shows why. Look at `../assets/gallery/surf-over-time.png` and `surf-close.png`.

A wave has a whole life, and `drawSurf` paints each stage:

1. **It stands up.** Out in the shallows, a white crest appears with a dark face under it, then rolls in.
2. **It rushes up the sand** as a thin sheet. The front moves quickly and then slows: `1 - (1 - e) * (1 - e)`.
3. **Froth at the leading edge.** A thick white rim of uneven width, frayed with dither behind it, then breaking up into **lace**.
4. **Lace** is the network you see on foam: the borders between flattened cells (a Worley-noise table, `SURF.lace`), with stretches worn away so that it isn't a net. It drifts with the sheet and thins with age.
5. **It slides back,** slower than it came: `(1 - e) ** 1.7`.
6. **It leaves the sand dark and wet,** with bubbles still on it, and that fades over a few seconds. The wet mark only ever covers where the water has been. Our first version painted wet sand ahead of the wave, with vertical edges where it ended.

**Why it doesn't look mechanical:**

- Three waves on their own clocks (`T` of 8.3, 11.7 and 6.9 seconds), overlapping. Their periods share no neat ratio.
- Each one arrives at a slant, so one part of the beach is rising as another falls. Keep the slant small, or the crest lines go visibly diagonal.
- Reach varies along the shore with noise, and so does the timing.
- The foam takes the sun's colour near the sun's column, and it's white elsewhere.

**It's painted a pixel at a time, every frame,** into a `Uint32Array` for one band across the shore, 640×100. Only the clouds get that treatment too, and a band that size costs about a millisecond. Everything expensive is precomputed: the lace table and a noise table (`n1`) in place of computing noise per pixel. If you want per-pixel water, restrict the band, precompute the noise, and measure.

**Birds and wet sand go together:** sandpipers run up and down the wet sand on a slow swing, their legs a blur. See `creatures.md`.

## Rain on water

`outdoorRain` with a `'water'` band gives you rings. See `sky.md`.

## Things in water

Anything standing in water needs a dim reflection or a dark band where it meets the surface (`p.rect(x, 134, 2, 10, 'rgba(40,30,30,.45)')` under a dock post). A jumping animal has to be **clipped at the waterline** so it comes out of the water rather than floating in front of it: `g.rect(0, 0, DW, waterY * HD); g.clip()`. See `dolphinSight` and `whaleSight`.
