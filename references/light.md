# Light: where it comes from, and what it does

Light is what makes a scene hold together, and it's what we care about most. People notice when it's wrong even if they can't say why. The first feedback on the campfire included "the glow of the trees are all on the right side" when the moon was on the left. We'd had the sign backwards in every scene, and nobody caught it because each tree looked fine on its own.

Four questions, for everything in the frame:

1. **Where's the light coming from?**
2. **How does light really behave here?**
3. **What reflects it?**
4. **What happens to things that move through it?**

We aren't simulating physics. We're choosing the physics the eye notices, and making sure none of it is contradicted.

Look at `../assets/gallery/light-campfire.png`, then `before-campfire.png` to see the same scene before we got this right. Then `light-beach-shadows.png`, `light-torch-walker.png` and `light-fox-firelight.png` for moving things.

## Say where it is first, as data

Before painting anything, write the light down. Everything reads from this, so nothing can disagree. Each place has one of these, and it goes on `k.light` for whatever's being drawn.

```js
LIGHTS.forest = {id: 'f', dim: .66, tint: [14, 20, 52], tintAmt: .22,   // how dark it is, and the colour of the dark
  rim: '#ffa050', rimAmt: .6, side: 1, flicker: true,                    // the light on someone here: fire on one shoulder...
  rim2: '#a4b4ec', rimAmt2: .42, side2: -1,                              // ...and the moon on the other
  far: .46, ink: '#03040c', seat: 124,                                   // how dim, away from every light; the colour of a shadow; the ground under a seat
  key: {x: 60, horizon: 100, long: .9, shadow: .14, col: '#aebcf0'},     // the moon: where it hangs, and what its shadows do
  spots: [{x: 208, y: 122, r: 92, col: '#ff8a40', long: 1.15, shadow: .36, fire: true}]};   // the fire
```

| Field | What it is |
|---|---|
| `id` | A short name, different for each place. Sprites lit here are kept under it |
| `dim`, `tint`, `tintAmt` | How dark a person is here, and the colour of the dark |
| `far` | How dim a sprite is, away from every lamp and fire |
| `rim`, `rimAmt`, `side` | The light on someone: its colour, its strength, and its side (-1 is left, 1 is right). `rim2`, `rimAmt2` and `side2` are the same for a second light. `flicker` makes it move with the flames |
| `ink` | The colour of a shadow |
| `seat` | The ground under a seated person, so that they can cast a shadow. Leave it out when there's no ground there |
| `key` | The sun or moon. `x` is where it hangs across the frame, `horizon` is the row on the ground under it, `long` is how far a shadow runs for each pixel of height, `shadow` is how dark, and `col` is its colour |
| `spots` | Each lamp or fire. `x` and `y` are where it meets the ground, because shadows run away from that point: for a lamp, that's its foot and not its head. `r` is how far it reaches, and a little less up and down the screen, because you're seeing the ground from low down. `col`, `long` and `shadow` are as for the key. `fire` makes its shadows flicker |

## The kinds of light in a scene

| Kind | What it is | Job |
|---|---|---|
| **Key** | The sun or moon | Sets the shape of everything: which side is bright, and which way shadows fall |
| **Sky** | Light from the whole sky, with no direction | The colour of the dark. Shadows are this colour, never black |
| **Local** | Fire, a lamp, a window, a screen | Reaches only so far, and that's what makes a spot feel safe |
| **Bounce** | Light coming back off the ground or water | Warm sand under a sunset, firelight on the ground, a screen on a polished desk |

A place usually has a key that's high and cool and a local light that's low and warm. Where they meet, the warm one wins near its source.

## The physics we follow

**A surface is as bright as it faces the light.** That's all shading is. Whatever is turned toward the light is bright, and whatever's turned away gets only the sky's colour. A hill's slope is lit if it faces the moon. A round tower is brightest on the side toward it.

**A distant light seems to radiate from where it hangs.** The sun's rays are parallel, but perspective makes them spread out from its spot in the sky, like a road's edges running to the horizon. So the bright edge of each thing is on the side toward the sun or moon's position on screen. A tree left of the moon is lit on its right, and a tree right of the moon is lit on its left. A tower that passes under the moon changes sides.

**A nearby light falls away quickly.** Light thins out with distance, roughly by the square. Twice as far away is about a quarter as bright. So a fire doesn't make a dim glow across the whole clearing: it's bright close up, and then gone. `(1 - d) * (1 - d)` is close enough.

