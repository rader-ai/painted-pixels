---
name: painted-pixels
description: Use when painting, animating or fixing pixel art in code, such as a scene, world, background, sprite, character, creature, tree, cloud, water or weather on a canvas. Use for any work on Lofi Studio's worlds, when someone wants that look in another project, when a pixel scene looks flat, static or like a painted backdrop, or when a sprite bounces, slides or looks stiff, even if they never say "pixel art".
---

# Painted Pixels

How Lofi Studio's worlds are painted: hi-bit pixel art drawn entirely in code, with the deep colour of a game like Owlboy.

**The one idea: paint a place, not a picture.** Someone should be able to stay there for an hour. So every element has to follow from the place: where the light comes from, how far away it is, what moves it, what lives here, what happens now and then, and what a person would do here.

## Start here

Paths here are from this skill's own folder, wherever it's installed.

**In any project:** copy `assets/kit.js` and `assets/starter.html` next to the page. `starter.html` is a complete small world, and it's your starting point. `kit.js` holds the whole toolkit, and `references/kit-index.md` lists all of it with line numbers, so you don't need to read it. Paint with `painter()`, and when the kit has no brush for something, write a new one on top of it. `assets/examples/cabin.html` is a whole scene made that way, with snow, mountains and a page of its own; its own code starts where `kit.js` ends. For a different shape, change `SW` and `SH` at the top of your copy of the kit. For anything on a real web page, read "On a web page" in `references/look.md`.

**Inside Lofi Studio** (`index.html`, with its `PLACES`): the toolkit's already in that file, under the same names the guides use. Paint in there.

**If you're only asked what's wrong with a scene:** look at it first, go through the questions below, and describe what's off in plain words, biggest first. Then fix it, if asked.

**A guide may name something the kit doesn't have,** like `drawSurf`, `drawFolk` or `torchLight`. That's one world's own code from Lofi Studio, and you can read it as an example at https://github.com/rader-ai/lofi-studio/blob/main/index.html.

To look at your work, run `npm install` once in `scripts/`, then use `scripts/look.mjs`. See `references/checking.md`.

## Before you paint: walk the place

Write these down as a comment at the top of the place. It takes a minute and it decides everything else.

1. **The light.** Where exactly is it, how high, and what colour? What's the second light? Write it in `LIGHTS` before anything else. See `references/light.md`.
2. **The key.** One family of colours, and one accent (usually the light).
3. **The depth.** What's far, middle, near and very near? In what order are they drawn?
4. **What moves, and what moves it?** Wind, a step, its own small life. What's it doing when nothing's moving it?
5. **What lives here?** What would turn up once in a while?
6. **What would someone do here?** Not generic things: what does this place call for?
7. **The moment.** What's the one thing you'd want to catch on screen?

Then **block the whole frame in big flat shapes** and look at it at phone size. Where does the eye go? The person should sit against the cleanest contrast in the frame, and you should be able to find them in a second. See "Composition" in `references/look.md`. Detail can't fix this later.

## For every element

Paint one element at a time, the way an artist would. For each:

1. **Read its guide and look at its gallery picture** (table below). The pictures are the target; open them with the Read tool.
2. **Answer the questions:**
   - What is it, at this size? Will its silhouette read on a phone?
   - What's lighting it? Which side is bright, and where does its shadow fall?
   - Does it reflect anything, or does anything reflect it? Does light pass through it?
   - If it moves, how does the light change on it as it goes?
   - How far away is it? That sets its contrast, detail and speed.
   - What moves it, and how much of the time is it still?
   - What's in front of it, and what's behind it?
   - Where would it repeat, and where does it end? Look for combs, tiles and ruled edges.
   - Does the rest of the world notice it? Could something react?
3. **Paint it, then look three ways:** up close at 4× or more (are these good pixels?), in a full frame (does it belong?), and at real phone size (does it read?).
4. **Say what's wrong in plain words, and fix that.** "Those look like balls on a stick." Expect more than one try: our clouds took several complete rethinks.

