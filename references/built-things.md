# Built things: stone, wood, rooms, windows

Natural things are made of many small things. Built things are made of courses, planks and panes: regular shapes that time has got at. Paint the regularity first, then break it.

Look at `../assets/gallery/castle.png`, `office.png` and `cafe.png`.

## Materials

| Material | How | Tool |
|---|---|---|
| Wood | Grain runs along the plank, lit along the top and left edges, dark along the bottom and right | `p.wood(x, y, w, h, ramp, seed, vertical)` |
| Machined things | A bevel: light top and left, dark bottom and right, optional outline | `p.box(x, y, w, h, [dark, base, light], outline)` |
| Stone | Courses and offset joints, each block slightly different, shaded across the whole surface, not per block | `stone` in `paintKeep` |
| Plaster, floors, walls | Quiet noise from a close ramp, or the room feels busy | `p.texture(x, y, w, h, ramp, scale, seed, bias)` |
| Fabric | Sine folds down its length | `p.curtain` |
| Round roofs, lampshades | Shade across the dome | `p.dome` |
| Moss, ivy, cracks | Added last, where water would run | `p.leaves`, `p.strands` |

**Which way bevels face:** `p.box`, `p.wood` and `p.dome` light the top and left edges, unless you set `p.sun = 1` first, for a light on the right. Follow the line from the light to check. Our bench, lamp and observatory were lit from the wrong side for a long time.

A wall shaded evenly looks flat however good its texture is. Shade the whole wall from its light first, and let individual stones vary on top of that. A round tower gets a curve across it: `.36 + rel * .3 - rel * rel * .1`, plus a thin rim on the moon's side.

## Windows

- A window at night is a warm pane with a brighter top, a dark bar, a glow painted outside it, and a ledge below.
- **A room with a window is two layers, and the room's on top.** Paint the view in `sky` and `bg`. Paint the room in `front`, all of it, and cut the window out of it with `p.clear`. Then draw, in this order: the view, anything that moves out there, rain, the glass, `placeFg`, and whatever moves in the room. That way nothing outside can ever land on the room. Clipping the outside to the window's rectangle isn't enough, because a chair or a screen standing in front of the window is inside that rectangle: it's how we got rain falling through a TV and a bus driving through a booth. Semi-transparent paint in the hole of `front` goes over everything outside, which is how to do a reflection, or a shadow on the road that buses drive through.
- **Daytime rooms are lit from the window**, and it reads through the warm/cool contrast. Its light falls across the floor toward us, with the shadow of the window's bar in it, and dust shows inside it (see the cafe).
- **At night the glass shows the room:** a faint ghost of the lamp and screen over the city, drawn inside the window's clip.
- A window in a far building is 1 or 2 pixels plus a low glow. Lit at random, some of them blue like a TV.

## A street

The street outside the coffee shop is the opposite of a city at night: close up, in daylight, and the fronts face you. What makes it more than a row of boxes:

- **The sun comes from somewhere.** High, behind us and to the left, so whatever stands out of a wall throws a short shadow down and to the right: sills, heads, cornices, fire escapes, awnings.
- **Every building's a different kind of building.** Brick, limestone, painted plaster. Arched windows, shutters, a band of stone between floors. A shop at the bottom with its own sign and awning, and what it sells in the window.
- **A wall that isn't facing you** shows where one building stands taller than the next: it runs off toward the street's vanishing point, bright if it faces the sun and dark if it doesn't.
- **What stands at the kerb** breaks it all up: a tree with a real crown, a lamp post, a hydrant, a bus stop. They're nearer than whoever's walking along the pavement.

## A city

"One or two pixels plus a glow, lit at random" gets you flat rows that read as a bar chart. Three things make a city:

- **One lens.** Lay the blocks out in rows on the ground, project them with a small perspective function (`x = horizonX + (wx - horizonX) * scale`, with `scale` shrinking with distance), and paint their faces and roofs from that. It's painted once, so it costs nothing per frame. An avenue running straight out to the horizon gives you more depth than anything else you can draw.
- **Air.** Far buildings turn toward the sky behind them, and their windows shrink to dots.
- **Mostly asleep.** Whole floors are lit together, most buildings are nearly dark, and a few windows are blue like a TV. Evenly scattered lights look like a pattern.

## Nothing's a box

A bus, a chair, a screen, a cooler: if you've drawn a rectangle with a colour in it, you haven't drawn anything yet. "Everything is ugly squares" is how that looks to everyone else, and rule D7 measures it. For each thing, ask what it really is and what shape that makes:

