// Look at a pixel world up close: frames on a hand-stepped clock, in muted headless Chrome, so the
// same command shows the same pixels every time and nothing plays out loud. Needs Node and Chrome;
// run `npm install` in this folder once.
//
//   node look.mjs shot   [common] [--at 5] [--zoom 2] --out a.png            one frame
//   node look.mjs strip  [common] --n 12 --gap .5 [--crop x,y,w,h|hero] [--zoom 3] [--cols 3] --out a.png
//                                                                            frames across time, --gap seconds apart
//   node look.mjs clip   [common] --seconds 6 [--gap .06] [--loop 8] [--crop x,y,w,h|hero] [--zoom 2] --out folder
//                                                                            a recording, as numbered PNGs, --gap seconds apart
//                                                                            (played back at 60 ms a frame, a bigger gap is a time-lapse)
//   node look.mjs probe  [common] --expr "LIGHTS.park.veiled" --n 60 --gap 2 a number over time, for what a picture can't show
//   node look.mjs perf [common]                                            ms to draw a frame, and to paint a place
//   node look.mjs phone  [common] [--at 1.5] --out a.png                     real size on a phone
//   node look.mjs cover  [common] [--coverx 96] --out a.png                  a place as still cover art
//   node look.mjs soak   [common] [--minutes 4]                              every sight and action to its end, then a long
//                                                                            run: do things end, and do the caches stop growing?
//   node look.mjs poses  [--page f] [--spec poses.json] [--zoom 5] --out a.png   the rig, big
//   node look.mjs walk   [--page f] [--gait walk|jog] [--n 16] --out a.png   one walk cycle, against ground marks
//
// common: --page file.html   the page to open (default: the nearest index.html going up from where you are)
//         --place forest     which of PLACES to show (default: whatever the page shows; for perf, all)
//         --who guy|girl     --rain (make it rain). --place and --who only mean something in Lofi Studio.
//         --sight lane:name[,lane:name]   ask a rare() lane for a sight now, as in forestSky:comet
//         --act name         start an action from ACTIONS now, as in smoreFire. --actat 5 starts it 5 seconds in
//         --at 8 --skip 3    wait 8 seconds, ask for the sight or action, wait 3 more, then start the pictures
//         --seed 7          the same command gives the same pixels. In Lofi Studio this starts everything over,
//                            once it has loaded. On your own page the clock is ours from the first line, so nothing is lost.
//         --reduced          open the page as someone who prefers reduced motion
// Crops are canvas pixels (the 640x300 canvas, not the 320x150 grid). `hero` crops around the person.
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import('playwright-core').catch(() => {
  console.log(`Run npm install in ${dirname(fileURLToPath(import.meta.url))} once, then try again.`);
  process.exit(1);
});
const [cmd, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i++){
  if (!rest[i].startsWith('--')) continue;
  const name = rest[i].slice(2), next = rest[i + 1];
  opt[name] = next === undefined || next.startsWith('--') ? true : (i++, next);
}
if (!cmd || !['shot', 'strip', 'clip', 'probe', 'perf', 'phone', 'cover', 'soak', 'poses', 'walk'].includes(cmd)){
  console.log(`Usage: the top of ${fileURLToPath(import.meta.url)} lists every command.`);
  process.exit(cmd ? 1 : 0);
}