Then the next element. Don't move on from something that's merely fine.

## Guides

| Element | Guide | Pictures in `assets/gallery/` |
|---|---|---|
| Composition, pixels, ramps, dither, outlines, a place's colours | `references/look.md` | `tree-crowns`, `light-park` |
| **Light: where it comes from, how it behaves, what reflects it, what it does to moving things** | `references/light.md` | `light-campfire`, `light-park`, `light-beach-shadows`, `light-torch-walker`, `light-fox-firelight`, `before-campfire` |
| Gradient, stars, moon, clouds, rain | `references/sky.md` | `clouds`, `clouds-over-time`, `light-campfire` |
| Trees, pines, grass, flowers, earth, snow, mountains, sand | `references/plants-and-ground.md` | `tree-crowns`, `pines-moonlit`, `grass-flowers`, `dune-grass`, `before-trees`, `example-cabin` |
| Lakes, reflections, sea, surf | `references/water.md` | `lake`, `surf-close`, `surf-over-time`, `before-beach` |
| Stone, wood, windows, rooms, fire, flags, smoke | `references/built-things.md` | `castle`, `office`, `cafe`, `campfire` |
| Layers, walking, wind, timing, the music rule, cost | `references/depth-and-motion.md` | |
| The rig, faces, the walk, actions, props | `references/people.md` | `people-poses`, `people-walk`, `people-life`, `marshmallow` |
| Animals, behaviour, rare sights | `references/creatures.md` | `whale`, `fox`, `crab`, `birds-park` |
| Looking up close, strips, phone, cost, the tools | `references/checking.md` | |
| Everything that's gone wrong before | `references/mistakes.md` | `before-*` |
| Each world as a worked example, adding a world | `references/worlds.md` | |
| What's in the kit, with line numbers | `references/kit-index.md` | |

## What holds everywhere

| Do this | Because |
|---|---|
| Stay on the grid: integer positions, no smoothing, no anti-aliased canvas calls | One blurred edge and it stops looking like a game |
| Shade along hue-shifted ramps, with one set of ramps per light | Darkening a colour looks dead, and a daylight ramp at night glows |
| Build natural things from many small lit parts, and shade the whole as one form | Otherwise: balls, spheres, stickers |
| Build anything that changes over time so that it really can | A beautifully painted cloud that can't change is still wrong |
| Pass the light to everything as data | It's the easiest thing to get wrong, and everyone can feel it |
| Let moving things take the light where they are, with `blit`, and cast real shadows | A fox that warms as it reaches the fire needs no animating, and it's what makes a world solid |
| Check what's smooth, what's thin and what's in the air | Water mirrors, thin cloud glows, and rain and dust only show where light falls through them |
| Derive speed from depth | Chosen by eye, layers feel tied together or slide |
| Use one `WIND(x)` for everything | A gust you can watch crossing the scene is what makes it real |
| Keep things still until something moves them | Constant motion is tiring, and it's what makes code-drawn scenes look like screensavers |
| Keep the beat out of the world, apart from small things | Anything bobbing to the beat looks cheap |
| Make rare things rare, one at a time, from a shuffled bag | So that seeing one feels like luck |
| Seed everything painted once; use `Math.random` only for live behaviour | Same place every visit |
| Keep the subject readable: plain contrast behind them, quiet next to busy | The scene's a small rectangle on a phone, and people glance at it |
| Paint once what doesn't move; cache sprites; stay under 5 ms a frame | It has to keep up on a phone, with music playing |
| Respect reduced motion and LED mode | Some people need the scene still or steady |

## Finishing

Go through the list in `references/checking.md`. Then say what you made, the calls you made, how you checked it, and what you couldn't check. You can't watch motion here: you judged it from frame strips, so say so, and say what's most likely to need tuning.