- **Give it a form.** `p.form(X0, Y0, X1, Y1, ramp, shape, opts)` paints any shape along a ramp, and turns its edges toward the light or away. `sdBox(X, Y, x0, y0, x1, y1, r)` gives you a rounded box to start from. `shape` can be anything that says how far outside it a pixel is, so a tapered pot or a padded seat takes one line.
- **Then make it the real thing.** A booth has a curved back, tuck-and-roll channels, piping, brass nails, a cushion with a worn front edge, and a kicker scuffed by shoes. A bus has a roof pod, people in its windows, doors you could get on by, and a line where the panels meet. A desk chair has five feet on casters.
- **Turn it.** A screen that faces whoever's using it is a trapezoid, taller at its near edge, and that alone tells you where the person is.
- **Put something on it.** A marble table with half a croissant and a bud vase says more than the table does. A calendar with one day ringed, a long way off, says more than a wall.

`paintCafeRoom` and `paintOfficeRoom` in Lofi Studio are worked examples, one brush per thing.

## Rooms

A room is the same job as a landscape:

1. **Light plan first.** The office has an amber lamp, a teal monitor and a string of little bulbs. Each one has a painted glow in `bg` and a moving glow in `draw`. Everything else stays dark, and the vignette finishes it off. See `light.md`.
2. **A view to somewhere else.** A window with moving sky and rain makes a room feel like a place within a world.
3. **Things that say who lives here.** A stack of books, a steaming mug, a plant, a rug, a bookshelf with uneven spines, a clock that tells the real time. Each book differs in width, height and colour, with a gold band: the same detail you'd give leaves.
4. **What the light lands on:** a screen tints the polished desk under it, a lamp makes a pool, and `motes` shows dust inside a lamp's cone.
5. **Small steady movements:** steam off the mug, cat on the shelf, a barista working behind the counter, the coffee machine's breath, people passing outside, cars.

Keep the floor simple, and in the room's own perspective: `s = (Y - vy) / (F - vy)`, then `wx = (X - vx) / s` for across and `wz = K / s` for away gives you tiles or planks that run to one point. Keep their contrast low, or the floor shouts. Most of the eye belongs higher up.

## Scrolling buildings

Anything that scrolls forever wraps: `painter(w, h, {wrap: true})` makes drawing and noise repeat exactly across the width, so the layer tiles. Draw it with `wrapDraw(g, canvas, shift, y)`, where `shift` and `y` are in grid units. Every moving detail on it (windows, flags, rose window) has to be placed from the layer's offset each frame, repeated for each tile. So does its light: a tower's bright edge changes sides as it passes under the moon, and that can't be painted once.

## Layering around built things

Ask what's actually nearer the camera.

The torches on the castle wall hang on the wall's face, and the wall's face is nearer to us than the walkway on top of it. So the walker passes **behind** the flames. An early version had the character walking over the fire, and the feedback caught it: "he is walking over fire/in front of the fire, when it feels like that isn't the actual layering". That's why `walkHero` is called before `torchFlame`.

The same thought explains the `front` layer: trunks, benches, fences and posts stand in front of the swaying grass at their feet, so the order is grass fringe, then `placeFg`, then crowns.

## Flags and things that hang

A flag isn't a sine wave. `beachFlag` and the castle's pennants hang limp in still air, and they stream and flap harder in a gust: both the speed and the height of the wave depend on `WIND(x)`, and the flag flips when the wind turns (`wind.dir`). Three colours: a lit top, a body, a dark bottom.

## Smoke and steam

Small dithered glows or single pixels, rising and spreading as they age, fading out. Each has its own phase. Smoke bends with `WIND`. Steam off a mug is 3 pixels; don't make it more.

## Fire

Fire's a built thing's best friend, so it's here. `campfire(k, t, dt, x, y)`. Look at `../assets/gallery/campfire.png`.

**Three passes over the same tongues:** the red outside of all of them, then the orange inside that, then the pale heart. So they burn together as one fire. Our first version drew each tongue separately in three colours, and it looked like a comb. The tallest tongues are in the middle, and each height wanders through noise.

Around that: two glows (one broad and flat on the ground, one round), embers in the logs, thin smoke, sparks that drift up, and a pop every 3 to 14 seconds with a small flare. It leans with the wind. Everything nearby flickers with it: the rim on the person, the warm side of the trees. Torches (`torchFlame`) and small fires (`campfireSmall`) are the same idea at a smaller size.
