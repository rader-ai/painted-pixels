# People: the rig, the walk, small human moments

**A person feels alive through small human moments, not through motion.** A blink, a yawn, a hand through the hair, a wink at you. They don't bob to the music. The feedback that set this: "the character bounces a lot in every scene, I was hoping for subtle motion and feeling of being alive".

Look at `../assets/gallery/people-poses.png`, `people-walk.png` and `people-life.png`.

They're tiny. On a big phone, a person is about 16×25 points on the screen, so **every gesture has to read through the silhouette**. A hand moving across the chest disappears. A hand going above the head, a head tipping back, a jaw dropping: those all read. Always check at real size (`look.mjs phone`).

## How a person is put together

Everything's assembled at canvas pixels, joint by joint, into a buffer of letters (`rigPx`, 52×56), which a palette then colours. Finished poses are cached as canvases. Only a new pose costs anything.

- **Head:** rows of letters (`HEAD_GUY`, `QUARTER_GUY`, `FRONT_GUY`, and the girl's) upscaled with EPX so its diagonals are smooth. Three views: `R` profile, `Q` quarter, `F` front, and `L` mirrors `R`.
- **Face:** `faceEdit` paints eyes and mouth onto those rows. Eyes: `open half shut squint up down happy wink`. Mouth: `none smile o ah wide`. A mouth is two or three pixels, and a wide yawn is the whole lower face.
- **Tilting a head:** the way pixel artists do it, RotSprite-style: upscale ×8, rotate, sample back down, which keeps lines clean. In steps of 3 degrees.
- **Torso:** rows, again. The hem stays on the hips while the chest above it rises and falls, so breathing doesn't move the whole body.
- **Arms and legs:** outlined tubes through joints (`rigTube`, `rigJoint`). A hand is a solid block, not a plus shape, which read as sparkles.
- **Hair:** hers falls down the back of the hoodie and swings a little behind the rest of her. The wind lifts it outdoors.
- **Shoes:** `flat`, `up` and `down`, because a walking foot rolls.

## Poses

```js
const p = {...REST, sit: true, near: [16, 28], far: [18, 27], view: 'R', eyes: 'open', mouth: 'none',
           tilt: 0, hx: 0, hy: 0, lean: 0, chest: 0, hair: 0};
rigDraw(g, CHARS.guy, p, X, Y, dir, light, level);
```

**Hands are canvas pixels from the sprite's corner, plus how the arm bends:** `[x, y, bend]`. `bend` is 1 relaxed, 0 straight, and -1 with the elbow going back. These are the useful spots, for someone facing right:

| Spot | Hand at |
|---|---|
| Resting on the thigh (seated) | `[16, 28]` near, `[18, 27]` far |
| Over the mouth | `[22, 17]` |
| An eye | `[18, 11]` |
| The brow, shading the eyes | `[21, 7]` |
| Top of the head | `[10, -1, -1]` |
| Back of the head | `[1, 5, -1]` |
| Behind the head, relaxing | `[3, 7, -1]` and `[4, 7, -1]` |
| Stretched overhead | `[-4, 5, 0]` and `[27, 5, 0]` |
| Into a bag beside them | `[-8, 28, -1]` |
| A knee | `[12, 30]` |
| Held out in front | `[26, 22, .5]` |
| Across a table or desk | `[30, 11, .6]`, `[33, 13, .6]` |

## Sitting and walking

`sitHero(k, x, seatY, rest)` seats them with row `SEAT_ROW` of the sprite resting on the seat, and `rest` can move where their hands go when they aren't busy: `{near: [21, 19]}`. Their shins hang at canvas X + 19, their shoes span X + 17 to X + 25, and their soles are 9 canvas pixels below the seat, so a ledge or a chair needs to allow for that. `walkHero(k, x, groundY)` stands them with their soles at `RIG_GROUND`. Both set `scene.heroX` and `scene.heroY`, so that puffs, sparkles and creatures can find them. Move them close to whatever they'll reach for: we had to bring them nearer the fire, the keyboard and the table.

## The walk

**A step is measured in the ground it covers, and a foot on the ground moves back at exactly the ground's speed. So it can't slide.**

```js
const u = scene.scroll / STRIDE / 2 % 1;       // where they are in the two-step cycle
{...REST, ...gaitPose(u, GAITS.walk, scene.walk)}
```

- `GAITS.walk`: step 10 canvas pixels (`STRIDE` of 5 grid pixels), feet down 60% of the cycle, lift 3, arm swing 5, lean 1. `GAITS.jog` flies between steps.
- Heel to toe: `footAt` gives each foot's position and which shoe to use.
- The arms swing opposite the legs, and the hips rise slightly mid-step.
- `scene.walk` eases from 0 to 1 when they start, so they ease into a stride and out of it.
- On each quarter note `scene.nudge` shifts the stride so a foot lands on the beat. It isn't a bounce: nothing moves extra.
- Other people in the world use the same legs: `drawFolk(k, FOLK.lady, x, gy, dir, gait, u, hands)`, with `d` counting the distance they've covered.

Earlier, a two-frame walk with a sliding foot read as a stiff shuffle. `look.mjs walk` draws one full cycle against ground marks: **a planted foot must keep pace with the marks.**

## Being alive

`lifeTick` keeps them alive all the time, with no direction needed:

- **Breath:** one pixel of chest, about 15 a minute.
- **Blink:** at random, and sometimes twice in a row.
- **Head drift:** a few degrees, every few seconds.
- **An action** every 6 to 13 seconds, with a slightly different speed each time.

They work through every action once, in a new order, before anything comes round again. The first thing they ever do is turn and wink at you. On arriving somewhere they do something that place calls for, and about half the time after that too.

```js
const ALWAYS = ['look','back','sky','muse','yawn','stretch','hair','cough','sneeze','rub','sigh','relax','wink','nod'];
const SITTING = ['shift','dangle','tap'];
const LOCAL = {forest: ['smoreFire','work','smore','warm','smoreFire','sky'], lake: ['fish','skip','read','sky','fish'], ...};
```

Add to `LOCAL` for a new place, and **ask what someone would actually do here.** Toast a marshmallow, fish off the dock, take a photo of the sunset, feed the pigeons, hold out a finger for a butterfly, sip a coffee, pet the cat that's sat on the keyboard.

## Writing an action

An action is a list of poses on a clock: `[seconds, changes]`. The body glides from each pose to the next.

```js
sigh: [[.9, {chest: -2, hy: -1, tilt: -3, eyes: 'shut'}], [1.3, {}], [2.2, {chest: 0, hy: 0, tilt: 3, mouth: 'o'}],
       [2.5, {mouth: 'none'}], [2.9, {tilt: 0, eyes: 'open'}]],
```

- **Gliding channels:** `tilt hx hy lean chest hair kick nod foot drum aim reach toast blaze lid lapX lapY type page cast bite tug fish`.
- **Stepping channels:** `view eyes mouth prop`.
- **Hands:** `near` and `far`, and `null` puts one back where it rests.
- `[2.3, {}]` holds the pose until that time. **Holds are most of what makes an action feel human.** Add them.
- `flow: 1` means don't stop here: the hand sweeps on through, as in `hair`.
- `fx` fires something once: `puff sneeze glint blow curl plop skip crumbs flash`.
- Turn your head in steps: `R`, then `Q`, then `F`, each .12 s. A snap looks like a glitch.

**Think like an animator.** A sneeze has a wind-up and a false start, then the head snaps forward with a burst, then a sniff and a rub of the nose. A yawn opens slowly, holds at its widest, and the eyes stay heavy afterwards. Anticipation, then the action, then settling. The eyes lead. Then look at it at real size and cut whatever doesn't read.

**To add an action in another project,** use the kit's `addAction(name, list)`, since `ACTIONS` were filled in as the kit loaded. In Lofi Studio, add it to the `ACTIONS` table.

**A prop** is drawn from where the hand is: `PROPS.name(k, p, a, X, Y)`. Set it with `prop: 'name'` at the moment the hand arrives at it, and take it away the same way. For something they hold all the time, set `k.holding = 'mug'` and move the resting hand with `sitHero`'s `rest`. If it comes from somewhere, show it coming from there: everything for the campfire comes out of the bag next to the log, and the mug goes back on the table.

**A prop can have a whole story in its channels.** `smoreFire` uses `toast` (the marshmallow browning) and `blaze` (it catches): the toast goes up, the fire starts, they wave it, blow it out, shrug, and eat it anyway, with a small cough. `../assets/gallery/marshmallow.png`.

**A new head:** `rigHead` caches by long or short hair, not by character, because everyone so far shares those two heads. If you draw a different head, add something to that key.

## Lighting them

`k.light = LIGHTS[place]`. See `light.md`. A person without their place's light looks pasted on. Add a `LIGHTS` entry for every new place. They take a rim on each side (`rim` and `rim2`), and `k.light` can change from moment to moment: `torchLight` lights the walker from whichever torch is nearest. `sitHero` and `walkHero` cast their shadow from their real pose: set `seat` in `LIGHTS` to the ground under a seated person, or leave it out when there's no ground (a dock over water, indoors).

## Things to get right

| What goes wrong | Fix |
|---|---|
| Whole-body bob on the beat | Don't. Only a brief `nod` or foot `tap`, and only while music plays |
| Arms like rabbit ears | `bend` is a continuous channel: use 0 for straight, and negative to send the elbow behind |
| Hands as little plus signs | They read as sparkles. A hand is a solid block |
| A bump on the chest | Slimmer torso rows |
| Knees bent when standing | Ankle heights have to match `RIG_GROUND` |
| A gap under the head when it tips | `NECK` fills it, and the hair rows are taller than they look |
| Everything in the same pose and timing | `life.rate` varies each action; hand targets are rounded after low-passing (`livePose`) |
| Gesture unreadable on a phone | Change the silhouette, or cut it |
