# The referee

`scripts/validate.mjs` runs a scene in muted headless Chrome on a clock it steps by hand, measures it against `rules.md`, and gives it a rank. The rule book is the source of truth: the referee reads the rules from there, and it refuses to run if a machine rule has no check or a check has no rule.

## Running it

Run `npm install` once in `scripts/`. It needs Chrome.

```bash
node scripts/validate.mjs --page your-page.html --out quest
node scripts/validate.mjs --page lofi-studio/index.html --place forest
node scripts/validate.mjs --page lofi-studio/index.html --place all --out quest
```

A full check takes a couple of minutes for one scene. It plays every rare sight and action to its end, then runs on for a while, watching for what only goes wrong after minutes.

| Flag | What it does |
|---|---|
| `--quick` | Skips the long run, reduced motion, the phone and the cost. For while you're painting. A quick A doesn't count as an A |
| `--seconds 24` | How long it watches the scene |
| `--minutes 3` | How long the long run is. Some bugs take a while to show: our starved clouds first popped about two and a half minutes in |
| `--seed 2026` | A different seed gives a different run. Try one if a result looks like luck |
| `--root folder` | The folder to serve, if the page loads files from above its own folder |
| `--who guy` or `girl` | Which character, in Lofi Studio |
| `--selftest` | Runs every check against a page made to break it. Run this after changing the referee |

It exits with 1 if a Law is broken, so it can sit in a script. `report.json` is long, so read the terminal output first.

## What it writes

| File | What it's for |
|---|---|
| `status.png` | The result, as a status screen. Show this to the person if they can see files |
| `sheet.png` | What to look at for the Eye rules: the frame, what moved, its suspects, phone size, up close, and its colours. Open it with the Read tool |
| `eye.md` | The Eye rules, to tick off |
| `frame.png` | The frame that was judged |
| `report.json` | Every number, and the rule each one belongs to |
| `jump-1.png` | Only if something popped in the long run: the frame before and the frame after, one above the other |

## What the ranks mean

| Rank | What it takes | What to say |
|---|---|---|
| **S** | Everything in A, and every Eye rule walked, with a note on each | Cleared, and looked at |
| **A** | No machine rule fails. Excused Customs don't count against it | The machine has no complaints. It hasn't looked |
| **B** | 1 to 3 Customs fail | Close |
| **C** | More than 3 Customs fail | Getting there |
| **D** | Any Law fails | It isn't in this style yet |

**A rank is a floor, not a compliment.** Rank S means nothing was found and somebody looked. It doesn't mean it's beautiful, and a scene can clear every rule and be dull. Never say a scene is good because of its rank.

## Fixing what it finds

Each gremlin comes with what it found, the limit, what to try, and where in the code when it can tell.

```
✗ M5 Custom. The world doesn't pulse.
    Found: a beat changes 7.5% of the frame (wanted at most 3%)
    Try: Only small things touch the beat: an LED string, a monitor. Take flashy() out of big glows
```

Fix Laws first, then Customs, and run it again. Don't move the limits to get a pass. If a limit's really wrong, it's wrong for everyone: fix it in `rules.md` and the check, run the self-test, run `docs/calibrate.sh`, and say why.

## Breaking a Custom on purpose

A Custom is a strong habit, and sometimes the scene is right to break it. Say so on the page, and say why:

```html
<script>window.PAINTED_PIXELS_EXCUSES = {C5: "the ground melts into the page"};</script>
```

It shows as excused, not as passed, and you still have to tell the person when you hand the work over. `assets/examples/cabin.html` does this: its nearest ground is painted in the page's own colour so that the scene has no bottom edge, and that's a big flat patch. Laws can't be excused. Excusing something because you can't fix it isn't what this is for.

## Walking the Eye list

The machine can't tell whether the bright side of a tree faces the moon. Those rules go in `eye.md`.

