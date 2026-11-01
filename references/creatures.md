# Creatures and rare sights: what lives here, what happens now and then

A world earns its keep when you've been there for ten minutes and something happens that you didn't expect. "Every once in a while we can get a crab chittering across, or dolphins jumping, maybe a whale breaching." Ask two questions of any place:

- **What lives here, doing what it does all the time?** Birds on a fence, bugs on flowers, a cat on a ledge, an owl that blinks.
- **What would turn up now and then?** A fox at the edge of the firelight, a whale, a kite on the hill, a bus going past the window.

Look at `../assets/gallery/whale.png`, `fox.png`, `crab.png`, `birds-park.png`.

## Drawing an animal

**A pose is a function from a point to a colour letter.** It's sampled into a tiny sprite, then given an outline. So a creature stays editable, and every pose can be computed from a few numbers.

```js
const CRAB_PAL = {k:'#2a0e12', o:'#d8502a', O:'#a83418', L:'#f49a60', e:'#14080c', l:'#8a2a18'};
function crabAt(step, claws){
  const up = claws ? -2 : 0;
  return (x, y) => {
    if (nearSeg(x, y, 6.2, 3, 6.2, 1.2, .35) || nearSeg(x, y, 9.8, 3, 9.8, 1.2, .35)) return y < 1.9 ? 'e' : 'O';   // eyes on stalks
    if (inE(x, y, 8, 5.2, 4.6, 2.5)) return y < 4 ? 'L' : y > 6.2 ? 'O' : 'o';                                       // the shell, lit on top
    if (inE(x, y, 1.9, 3.6 + up, 1.6, 1.3) || inE(x, y, 14.1, 3.6 + up, 1.6, 1.3)) return y < 3.2 + up ? 'L' : 'o';  // claws, raised with `claws`
    // ...arms, then three legs a side whose feet swap with `step`
    return '';
  };
}
const cv = shapeSprite(`crab${frame}${claws ? 'c' : ''}`, 16, 10, crabAt(frame, claws), CRAB_PAL, dir, 'l');
blit(k, cv, x * HD, y * HD - 9);
```

- `inE(x, y, cx, cy, rx, ry)` is inside an ellipse. `nearSeg(x, y, x0, y0, x1, y1, width)` is close to a line. Most animals are a few of each. Earlier tests win, so write nearest parts first.
- **The first argument to `shapeSprite` names the pose, and it must differ between poses:** it's the cache key.
- `thin` lists letters that get no outline: legs, beaks, whiskers.
- Colours go from the light down: top of the back lightest, belly its own colour, shadow darkest. Use 4 to 7 letters. A whale gets pleats and barnacles, because it's big enough to show them: `whaleShape`.
- `dir` flips the sprite. Everything is drawn facing right.
- `tippedSprite(id, cv, deg)` rotates one, by sampling a 4× copy. Round to steps (`Math.round(angle / 6) * 6`), or the cache won't stop growing.

**Small things** can skip the sprite and use a few `k.rect` calls: a sandpiper is 6 of them. Rigid, even smaller things can be rows: `BAT`, `OWL_ROWS`.

**Paint it in its natural colours, and let the light do the rest.** `blit` draws a sprite as it looks where it is right now: dim and tinted by the place, warmer near a lamp or fire, with a lit edge on the side the light comes from. `onGround` casts its shadow first. See `light.md`.

**In another project,** the kit's `foxSight` and `deerSight` walk along the campfire's ground row, so copy them and change that. Their warmth comes from `k.light`, so it just works. `birdLife` takes your own perches.

**Reference size:** a person is 24×41 canvas pixels. Crab 16×10, bird 15×11, rabbit 12×10, cat 24×16, fox 26×14, deer 32×28, dolphin 25×9, whale 90×38. The whale's much bigger than it would be at that distance, on purpose: it's the moment people remember.

## Behaving

**An animal has a reason.** This is what makes a sight feel like an event rather than a sprite crossing the screen. Most sights are small state machines: arrive, do something, leave.

| Creature | What it does |
|---|---|
| Deer | Walks in, grazes, lifts its head and flicks an ear, grazes again, turns round and leaves |
| Fox | Trots across, stops partway, looks, carries on |
| Crab | Goes in dashes, rests, and raises its claws; hurries off if the walker gets close |
| Sandpipers | Run up and down the wet sand on a slow swing, their legs a blur |
| Rabbit | A few hops, then a wait with a twitching nose |
| Owl | Blinks, looks around, sometimes drops off its bough, glides across the moon and comes back |
| Whale | Blows far out, blows again nearer, then the whole animal comes up, hangs, rolls and comes down on its side |
| Birds | Swoop in on a curve, flare their wings to land, hop, peck, look round, fly off (`birdLife`) |

