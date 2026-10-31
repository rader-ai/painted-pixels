# Mistakes we've already made

Each of these shipped, or nearly did. Most were spotted by someone looking at the app on a phone and describing what felt off. Their words are the most useful thing here, so they're quoted. If you catch yourself describing your own work this way, you've found the problem.

## What it looked like, why, and the fix

| What people saw | Why it happened | Fix |
|---|---|---|
| "Too many spheres attached together" (clouds) | Each cloud was a pile of circles, each shaded as its own ball | Shade the whole cloud as one mass; lobes only shape the outline |
| Clouds that looked like a mountain ridge | Smoothed the top too far, with an even fill | Noise strong enough to tear the outline |
| Clouds that looked like stickers | Outlined each billow | No outlines on anything in the sky |
| "More wispy, less consistent, less full circles, less flat on the bottom" | All clouds were the same kind of thing, built from circles over a flat base | Density plus noise, and four kinds sharing a sky |
| "They need to morph and change and dissipate or increase, like clouds do" | Painted once, then just moved along | Repainted a few times a second, with a life: they gather, swell, thin and dissolve |
| Clouds that popped in from nothing, huge, in seconds | One repaint a frame went to whichever came first in the list, so below 60 frames a second the last ones never changed | Give the turn to whichever has waited longest. Look at it at a low frame rate, where this shows |
| A shimmer pulsing about once a second | Noise layers moved by whole pixels, so 10 to 15% of a cloud changed at once | Slide by fractions of a pixel and read between table cells |
| Clouds too bright far from the moon | One lighting for all distances | Dimmer with distance; thin edges shine only near the moon |
| "The trees just look like balls/spheres connected" | Same mistake as the clouds: a crown of shaded balls | Clumps of small leaves, each catching light, shaded as one crown, on real limbs |
| "They don't feel like they are coming from one source" | No visible structure | Trunk, leader, staggered limbs, gaps showing sky and branches |
| Everything glows on the right, with the moon on the left | The light's sign was backwards, in every scene | Pass the moon's position as data. Follow the line from the light to each thing |
| "The moon doesn't influence the reflection on the trees at all" | Fixed `sun` on every tree | `opts.moon` lights each tree from wherever the moon is |
| Clouds lit the same whether they were left or right of the sun | One fixed `side` for a whole deck | `sun: {x, y, r}`, so each is lit from where the sun really is |
| Bench, lamp and observatory lit from the wrong side | Bevels and domes always lit top-left | `p.sun` |
| A tower's lit edge stayed put after it passed under the moon | Painted once into a scrolling layer | Draw that edge fresh each frame |
| Bright white gulls at sunset, and a fox that flipped between two palettes | Sprites ignored the light they were in | `blit`: natural colours, lit where they are |
| Shadows that snapped round at the edge of a fire's reach | The strongest light took over completely, as soon as it reached at all | One shadow for each light, the nearer one's growing with how close you are |
| A person and a fox fully lit while a cloud darkened everything else | The dimming was painted over the background, before they were drawn | Call `skyDim` after whatever the sun or moon lights, and before anything with its own light |
| A flat little bar under everyone, whichever way the light was | A shadow with no direction | `castShadow`: their real shape, running away from the point under the light |
| A hard black stripe under the log | A flat shadow at one darkness, with a ruled edge | Thin it along its length, and use a dark flat glow for something soft |
| A brown rectangle under the campfire | `p.texture` fills a box, and nobody looked at where it ended | Shape worn ground from a distance plus noise, so the grass gives way to it unevenly |
| Lightning that only lit the window | It was drawn behind the room | Light the whole room for an instant |
| Odd arrows along the treeline | Sky showing under the far pines | A solid dark band behind the near row |
| "The blades of grass... a constant state of moving" | Grass swayed on a sine wave | One wind: still until a gust rolls through |
| "We are forever walking toward the grass, but it never gets closer" | A fixed foreground in a walking scene | Near things pass faster than the walker |
| "The background doesn't seem to move with the walk" | Only the ground scrolled | Everything moves by its depth; the sun doesn't; a long loop with new things in it |
| "The pace of the castle movement and the walking foreground need to be different" | The castle moved at almost half the walkway's speed | Mountains .04, keep .18, wall 1 |
| "Waves don't feel like they have any froth or foam, it just feels like a line going up and down" | A line going up and down | A wave's whole life, painted a pixel at a time: crest, sheet, froth, lace, wet sand, bubbles |
| Foam crests running visibly diagonally | Each wave's slant too strong | Small slants, offset by noise |
| A hard line where the sheet met the sea | The two used different colours with no transition | Dither, and match the colours |
| Wet sand appearing ahead of the wave, with vertical ends | The wet mark was computed from the peak, even while the water was rising | While rising, the mark follows the water |
| Comb-like flames | Each tongue drawn separately in three colours | Three passes over all the tongues: reds, then oranges, then the pale heart |
| "He is walking over fire/in front of the fire" | Drew the walker after the torches | Torches are nearer than the walkway: walker first |
| "The lights turning off and on in the castle seem too fast" | Windows blinked on a timer and changed on the beat | Slow fades, minutes apart, a candle's waver, never to the beat |
| "The character bounces a lot in every scene" | The whole sprite hopped a pixel on every beat | No bob at all. A one-pixel breath, and a brief nod when a song starts |
| "The walk animation... doesn't feel natural" | Two frames, with a sliding foot | Heel-to-toe cycle, with planted feet moving at ground speed |
| Arms like rabbit ears | Fixed elbow direction | A continuous `bend` channel |
| Hands that looked like sparkles | Plus-shaped hands | Solid blocks |
| A dark gap at the neck when the head tipped | Nothing behind the head | A `NECK` block and longer hair rows |
| Fringe tufts across the tent | Lawn fringe drawn over everything along an edge | Filter them out where they'd cross something |
| Cloud reflections as dark lumps on a lake | Plain alpha over dark water | `lighter` composite at low alpha |
| Sand that looked like gravel | Speckle too strong and too even | Quieter noise, with occasional speckle and wind ripples |
| Lavender like a blob | One big dithered shape | Separate stalks, each moved by the wind |
| "A weird looking bird thing on a tree" | An owl drawn with too few pixels | Redrew it, with big round eyes that blink and look around |
| "There isn't much wildlife, like no nightlife" | Nobody had asked what lives there | The two questions in `creatures.md` |
| A spidery palm crown | Thin lines for fronds | Leaflets on both sides, hanging with their own weight |
| A sprite stuck on screen forever | `() => lightningSight(...)` wrapped a starter in another starter | Pass the starter itself |
| A butterfly that never arrived | It flew too slowly from wherever it happened to be | Pick the nearest one, and speed it up for the moment |
| Memory climbing at the campfire (2,438 cached glows in 40 seconds, and rising) | A flickering fire asked for glows of a new fractional size every frame, and each was cached forever | Key a cache by what's really drawn: the size in whole pixels |
| A wink behind the loading screen | The first action fired while the splash was still up | `life.awake`: nothing happens until the page is revealed |

## Mistakes in how we worked

- **Stopping at the first render that looked good.** The clouds took three tries, and the surf several more. Zoom in one more time.
- **Looking at the whole frame only.** A wrongly lit tree looks fine at a glance, and it was wrong in every scene until someone said so.
- **Adding more instead of fixing what's there.** More birds won't help a badly lit tree.
- **Judging motion by imagining it.** Render the strip.
- **Using a daylight palette at night.** Everything looks right until you step back, and then it glows.
- **Animating everything.** It feels lively in a test of ten seconds, and exhausting after ten minutes.
- **Tying things to the beat because it's easy.** It always looks cheap.
- **Painting something once because it's quicker.** Anything that's meant to change over time has to be built so that it can. A beautifully painted cloud that can't change is still wrong.
- **A background job that hangs quietly.** A bare `wait` in a shell script also waits for the web server the script started, and that never exits. Our rebuild sat there for two hours. Wait for specific process ids.
- **Saying it's good when you couldn't see it.** Say what you checked and how, and what you couldn't.
