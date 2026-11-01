# The rule book

What a scene has to do to count as this style. `style.md` shows what the style looks like, and the guides explain how to paint it. This is the short, testable version.

`scripts/validate.mjs` reads this file. If you change a rule here, the validator changes with it, and it refuses to run if a machine rule has no check. To run it, and to see what each rank means, read `validation.md`.

**Two levels:**

- **Law:** it isn't in this style until this holds. There's no breaking a Law on purpose.
- **Custom:** a strong habit. You can break one on purpose, if you say which one and why when you hand the work over.

**Two ways of checking:**

- **Machine:** the validator measures it.
- **Eye:** it takes judgement, so you look, then tick it off in `eye.md` with a note saying what you saw. If you can't look, you can't tick.

The numbers aren't arbitrary. They were set by running the checks over Lofi Studio's own history, from the first flat versions to now, so that what people complained about fails and what they liked passes. `validation.md` has the table.

## G. Grid

| Rule | Level | The rule | Why | Check |
|---|---|---|---|---|
| G1 | Law | **Nothing is smoothed.** `imageSmoothingEnabled` is off whenever an image is scaled, and a canvas shown at another size has `image-rendering: pixelated`. | One blurred edge and it stops looking like a game. | Machine |
| G2 | Law | **No canvas call that blurs.** No `arc`, `ellipse`, curves, `stroke`, text, gradients, `rotate`, `filter` or `shadowBlur` in the art. | They all anti-alias, and in-between pixels are the first thing that breaks the look. The kit has a pixel version of each. | Machine |
| G3 | Law | **Whole pixels only.** Every rect and image lands on a whole canvas pixel. | Something at x = 10.3 smears, and shimmers as it moves. | Machine |
| G4 | Law | **No soft edges in the picture.** Across a hard step, there's no blended pixel. | This catches the blur no single call shows: a scaled canvas, a pasted photo. | Machine |
| G5 | Custom | **A whole-number scale on a real page.** On a phone, an art pixel is a whole number of device pixels. | Otherwise the dither goes uneven and blotchy. | Machine |
| G6 | Custom | **The same place every visit.** What's painted once comes out the same each time, because it's seeded. | People come back to a place. And a fix to one tree shouldn't reshuffle the forest. | Machine |

## C. Colour

| Rule | Level | The rule | Why | Check |
|---|---|---|---|---|
| C1 | Law | **No dead black.** Under .5% of the frame is pure black, and under 2% is colourless near-black. | Shadows are the colour of the sky. Pure black punches a hole in the picture. | Machine |
| C2 | Custom | **No dead grey.** Under 10% of the mid-tones are neutral grey. | Stone, metal and shadow all lean toward the light or the sky. | Machine |
| C3 | Custom | **Ramps shift hue.** The hue moves at least 6 degrees between the lights and darks of a colour. | Darkening a colour looks dead. Shadows lean blue or purple, and lights lean warm. | Machine |
| C4 | Custom | **Deep colour.** At least 300 colours in a frame. | Hi-bit means many small lit parts. A handful of colours looks like a placeholder. | Machine |
| C5 | Custom | **No flat fills.** No patch of one exact colour over 4% of the frame, and big patches cover at most 35% of it. | A flat band is something that hasn't been painted yet. | Machine |
| C6 | Custom | **One family, one accent.** You can name both, and the accent is almost always the light. Warm sits against cool. | It's what makes light feel like light, and a place feel like one place. | Eye: the colours and hues on the sheet |
| C7 | Law | **A ramp belongs to its light.** Nothing wears a daylight ramp under the moon. | Everything looks right until you step back, and then it glows. | Eye: the frame, then each material up close |

## L. Light

| Rule | Level | The rule | Why | Check |
|---|---|---|---|---|
| L1 | Law | **The light is written down first.** `LIGHTS.place` says where the key and the local lights are, and its `ink` has colour in it. | Everything reads from it, so nothing can disagree. | Machine |
| L2 | Law | **Every bright side faces the light.** Clouds, hills, trees, buildings, people, animals. | People notice when it's wrong even if they can't say why. Ours was backwards in every scene, and each tree looked fine on its own. | Eye: follow a line from the light to each thing in the frame |
| L3 | Custom | **Shadows run away from the point under the light,** in the shape of what casts them, thinning as they go. | A flat bar under everyone is the commonest way to look pasted on. | Eye: follow the line on through each thing to the ground |
| L4 | Custom | **Smooth things mirror, thin things glow, and air catches light.** | Water shows what's above it. Thin cloud shines. Rain and dust only show where light falls through them. | Eye: find what's wet, thin or in the air, and see what it does |
| L5 | Custom | **A moving thing takes the light where it is.** | A fox that warms as it reaches the fire needs no animating, and it's what makes a world solid. | Eye: `look.mjs strip` of something crossing a light |
| L6 | Custom | **Cover the source and the land answers.** It dims, moving things included, and the shadows fade. | A sky you can see changing has to change something. | Eye: find a crossing with `look.mjs probe`, then film it |

## D. Depth