**The height of the light changes everything.** A high sun gives short shadows and lit tops. A low sun gives long shadows, warm colour and glowing edges, and everything between you and it is backlit, so you see the shaded side of it with only its edge lit.

**Shadows run away from the point on the ground under the light.** With a sun or moon in the frame, that's the point on the horizon beneath it, so shadows fan out across the ground like the spokes of a wheel. A thing to the left of the sun has a shadow going down and left, one straight below goes straight toward you, and one to the right goes right. They swing round as you walk past.

- A shadow has the shape of the thing that casts it. A walker's legs scissor in theirs.
- It thins toward the far end.
- It's the colour of the sky, not black (`ink`).
- A second light gives a second shadow, and `shadowsOf` gives you both. A fire's flickers with the flames, and it strengthens as you get closer, so it doesn't snap on at the edge of the light's reach. Close to the fire, it washes the moon's shadow out.
- When a cloud covers the light, the shadow fades.

**Something that blocks the light takes it from what's behind.** A log throws a shadow away from the fire. A cloud over the sun dims everything it was falling on, moving things included, and the shadows soften until it passes. `skyDim` does this by painting over whatever's been drawn so far, so call it after everything the sun or moon lights, and before anything with its own light, like a fire or a torch.

**Smooth things reflect like mirrors.** Water, wet sand, glass and polished wood show what's opposite them, not the colour of the light.

- A reflection sits straight below the thing, starting from the waterline. Whatever's on the water gets one: a boat, a duck, the pier.
- The road of light on water always runs straight between you and the source, and it moves when the source moves.
- Wet sand gives back the sky and sun, and dry sand doesn't.
- At night a window shows the room behind you: a ghost of the lamp over the city.
- **Check the geometry before you fake one.** Someone on the dock is high enough above the water that their reflection would fall below the frame, so we don't draw it.

**Rough things bounce light as colour.** Firelight warms the ground around it. A low sun warms the sand. A screen tints the desk under it.

**Thin things let light through.** Thin cloud shines when the sun or moon is behind it, while the thick parts go dark, which is what a silver lining is. A tent glows from inside, and the same goes for a flag or a backlit leaf.

**Air catches light.** This is why far things turn toward the colour of the sky. It's also why:

- A low sun's glare washes out the hills nearest to it.
- You can see rays in haze.
- There's a halo around the moon.
- Smoke is orange low down and grey once it climbs out of the firelight.
- Rain is bright only where it falls through a lamp's light.
- Dust is in the air all the time, and you only see it inside a beam.

**Warm against cool is what makes light feel like light.** Pick one of each. If everything's warm, nothing looks lit.

## What each thing does

| Thing | How it takes the light | Tool |
|---|---|---|
| Clouds | One pass from the light's side: each pixel takes in how much cloud lies between it and the light. `sun` or `moon: {x, y, r}` lights each from wherever the source hangs, with thin edges shining close by. `{under: 1, sunX}` at sunset | `cloudDeck`, `cloudShade` |
| Mountains and hills | `sunX`: a slope facing the light catches it, one facing away falls into shade. `rim` along the top | `p.hill` |
| Pines | `moon: {x}` lights each tree from wherever the moon is. `fire: {x, y, r, col}` warms the side facing a fire | `p.pine` |
| Leaf crowns | `sun` sets which side of each leaf and clump is lit | `treeModel`, `leafClump` |
| Trunks and branches | `sun` picks the lit side | `stroke` |
| Buildings, boxes, planks, domes | `p.sun = 1` before painting, when the light's on the right. It's the top and left by default | `p.box`, `p.wood`, `p.dome` |
| Buildings that scroll | The bright edge changes sides as they pass under the source, drawn fresh each frame | `KEEP_EDGES` in `castle.draw` |
| Ground | `opts.light(x, y)` adds or takes light at any spot: tree shade, a lamp's pool. The campfire's is about .7 at its brightest; a lamp's may want more | `p.lawn` |
| Stones and logs | A smaller highlight offset toward the light | see the fire pit in `forest.bg` |
| Tent, walls, big flat things | Brightness from the side nearest the light, and a sliver of the other light on the far edge | see the tent in `forest.bg` |
| Water | Mirror, tint and ripple. Road of light. Reflected clouds use `lighter` at low alpha | `p.reflect`, `mirrorRows` |
| People | Dim and tint from `LIGHTS`, a rim on each lit side | `rigPalette`, `rigFrame` |
| Animals, birds, sprites | Automatic: see below | `blit`, `litSprite` |
| Glows | Dithered and stepped. `p.glow` painted once, `k.glow` per frame. A flat one (`ry` far smaller than `rx`) is light on the ground, or a soft shadow in a dark colour | |