function findPage(){
  if (opt.page) return resolve(opt.page);
  for (let d = process.cwd(); ; d = dirname(d)){
    if (existsSync(join(d, 'index.html'))) return join(d, 'index.html');
    if (d === dirname(d)) throw new Error('No --page given, and no index.html here or above. Say which page with --page.');
  }
}
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.css': 'text/css', '.json': 'application/json'};
function serve(root){
  return new Promise(done => {
    const server = createServer(async (req, res) => {
      try {
        const body = await readFile(join(root, decodeURIComponent(req.url.split('?')[0])));
        res.writeHead(200, {'content-type': TYPES[extname(req.url.split('?')[0])] || 'application/octet-stream'});
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    }).listen(0, '127.0.0.1', () => done(server));
  });
}

// Takes over the clock inside the page. Everything else is the page's own code.
const takeOver = ({place, who, rain, seed}) => {
  const inApp = typeof VIBES !== 'undefined', early = window.__clock;
  // the page's frame loop is waiting on the browser's next frame: let that come, so the loop lands in our queue
  const clock = early || {q: [], now: performance.now()}, q = clock.q, browserFrame = window.requestAnimationFrame.bind(window), settled = early ? Promise.resolve() : new Promise(done => browserFrame(() => browserFrame(done)));
  if (!early){ window.requestAnimationFrame = f => q.push(f); performance.now = () => clock.now; }
  let beats = 0;
  if (inApp){
    if (typeof A === 'undefined' || !A || !A.fft){ const bins = new Float32Array(64).map((_, i) => -60 + 30 * Math.sin(i)); A = {fft: {getValue: () => bins}}; }
    playing = true;
    state = makeState(PRESETS[VIBES.find(v => VIBE_PLACE[v] === place) || VIBES[0]]);
    state.seed = 4242;
  }
  // an older copy of the app has these without the rest
  if (place && typeof activeSceneId !== 'undefined') activeSceneId = () => place;
  if (who && typeof charPick !== 'undefined') charPick = who;
  if (rain) state.layers.rain.on = true;
  if (typeof life !== 'undefined') life.awake = true;
  if (seed && inApp){
    // start from nothing: whatever happened while the page loaded mustn't show in the pictures
    clock.now = 1e6; Math.random = mulberry32(seed);
    for (const key of Object.keys(pst)) delete pst[key];
    Object.assign(wind, {gusts: [], wait: 1.2, dir: 1, turn: 150}); windy = 1;
    Object.assign(scene, {scroll: 0, walk: 0, nudge: 0, beat: 0, q: 0, flash: 0, step: 0, notes: [], last: clock.now / 1000});
    Object.assign(life, {sid: null, who: null, met: false, arrived: true, localBag: [], bag: [], clock: 0, tip: [0, 0], next: null, act: null, name: '', at: 0, rate: 1, wait: 99, nod: 0, soft: null, breath: 0, blinkIn: 2, blink: 0, tilt: 0, tiltTo: 0, tiltIn: 4, fx: [], sneezed: 0});
  }
  const look = window.__look = {
    tick(dt){
      clock.now += dt * 1000;
      if (inApp){
        const before = beats;
        beats += dt * state.bpm / 60 * 2;
        if (Math.floor(beats) !== Math.floor(before)) sceneBeat(Math.floor(beats) % 2 === 0);
      }
      for (const f of q.splice(0)) f(clock.now);
    },
    warm(s){ for (let x = 0; x < s; x += .05) look.tick(.05); },
    canvas: document.getElementById('viz') || document.querySelector('canvas'),
    sight(list){ for (const f of String(list).split(',')){ const [lane, name] = f.split(':'); (pst[lane] ||= {wait: 1e9, now: null, bag: []}).force = name; } },
    act(name, at = 0){ life.met = true; life.wait = 1e9; life.act = ACTIONS[name]; life.name = name; life.at = at; life.rate = 1; },
    quiet(){ life.met = true; life.wait = 1e9; },
  };
  return settled;
};

async function open(extra = {}){
  const file = findPage(), root = dirname(file), text = await readFile(file, 'utf8'), inApp = /\bconst VIBES\b/.test(text);
  // better to stop than to hand back a nice picture of the wrong world
  if ((opt.place && !/\bactiveSceneId\b/.test(text)) || (opt.who && !/\bcharPick\b/.test(text))){
    console.log('--place and --who only mean something in Lofi Studio. On your own page, change the page.');
    process.exit(1);
  }
  const server = await serve(root);
  const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio']});
  const context = await browser.newContext({...(extra.context || {viewport: {width: 1280, height: 800}, deviceScaleFactor: 1}), ...(opt.reduced ? {reducedMotion: 'reduce'} : {})});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (extra.init) await context.addInitScript(extra.init);
  // On any page but the app, which has a splash that needs real frames, the clock is ours from the first line.
  if (!inApp && !extra.realClock) await context.addInitScript(seed => {
    const clock = window.__clock = {q: [], now: 1e6};
    window.requestAnimationFrame = f => clock.q.push(f);
    performance.now = () => clock.now;
    if (seed){ let a = seed; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  }, +opt.seed || 0);
  await page.goto(`http://127.0.0.1:${server.address().port}/${basename(file)}`);
  // a page that threw while loading may never finish: say why, right away, instead of timing out
  for (let waited = 0, errorAt = 0; ; waited += 250){
    if (await page.evaluate(() => !document.getElementById('splash'))) break;
    if (errors.length && !errorAt) errorAt = waited;
    if ((errorAt && waited - errorAt > 3000) || waited > 60000){
      console.log(errors.length ? 'The page threw while loading:' : 'The page never finished loading (its #splash is still there), with no error.');
      for (const e of errors) console.log('  ' + e);
      await browser.close(); server.close(); process.exit(1);
    }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(300);
  return {page, errors, done: async () => { await browser.close(); server.close(); }};
}
const save = (path, b64) => writeFile(path, Buffer.from(b64, 'base64'));
const report = errors => { if (errors.length){ console.log('PAGE ERRORS:'); for (const e of [...new Set(errors)]) console.log('  ' + e); process.exitCode = 1; } };
const setup = {place: opt.place, who: opt.who, rain: !!opt.rain, seed: +opt.seed || 0};

if (cmd === 'shot' || cmd === 'strip'){
  const {page, errors, done} = await open();
  await page.evaluate(takeOver, setup);
  const n = cmd === 'shot' ? 1 : +(opt.n || 8), gap = +(opt.gap || .5), zoom = +(opt.zoom || (cmd === 'shot' ? 2 : 3));
  const b64 = await page.evaluate(({n, gap, zoom, crop, at, skip, sight, act, actat, cols: wanted}) => {
    const look = __look, src = look.canvas;
    look.warm(+at);
    if (sight) look.sight(sight);
    if (act) look.act(act, +actat); else if (sight) look.quiet();
    look.warm(+skip);
    look.tick(.05);
    const c = crop === 'hero' ? [Math.round(scene.heroX * 2) - 40, Math.round(scene.heroY * 2) - 34, 150, 90]
      : crop ? String(crop).split(',').map(Number) : [0, 0, src.width, src.height];
    // no wider than 2000 pixels unless asked: the Read tool shrinks anything bigger, and the detail goes
    const cols = wanted || Math.max(1, Math.min(n, Math.floor(2000 / (c[2] * zoom)))), rows = Math.ceil(n / cols);
    const cv = Object.assign(document.createElement('canvas'), {width: cols * c[2] * zoom, height: rows * c[3] * zoom}), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false; g.font = '12px monospace';
    for (let i = 0; i < n; i++){
      if (i) for (let t = 0; t < gap - 1e-6; t += .033) look.tick(.033);
      const X = (i % cols) * c[2] * zoom, Y = Math.floor(i / cols) * c[3] * zoom;
      g.drawImage(src, c[0], c[1], c[2], c[3], X, Y, c[2] * zoom, c[3] * zoom);
      if (n > 1){ g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(X, Y, 40, 16); g.fillStyle = '#fff'; g.fillText((i * gap).toFixed(1) + 's', X + 3, Y + 12); }
    }
    return cv.toDataURL('image/png').split(',')[1];
  }, {n, gap, zoom, crop: opt.crop, at: opt.at || 3, skip: opt.skip || 0, sight: opt.sight, act: opt.act, actat: opt.actat || 0, cols: +opt.cols || 0});
  await save(opt.out || 'look.png', b64);
  report(errors);
  await done();
}

if (cmd === 'clip'){
  // A recording, as numbered PNGs, to encode however you like: img2webp -loop 0 -lossless -min_size -d 60 frames/*.png -o a.webp
  // --loop 8 dissolves the last 8 frames into what came just before the first, so there's no seam.
  const {page, errors, done} = await open();
  await page.evaluate(takeOver, setup);
  const dir = resolve(opt.out || 'clip'), gap = +(opt.gap || .06), n = Math.round(+(opt.seconds || 6) / gap);
  await mkdir(dir, {recursive: true});
  await page.evaluate(({gap, zoom, overlap, crop, at, skip, sight, act, actat}) => {
    const look = __look, src = look.canvas;
    look.warm(+at);
    if (sight) look.sight(sight);
    if (act) look.act(act, +actat); else if (sight) look.quiet();
    look.warm(+skip);
    look.tick(.05);
    const c = crop === 'hero' ? [Math.round(scene.heroX * 2) - 40, Math.round(scene.heroY * 2) - 34, 150, 90]
      : crop ? String(crop).split(',').map(Number) : [0, 0, src.width, src.height];
    const part = Object.assign(document.createElement('canvas'), {width: c[2], height: c[3]}), pg = part.getContext('2d', {willReadFrequently: true});
    const out = Object.assign(document.createElement('canvas'), {width: c[2] * zoom, height: c[3] * zoom}), og = out.getContext('2d');
    og.imageSmoothingEnabled = false;
    // however far apart the frames are, the page sees small steps, or its own limit on a step would slow the scene down
    const steps = Math.ceil(gap / .06 - 1e-6), advance = () => { for (let s = 0; s < steps; s++) look.tick(gap / steps); pg.drawImage(src, c[0], c[1], c[2], c[3], 0, 0, c[2], c[3]); };
    const lead = [], BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let i = 0; i < overlap; i++){ advance(); lead.push(pg.getImageData(0, 0, c[2], c[3])); }
    look.frame = (i, total) => {
      advance();
      const j = i - (total - overlap);
      if (j >= 0){
        // an ordered dither in the scene's own 2px cells, so the dissolve looks painted too
        const p = (j + 1) / (overlap + 1), img = pg.getImageData(0, 0, c[2], c[3]), to = lead[j].data;
        for (let y = 0; y < c[3]; y++) for (let x = 0; x < c[2]; x++)
          if ((BAYER[((y + c[1] >> 1) & 3) * 4 + ((x + c[0] >> 1) & 3)] + .5) / 16 < p){ const q = (y * c[2] + x) * 4; img.data[q] = to[q]; img.data[q + 1] = to[q + 1]; img.data[q + 2] = to[q + 2]; }
        pg.putImageData(img, 0, 0);
      }
      og.drawImage(part, 0, 0, c[2] * zoom, c[3] * zoom);
      return out.toDataURL('image/png').split(',')[1];
    };
  }, {gap, zoom: +(opt.zoom || 1), overlap: +(opt.loop || 0), crop: opt.crop, at: opt.at || 3, skip: opt.skip || 0, sight: opt.sight, act: opt.act, actat: opt.actat || 0});
  for (let i = 0; i < n; i++) await save(join(dir, String(i).padStart(4, '0') + '.png'), await page.evaluate(([i, n]) => __look.frame(i, n), [i, n]));
  console.log(`${n} frames in ${dir}`);
  report(errors);
  await done();
}

if (cmd === 'probe'){
  const {page, errors, done} = await open();
  await page.evaluate(takeOver, setup);
  const at = +(opt.at || 3), gap = +(opt.gap || 1);
  await page.evaluate(({at, sight, act}) => {
    __look.warm(at);
    if (sight) __look.sight(sight);
    if (act) __look.act(act); else if (sight) __look.quiet();
  }, {at, sight: opt.sight, act: opt.act});
  for (let i = 0, n = +(opt.n || 20); i < n; i++){
    if (i) await page.evaluate(gap => __look.warm(gap), gap);
    console.log(`${(at + i * gap).toFixed(1)}s ${JSON.stringify(await page.evaluate(opt.expr))}`);
  }
  report(errors);
  await done();
}

if (cmd === 'perf'){
  const {page, errors, done} = await open();
  await page.evaluate(takeOver, setup);
  const res = await page.evaluate(({place}) => {
    const real = () => Performance.prototype.now.call(performance), out = {};
    const pg = Object.assign(document.createElement('canvas'), {width: 1, height: 1}).getContext('2d', {willReadFrequently: true});
    const known = typeof PLACES === 'undefined' ? [] : Object.keys(PLACES), places = place ? [place] : known.length ? known : ['this page'];
    for (const id of places){
      if (typeof VIBES !== 'undefined') activeSceneId = () => id;
      __look.warm(2);
      const t0 = real();
      // copying a pixel off to its own little canvas makes the browser finish the drawing before the clock stops.
      // Reading the page's own canvas would too, but after a few hundred reads the numbers jump tenfold
      for (let f = 0; f < 120; f++){ __look.tick(.033); pg.drawImage(__look.canvas, 0, 0, 1, 1, 0, 0, 1, 1); pg.getImageData(0, 0, 1, 1); }
      const frame = +((real() - t0) / 120).toFixed(2);
      // and the once-only painting, with sprite caches already warm
      const pl = known.includes(id) ? PLACES[id] : {}, t1 = real();
      for (const part of ['sky', 'bg', 'front']) if (pl[part]) pl[part](painter());
      out[id] = {frame, paintOnce: Math.round(real() - t1)};
    }
    return out;
  }, {place: opt.place});
  console.log('ms:', JSON.stringify(res));
  console.log('One run is a rough number. Run it twice, with nothing else busy.');
  report(errors);
  await done();
}

if (cmd === 'phone'){
  // the size people really see: a big iPhone, 440 points wide at 3x, on the page's own clock
  // the app slides the scene sideways on a first visit, to hint at swiping, which looks like a bug in a picture
  const {page, errors, done} = await open({realClock: true, init: () => { try { localStorage.setItem('lofi.swiped', '1'); } catch (e) {} }, context: {viewport: {width: 440, height: 852}, deviceScaleFactor: 3, hasTouch: true, isMobile: true}});
  const box = await page.evaluate(({place, who}) => {
    if (typeof VIBES !== 'undefined' && place) activeSceneId = () => place;
    if (typeof VIBES !== 'undefined' && who) charPick = who;
    const c = document.getElementById('viz') || document.querySelector('canvas'), r = c.getBoundingClientRect();
    // only what's in view: a page may crop a wide world by sliding the canvas along behind a window
    const x = Math.max(0, r.left), y = Math.max(0, r.top);
    return {x, y, width: Math.min(innerWidth, r.right) - x, height: Math.min(innerHeight, r.bottom) - y, shown: r.width, canvas: c.width};
  }, {place: opt.place, who: opt.who});
  await page.waitForTimeout(+(opt.at || 1.5) * 1000);
  await page.screenshot({path: opt.out || 'phone.png', clip: {x: box.x, y: box.y, width: box.width, height: box.height}});
  const scale = box.shown / box.canvas;
  console.log(`${box.width.toFixed(0)}x${box.height.toFixed(0)} points of it show${box.width < box.shown - 1 ? `, out of ${box.shown.toFixed(0)} across` : ''}; one canvas pixel is ${scale.toFixed(2)} points. A person (24x41 canvas pixels) is about ${(24 * scale).toFixed(0)}x${(41 * scale).toFixed(0)} points.`);
  report(errors);
  await done();
}

if (cmd === 'cover'){
  // drawn still, as an album cover or a thumbnail is: rare sights stay away, and nothing advances
  const {page, errors, done} = await open();
  await page.evaluate(takeOver, setup);
  const b64 = await page.evaluate(({place, who, coverx, zoom}) => {
    const id = place || (typeof activeSceneId === 'function' ? activeSceneId() : Object.keys(PLACES)[0]);
    __look.warm(1);
    const src = Object.assign(document.createElement('canvas'), {width: DW, height: DH}), g = src.getContext('2d');
    g.imageSmoothingEnabled = false;
    const k = ck(g); k.who = who || (typeof whoFor === 'function' ? whoFor(id) : 'guy'); k.light = LIGHTS[id];
    PLACES[id].draw(g, 1, 0, k);
    const X = coverx === undefined ? 0 : +coverx * HD, W = coverx === undefined ? DW : DH;
    const out = Object.assign(document.createElement('canvas'), {width: W * zoom, height: DH * zoom}), o = out.getContext('2d');
    o.imageSmoothingEnabled = false;
    o.drawImage(src, X, 0, W, DH, 0, 0, W * zoom, DH * zoom);
    return out.toDataURL('image/png').split(',')[1];
  }, {place: opt.place, who: opt.who, coverx: opt.coverx, zoom: +(opt.zoom || 2)});
  await save(opt.out || 'cover.png', b64);
  report(errors);
  await done();
}

if (cmd === 'soak'){
  const {page, errors, done} = await open();
  await page.evaluate(takeOver, setup);
  const res = await page.evaluate(({minutes}) => {
    const look = __look, lanes = {}, realRare = rare, out = {stuck: [], ran: 0, caches: {}, grew: [], blank: false};
    rare = (k, t, dt, key, sights, gap) => { lanes[key] = sights; return realRare(k, t, dt, key, sights, gap); };
    look.warm(1);
    // every rare sight, from start to finish
    for (const [lane, sights] of Object.entries(lanes)) for (const name of Object.keys(sights)){
      look.sight(lane + ':' + name); look.tick(.05);
      let s = 0;
      while (pst[lane].now && s < 150){ look.tick(.05); s += .05; }
      if (pst[lane].now){ out.stuck.push(`${lane}:${name}`); pst[lane].now = null; }
      out.ran++;
    }
    // every action, from start to finish
    for (const name of Object.keys(ACTIONS)){
      look.act(name);
      for (let s = 0; s < ACTIONS[name].dur + .2; s += .05) look.tick(.05);
      out.ran++;
    }
    life.wait = 2;
    // then just leave it running, watching what's held on to
    const caches = {GLOWS: 0, POSES: 0, HEADS: 0, PALETTES: 0, CLUMPS: 0, MODELS: 0, TUFTS: 0, FLOWERS: 0, FRONDS: 0, BIRDS: 0, SHAPES: 0, HD_SPRITES: 0, CONES: 0, MOONS: 0};
    const sizes = () => { const o = {}; for (const n of Object.keys(caches)){ try { o[n] = eval(n).size; } catch (e) {} } return o; };
    const half = minutes / 2;
    for (let s = 0; s < half * 60; s += .05) look.tick(.05);
    const mid = sizes();
    for (let s = 0; s < half * 60; s += .05) look.tick(.05);
    const end = sizes();
    out.caches = end;
    for (const n of Object.keys(end)) if (end[n] > mid[n] * 1.15 + 8) out.grew.push(`${n}: ${mid[n]} -> ${end[n]}`);
    // a canvas that runs out of memory goes blank without any error
    const d = look.canvas.getContext('2d').getImageData(0, 0, look.canvas.width, look.canvas.height).data;
    let lit = 0; for (let i = 0; i < d.length; i += 400) if (d[i] + d[i + 1] + d[i + 2] > 0) lit++;
    out.blank = lit === 0;
    return out;
  }, {minutes: +(opt.minutes || 4)});
  console.log(`Ran ${res.ran} sights and actions to their end, then ${+(opt.minutes || 4)} minutes more.`);
  console.log('Caches:', JSON.stringify(res.caches));
  if (res.stuck.length) console.log('NEVER ENDED:', res.stuck.join(', '));
  if (res.grew.length) console.log('STILL GROWING:', res.grew.join('; '));
  if (res.blank) console.log('THE CANVAS WENT BLANK: usually too many cached canvases. Check the keys of whatever grew.');
  if (res.stuck.length || res.grew.length || res.blank) process.exitCode = 1;
  else console.log('Everything ended, and the caches levelled off.');
  report(errors);
  await done();
}

if (cmd === 'poses'){
  const {page, errors, done} = await open();
  const spec = opt.spec ? JSON.parse(await readFile(opt.spec, 'utf8')) : {cols: 8, poses: [
    {label: 'rest'}, {label: 'Q', view: 'Q'}, {label: 'F', view: 'F'}, {label: 'L', view: 'L'},
    {label: 'tilt -12', tilt: -12}, {label: 'tilt 9', tilt: 9}, {label: 'yawn', tilt: -12, mouth: 'wide', eyes: 'squint'}, {label: 'wink', view: 'F', eyes: 'wink', mouth: 'smile'},
  ]};
  const b64 = await page.evaluate(({spec, zoom}) => {
    const Z = zoom, CW = 60, CH = 76, cols = spec.cols || 8, list = spec.poses, who = spec.who || ['girl', 'guy'], rows = Math.ceil(list.length / cols) * who.length;
    const cv = Object.assign(document.createElement('canvas'), {width: cols * CW * Z, height: rows * CH * Z}), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false; g.fillStyle = spec.bg || '#6a6478'; g.fillRect(0, 0, cv.width, cv.height);
    const REST2 = {...REST, near: [9, 33], far: [15, 33]};
    who.forEach((name, w) => list.forEach((raw, i) => {
      const gx = (i % cols) * CW, gy = (Math.floor(i / cols) * who.length + w) * CH;
      const tmp = Object.assign(document.createElement('canvas'), {width: CW, height: CH}), t = tmp.getContext('2d');
      t.imageSmoothingEnabled = false;
      rigDraw(t, CHARS[name], {...REST2, ...raw}, 18, 22);
      g.drawImage(tmp, gx * Z, gy * Z, CW * Z, CH * Z);
      g.fillStyle = '#fff'; g.font = '16px monospace'; g.fillText(raw.label || String(i), gx * Z + 6, gy * Z + 18);
    }));
    return cv.toDataURL('image/png').split(',')[1];
  }, {spec, zoom: +(opt.zoom || 5)});
  await save(opt.out || 'poses.png', b64);
  report(errors);
  await done();
}

if (cmd === 'walk'){
  const {page, errors, done} = await open();
  const b64 = await page.evaluate(({gait, n}) => {
    const Z = 4, CW = 50, CH = 58, cols = 8, rows = Math.ceil(n / cols), G = GAITS[gait];
    const cv = Object.assign(document.createElement('canvas'), {width: cols * CW * Z, height: rows * CH * Z}), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false; g.fillStyle = '#c8a878'; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < n; i++){
      const u = i / n, tmp = Object.assign(document.createElement('canvas'), {width: CW, height: CH}), t = tmp.getContext('2d');
      t.imageSmoothingEnabled = false; t.fillStyle = '#b89868'; t.fillRect(0, 50, CW, 8);
      // marks fixed to the ground, moving with the walk: a planted foot must keep pace with them
      const scroll = u * 2 * G.step;
      for (let x = -40; x < 120; x += 10){ t.fillStyle = '#806040'; t.fillRect(Math.round(x - scroll + 80) % 200 - 60, 50, 1, 3); }
      rigDraw(t, CHARS.girl, {...REST, ...gaitPose(u, G)}, 14, 50 - RIG_GROUND);
      const gx = (i % cols) * CW, gy = Math.floor(i / cols) * CH;
      g.drawImage(tmp, gx * Z, gy * Z, CW * Z, CH * Z);
      g.fillStyle = '#000'; g.font = '14px monospace'; g.fillText(u.toFixed(2), gx * Z + 4, gy * Z + 14);
    }
    return cv.toDataURL('image/png').split(',')[1];
  }, {gait: opt.gait || 'walk', n: +(opt.n || 16)});
  await save(opt.out || 'walk.png', b64);
  report(errors);
  await done();
}