| Rule | Level | The rule | Why | Check |
|---|---|---|---|---|
| D1 | Custom | **No ruled edge across the frame.** No straight seam over 90% of the width. | A ruler isn't in nature. Let things stand across it, or wobble it. | Machine |
| D2 | Custom | **It reads at phone size.** You can name the main things, and you'd know this place from a thumbnail. | The scene's a small rectangle on a phone, and people glance at it. Detail can't fix this later. | Eye: phone size on the sheet |
| D3 | Custom | **Far is pale and flat, near is rich or nearly black.** | The eye reads this falling-off as depth, even in a still frame. | Eye: the frame |
| D4 | Custom | **Everything's really in front of what it's in front of.** What's outside a window is behind everything in the room, and what walks along a tree line is behind the tent. | Rain in front of the TV, a bus in front of the booth, a walker over a torch, a bird's feet behind a bench. | Eye: film each moving thing across the frame, and follow what it passes |
| D5 | Custom | **Speed follows distance.** The near passes fastest, and the sun doesn't move. | Chosen by eye, layers feel tied together or slide. | Eye: a strip, if anything walks or scrolls |
| D6 | Custom | **No combs, no tiles, no edges that just stop.** | If you can spot a period, it isn't finished. | Eye: the suspects on the sheet, and where things end |
| D7 | Custom | **Nothing's a plain box.** At most 3% of the frame is flat rectangles, not counting sky and floor. | "Everything is ugly squares." A bus, a chair, a screen: if it's a box with a colour in it, it isn't anything yet. | Machine |

## M. Motion

| Rule | Level | The rule | Why | Check |
|---|---|---|---|---|
| M1 | Custom | **Something's alive.** At least 5% of the frame moves in a run. | It's a place, not a picture. | Machine |
| M2 | Custom | **Still until something moves it.** At most 20% of the frame moves nearly all the time, and the wind is calm at least half of the time. | Constant motion is tiring. It's what makes code-drawn scenes look like screensavers. | Machine |
| M3 | Custom | **Nothing pops.** No part of the frame makes a sudden big jump in a run. If something really is sudden, like lightning, excuse it. | Things arrive. They don't appear. | Machine |
| M4 | Law | **Nobody bounces to the beat.** | "The character bounces a lot in every scene." Anything bobbing to the beat looks cheap. | Machine |
| M5 | Custom | **The world doesn't pulse.** At most 3% of the frame jumps on a beat. | Only small things touch the beat: an LED string, a monitor's bars. | Machine |
| M6 | Law | **LED mode means steady.** At most 1% of the frame jumps on a beat with it on. | Some people need the lights not to flash. | Machine |
| M7 | Custom | **Something turns up, and rare is rare.** At least one `rare` lane, with waits of 5 seconds or more. | Ten minutes in, something should happen that you didn't expect. | Machine |
| M8 | Law | **Reduced motion means less motion.** At any moment, at most three quarters as much of the frame is changing, or under 1% of it, and it still shows a finished picture. | Some people need the scene still. | Machine |
| M9 | Law | **Everything that starts, ends.** Every rare sight and action finishes by itself. | A sprite stuck on screen forever is a real bug we shipped. | Machine |
| M10 | Custom | **When something moves, something moved it.** Wind, a step, its own small life. No sine waves on natural things. | Otherwise it's a screensaver. | Eye: what moved on the sheet, and what's moving it |

## P. People

These apply when someone's in the scene.

| Rule | Level | The rule | Why | Check |
|---|---|---|---|---|
| P1 | Custom | **You can find them in a second.** They differ from what's behind them by at least 10%. | They're tiny, and they're why you're looking. | Machine |
| P2 | Custom | **They're alive when nothing's happening.** They breathe and blink, and they do something during a run. | Small human moments, not motion. | Machine |
| P3 | Custom | **Gestures read through the silhouette.** | A hand across the chest disappears at this size. A hand above the head doesn't. | Eye: `look.mjs phone`, during an action |
| P4 | Custom | **A planted foot can't slide.** | A step is measured in the ground it covers. | Eye: `look.mjs walk`, if anyone walks |
| P5 | Law | **They belong in this light.** | If someone looks pasted on, it's nearly always the light: full daylight colour at night, or no shadow. | Eye: up close on the sheet |
| P6 | Custom | **What they do fits this place.** | Not generic things. Toast a marshmallow, fish off the dock, pet the cat that's on the keyboard. | Eye: what does `LOCAL` give them to do? |

## K. Cost

| Rule | Level | The rule | Why | Check |
|---|---|---|---|---|
| K1 | Custom | **Under 5 ms a frame on a laptop.** | It has to keep up on an older phone, with music playing. It's a rough number: the referee takes the fastest of three goes, so run it with nothing else busy. | Machine |
| K2 | Law | **Nothing grows forever.** The caches level off, and the canvas stays lit. | A cache that never stops growing doesn't throw an error. One day every canvas just goes blank. | Machine |
| K3 | Law | **It doesn't throw.** | A scene that throws stops painting, usually on somebody else's phone. | Machine |
