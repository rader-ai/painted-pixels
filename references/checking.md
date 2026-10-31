# Checking: get up close, then step back

You can't judge pixel art from code. Looking is the job, and it's three different kinds of looking. The feedback at the start of all this was "take your time, get up close and personal with pixels... take the time like an artist would on each individual element".

## The tool

`scripts/look.mjs` opens the page in muted headless Chrome with a hand-stepped clock, so the same command shows the same pixels every time and nothing plays out loud. It needs Node and Chrome. Run `npm install` in this skill's `scripts/` folder once. The commands below are written from the skill's folder, and they work from anywhere if you give the full path to `look.mjs`.

```bash
# one frame, at 2x
node scripts/look.mjs shot --page path/to/page.html --place forest --at 6 --out a.png

# one element, up close
node scripts/look.mjs shot --place park --crop 430,40,210,190 --zoom 4 --out tree.png

# frames across time, with a timestamp on each
node scripts/look.mjs strip --place beach --n 6 --gap 1.2 --crop 0,180,640,90 --zoom 1 --out surf.png

# ask for a rare sight or an action now
node scripts/look.mjs strip --place beach --sight beachSea:whale --n 12 --gap .95 --crop 0,60,640,160 --zoom 1 --out whale.png
node scripts/look.mjs strip --place forest --act smoreFire --n 12 --gap 1.75 --crop hero --out smore.png

# a recording, as numbered PNGs: to step through, or to put in your own README
node scripts/look.mjs clip --place beach --seconds 8 --loop 8 --out frames

# what it costs, and what it looks like on a phone and as still cover art
node scripts/look.mjs perf
node scripts/look.mjs phone --place cafe --out phone.png
node scripts/look.mjs cover --place forest --coverx 100 --out cover.png

# every sight and action to its end, then a long run: do things end, and do the caches stop growing?
node scripts/look.mjs soak --place forest

# the rig itself
node scripts/look.mjs poses --out poses.png
node scripts/look.mjs walk --out walk.png
```

Without `--page`, it opens the nearest `index.html` going up from where you are. `--place` and `--who` only mean something in Lofi Studio, and `hero` and `--crop` assume the canvas shows the whole world. Crops are canvas pixels. `--seed 7` makes the same command give exactly the same pixels, so you can diff two runs. In Lofi Studio it starts everything over once the app has loaded, which skips anything that only happens on arrival, like the first wink. Strips stay under 2000 pixels wide unless you pass `--cols`, because the Read tool shrinks anything wider. Any page errors are printed at the end and set a failing exit code, so read them. View the PNGs with the Read tool.

## Three kinds of looking

**1. Up close: are these good pixels?** Crop one element at 4× to 6× and look at it pixel by pixel.

- Are there stray pixels, or a hole in a shape?
- Does an edge have jaggies where it should curve? Is a straight line accidentally a staircase?
- Are there colours that aren't on a ramp? Blur from anti-aliasing?
- Does its shading follow one form, or is it several shapes stuck together?
- Does anything repeat?

**2. In place: does it belong here?** A full frame at 2×.

- Follow the light to it. Is the bright side on the right side? Does its shadow fall away from the light? `light.md` ends with a full list for light.
- Does its contrast and saturation match its distance?
- Does it sit on the ground? Has it got a shadow, and is that going the right way?
- Is it in front of and behind the right things?
- Does it steal attention from what should have it?
- Put the world's own gallery picture next to it. Is it the same quality as what's around it?

**3. At real size: does it read?** `look.mjs phone`. A person is about 16×25 points.

- Can you tell what it is?
- Does the gesture show in the silhouette?
- Does the dither turn to mush or to crosshatch?

## Judging motion

You can't watch a video here, so judge motion from strips, and be honest that that's what you did.

- **Strip across a gesture:** every pose should read, and there should be no pop between frames.
- **Strip across a long time:** take frames many seconds apart. Is most of it still in most of them? If everything has moved in every frame, it's too busy.
- **Numbers:** for "does this move on the beat", measure instead of guessing: record the pose values over 40 seconds and compare the average position on and off the beat. For wind, sample `WIND(x)` over a few minutes and see how much of the time it's near zero. `look.mjs probe --expr "WIND(100)" --n 120 --gap 2` prints any value over time.
- **Compare neighbours:** diff two frames to see exactly what's changed. If the moon's moved more than the grass, something's wrong.
- **Say what you couldn't check.** A strip tells you about poses and timing, but not how it feels. When handing work over, say so, and say which things are most likely to need tuning.

## Before calling it done

- [ ] No page errors, in `shot` and `strip`.
- [ ] Each moving thing checked with a strip; each rare sight and action forced and watched end to end, including how it **ends**.
- [ ] Both characters, if a person's involved: `--who guy`, `--who girl`.
- [ ] The list at the end of `light.md`: follow the light to everything, film something moving through it, and cover the source.
- [ ] `perf` under 5 ms a frame, and no worse than before if you changed something existing.
- [ ] `soak` passes: everything ends by itself, and the caches level off.
- [ ] Strips at close gaps show no pops. The stepped clock runs at 20 to 30 frames a second, so it shows what a fast machine hides and a slow phone doesn't: a big change between two frames half a second apart is a bug.
- [ ] Reduced motion looks right as a still: `look.mjs shot --reduced`.
- [ ] Rain on, if it's outdoors: `--rain`.
- [ ] Phone size checked.
- [ ] In Lofi Studio, the same scene as album cover art (`look.mjs cover --coverx 96`): `k.live` is false there, and a cover's a square crop.

## Safari

Plenty of people will open this on an iPhone. A page that's fine in Chrome is usually fine in Safari here, but check a real page load in WebKit when something's changed about the runtime rather than the art. Playwright's WebKit needs the copy of `playwright-core` that matches the installed browser. If you can't test on a real iPhone, say so.

## In Lofi Studio

- After visible scene changes, the app's README recordings go stale: its `docs/readme/tools/make.sh` rebuilds them all (about 16 minutes, adds about 20 MB to git history, so batch them). Each world's staged moment is in `scenes.mjs`, in `stage()`.
- This skill's kit and pictures are copied from the app, so they go stale too. Run these from the skill's folder, with a checkout of Lofi Studio beside it:

```bash
node scripts/build-kit.mjs ../lofi-studio/index.html       # after toolkit changes
bash scripts/build-gallery.sh ../lofi-studio/index.html    # after the art changes
bash docs/make.sh ../lofi-studio/index.html                # the clips on this skill's own front page
```