## Moving things

**A moving thing takes the light where it is, right now.** This is what makes a world feel solid. A fox trots out of the dark, warms as it reaches the fire, has a lit edge on the side facing it, and goes dark again as it leaves. Nobody had to animate any of that.

```js
lightAt(L, x, y)                 // how much local light reaches here (0 to 3), from which side, and which light
blit(k, cv, X, Y)                // draws a sprite as it looks right there: use this for every creature
litSprite(cv, L, level, side)    // the same sprite in that light, worked out once and kept
onGround(k, cv, X, Y)            // its shadows, then the sprite
shadowsOf(L, x, y)               // every shadow it throws from here: which way, and how dark
castShadows(k, cv, X, Y, foot, baseY, L, x, y)         // lays its real silhouette on the ground, once for each light
mirrorRows(k, cv, X, waterY, alpha, t, n)              // its reflection, broken by ripples
skyDim(k, key, cover, dt, 'r,g,b', amount, L)          // cover comes from cloudDeck; takes light off everything drawn so far
motes(k, t, dt, key, n, x0, x1, y0, y1, inLight)       // dust you can only see where light falls through it
sunRays(k, t, id, x, y, len, col, a)                   // rays in the haze
```

**Paint creatures in their natural colours,** and let the light do the rest. A fox has one palette now; it used to have a day one and a night one, and it would flip between them.

**People:**

- `k.light` can change from moment to moment. `torchLight` lights the walker from whichever torch is nearest, with the moon still on the other shoulder, and it fades as they walk on.
- `screenLight` lights a face from a laptop while the lid is up.
- A person takes two rims, one on each side. For a light that's moved to the other side of someone, flip it (`drawFolk` does this as people pass under the sun).

**Shadows are drawn before the thing that casts them,** and after the ground they fall on. A hopping bird's shadow stays on the ground while the bird leaves it.

**If the character looks pasted on,** it's nearly always the light: full daylight colour in a night scene, or no shadow.

## Light as behaviour

Lights change at the pace of the people or things behind them. This is where light becomes story.

- **Windows in the castle** are lit and put out one at a time, fading over a second or two, staying on for minutes, with a slow candle waver. An earlier version blinked on the beat, and the feedback was that it looked "too fast, and not really how lights would be working in a castle".
- **Windows in the city** go off for a while and come back: someone's getting a glass of water.
- **A cloud crossing the moon or sun** dims the scene by as much as it really covers.
- **A fire** flickers, leans in the wind and flares when a log pops. Everything it lights flickers with it, including shadows.
- **Lightning** lights the whole room for an instant, not only the window. In LED mode, only the window flashes.

## With or without the beat

The lights that follow the music outright are the ones a real thing might: an LED string, a monitor's bars, a visualiser. Torches, the campfire, a desk lamp and the castle's moon take a small lift on the beat. They all read it through `flashy()`, which returns 0 in LED mode, so that nothing flashes for people who'd rather it didn't. The sun never pulses.

Keep the lift small, and measure it: rule M5 lets a beat change at most 3% of the frame. A wide cone of light is what goes over. The coffee shop's lamps pulsed until the validator showed a beat changing 7% of the frame, so they're steady now.

## How to check it

Do this on the screen, one thing at a time. A wrongly lit tree looks fine at a glance.

- [ ] **Follow a line from the light to each thing.** Is its bright side on that side? Do this for clouds, mountains, trees, buildings, people and animals.
- [ ] **Follow the line through each thing to the ground.** Is its shadow on the far side, and fanning the right way?
- [ ] **Move it.** Film a strip of something crossing the frame, or crossing a light. Does its lit edge change? Does it warm and cool? Does its shadow swing?
- [ ] **Cover the source.** Find a moment when a cloud crosses it, with `look.mjs probe --expr "LIGHTS.hill.veiled" --n 100 --gap 2`, then make a strip with `--at` set to that time. Does the land dim, do moving things dim with it, and do the shadows fade? If no cloud ever crosses, narrow the clouds' band around the source (`y0` and `y1`) or add one.
- [ ] **What in this frame is smooth or wet?** Does it show what's opposite it?
- [ ] **What's in the air?** Smoke, rain, dust, mist. Does it catch the light it passes through?
- [ ] **Is anything black?** Shadows should have the colour of the sky.
- [ ] **Is the light still consistent at phone size?** You should be able to point to where the light is from any part of the frame.