1. Open `sheet.png` with the Read tool. It's arranged so that the frame, what moved, the suspects and phone size are all in one picture.
2. Take the rules in order. Each one says what to look at, and some need a strip of frames from `look.mjs`.
3. Tick a rule only once you've really looked, and write what you saw: `- [x] L2 ... note: the moon's upper left, and every pine is lit on that side`. A note under 12 characters doesn't count.
4. A problem stays unticked until it's fixed. If you change the art, untick what that touches.
5. Run the referee again, with the same `--out`. It reads your ticks from there, and they stay.

**If you can't look at something, leave it unticked and say so.** Rank A and an honest "I couldn't judge the walk from stills" is worth much more than an S you talked yourself into. You can't watch motion here, so anything about how motion feels goes under "Still in the fog", even with a tick beside it.

**A second opinion.** You've been looking at this for an hour, and you wrote the notes. For anything that matters, hand a fresh agent `sheet.png` and `eye.md` with the notes blanked, ask what's wrong with it in plain words, and compare. Give it the picture and not your conclusions, or it will agree with you.

## What it can't see

- **Whether it's any good.** It has no taste.
- **What it didn't run into.** It plays every rare sight and action once, on one seed, from one starting point. In a quick run, it only sees what happened to turn up.
- **How motion feels.** It knows that something moved and how much, not whether a walk looks stiff.
- **A real phone.** The phone run is Chrome pretending, at the size of a large iPhone. It doesn't catch Safari's quirks, and its cost number comes from this machine.
- **Sound.** The beat test fires a beat by hand. It says what reacts, not whether it suits the song.

**Pages that don't use the kit.** Everything measured from pixels still works, such as colour, flat fills, seams, motion and blur. The checks that need the kit's own parts say N/A rather than pass: the light, rare sights, people, and the long run. So a page written from scratch gets a shorter exam, and its rank means less. Say so.

## Why these numbers

The limits weren't guessed. Lofi Studio's git history still runs, so the referee can be pointed at each old version: what people complained about should fail, and what they liked should pass. To run it again:

```bash
bash docs/calibrate.sh path/to/lofi-studio out-folder
```

Each row is a quick look at every world in that version, so there's no long run, reduced motion, phone or cost in it. "×8" means eight of the worlds failed that rule.

| Version | What changed | Ranks, and failures per world | What failed |
|---|---|---|---|
| `45030b1` | The first castle, on its own | D, 5 failures | C4 C5 D1 L1 M3 |
| `f152449` | Every album gets a scene | 8 D, 5 to 7 | C4×8 C5×8 D1×4 G3 L1×8 M1 M3 M4×7 M5 P2×8 |
| `85e7961` | Repainted in hi-bit | 8 D, 3 to 7 | C4×4 C5×2 D1×3 L1×8 M1 M3 M4×7 M5 P2×8 |
| `02222d4` | Softer clouds, deeper parallax | 8 D, 3 to 5 | C4×3 C5 D1×2 L1×8 M1 M4×6 M5×2 P2×8 |
| `93e0785` | Real trees, calmer castle lights | 8 D, 2 to 5 | C4×3 C5 D1×2 L1×8 M1 M4×6 M5 P2×8 |
| `df0ba6b` | Deep foliage, and wind | 8 D, 3 to 6 | C4×2 C5 D1 L1×8 M2×8 M4×6 M5 P2×8 |
| `87455fb` | No more bouncing, small human moments | 8 D, 2 to 5 | C4×2 C5 D1 L1×8 M2×8 M5 |
| `6a61202` | Gusts, wildlife, things to do | 8 D, 1 to 3 | C5 D1 G3 L1×8 M5 |
| `c9ee540` | Clouds that change | 8 D, 1 to 2 | G3 L1×8 M3 M5 |
| `51503c3` | The light written down first | 5 A, 2 B, 1 D | G3 M3 M5 |
| `b61438b` | Every cloud gets its turn, and clouds dim what moves | 6 A, 2 B | M3 M5 |
| `47684ff` | What the referee found, fixed | 8 A | None |

A full check of `47684ff`, on two different seeds, gives Rank A in seven worlds and Rank B in the park, on cost. Everything before `51503c3` is Rank D for at least one reason, L1, since the light wasn't written down yet. That's why it's worth reading the failure counts as well as the rank.

**What people said, and what the referee says about that version:**

| What people said | The version | Caught? |
|---|---|---|
| "i was hoping for this style vs our traditional pixels" | `f152449` | Yes. C4: 41 to 87 colours in a frame. C5: flat patches over as much as 93% of it |
| "the character bounces a lot in every scene" | until `df0ba6b` | Yes. M4: a beat moves 63 to 418 pixels around them, in six or seven worlds of eight. None at `87455fb`, when it was fixed |
| "i was hoping for subtle motion and feeling of being alive" | until `df0ba6b` | Yes. P2 in all eight, until `87455fb` |
| "the lights turning off and on in the castle seem too fast" | `02222d4` | Yes. M5: a beat changes 3.5% of the castle. Under the limit at `93e0785`, when they calmed down |
| "I'm big on the lighting too" | until `c9ee540` | Partly. L1 in all eight says the light isn't written down. Whether it's right is L2, which takes an eye |
| "waves dont feel like they have any froth or foam" | `87455fb` | Partly. D1: the sea ends in a straight line across the whole frame. Froth takes an eye |
| "we arent doing this right", of foliage, layers and shading | `93e0785` | Barely. C4 in three of the worlds, at 167 to 276 colours. The rest takes an eye |
| "the trees just look like balls/spheres connected" | `02222d4` | No |
| "too many spheres attached together", of the clouds | `85e7961` | No |

So the machine catches about what you'd expect: what can be counted. The Eye rules are there for the rest.

**And what nobody had said.** The referee also found things in the old versions that people had lived with: wind that was never calm, in all eight worlds at `df0ba6b` and `87455fb` (M2). A moon's halo and the torches leaping on every beat, 134 times in 24 seconds, on the first castle (M3). Clouds appearing from nothing in the garden, about a minute into a long run, at `51503c3` (M3).

## The referee checked too

`node scripts/validate.mjs --selftest` runs `scripts/fixtures/`: a page for each check, made to break just that rule, as well as the starter and the cabin, which must break no Law. If a check stops catching its example, or something good gets flagged, it says so. It ends with "Every check has been seen to catch something", or names the ones that haven't.

**Real things it found in the app, on its first day.** They had all shipped, and somebody had looked at every one of those worlds many times:

- **A fishing rod and a beach flag at fractions of a pixel** (G3). Both smeared and shimmered as they moved.
- **Someone who kept walking for people who'd asked for less motion** (M8), at the castle and on the beach, so the whole world scrolled past them. Rain kept falling in the office too, and the campfire kept its full flicker.
- **A coffee shop whose lamps pulsed with the beat** (M5), across 7.5% of the frame. Chasing a smaller reading at the castle turned up the glow round its moon doing the same.
- **A shadow that snapped** (M3), on the beach, from standing up to lying down, as someone walked past the point under the sun.
- **A black cat that could stay on the castle wall for minutes** (M9). It walks at about the speed the world scrolls, so walking our way, it nearly stands still. It only turned up on the third run, because that's when the dice sent it that way. It's why a clean run isn't proof, and why `--seed` exists.
- **A park that's a little over budget** (K1), at 5.3 to 5.5 ms a frame. That one's still there, so the park is Rank B.

**And what it found in itself.** The self-test caught a leak check that missed slow leaks. Pointing it at the old versions showed that its pop check couldn't see the starved clouds that first prompted it: it watched for too short a time, allowed one pop, and let grass in the wind hide a whole cloud appearing in the sky. Now it watches the whole long run, part by part of the frame, and it caught them. Check the checker.