**Build-up matters.** The whale's two blows give you time to look over there before it breaches.

**The world notices itself.** These small links are worth more than another animal:

- A sneeze sends nearby birds off (`life.sneezed`).
- Pigeons come to the crumbs (`prefer`) and scatter when the jogger passes (`scare`).
- A butterfly comes to the finger held out for it.
- When a whale starts, the character shades their eyes to watch (`life.next = 'shade'`).
- The cat comes down from the bookshelf, sits on the keyboard and gets petted.

**A gull a long way off isn't a little bird** (`../assets/gallery/ship-gulls.png`). We shrank the perched bird's sprite and gave it a wing, and it looked like a fish. It's long wings bent at the wrist, and you'd know it anywhere: `gullSprite` draws strokes out from the shoulder, dark toward the tips, with the low sun along the top of the near part of each wing. They glide for a long time, sinking a little, then flap a few times and glide on.

**A little sound-less life everywhere:** `fireflies`, `gardenBugs` (bees that visit flowers, butterflies with slow wingbeats), moths at a lamp, `eyesInTheDark` (two pixels in the undergrowth, blinking, then gone), petals falling, gulls.

**People count too,** at a distance: the jogger, someone with a pram, someone walking a dog (`parkFolk`), figures on the far pavement, the barista.

## Birds

`birdLife(k, t, dt, key, n, perches, kinds, opts)`. Perches are `{x, y, w, ground}`: `w` lets them hop along a rail, `ground` lets them peck. **Put perches where a bird would really land:** the top of a fence post, a bench back clear of whoever's sitting, the pier's rail. Feet on the surface. `BIRD_KINDS`: robin, sparrow, blue, gull, pigeon.

## Once in a while

`rare` keeps a shuffled bag of sights for each **lane**. One plays at a time, with a long wait before the next, and nothing comes round again until the bag's been through.

```js
rare(k, t, dt, 'forestSky',  {comet: cometSight, bats: () => batSight(mx + 40, my + 22), owl: owlFlight(mx, my, 282, 77)}, [22, 55]);
rare(k, t, dt, 'forestEdge', {fox: foxSight, deer: deerSight}, [16, 40]);
rare(k, t, dt, 'forestNear', {rabbit: rabbitSight}, [25, 60]);
```

- **A lane is a place in the layer order:** call `rare` at the point in `draw` where that sight belongs. The sky lane is before the land, the near lane after the person.
- **A sight is a starter:** a function that sets things up and returns a function that draws each frame, until it returns `false`.

  ```js
  function foxSight(){
    let x = -28;                                   // set up
    return (k, t, dt) => {                         // each frame
      x += 19 * dt;
      blit(k, shapeSprite(...), x * HD, y * HD - 14);
      return x < SW + 30;                          // false when it's gone
    };
  }
  ```

  If a helper already returns a starter (`owlFlight(...)`, `lightningSight(...)`), pass it as it is. Wrapping it in another arrow makes a starter that returns a starter, and the sight gets stuck: that was a real bug.
- **Gaps:** rare means rare. `[14, 34]` seconds for the sea, `[40, 90]` for pelicans, `[6, 16]` for traffic because a street is busy. Make the big moments wait.
- **Starting positions:** come from offscreen, and when they're on a walking beach, also subtract the ground's movement: `x -= scene.speed * f * dt`.
- **Watch for clashes:** the whale picks a spot clear of the pier.
- **They're not in the cover art:** `rare` does nothing unless `k.live`.
- **Asking for one:** `pst[lane].force = 'whale'`, or `look.mjs strip --sight beachSea:whale`. That's how you check it, and how the README's recordings stage them.

## What fits where

Don't put in animals because they're charming. Put in what would be there, at that hour, in that light.

| World | All the time | Rare |
|---|---|---|
| Castle | Bats, torches, a walker | Dragon far off, comet, black cat on the wall |
| Office | Cat on the shelf, city windows, traffic | Plane, lightning |
| Coffee shop | Barista, cat on the ledge, people passing | Car, bus, cyclist |
| Garden | Birds, bees, butterflies | Squirrel on the fence |
| Campfire | Owl, fireflies, moths, eyes in the dark | Comet, bats, owl across the moon, fox, deer, rabbit |
| Lake | Fireflies, fish, ripples | Comet, bats, ducklings, a frog, a heron |
| Park | Birds, pigeons, strollers, falling petals | Kite, lost balloon, squirrel |
| Beach | Gulls, boats | Pelicans, whale, dolphins, crab, sandpipers |
