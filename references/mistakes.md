# Mistakes we've already made

Each of these shipped, or nearly did. Most were spotted by someone looking at the app on a phone and describing what felt off. Their words are the most useful thing here, so they're quoted. If you catch yourself describing your own work this way, you've found the problem.

## What it looked like, why, and the fix

| What people saw | Why it happened | Fix |
|---|---|---|
| "The rain in the office is appearing inside and in front of the TV. The bus is also in front of the chair." | The room and the view were one painted layer, and whatever moved outside was drawn over it, clipped only to the window's rectangle. A chair or a screen standing in front of the window is inside that rectangle. The guide even said to do it that way. | The view, then what moves in it, then the room as its own layer with the window cut out of it. Now nothing outside can land on the room |
| "Zero thoughtfulness and detail. Everything is ugly squares." (the booth, the bus, the street) | Each thing was a rectangle with a colour in it, and the only texture was noise. It passed every check we had, at Rank A, because nobody had walked the Eye list | Paint each thing as what it is. `p.form` and `sdBox` give it a shape that turns to the light. Rule D7 now measures it |
| The moon's road on the lake, like a ladder | Bars at an even spacing, one per band of the music | Broken glitter: narrow far off, wider nearer us, and missing in places |
| A grid of one window stamped on every tower | A loop that placed a window every 12 pixels | Ask who'd cut one there. Real ones high up, a stair's slits climbing round, solid lower down, and every tower its own plan |
| Patches of ivy floating on the castle's walls | `p.leaves` puts leaves wherever you say | `ivyClimb` roots it at the foot of the wall and grows it up |
| A bridge held up by a thin line | An arch drawn as a curve, with nothing in it | A thick ring of cut stones, masonry over it, and the underside showing |
| A torch every 96 pixels | A `for` loop, again. Windows, torches and ivy were all spaced by one | Put each one somewhere for a reason, from a list |
| A park of one tree, in two colours | One `treeModel`, with different numbers | `kind`: an oak, a cherry, birches, poplars, each growing its own way |
| A path ruled straight across the park | A texture in a rectangle, and everything that walked on it had a fixed row | A path that goes somewhere, and a footpath off it that winds away up the hill. Both narrow with distance |
| A shed that was a flat rectangle with a triangle on it | Painted front-on, in one light | One side running off to a vanishing point, and three surfaces in three different lights |
| A squirrel on the fence, running straight across the shed | It crosses the whole frame along the fence, and it's drawn after the shed | Check what crosses anything you paint. Clip it, so it goes behind |
| A ship that was a slab with some coloured squares on it | Four rectangles, far away, so nobody looked | A hull with a sheer and a raked bow, a bridge and funnel at the stern, and stacks that don't come out level, all gone toward the colour of the air |
| Gulls that looked like little grey fish | The perched bird's sprite, shrunk and given a stub of a wing | `gullSprite`: long bent wings, in strokes |
| The lake's far shore as a straight line, and later a straight line above it too | Every tree rooted on one row. Then a bank painted from one row down | A shore that runs in and out, nearer points and an island in front of it, and no two of anything on one row |
| An island whose reflection had square corners | The mirror line jumped where the land started | Everything comes out from the far shore gradually, and goes back the same way |
| Lily pads like green ellipses with plus signs on them, spread out evenly | One ellipse and a highlight, placed by hand across the whole lake | Colonies where it's shallow, seen from low down, with notches, closed buds, and a flower that stayed open |
| Ripples across the dock's posts, and rain landing on far trees | The dock and the land were in the background, under everything the water does | Paint what stands in the water again, over that |
| A square of dither on the lake | A low-alpha glow only gets past its first step in the middle, and there it has an edge | Leave it out, or make it strong enough to fade properly |
| A garden that crashed Safari's whole tab, about ten frames after you got there, every time. Every check we had was green | A compiler in Safari choking on the world's draw function. Changing one small loop stopped it. Chrome's never heard of this problem | Run it in Safari's engine, for a while, before you publish: `look.mjs safari`. Found by the last check before pushing |
| Sunflowers in a ruled row, all one height; a watering can that's a blue box; cabbages that were green circles; a cooler that's a red box | First pass, and never looked at again, because the eye goes to what's moving | Walk every world looking for what's still a first pass |
| Grass and a deer drawn over the tent | The tent was painted into the background, so whatever came along the tree line behind it was drawn on top. The grass had been filtered out from where the old, smaller tent stood | The tent has its own layer, drawn after whatever's behind it |
| "Too many spheres attached together" (clouds) | Each cloud was a pile of circles, each shaded as its own ball | Shade the whole cloud as one mass; lobes only shape the outline |
| Clouds that looked like crumpled paper, or snowy mountains, even in their own reflection | Noise folded into planes that met along ridges, lit from one side. And a height map for a top, torn up by noise: which is how you'd draw a mountain range | Fold it into domes, draw the top in arcs that meet in cusps, and let the noise wave the edge and not draw it. The sky's biggest single gain since density |
| Clouds that looked like stickers | Outlined each billow | No outlines on anything in the sky |
| "More wispy, less consistent, less full circles, less flat on the bottom" | All clouds were the same kind of thing, built from circles over a flat base | Density plus noise, and four kinds sharing a sky |
| "They need to morph and change and dissipate or increase, like clouds do" | Painted once, then just moved along | Repainted a few times a second, with a life: they gather, swell, thin and dissolve |
| Clouds that popped in from nothing, huge, in seconds | One repaint a frame went to whichever came first in the list, so below 60 frames a second the last ones never changed | Give the turn to whichever has waited longest. Look at it at a low frame rate, where this shows |
| Clouds growing flat-sided slabs and spires, now and then | The slow layer that curdles the edge pushes each column a little differently, and where it jumped between neighbours, the column broke away. Found by a fresh agent painting a rooftop | Smooth it along the row. Don't slow it right down, which makes a mountain ridge again |
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
| A shadow that snapped to a new shape as whatever cast it went by | Two ways of drawing a shadow, upright and lying down, with a hard switch at one angle | Change between them gradually. No one saw this by eye: the validator's jump check did |
| A hard black stripe under the log | A flat shadow at one darkness, with a ruled edge | Thin it along its length, and use a dark flat glow for something soft |
| A brown rectangle under the campfire | `p.texture` fills a box, and nobody looked at where it ended | Shape worn ground from a distance plus noise, so the grass gives way to it unevenly |
| A beat changing 7% of the frame in the coffee shop | Each lamp's cone of light pulsed, and a cone covers a wall. At the castle, the glow round the moon pulsed too | Only small things touch the beat, and never the moon. Measured, with rule M5 |
| A walker who kept walking for people who'd asked for less motion | `reduceMotion` stopped the wind and the birds, but not the stride, and the whole world scrolls with it | Nobody walks under reduced motion. Found by rule M8 |
| A white mug glowing in someone's hand at night | Props painted their own colours straight onto the canvas, and only the person took the light. Found the same way | `k.g` tones a prop's colours on the way through. A screen or a flame paints on `k.bare` |
| Rain, beads, headlights and steam that kept going in the office, for people who'd asked for less motion | The other worlds have a `still` switch, and this one never got one | Rain hangs in the air under reduced motion, and a fire burns low and slow. Found while checking rule M8 |
| A black cat that could stay on the castle wall for minutes | It walks at 13 pixels a second and the world scrolls at about the same speed, so walking our way it nearly stands still | After 45 seconds it turns back. A rare sight has to end however the numbers fall. Found by rule M9, on the third run |
| A fishing rod, a float and a beach flag drawn at fractions of a pixel | Positions from `lerp`, drawn straight to the canvas without rounding | Round before drawing. Found by rule G3, which watches every action to its end |
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
| "The lights turning off and on in the castle seem too fast" | Windows blinked on a timer and changed on the beat | Each window on its own clock: slow fades, lit for minutes, a candle's waver, never to the beat |
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
