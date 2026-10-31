# Water: mirrors, roads of light, surf

Water isn't a colour. It's whatever is above it, moved around a little.

## Still water

Look at `../assets/gallery/lake.png`.

1. **Paint everything that stands above the water first**, so there's something to reflect. Then `p.reflect(yLine, depth, tint, strength)` mirrors it downward row by row, mixing toward the water's tint and shifting each row sideways by a little for ripple.
2. Paint the water's own colour first as a `p.sky` gradient (lighter near the far shore), then the reflection over it, then a scatter of faint short horizontal lines.
3. Remember to cut the bare sky back out with `p.snapshot` and `p.cutTo`, so the real moving sky shows behind.

**Clouds move, so their reflection has to as well:** draw each cloud's canvas (`c.cv`) flipped around the horizon, clipped to the water, with `globalCompositeOperation = 'lighter'` and a low alpha like .1. Plain alpha turned them into dark lumps on the lake. The open sea does this too.

**Anything on the water gets a reflection,** starting at its waterline: `mirrorRows(k, cv, X, waterY, alpha, t, n)`. A duck, a boat, the pier. Work out where a reflection would really land first: someone sitting on the dock is high enough above the water that theirs would fall below the frame, so we don't draw one.

**The road of light** under a moon, sun or lamp: a stack of thin horizontal bars straight below the light, each with its own width and a little sideways wobble. It's one of the most satisfying details in a night scene, and it costs almost nothing. The moon's road dims when a cloud covers the moon. On the lake and the beach its width follows the music, which is one of the few places the music is allowed to touch the world, because water doing that looks like shimmer rather than a beat.

**Small life on it:** lily pads (dark ellipses, a lit top, the odd flower), ripples that drift with the wind, reeds at the edge (`reedBed`, `drawReeds`), a fish that jumps and leaves rings (`fishJumps`), ducks, a frog, a heron. Rings are drawn as flat ellipses, a third as tall as wide, because you're looking at the water from low down.

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

**It's painted a pixel at a time,** into a `Uint32Array` for one band across the shore, 640×100. That's the one element in the app done this way, and a band that size costs about a millisecond. Everything expensive is precomputed: the lace table and a noise table (`n1`) in place of computing noise per pixel. If you want per-pixel water, restrict the band, precompute the noise, and measure.

**Birds and wet sand go together:** sandpipers run down after each wave and back from the next. See `creatures.md`.

## Rain on water

`outdoorRain` with a `'water'` band gives you rings. See `sky.md`.

## Things in water

Anything standing in water needs a dim reflection or a dark band where it meets the surface (`p.rect(x, 134, 2, 10, 'rgba(40,30,30,.45)')` under a dock post). A jumping animal has to be **clipped at the waterline** so it comes out of the water rather than floating in front of it: `g.rect(0, 0, DW, waterY * HD); g.clip()`. See `dolphinSight` and `whaleSight`.
