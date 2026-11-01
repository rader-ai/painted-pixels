// The referee: runs a scene in muted headless Chrome on a hand-stepped clock, and checks it against
// references/rules.md. The rule book is the source of truth: this reads the rules from there, and it
// refuses to run if a machine rule has no check here, or a check here has no rule there.
//
//   node validate.mjs --page file.html [--out quest] [--seconds 24] [--minutes 3] [--quick] [--root folder] [--who guy|girl] [--seed 2026]
//   node validate.mjs --page lofi-studio/index.html --place forest      one world in Lofi Studio
//   node validate.mjs --page lofi-studio/index.html --place all          all of them, and a table
//   node validate.mjs --selftest                                         every check must catch its bad example
//
// --quick skips the long soak and the reduced-motion run. --root is the folder to serve, if the page loads
// files from above its own folder. To break a Custom on purpose, say so on the page, and it's excused:
//   <script>window.PAINTED_PIXELS_EXCUSES = {C5: "the ground melts into the page"};</script>
// It writes these into --out (default: a folder called quest next to the page, with one inside it per place when there's more than one):
//   status.png   the result, as a status screen
//   sheet.png    what to look at for the Eye rules: the frame, what moves, its colours, phone size, up close
//   frame.png    the frame that was judged
//   eye.md       the Eye rules, to tick off with a note saying what you saw. Rank S needs them all
//   report.json  every number, and the rule each one belongs to
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import('playwright-core').catch(() => {
  console.log(`Run npm install in ${dirname(fileURLToPath(import.meta.url))} once, then try again.`);
  process.exit(1);
});
const HERE = dirname(fileURLToPath(import.meta.url)), SKILL = resolve(HERE, '..');
const opt = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++){
  if (!argv[i].startsWith('--')) continue;
  const name = argv[i].slice(2), next = argv[i + 1];
  opt[name] = next === undefined || next.startsWith('--') ? true : (i++, next);
}

// ---- the rule book
export function readRules(file = join(SKILL, 'references/rules.md')){
  const rules = {};
  let chapter = '';
  for (const line of readFileSync(file, 'utf8').split('\n')){
    const head = line.match(/^## ([A-Z])\. (.+)$/);
    if (head){ chapter = head[2]; continue; }
    const row = line.match(/^\| ([A-Z]\d+) \| (Law|Custom) \| (.+?) \| (.*?) \| (.+?) \|$/);
    if (row) rules[row[1]] = {id: row[1], level: row[2], text: row[3].replace(/\*\*/g, ''), why: row[4], how: row[5], eye: row[5].startsWith('Eye'), chapter};
  }
  return rules;
}

// ---- what happens inside the page. Counts the canvas calls that blur, from before its first line.
const instrument = () => {
  const C = CanvasRenderingContext2D.prototype, q = window.__q = {on: false, calls: {}, where: {}, rects: 0, draws: 0, touched: 0}, real = {};
  const note = kind => {
    if (!q.on) return;
    q.calls[kind] = (q.calls[kind] || 0) + 1;
    if ((q.where[kind] ||= []).length < 3){
      const at = (new Error().stack || '').split('\n').slice(3, 5).map(l => l.trim().replace(/^at /, '').replace(/\(?https?:\/\/[^/]+\//, '(').slice(0, 70)).join(' < ');
      if (!q.where[kind].includes(at)) q.where[kind].push(at);
    }
  };
  for (const m of ['arc', 'arcTo', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'stroke', 'strokeRect', 'fillText', 'strokeText', 'createLinearGradient', 'createRadialGradient', 'createConicGradient', 'rotate']){
    if (!C[m]) continue;
    real[m] = C[m];
    C[m] = function(...a){ note(m); return real[m].apply(this, a); };
  }
  const frac = v => Math.abs(v - Math.round(v)) > 1e-3;
  real.fillRect = C.fillRect;
  C.fillRect = function(x, y, w, h){ q.touched++; if (q.on){ q.rects++; if (frac(x) || frac(y) || frac(w) || frac(h)) note('offGrid'); } return real.fillRect.call(this, x, y, w, h); };
  real.drawImage = C.drawImage;
  C.drawImage = function(...a){
    q.touched++;
    if (q.on){
      q.draws++;
      const [dx, dy, dw, dh] = a.length === 3 ? [a[1], a[2]] : a.length === 5 ? [a[1], a[2], a[3], a[4]] : [a[5], a[6], a[7], a[8]];
      if (frac(dx) || frac(dy)) note('offGrid');
      const sw = a.length === 9 ? a[3] : a[0].width, sh = a.length === 9 ? a[4] : a[0].height;
      if (this.imageSmoothingEnabled && dw !== undefined && (dw !== sw || dh !== sh)) note('smoothed');
    }
    return real.drawImage.apply(this, a);
  };
  const props = {};
  for (const prop of ['filter', 'shadowBlur']){
    const d = props[prop] = Object.getOwnPropertyDescriptor(C, prop);
    if (d && d.set) Object.defineProperty(C, prop, {...d, set(v){ if (v && v !== 'none' && v !== 0) note(prop); d.set.call(this, v); }});
  }
  // back to the real thing, so that what a frame costs isn't our counting
  q.unwrap = () => { for (const [m, f] of Object.entries(real)) C[m] = f; for (const [p, d] of Object.entries(props)) if (d) Object.defineProperty(C, p, d); };
};

// On a page that isn't the app, the clock is ours from its first line.
const earlyClock = seed => {
  const clock = window.__clock = {q: [], now: 1e6};
  window.requestAnimationFrame = f => clock.q.push(f);
  performance.now = () => clock.now;
  let a = seed;
  Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
};

// Takes the clock over and gets the scene ready. Anything an older or smaller page doesn't have, it does without.
const setUp = async ({place, who, seed}) => {
  const early = window.__clock, q = early ? early.q : [], clock = early || {now: performance.now()}, browserFrame = window.requestAnimationFrame.bind(window);
  if (!early){
    window.requestAnimationFrame = f => q.push(f);
    performance.now = () => clock.now;
    // the page's loop is waiting on the browser's next frame: let that come, so that the loop lands in our queue
    await new Promise(done => browserFrame(() => browserFrame(done)));
  }
  const bins = new Float32Array(64), hum = t => { for (let i = 0; i < 64; i++) bins[i] = -84 + 24 * (.5 + .5 * Math.sin(t * 1.7 + i * .9)) * (.55 + .45 * Math.sin(t * .63 + i * 2.1)); };
  const isApp = typeof activeSceneId !== 'undefined' || typeof drawScene === 'function';
  // a page's consts and lets aren't on window, so ask about each by name
  const KNOWN = {life: () => typeof life, scene: () => typeof scene, state: () => typeof state, PLACES: () => typeof PLACES, painter: () => typeof painter, rare: () => typeof rare, WIND: () => typeof WIND, ledMode: () => typeof ledMode, LIGHTS: () => typeof LIGHTS, HD: () => typeof HD};
  const has = name => { try { return KNOWN[name]() !== 'undefined'; } catch (e) { return false; } };
  if (isApp){
    // stands in for the audio engine, since nothing's playing: it answers anything, and a quiet spectrum for the visualisers
    const any = () => new Proxy(function(){}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : any(), apply: () => any()});
    A = new Proxy({fft: {getValue: () => bins}}, {get: (t, k) => k in t ? t[k] : any()});
    try { playing = true; } catch (e) {}
    try { state.seed = 4242; state.layers.rain.on = false; } catch (e) {}
    try { Math.random = mulberry32(seed); } catch (e) {}
    try { if (place) activeSceneId = () => place; } catch (e) {}
    try { if (who) charPick = who; } catch (e) {}
  }
  try { if (has('life')) life.awake = true; } catch (e) {}
  let beats = 0, beatStep = false;
  const thrown = [];
  const canBeat = has('scene') && 'beat' in scene;
  const tick = (dt, quiet) => {
    clock.now += dt * 1000;
    if (isApp) hum(clock.now / 1000);
    beatStep = false;
    if (canBeat && dt > 0 && !quiet){
      const before = beats, bpm = has('state') && state.bpm || 72;
      beats += dt * bpm / 60 * 2;
      if (Math.floor(beats) !== Math.floor(before)){
        beatStep = true;
        // the little notes that rise off someone belong to the app's music, not to the place
        if (typeof sceneBeat === 'function') sceneBeat(Math.floor(beats) % 2 === 0); else scene.beat = 1;
        if (scene.notes) scene.notes.length = 0;
      }
    }
    // a throw inside a frame is a finding, and the browser would carry on past it too
    for (const f of q.splice(0)){ try { f(clock.now); } catch (e) { thrown.push(e.message); } }
  };
  const canvases = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height), canvas = document.getElementById('viz') || canvases[0];
  const out = window.__v = {
    isApp, has, tick, canvas, clock, thrown,
    beating: () => beatStep, canBeat,
    warm(s){ for (let x = 0; x < s; x += .05) tick(.05); },
    // One more frame with the clock stopped, to see what changes when nothing else can. A page that caps its frame rate
    // won't draw unless time has passed, so there it takes the next step instead, and whatever moved anyway gets taken away.
    redraw(){
      const before = __q.touched;
      tick(0);
      if (__q.touched === before) tick(.05, true);
    },
    // A pop is a solid area changing colour by a lot in one step, far more than that part of the frame was doing just
    // before and just after. A glow stepping a level changes many pixels by a little. A far layer sliding one pixel changes
    // thin edges. Neither counts: solid means the pixels around it changed too. It's judged part by part of the frame, or
    // grass in the wind would hide a whole cloud appearing in an empty sky.
    jump(d, prev){
      const c = out.canvas, W = c.width, H = c.height, n = W * H, mask = out.mask ||= new Uint8Array(n), parts = new Array(12).fill(0);
      for (let p = 0, j = 0; p < n; p++, j += 4) mask[p] = Math.abs(d[j] - prev[j]) > 48 || Math.abs(d[j + 1] - prev[j + 1]) > 48 || Math.abs(d[j + 2] - prev[j + 2]) > 48 ? 1 : 0;
      for (let y = 1; y < H - 1; y++) for (let x = 1, p = y * W + 1; x < W - 1; x++, p++) if (mask[p] && mask[p - 1] && mask[p + 1] && mask[p - W] && mask[p + W]) parts[Math.floor(y * 3 / H) * 4 + Math.floor(x * 4 / W)]++;
      return parts;
    },
    // anything about the size of a person, or larger, arriving all at once
    bigJump(parts){ const c = out.canvas, n = c.width * c.height; return parts.some(x => x >= n * .002); },
    // the frame before and the frame after, one above the other, to see what jumped
    pair(prev){
      const c = out.canvas, W = c.width, H = c.height, s = Object.assign(document.createElement('canvas'), {width: W, height: H * 2 + 4}), g = s.getContext('2d');
      g.putImageData(new ImageData(new Uint8ClampedArray(prev), W, H), 0, 0);
      g.drawImage(c, 0, H + 4);
      return s.toDataURL('image/png');
    },
    popsIn(steps){
      const pops = [], c = out.canvas, n = c.width * c.height, med = a => a.slice().sort((x, y) => x - y)[a.length >> 1] || 0;
      steps.forEach((parts, i) => {
        for (let k = 0; k < 12; k++){
          if (parts[k] < n * .002) continue;
          const near = steps.slice(Math.max(0, i - 8), i).concat(steps.slice(i + 1, i + 9)).map(s => s[k]);
          if (parts[k] > med(near) * 3 + n * .0005){ pops.push(+(i * .05).toFixed(2)); break; }
        }
      });
      return pops;
    },
    read(){ const c = out.canvas, g = c.getContext('2d', {willReadFrequently: true}); return g.getImageData(0, 0, c.width, c.height).data; },
  };
  tick(.05);
  return {isApp, canvas: canvas ? [canvas.width, canvas.height] : null, places: has('PLACES') ? Object.keys(PLACES) : []};
};

// Everything measured over time. Returns numbers, and keeps the last frame and a map of what moved.
const watch = ({seconds, place}) => {
  const v = __v, c = v.canvas, W = c.width, H = c.height, n = W * H, q = __q;
  if (!place && v.has('PLACES') && Object.keys(PLACES).length === 1) place = Object.keys(PLACES)[0];
  const got = {place: place || null};
  // what's painted once gets painted again, on the record, since the app paints its places before we arrive
  const lanes = {};
  if (v.has('rare')){ try { const realRare = rare; rare = (k, t, dt, key, sights, gap) => { lanes[key] = {sights: Object.keys(sights), gap}; return realRare(k, t, dt, key, sights, gap); }; } catch (e) {} }
  q.on = true;
  try {
    if (place && v.has('PLACES') && PLACES[place] && v.has('painter')){
      const dice = Math.random;
      got.seeded = true;
      for (const part of ['sky', 'bg', 'front']){
        if (!PLACES[place][part]) continue;
        // painted twice, with different dice: what's painted once has to come out the same
        const shots = [3, 5].map(seed => { let a = seed * 7919; Math.random = () => (a = a * 16807 % 2147483647) / 2147483647; const p = painter(); PLACES[place][part](p); return p.canvas().toDataURL(); });
        if (shots[0] !== shots[1]) got.seeded = false;
      }
      Math.random = dice;
    }
  } catch (e) { got.seeded = undefined; }
  v.warm(6);
  const scale = v.has('HD') ? HD : W / 320, box = () => {
    if (!v.has('scene') || !(scene.heroX > 0)) return null;
    // a page that crops by moving the canvas's origin has them somewhere else on the canvas than in the world
    const o = c.getContext('2d').getTransform();
    return [Math.round(scene.heroX * scale + o.e) - 6, Math.round(scene.heroY * scale + o.f) - 6, 38, 56];
  };
  const pass = (secs, keep) => {
    const steps = Math.round(secs / .05), changes = [], jumps = [], counts = new Uint16Array(n), winds = [];
    let prev = v.read(), acted = false, clock0 = v.has('life') ? life.clock : 0;
    for (let i = 0; i < steps; i++){
      v.tick(.05);
      const d = v.read();
      let ch = 0;
      for (let p = 0, j = 0; p < n; p++, j += 4){
        if (Math.abs(d[j] - prev[j]) > 8 || Math.abs(d[j + 1] - prev[j + 1]) > 8 || Math.abs(d[j + 2] - prev[j + 2]) > 8){ ch++; counts[p]++; }
      }
      changes.push(ch / n);
      jumps.push(v.jump(d, prev));
      try { if (v.has('WIND')) winds.push(Math.abs(WIND(160))); } catch (e) {}
      try { if (v.has('life') && life.act) acted = true; } catch (e) {}
      prev = d;
    }
    const med = a => a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : 0;
    const pops = v.popsIn(jumps);
    let moved = 0, busy = 0;
    const parts = new Array(12).fill(0);
    for (let p = 0; p < n; p++){ if (counts[p]){ moved++; parts[Math.floor(Math.floor(p / W) * 3 / H) * 4 + Math.floor((p % W) * 4 / W)]++; } if (counts[p] > steps * .3) busy++; }
    if (keep){ v.lastCounts = counts; v.lastSteps = steps; }
    return {median: med(changes), most: Math.max(...changes), moved: moved / n, parts: parts.map(x => +(x * 12 / n).toFixed(3)), busy: busy / n, pops, calm: winds.length ? winds.filter(x => x < .25).length / winds.length : null, acted, lived: v.has('life') ? life.clock - clock0 : 0};
  };
  Object.assign(got, {run: pass(seconds, true)});
  q.on = false;
  // What reacts to the beat? Stop the clock, fire one beat, and see what changes: nothing else can, not the wind, not
  // a layer sliding past. Then again with the lights told not to flash: what's left around the person is them bouncing.
  if (v.canBeat){
    const react = () => {
      const shot = beat => { scene.beat = beat; if ('q' in scene) scene.q = beat; v.redraw(); return v.read().slice(); };
      const hero = box(), area = hero && [hero[0], hero[1], hero[0] + hero[2], hero[1] + hero[3]];
      const differ = (x, y, area) => {
        let count = 0;
        const [x0, y0, x1, y1] = area || [0, 0, W, H];
        for (let yy = Math.max(0, y0); yy < Math.min(H, y1); yy++) for (let xx = Math.max(0, x0), j = (yy * W + xx) * 4; xx < Math.min(W, x1); xx++, j += 4){
          if (Math.abs(x[j] - y[j]) > 8 || Math.abs(x[j + 1] - y[j + 1]) > 8 || Math.abs(x[j + 2] - y[j + 2]) > 8) count++;
        }
        return count;
      };
      // A few times over, keeping the smallest: a real reaction shows every time, and a bee that happened to flutter past doesn't.
      let frame = Infinity, heroMoved = Infinity, at = null;
      for (let i = 0; i < 3; i++){
        // what the beat changed, less what changes anyway from one frame to the next
        const n0 = shot(0), a = shot(0), b = shot(1), count = Math.max(0, differ(a, b) - differ(n0, a));
        shot(0);
        heroMoved = Math.min(heroMoved, area ? Math.max(0, differ(a, b, area) - differ(n0, a, area)) : 0);
        if (count >= frame) continue;
        frame = count;
        // and where, so that it can be found
        let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++){
          const j = (yy * W + xx) * 4;
          if (Math.abs(a[j] - b[j]) > 8 || Math.abs(a[j + 1] - b[j + 1]) > 8 || Math.abs(a[j + 2] - b[j + 2]) > 8){ if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
        }
        at = x1 < 0 ? null : [x0, y0, x1, y1];
      }
      return {frame: frame / n, hero: heroMoved, at};
    };
    got.beat = react();
    if (v.has('ledMode')){
      const keep = ledMode; ledMode = true;
      got.ledBeat = react();
      ledMode = keep;
    }
  }
  got.lanes = lanes;
  got.excuses = window.PAINTED_PIXELS_EXCUSES || {};
  got.calls = q.calls; got.where = q.where; got.rects = q.rects; got.draws = q.draws;
  got.rendering = getComputedStyle(c).imageRendering;
  got.shown = c.getBoundingClientRect().width;
  got.width = W; got.height = H;
  got.dpr = devicePixelRatio;
  got.hero = box();
  // a page without PLACES still names its light: it's whichever one the kit didn't come with
  const lightName = place || (v.has('LIGHTS') ? Object.keys(LIGHTS).filter(key => !['castle', 'office', 'park', 'lake', 'cafe', 'garden', 'forest', 'beach'].includes(key)).pop() : null);
  if (v.has('LIGHTS') && lightName && LIGHTS[lightName]){
    const L = LIGHTS[lightName];
    got.light = {key: !!L.key, spots: !!(L.spots && L.spots.length), ink: L.ink || null, id: L.id || null};
  } else got.light = v.has('LIGHTS') ? {} : null;
  // does the person stand out from what's behind them? The same instant, drawn with and without them
  try {
    if (got.hero && typeof heroDraw === 'function'){
      v.redraw();
      const a = v.read().slice();
      // a page may draw them with heroDraw or straight from the rig
      const realDraw = heroDraw, realRig = typeof rigDraw === 'function' ? rigDraw : null;
      heroDraw = () => {};
      if (realRig) rigDraw = () => {};
      v.redraw();
      const b = v.read().slice();
      heroDraw = realDraw;
      if (realRig) rigDraw = realRig;
      v.redraw();
      const [x0, y0, w, h] = got.hero;
      let sum = 0, cnt = 0, lums = [];
      for (let y = Math.max(0, y0 - 12); y < Math.min(H, y0 + h + 12); y++) for (let x = Math.max(0, x0 - 12); x < Math.min(W, x0 + w + 12); x++){
        const j = (y * W + x) * 4;
        lums.push(.3 * b[j] + .59 * b[j + 1] + .11 * b[j + 2]);
        if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + h) continue;
        const dist = Math.hypot(a[j] - b[j], a[j + 1] - b[j + 1], a[j + 2] - b[j + 2]);
        if (dist > 24){ sum += dist; cnt++; }
      }
      const m = lums.reduce((s, x) => s + x, 0) / lums.length;
      got.reads = {pop: sum / Math.max(1, cnt) / 441, pixels: cnt, behind: Math.sqrt(lums.reduce((s, x) => s + (x - m) * (x - m), 0) / lums.length)};
    }
  } catch (e) { got.readsFailed = e.message; }
  return got;
};

// Everything measured from one frame.
const still = () => {
  const v = __v, c = v.canvas, W = c.width, H = c.height, n = W * H, d = v.read(), lum = new Float32Array(n), hist = new Map();
  let black = 0, dead = 0, grey = 0, mids = 0;
  const hues = new Array(12).fill(0); let huesN = 0;
  for (let p = 0, j = 0; p < n; p++, j += 4){
    const r = d[j], g = d[j + 1], b = d[j + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = .3 * r + .59 * g + .11 * b;
    lum[p] = l;
    const key = r << 16 | g << 8 | b;
    hist.set(key, (hist.get(key) || 0) + 1);
    if (mx <= 3) black++;
    if (mx <= 28 && mx - mn <= 4) dead++;
    if (l > 40 && l < 225){ mids++; if (mx - mn < 10) grey++; }
    if (mx - mn >= 14 && l > 14){
      const dl = mx - mn;
      let h = mx === r ? (g - b) / dl : mx === g ? 2 + (b - r) / dl : 4 + (r - g) / dl;
      h = (h * 60 + 360) % 360;
      hues[Math.floor(h / 30)]++; huesN++;
    }
  }
  let rare = 0;
  for (const count of hist.values()) if (count <= 2) rare++;
  // a blurred edge: a pixel that's a mix of its two neighbours, across a step too big to be a ramp
  let edges = 0, mixes = 0;
  for (let y = 0; y < H; y++) for (let x = 1; x < W - 1; x++){
    const a = y * W + x - 1, m = a + 1, b = a + 2;
    if (Math.abs(lum[a] - lum[b]) < 60) continue;
    edges++;
    let between = true;
    for (let ch = 0; ch < 3 && between; ch++){
      const lo = Math.min(d[a * 4 + ch], d[b * 4 + ch]), hi = Math.max(d[a * 4 + ch], d[b * 4 + ch]), mid = d[m * 4 + ch];
      if (mid < lo - 1 || mid > hi + 1) between = false;
    }
    if (between && Math.abs(lum[m] - lum[a]) > 10 && Math.abs(lum[m] - lum[b]) > 10) mixes++;
  }
  // a flat fill: the biggest patch of one exact colour, and how much of the frame is in big patches
  const seen = new Uint8Array(n), stack = new Int32Array(n);
  let flatMax = 0, flatBig = 0, flatAt = 0;
  for (let s = 0; s < n; s++){
    if (seen[s]) continue;
    const j0 = s * 4, r = d[j0], g = d[j0 + 1], b = d[j0 + 2];
    let sp = 0, size = 0;
    stack[sp++] = s; seen[s] = 1;
    while (sp){
      const p = stack[--sp], x = p % W;
      size++;
      for (const o of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]){
        if (o < 0 || o >= n || seen[o]) continue;
        const j = o * 4;
        if (d[j] === r && d[j + 1] === g && d[j + 2] === b){ seen[o] = 1; stack[sp++] = o; }
      }
    }
    if (size > flatMax){ flatMax = size; flatAt = s; }
    if (size >= n * .004) flatBig += size;
  }
  // a ruled edge: a long straight seam between two bands
  const seams = [];
  for (let y = 2; y < H - 3; y++){
    let run = 0, sign = 0, best = 0, end = 0, gap = 0;
    for (let x = 0; x < W; x++){
      const dv = (lum[(y + 1) * W + x] + lum[(y + 2) * W + x] - lum[(y - 1) * W + x] - lum[y * W + x]) / 2, sg = dv > 9 ? 1 : dv < -9 ? -1 : 0;
      if (sg && sg === sign){ run += 1 + gap; gap = 0; } else if (sg){ sign = sg; run = 1; gap = 0; } else if (++gap > 2){ run = 0; sign = 0; gap = 0; }
      if (run > best){ best = run; end = x; }
    }
    if (best >= W * .3) seams.push({y, x: end - best, w: best});
  }
  seams.sort((a, b) => b.w - a.w);
  // A comb or a tile: a band of the picture that comes back at some distance. Smoothed first, or the dither's own 8-pixel
  // lattice wins. The slow changes are taken away, and it has to fall away before it comes back: a pool of lamplight across
  // a floor looks like itself at any small distance, and that isn't a repeat.
  const tiles = [];
  for (let y = 0; y + 16 <= H; y += 16){
    const raw = new Float32Array(W), prof = new Float32Array(W);
    for (let x = 0; x < W; x++){ let s = 0; for (let k = 0; k < 16; k++) s += lum[(y + k) * W + x]; raw[x] = s / 16; }
    for (let x = 0; x < W; x++){ let s = 0, m = 0; for (let k = -4; k < 4; k++){ const u = x + k; if (u >= 0 && u < W){ s += raw[u]; m++; } } prof[x] = s / m; }
    const sum = new Float32Array(W + 1);
    for (let x = 0; x < W; x++) sum[x + 1] = sum[x] + prof[x];
    let vari = 0;
    for (let x = 0; x < W; x++){ const a = Math.max(0, x - 64), b = Math.min(W, x + 65), u = prof[x] - (sum[b] - sum[a]) / (b - a); raw[x] = u; vari += u * u; }
    if (vari / W < 12) continue;
    let best = 0, lagAt = 0, fell = false;
    for (let lag = 2; lag <= W / 4; lag++){
      let s = 0;
      for (let x = 0; x < W - lag; x++) s += raw[x] * raw[x + lag];
      const cor = s / vari * W / (W - lag);
      if (cor < .3) fell = true;
      if (fell && lag >= 16 && cor > best){ best = cor; lagAt = lag; }
    }
    if (best > .8) tiles.push({y, lag: lagAt, score: +best.toFixed(2)});
  }
  tiles.sort((a, b) => b.score - a.score);
  // Plain boxes: areas of one flat colour, nearly as full as their bounding rectangles, once dither's been smoothed away. The
  // sky and the floor don't count: anything about as wide as the frame is a background, and a thing is what's standing on it.
  const S = new Float32Array(n * 3), boxes = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    let r0 = 0, g0 = 0, b0 = 0, m = 0;
    for (let a = -1; a <= 1; a++) for (let e = -1; e <= 1; e++){ const u = x + e, w = y + a; if (u < 0 || w < 0 || u >= W || w >= H) continue; const j = (w * W + u) * 4; r0 += d[j]; g0 += d[j + 1]; b0 += d[j + 2]; m++; }
    const i = (y * W + x) * 3; S[i] = r0 / m; S[i + 1] = g0 / m; S[i + 2] = b0 / m;
  }
  seen.fill(0);
  for (let s = 0; s < n; s++){
    if (seen[s]) continue;
    const r0 = S[s * 3], g0 = S[s * 3 + 1], b0 = S[s * 3 + 2];
    let sp = 0, area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    stack[sp++] = s; seen[s] = 1;
    while (sp){
      const p = stack[--sp], x = p % W, y = (p - x) / W;
      area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const o of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]){
        if (o < 0 || seen[o]) continue;
        const a = o * 3, b = p * 3;
        if (Math.abs(S[a] - S[b]) <= 7 && Math.abs(S[a + 1] - S[b + 1]) <= 7 && Math.abs(S[a + 2] - S[b + 2]) <= 7 && Math.abs(S[a] - r0) <= 22 && Math.abs(S[a + 1] - g0) <= 22 && Math.abs(S[a + 2] - b0) <= 22){ seen[o] = 1; stack[sp++] = o; }
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (area >= n * .001 && bw >= 10 && bh >= 10 && bw < W * .8 && area / (bw * bh) >= .86) boxes.push({x: x0, y: y0, w: bw, h: bh, area});
  }
  boxes.sort((a, c) => c.area - a.area);
  // does the hue move along a ramp? Pairs of main colours in one family, one lighter than the other
  const coarse = new Map();
  for (const [key, count] of hist){ const k5 = (key >> 19 & 31) << 10 | (key >> 11 & 31) << 5 | (key >> 3 & 31); coarse.set(k5, (coarse.get(k5) || 0) + count); }
  const hsl = k => {
    const r = (k >> 10 & 31) / 31, g = (k >> 5 & 31) / 31, b = (k & 31) / 31, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn;
    if (!dl) return {h: 0, s: 0, l};
    let h = mx === r ? (g - b) / dl : mx === g ? 2 + (b - r) / dl : 4 + (r - g) / dl;
    return {h: (h * 60 + 360) % 360, s: dl / (1 - Math.abs(2 * l - 1) + 1e-6), l};
  };
  const top = [...coarse.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80).map(([k, count]) => ({...hsl(k), count})).filter(x => x.s > .12 && x.l > .04);
  let weight = 0, drift = 0;
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++){
    const a = top[i], b = top[j];
    let dh = Math.abs(a.h - b.h);
    if (dh > 180) dh = 360 - dh;
    if (dh > 50 || Math.abs(a.l - b.l) < .15) continue;
    const w = Math.min(a.count, b.count);
    weight += w; drift += w * dh;
  }
  const palette = [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 48).map(([key, count]) => ['#' + key.toString(16).padStart(6, '0'), count]);
  return {colours: hist.size, rare: rare / hist.size, black: black / n, dead: dead / n, grey: grey / Math.max(1, mids), mix: mixes / Math.max(1, edges), edges,
    flatMax: flatMax / n, flatBig: flatBig / n, flatAt: [flatAt % W, Math.floor(flatAt / W)], seams: seams.slice(0, 12), tiles: tiles.slice(0, 6), boxes: boxes.slice(0, 12), boxShare: boxes.reduce((s, b) => s + b.area, 0) / n, drift: weight ? drift / weight : null,
    hues: hues.map(x => x / Math.max(1, huesN)), palette};
};

// The inspection sheet. Plain canvas work, after the scene's been measured.
const sheet = async ({got, stats, phone}) => {
  const v = __v, c = v.canvas, W = c.width, H = c.height, Z = W < 500 ? 2 : 1, FW = W * Z, FH = H * Z, n = W * H;
  const M = 12, out = Object.assign(document.createElement('canvas'), {width: FW * 2 + M * 3, height: FH * 2 + M * 5 + 216});
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#120c28'; g.fillRect(0, 0, out.width, out.height);
  const label = (s, x, y) => { g.fillStyle = '#ece6ff'; g.font = '14px monospace'; g.fillText(s, x, y); };
  label('The frame', M, M + 8);
  g.drawImage(c, M, M + 14, FW, FH);
  // what moved, and how much of the time: dim where it's still, bright where it's busy
  const heat = Object.assign(document.createElement('canvas'), {width: W, height: H}), hg = heat.getContext('2d'), img = hg.createImageData(W, H), d = v.read(), counts = v.lastCounts, steps = v.lastSteps;
  for (let p = 0, j = 0; p < n; p++, j += 4){
    const l = .3 * d[j] + .59 * d[j + 1] + .11 * d[j + 2], u = counts ? Math.min(1, counts[p] / (steps * .3)) : 0, on = counts && counts[p] > 0;
    img.data[j] = on ? 90 + 165 * u : l * .28; img.data[j + 1] = on ? 200 * (1 - u) + 40 : l * .28; img.data[j + 2] = on ? 120 * (1 - u) : l * .36; img.data[j + 3] = 255;
  }
  hg.putImageData(img, 0, 0);
  label('What moved in the run: green now and then, red nearly all the time', FW + M * 2, M + 8);
  g.drawImage(heat, FW + M * 2, M + 14, FW, FH);
  // suspects: the machine can't judge these, so it points
  const Y0 = M * 2 + 14 + FH;
  label('Suspects: ruled edges orange, repeats teal, biggest flat patch pink, plain boxes white', M, Y0 + 8);
  g.drawImage(c, M, Y0 + 14, FW, FH);
  g.fillStyle = '#ff9a3c';
  for (const s of stats.seams) g.fillRect(M + s.x * Z, Y0 + 14 + s.y * Z, s.w * Z, 1);
  g.fillStyle = 'rgba(79,209,197,.28)';
  for (const t of stats.tiles) g.fillRect(M, Y0 + 14 + t.y * Z, FW, 16 * Z);
  g.strokeStyle = '#ffffff';
  for (const b of stats.boxes) g.strokeRect(M + b.x * Z - .5, Y0 + 14 + b.y * Z - .5, b.w * Z + 1, b.h * Z + 1);
  g.strokeStyle = '#ff6fa8';
  g.strokeRect(M + stats.flatAt[0] * Z - .5, Y0 + 14 + stats.flatAt[1] * Z - .5, 40 * Z, 12 * Z);
  // phone size: what a big iPhone really shows, or in a quick look, the whole frame at about that scale
  const X1 = FW + M * 2;
  let PW, PH;
  g.imageSmoothingEnabled = true;
  if (phone){
    const img = new Image();
    img.src = phone;
    await img.decode();
    PW = Math.min(FW, img.width); PH = Math.min(FH, img.height);
    label('At phone size: what a big iPhone shows', X1, Y0 + 8);
    g.drawImage(img, 0, 0, PW, PH, X1, Y0 + 14, PW, PH);
  } else {
    const scale = W < 500 ? 1.2 : .6;
    PW = Math.round(W * scale); PH = Math.round(H * scale);
    label('At about phone size, with no crop: a full check shows the real thing', X1, Y0 + 8);
    g.drawImage(c, X1, Y0 + 14, PW, PH);
  }
  g.imageSmoothingEnabled = false;
  // up close
  if (got.hero){
    const [hx, hy, hw, hh] = got.hero, CZ = 3;
    label('Up close', X1 + PW + M, Y0 + 8);
    g.drawImage(c, hx - 8, hy - 8, hw + 16, hh + 16, X1 + PW + M, Y0 + 14, Math.min(FW - PW - M, (hw + 16) * CZ), (hh + 16) * CZ);
  }
  // its colours, by how much of the frame they cover
  const Y1 = Y0 + M * 2 + 14 + FH;
  label(`Colours (${stats.colours} in all): the 48 biggest, by how much they cover, and which hues`, M, Y1 + 8);
  let x = M; const total = stats.palette.reduce((s, p) => s + p[1], 0);
  for (const [hex, count] of stats.palette.slice().sort((a, b) => parseInt(a[0].slice(1), 16) - parseInt(b[0].slice(1), 16))){
    const w = count / total * (out.width - M * 2);
    g.fillStyle = hex; g.fillRect(Math.round(x), Y1 + 16, Math.ceil(w), 40);
    x += w;
  }
  const names = ['red', 'orange', 'yellow', 'lime', 'green', 'jade', 'cyan', 'blue', 'indigo', 'violet', 'pink', 'rose'];
  stats.hues.forEach((u, i) => {
    const bx = M + i * ((out.width - M * 2) / 12), bh = Math.round(u * 110);
    g.fillStyle = `hsl(${i * 30 + 15},70%,55%)`; g.fillRect(bx, Y1 + 170 - bh, (out.width - M * 2) / 12 - 6, bh);
    g.fillStyle = '#a79dd6'; g.font = '12px monospace'; g.fillText(names[i], bx, Y1 + 186);
  });
  return out.toDataURL('image/png');
};

// Every rare sight and action, to its end, then a long run: does it all end, and do the caches stop growing?
const soak = ({minutes}) => {
  const v = __v, lanes = {}, realRare = rare, out = {stuck: [], ran: 0, grew: [], blank: false};
  rare = (k, t, dt, key, sights, gap) => { lanes[key] = sights; return realRare(k, t, dt, key, sights, gap); };
  __q.on = true;   // a sight or an action might only blur while it's happening
  v.warm(1);
  for (const [lane, sights] of Object.entries(lanes)) for (const name of Object.keys(sights)){
    (pst[lane] ||= {wait: 1e9, now: null, bag: []}).force = name;
    v.tick(.05);
    let s = 0;
    while (pst[lane].now && s < 150){ v.tick(.05); s += .05; }
    if (pst[lane].now){ out.stuck.push(`${lane}:${name}`); pst[lane].now = null; }
    out.ran++;
  }
  if (typeof ACTIONS !== 'undefined' && typeof life !== 'undefined') for (const name of Object.keys(ACTIONS)){
    life.met = true; life.wait = 1e9; life.act = ACTIONS[name]; life.name = name; life.at = 0; life.rate = 1;
    for (let s = 0; s < ACTIONS[name].dur + .2; s += .05) v.tick(.05);
    out.ran++;
  }
  if (typeof life !== 'undefined') life.wait = 2;
  __q.on = false;
  out.calls = __q.calls; out.where = __q.where; out.rects = __q.rects; out.draws = __q.draws;
  const CACHES = {GLOWS: () => GLOWS, POSES: () => POSES, HEADS: () => HEADS, PALETTES: () => PALETTES, CLUMPS: () => CLUMPS, MODELS: () => MODELS, TUFTS: () => TUFTS, FLOWERS: () => FLOWERS, FRONDS: () => FRONDS, BIRDS: () => BIRDS, SHAPES: () => SHAPES, HD_SPRITES: () => HD_SPRITES, CONES: () => CONES, MOONS: () => MOONS};
  const sizes = () => { const o = {}; for (const [name, get] of Object.entries(CACHES)){ try { o[name] = get().size; } catch (e) {} } return o; };
  // the long run, all of it watched, for what only goes wrong after minutes: a cloud starved of its turn, say
  const steps = [], shots = [], winds = [], count = minutes * 60 / .05;
  let prev = v.read(), mid = sizes();
  for (let i = 0; i < count; i++){
    if (i === count >> 1) mid = sizes();
    v.tick(.05);
    try { if (v.has('WIND')) winds.push(Math.abs(WIND(160))); } catch (e) {}
    const d = v.read(), parts = v.jump(d, prev);
    steps.push(parts);
    if (v.bigJump(parts) && shots.length < 12) shots.push({i, pair: v.pair(prev)});
    prev = d;
  }
  out.pops = v.popsIn(steps);
  out.popShots = shots.filter(x => out.pops.includes(+(x.i * .05).toFixed(2))).slice(0, 4).map(x => x.pair);
  out.calm = winds.length ? winds.filter(x => x < .25).length / winds.length : null;
  // A cache settling down gains a few more shapes, and then stops. One that gains more than one a second, this long in, won't stop.
  const end = sizes();
  out.sizes = {mid, end};
  for (const name of Object.keys(end)) if (end[name] - mid[name] > Math.max(24, minutes * 30)) out.grew.push(`${name}: ${mid[name]} to ${end[name]}`);
  const d = v.read();
  let lit = 0;
  for (let i = 0; i < d.length; i += 400) if (d[i] + d[i + 1] + d[i + 2] > 0) lit++;
  out.blank = lit === 0;
  return out;
};

// ---- the browser
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2'};
const serve = root => new Promise(done => {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0]), body = await readFile(join(root, path));
      res.writeHead(200, {'content-type': TYPES[extname(path)] || 'application/octet-stream'}); res.end(body);
    } catch { res.writeHead(404); res.end(); }
  }).listen(0, '127.0.0.1', () => done(server));
});

async function openScene(browser, {file, root, port, place, who, seed = 2026, reduced, phone}){
  const isApp = /\bactiveSceneId\b|function drawScene/.test(readFileSync(file, 'utf8'));
  const context = await browser.newContext({viewport: phone ? {width: 440, height: 852} : {width: 1280, height: 800}, deviceScaleFactor: phone ? 3 : 1, ...(reduced ? {reducedMotion: 'reduce'} : {})});
  await context.addInitScript(instrument);
  if (!isApp) await context.addInitScript(earlyClock, seed);
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const rel = file.slice(root.length).split('/').map(encodeURIComponent).join('/');
  await page.goto(`http://127.0.0.1:${port}${rel}`);
  for (let waited = 0; waited < 60000; waited += 250){
    if (await page.evaluate(() => !document.getElementById('splash'))) break;
    if (errors.length && waited > 3000) break;
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(300);
  const info = await page.evaluate(setUp, {place, who, seed});
  return {context, page, errors, info};
}

// ---- judging. Each check says what it measured, and whether that holds.
const pct = (x, places = 1) => (x * 100).toFixed(places) + '%';
const clean = kinds => (calls) => kinds.reduce((sum, k) => sum + (calls[k] || 0), 0);
const BLUR_KINDS = ['arc', 'arcTo', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'stroke', 'strokeRect', 'fillText', 'strokeText', 'createLinearGradient', 'createRadialGradient', 'createConicGradient', 'rotate', 'filter', 'shadowBlur'];
const NA = why => ({na: why});

export const CHECKS = {
  // the grid
  G1(r){
    const n = r.got.calls.smoothed || 0, soft = r.got.shown !== r.got.width && !/pixelated|crisp/.test(r.got.rendering);
    return {pass: !n && !soft, got: soft ? `canvas shown at ${r.got.shown}px with image-rendering: ${r.got.rendering}` : `${n} smoothed draws`, fix: 'imageSmoothingEnabled = false on every context, and image-rendering: pixelated on the canvas', where: r.got.where.smoothed};
  },
  G2(r){
    const n = clean(BLUR_KINDS)(r.got.calls), kinds = BLUR_KINDS.filter(k => r.got.calls[k]);
    return {pass: !n, got: n ? `${n} calls: ${kinds.map(k => `${k} ${r.got.calls[k]}`).join(', ')}` : 'none', fix: 'Paint with the kit, or many small rects. Rotate with tippedSprite', where: kinds.flatMap(k => r.got.where[k] || []).slice(0, 3)};
  },
  G3(r){
    const n = r.got.calls.offGrid || 0, all = r.got.rects + r.got.draws;
    return {pass: !n, got: `${n} of ${all} draws at a fraction of a pixel`, fix: 'Round before drawing: Math.round(x * HD)', where: r.got.where.offGrid};
  },
  G4(r){
    const {mix, edges, colours} = r.stats;
    return {pass: !(mix > .35 && edges > 100) && colours < 12000, got: `${pct(mix)} of hard edges have a blended pixel, ${colours} colours`, limit: 'under 35%, and under 12,000', fix: 'Something is blurring: find the smoothed draw, the CSS scale or the filter'};
  },
  G5(r){
    if (r.isApp) return NA('the app sets its own frame');
    if (!r.phone) return NA('no phone run in a quick check');
    const k = r.phone.shown * r.phone.dpr / r.phone.width;
    return {pass: Math.abs(k - Math.round(k)) < .02, got: `on a phone, each art pixel is ${k.toFixed(2)} device pixels`, limit: 'a whole number', fix: 'scale = Math.round(width * devicePixelRatio / DW). See "On a web page" in look.md'};
  },
  G6(r){ return r.got.seeded === undefined || !r.got.place ? NA("the page doesn't paint with the kit") : {pass: r.got.seeded, got: r.got.seeded ? 'painted twice, and it came out the same' : 'painted twice, and it came out different', fix: 'Paint with mulberry32(seed), hash2 or vnoise. Math.random is for live behaviour only'}; },
  // colour
  C1(r){ return {pass: r.stats.black < .005 && r.stats.dead < .02, got: `${pct(r.stats.black, 2)} pure black, ${pct(r.stats.dead, 2)} colourless near-black`, limit: 'under .5% and 2%', fix: "Give the darks the colour of the place's sky: shadows use LIGHTS.ink, never #000"}; },
  C2(r){ return {pass: r.stats.grey < .1, got: `${pct(r.stats.grey)} of the mid-tones are neutral grey`, limit: 'under 10%', fix: 'Tint stone, metal and shadows toward the light and the sky'}; },
  C3(r){ return r.stats.drift === null ? NA('too few colours to tell') : {pass: r.stats.drift >= 6, got: `the hue moves ${r.stats.drift.toFixed(1)} degrees along its ramps`, limit: 'at least 6', fix: 'Shade along a hue-shifted ramp: shadows lean blue or purple, lights lean warm. Never darken a colour by multiplying it'}; },
  C4(r){ return {pass: r.stats.colours >= 300, got: `${r.stats.colours} colours in the frame`, limit: 'at least 300', fix: 'More ramps with more steps, and let light and glows mix them'}; },
  C5(r){ return {pass: r.stats.flatMax <= .04 && r.stats.flatBig <= .35, got: `biggest flat patch ${pct(r.stats.flatMax)}, big patches cover ${pct(r.stats.flatBig)}`, limit: 'at most 4% and 35%', fix: 'Dither between ramp steps, or add grain with p.texture'}; },
  // light
  L1(r){
    const L = r.got.light;
    if (L === null) return r.isApp ? {pass: false, got: 'the light is not written down anywhere', fix: 'Write LIGHTS.yourplace before you paint: key for the sun or moon, spots for fires and lamps'} : NA("the page doesn't use the kit");
    if (!L.key && !L.spots) return {pass: false, got: r.got.place ? `LIGHTS.${r.got.place} has no key and no spots` : 'no entry in LIGHTS for this place', fix: 'Write LIGHTS.yourplace before you paint: key for the sun or moon, spots for fires and lamps'};
    const ink = L.ink && [1, 3, 5].map(i => parseInt(L.ink.slice(i, i + 2), 16));
    if (ink && Math.max(...ink) - Math.min(...ink) < 3) return {pass: false, got: `its shadows are ${L.ink}, with no colour in them`, fix: "Make ink the colour of the sky's darkest part"};
    return {pass: true, got: [L.key && 'a key', L.spots && 'local lights', L.ink && `ink ${L.ink}`].filter(Boolean).join(', ')};
  },
  // depth
  D1(r){ const s = r.stats.seams[0], w = s ? s.w / r.got.width : 0; return {pass: w < .9, got: s ? `longest straight seam is ${pct(w, 0)} of the width, at row ${s.y}` : 'no long seams', limit: 'under 90%', fix: 'Break it: let things stand across it, wobble it with noise, or dither it'}; },
  D7(r){ const b = r.stats.boxes[0]; return {pass: r.stats.boxShare <= .03, got: `${pct(r.stats.boxShare)} of the frame is plain boxes, in ${r.stats.boxes.length}${b ? `, the biggest ${b.w}x${b.h} at ${b.x},${b.y}` : ''}`, limit: 'at most 3%', fix: 'Give it a form: p.form and sdBox round its edges and turn them to the light. Then ask what it really is, and what would be on it'}; },
  // motion
  M1(r){ return {pass: r.got.run.moved >= .05, got: `${pct(r.got.run.moved)} of the frame moved in ${r.seconds} seconds`, limit: 'at least 5%', fix: 'Ask what lives here, and what moves it'}; },
  M2(r){
    const {busy} = r.got.run, calm = r.soak && typeof r.soak.calm === 'number' ? r.soak.calm : r.got.run.calm;
    if (busy > .2) return {pass: false, got: `${pct(busy)} of the frame is moving nearly all the time`, limit: 'at most 20%', fix: 'Still until something moves it. Use noise or a state machine, not Math.sin'};
    if (calm !== null && calm < .5) return {pass: false, got: `the wind is calm only ${pct(calm, 0)} of the time`, limit: 'at least 50%', fix: 'Use gusts: call windTick once a frame, and read WIND(x)'};
    return {pass: true, got: `${pct(busy)} busy${calm === null ? '' : `, calm wind ${pct(calm, 0)} of the time`}`};
  },
  M3(r){
    const p = r.got.run.pops, later = r.soak && r.soak.pops || [], all = p.length + later.length;
    const say = [p.length && `at ${p.slice(0, 5).join(', ')} s in the run`, later.length && `at ${later.slice(0, 5).join(', ')} s into the long run`].filter(Boolean).join(', and ');
    return {pass: !all, got: all ? `${all} sudden ${all === 1 ? 'jump' : 'jumps'}, ${say}` : 'none', limit: 'none', fix: `Look at a strip around those times${r.soak && r.soak.popShots && r.soak.popShots.length ? ', and at jump-1.png' : ''}. Things should arrive, not appear. If it really is sudden, like lightning, excuse it`};
  },
  M4(r){
    if (!r.got.hero) return NA('nobody here');
    if (!r.got.beat) return NA('no beat on this page');
    const {hero} = r.got.ledBeat || r.got.beat;
    return {pass: hero <= 30, got: `a beat changes ${hero} pixels around them, with the clock stopped`, limit: 'at most 30', fix: 'No bob at all. A one-pixel breath, and a brief nod when a song starts'};
  },
  M5(r){
    if (!r.got.beat) return NA('no beat on this page');
    const {frame, at} = r.got.beat;
    return {pass: frame <= .03, got: `a beat changes ${pct(frame)} of the frame${at && frame > .03 ? `, somewhere from ${at[0]},${at[1]} to ${at[2]},${at[3]} in canvas pixels` : ''}`, limit: 'at most 3%', fix: 'Only small things touch the beat: an LED string, a monitor. Take flashy() out of big glows'};
  },
  M6(r){
    if (!r.got.ledBeat) return NA('no LED mode on this page');
    return {pass: r.got.ledBeat.frame <= .01, got: `in LED mode, a beat still changes ${pct(r.got.ledBeat.frame)} of the frame`, limit: 'at most 1%', fix: 'Read the beat through flashy(), which is 0 in LED mode'};
  },
  M7(r){
    const lanes = Object.entries(r.got.lanes);
    if (!r.got.hasRare && !lanes.length) return r.isApp ? {pass: false, got: 'nothing turns up now and then: this page has no rare sights', fix: 'What would turn up here once in a while? See creatures.md'} : NA("the page doesn't use rare()");
    const quick = lanes.filter(([, l]) => (l.gap ? l.gap[0] : 18) < 5);
    return {pass: lanes.length > 0 && !quick.length, got: lanes.length ? `${lanes.length} lanes, ${lanes.reduce((s, [, l]) => s + l.sights.length, 0)} sights${quick.length ? `; ${quick.map(([k]) => k).join(', ')} wait under 5 seconds` : ''}` : 'nothing turns up now and then', limit: 'at least one lane, waits of 5 seconds or more', fix: 'What would turn up here once in a while? See creatures.md'};
  },
  M8(r){
    if (!r.reduced) return NA('no reduced-motion run in a quick check');
    const a = r.reduced.run.median, b = r.got.run.median;
    return {pass: r.reduced.blank === false && (a <= b * .75 || a < .01), got: `at any moment, ${pct(a, 2)} of the frame is changing for someone who asked for less, against ${pct(b, 2)}`, limit: 'at most three quarters, or under 1%', fix: 'If reduceMotion: no wind, no rare sights, and only a blink from the person'};
  },
  M9(r){
    if (!r.soak) return NA('no soak in a quick check');
    if (r.soak.skipped) return NA(r.soak.skipped);
    return {pass: !r.soak.stuck.length, got: r.soak.stuck.length ? `never ended: ${r.soak.stuck.join(', ')}` : `${r.soak.ran} sights and actions all ended`, fix: 'A sight returns false when it has finished. Pass a starter as it is, without wrapping it'};
  },
  // people
  P1(r){
    if (!r.got.hero) return NA('nobody here');
    if (!r.got.reads) return NA('the page has no heroDraw');
    const {pop, pixels} = r.got.reads;
    if (pixels < 20) return NA("can't tell them from what's behind them on this page");
    return {pass: pop >= .1 && pixels >= 60, got: `they differ from what's behind them by ${pct(pop, 0)}, over ${pixels} pixels`, limit: 'at least 10%', fix: 'Put them against the cleanest contrast in the frame. See "Composition" in look.md'};
  },
  P2(r){
    if (!r.got.hero) return NA('nobody here');
    if (r.got.run.lived <= 0) return {pass: false, got: "they aren't on the life clock", fix: 'Call lifeTick once a frame, as runPlace does, so that they breathe, blink and do things'};
    return {pass: r.got.run.acted, got: r.got.run.acted ? `did something in ${r.seconds} seconds` : `did nothing in ${r.seconds} seconds`, fix: 'Check life.awake is true and lifeTick runs. Add to LOCAL what someone does here'};
  },
  // cost
  K1(r){ return r.cost === undefined ? NA('no cost run in a quick check') : {pass: r.cost <= 5, got: `${r.cost.toFixed(1)} ms a frame on this machine`, limit: 'at most 5', fix: 'Paint once what does not move, cache sprites, and keep per-pixel work to one small band. See "Cost" in depth-and-motion.md'}; },
  K2(r){
    if (!r.soak) return NA('no soak in a quick check');
    if (r.soak.skipped) return NA(r.soak.skipped);
    return {pass: !r.soak.grew.length && !r.soak.blank, got: r.soak.blank ? 'the canvas went blank' : r.soak.grew.length ? `still growing: ${r.soak.grew.join('; ')}` : 'caches level off', fix: 'Key a cache by what is really drawn, in whole pixels, never by a raw float'};
  },
  K3(r){ return {pass: !r.errors.length, got: r.errors.length ? r.errors.slice(0, 2).join(' | ') : 'none', fix: 'Fix what the page throws'}; },
};

function judge(rules, r){
  const results = [];
  for (const rule of Object.values(rules)){
    if (rule.eye) continue;
    let res;
    try { res = CHECKS[rule.id](r); } catch (e) { res = {pass: false, got: `the check itself failed: ${e.message}`}; }
    const excuse = rule.level === 'Custom' && r.got.excuses[rule.id];
    if (res.na) results.push({...rule, status: 'na', got: res.na});
    else if (!res.pass && excuse) results.push({...rule, status: 'excused', got: res.got, limit: res.limit, excuse});
    else results.push({...rule, status: res.pass ? 'pass' : 'fail', got: res.got, limit: res.limit, fix: res.fix, where: res.where});
  }
  return results;
}

// The Eye rules, as a list to walk. A rule counts once it's ticked, with a note saying what you saw.
function eyeList(rules, r, file){
  const wanted = Object.values(rules).filter(x => x.eye && !(x.chapter === 'People' && !r.got.hero));
  const prior = {};
  if (existsSync(file)) for (const line of readFileSync(file, 'utf8').split('\n')){
    const m = line.match(/^- \[(.)\] ([A-Z]\d+)\b.*?note:\s*(.*)$/);
    if (m) prior[m[2]] = {ticked: m[1].toLowerCase() === 'x', note: m[3].trim()};
  }
  const walked = wanted.filter(x => prior[x.id] && prior[x.id].ticked && prior[x.id].note.length >= 12);
  const text = `# The Eye: ${r.name}\n\nThe machine can't judge these. Open sheet.png with the Read tool, and film what needs filming. Tick a rule only once you've really looked, and say what you saw: \`- [x] L2 ... note: the moon's upper left, and every pine is lit on that side\`. If a rule can't apply here, tick it and say why: \`note: nobody walks in this scene\`. A problem stays unticked until it's fixed. If you change the art, untick what it touches.\n\n${wanted.map(x => `- [${prior[x.id] && prior[x.id].ticked ? 'x' : ' '}] ${x.id} ${x.text} (${x.how.replace(/^Eye:?\s*/, '')}) note: ${prior[x.id] ? prior[x.id].note : ''}`).join('\n')}\n`;
  return {text, total: wanted.length, walked: walked.length};
}

// S takes the machine and the Eye. Below that it's the machine alone.
function rank(results, eye){
  const laws = results.filter(x => x.status === 'fail' && x.level === 'Law').length, customs = results.filter(x => x.status === 'fail' && x.level === 'Custom').length;
  if (laws) return 'D';
  if (customs > 3) return 'C';
  if (customs) return 'B';
  return eye.total && eye.walked === eye.total ? 'S' : 'A';
}
const VERDICT = {S: 'Cleared, and looked at. Worth staying in.', A: 'The machine has no complaints. The Eye rules are next.', B: 'Close. A few gremlins left.', C: 'Getting there. Several gremlins left.', D: "A law is broken. It isn't in this style yet."};
const CHAPTERS = ['Grid', 'Colour', 'Light', 'Depth', 'Motion', 'People', 'Cost'];

async function statusScreen(browser, r, results, eye, grade, thumb, file){
  const font = name => readFileSync(join(SKILL, 'assets/fonts', name)).toString('base64');
  const page = await browser.newPage({viewport: {width: 1000, height: 700}, deviceScaleFactor: 2});
  const COL = {S: '#f5c542', A: '#4fd1c5', B: '#ece6ff', C: '#ffb347', D: '#ff6b7f'};
  const rows = CHAPTERS.map(ch => {
    const list = results.filter(x => x.chapter === ch && x.status !== 'na'), ok = list.filter(x => x.status === 'pass' || x.status === 'excused').length;
    if (!list.length) return `<div class="row"><b>${ch.toUpperCase()}</b><span class="bar"></span><i>-</i></div>`;
    return `<div class="row"><b>${ch.toUpperCase()}</b><span class="bar">${list.map(x => `<u class="${x.status === 'pass' ? 'ok' : x.status === 'excused' ? 'eye' : x.level === 'Law' ? 'law' : 'bad'}"></u>`).join('')}</span><i>${ok}/${list.length}</i></div>`;
  }).join('') + `<div class="row"><b>THE EYE</b><span class="bar">${Array.from({length: eye.total}, (_, i) => `<u class="${i < eye.walked ? 'eye' : ''}"></u>`).join('')}</span><i>${eye.walked}/${eye.total}</i></div>` + (results.some(x => x.status === 'na') ? `<div class="row"><b>UNCHECKED</b><span class="bar"></span><i>${results.filter(x => x.status === 'na').length}</i></div>` : '');
  const fails = results.filter(x => x.status === 'fail').sort((a, b) => (a.level === 'Law' ? 0 : 1) - (b.level === 'Law' ? 0 : 1));
  const gremlins = fails.length ? fails.slice(0, 4).map(x => `<li><b${x.level === 'Law' ? ' class="law"' : ''}>${x.id}</b> ${x.text.replace(/</g, '&lt;')}</li>`).join('') + (fails.length > 4 ? `<li class="more">and ${fails.length - 4} more</li>` : '') : '<li class="none">None found. The Eye rules are the machine\'s blind spot.</li>';
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:P;src:url(data:font/woff2;base64,${font('press-start-2p-latin-400-normal.woff2')})}
    @font-face{font-family:V;src:url(data:font/woff2;base64,${font('vt323-latin-400-normal.woff2')})}
    *{box-sizing:border-box} html,body{margin:0;background:#07040f}
    #s{width:1000px;padding:20px 20px 24px;background:#120c28;color:#ece6ff;font:22px/1.1 V;display:grid;grid-template-columns:432px 1fr;gap:20px;
      box-shadow:inset 0 0 0 4px #07040f,inset 0 0 0 8px #5b4a9e,inset 0 0 0 12px #07040f}
    h1{margin:6px 0 0;font:15px/1 P;color:#a79dd6} h2{margin:10px 0 14px;font:24px/1.25 P;color:#f5c542;text-shadow:3px 3px 0 #07040f}
    .frame{width:432px;line-height:0;box-shadow:0 0 0 3px #07040f,0 0 0 6px #5b4a9e} .frame img{width:100%;image-rendering:pixelated}
    .rank{display:flex;align-items:center;gap:16px;margin-top:20px}
    .rank strong{flex:none;display:grid;place-items:center;width:92px;height:92px;font:60px/1 P;color:${COL[grade]};background:#07040f;box-shadow:0 0 0 4px ${COL[grade]},inset 0 0 0 4px #1d1640;padding:6px 0 0 6px}
    .rank p{margin:0;font:24px/1.1 V;color:#ece6ff}
    .row{display:grid;grid-template-columns:130px 1fr 56px;align-items:center;gap:10px;height:30px} .row b{font:12px/1 P;font-weight:normal;color:#a79dd6} .row i{font:24px/1 V;font-style:normal;text-align:right}
    .bar{display:flex;gap:3px;height:16px} .bar u{flex:1 1 0;max-width:26px;background:#2a2058;box-shadow:inset 0 0 0 2px #07040f;text-decoration:none} .bar .ok{background:#4fd1c5} .bar .bad{background:#ffb347} .bar .law{background:#ff4d6a} .bar .eye{background:#f5c542}
    h3{margin:16px 0 8px;font:13px/1 P;font-weight:normal;color:#ffb347} ul{list-style:none;margin:0;padding:0;font:23px/1.05 V} li{margin:0 0 7px} li b{color:#ffb347;font-weight:normal} li b.law{color:#ff6b7f} .none{color:#4fd1c5} .more{color:#a79dd6}
  </style><div id="s"><div><h1>${opt.quick ? 'A QUICK LOOK' : 'QUEST REPORT'}</h1><h2>${r.name.toUpperCase().replace(/</g, '&lt;')}</h2><div class="frame"><img src="${thumb}"></div><div class="rank"><strong>${grade}</strong><p>${VERDICT[grade]}</p></div></div>
  <div style="padding-top:6px">${rows}<h3>GREMLINS</h3><ul>${gremlins}</ul></div></div>`);
  await page.evaluate(() => Promise.all([document.fonts.load('20px P'), document.fonts.load('20px V')]));
  await page.locator('#s').screenshot({path: file});
  await page.close();
}

// What a phone really shows, at the size people see it: only the part of the canvas that's in view.
async function phoneLook(browser, target){
  const {context, page} = await openScene(browser, {...target, phone: true});
  await page.evaluate(() => __v.warm(6));
  const clip = await page.evaluate(() => { const r = __v.canvas.getBoundingClientRect(), x = Math.max(0, r.left), y = Math.max(0, r.top); return {x, y, width: Math.min(innerWidth, r.right) - x, height: Math.min(innerHeight, r.bottom) - y}; });
  const shot = clip.width > 0 && clip.height > 0 ? await page.screenshot({clip, scale: 'css'}) : null;
  await context.close();
  return shot && `data:image/png;base64,${shot.toString('base64')}`;
}

async function checkOne(browser, target, rules, o){
  const {file, place} = target, seconds = +(opt.seconds || 24), phone = opt.quick ? null : await phoneLook(browser, target);
  const {context, page, errors, info} = await openScene(browser, target);
  const stem = basename(file, extname(file)), r = {name: place || (stem === 'index' ? basename(dirname(file)) : stem), place, seconds, isApp: info.isApp, errors};
  if (!info.canvas) throw new Error(`No canvas on ${file}`);
  r.got = await page.evaluate(watch, {seconds, place});
  r.errors.push(...await page.evaluate(() => __v.thrown));
  r.got.hasRare = await page.evaluate(() => __v.has('rare'));
  r.stats = await page.evaluate(still);
  const sheetUrl = await page.evaluate(sheet, {got: r.got, stats: r.stats, phone});
  const thumb = await page.evaluate(() => __v.canvas.toDataURL('image/png'));
  if (!opt.quick){
    r.soak = await page.evaluate(soak, {minutes: +(opt.minutes || 3)}).catch(e => ({skipped: `the long run couldn't happen here (${e.message.split('\n')[0].slice(0, 60)})`}));
    if (r.soak.calls) Object.assign(r.got, {calls: r.soak.calls, where: r.soak.where, rects: r.soak.rects, draws: r.soak.draws});
  }
  await context.close();
  if (!opt.quick){
    const low = await openScene(browser, {...target, reduced: true, phone: true});
    const got = await low.page.evaluate(watch, {seconds, place});
    const d = await low.page.evaluate(() => { const a = __v.read(); let lit = 0; for (let i = 0; i < a.length; i += 400) if (a[i] + a[i + 1] + a[i + 2] > 0) lit++; return lit === 0; });
    r.reduced = {run: got.run, blank: d};
    r.phone = {shown: got.shown, width: got.width, dpr: got.dpr};
    await low.context.close();
  }
  return {r, sheetUrl, thumb};
}

// What a frame costs, alone, with nothing else busy and without our counting in the way.
async function measureCost(browser, target){
  const {context, page} = await openScene(browser, target);
  const ms = await page.evaluate(({place}) => {
    __q.unwrap();
    const v = __v, real = () => Performance.prototype.now.call(performance);
    // Copying a pixel off to its own little canvas makes the browser finish the drawing before the clock stops. Reading the
    // page's own canvas would too, but after a few hundred reads the numbers jump tenfold. An empty page comes to .3 ms this way.
    const pg = Object.assign(document.createElement('canvas'), {width: 1, height: 1}).getContext('2d', {willReadFrequently: true});
    v.warm(3);
    // the fastest of three goes: anything else running on the machine only ever slows it down
    let best = Infinity;
    for (let go = 0; go < 3; go++){
      const t0 = real();
      for (let f = 0; f < 100; f++){ v.tick(.033); pg.drawImage(v.canvas, 0, 0, 1, 1, 0, 0, 1, 1); pg.getImageData(0, 0, 1, 1); }
      best = Math.min(best, (real() - t0) / 100);
    }
    return best;
  }, {place: target.place});
  await context.close();
  return ms;
}

async function finish(browser, rules, one, outDir){
  const {r, sheetUrl, thumb} = one;
  await mkdir(outDir, {recursive: true});
  const results = judge(rules, r), eyeFile = join(outDir, 'eye.md'), eye = eyeList(rules, r, eyeFile), grade = rank(results, eye);
  await writeFile(eyeFile, eye.text);
  await writeFile(join(outDir, 'sheet.png'), Buffer.from(sheetUrl.split(',')[1], 'base64'));
  await writeFile(join(outDir, 'frame.png'), Buffer.from(thumb.split(',')[1], 'base64'));
  for (const [i, url] of (r.soak && r.soak.popShots || []).entries()) await writeFile(join(outDir, `jump-${i + 1}.png`), Buffer.from(url.split(',')[1], 'base64'));
  await statusScreen(browser, r, results, eye, grade, thumb, join(outDir, 'status.png'));
  const counted = results.filter(x => x.status !== 'na'), passed = counted.filter(x => x.status === 'pass' || x.status === 'excused').length;
  const report = {name: r.name, rank: grade, quick: !!opt.quick, verdict: VERDICT[grade], passed, checked: counted.length, eye: {walked: eye.walked, total: eye.total}, results: results.map(({id, level, chapter, text, status, got, limit, fix, where, excuse}) => ({id, level, chapter, text, status, got, limit, fix, where, excuse})), suspects: {seams: r.stats.seams, tiles: r.stats.tiles}, measured: r.stats, run: r.got.run, beat: r.got.beat, ledBeat: r.got.ledBeat, reduced: r.reduced && r.reduced.run, reads: r.got.reads, cost: r.cost, caches: r.soak && r.soak.sizes, calm: r.soak && r.soak.calm};
  await writeFile(join(outDir, 'report.json'), JSON.stringify(report, null, 1));
  return {grade, results, eye, passed, checked: counted.length};
}

function printOne(name, res, outDir){
  const {grade, results, eye, passed, checked} = res;
  console.log(`\n▶ ${name}: RANK ${grade}. ${VERDICT[grade]}`);
  console.log(`  ${passed} of ${checked} checks cleared. The Eye: ${eye.walked} of ${eye.total} walked.`);
  if (opt.quick) console.log("  A quick look: no long run, reduced motion, phone or cost, so this isn't the rank yet.");
  console.log('  ' + CHAPTERS.map(ch => { const l = results.filter(x => x.chapter === ch && x.status !== 'na'); return l.length ? `${ch} ${l.filter(x => x.status === 'pass' || x.status === 'excused').length}/${l.length}` : `${ch} -`; }).join('   '));
  for (const x of results.filter(x => x.status === 'excused')) console.log(`  Excused, on purpose: ${x.id}, ${x.excuse}. (${x.got})`);
  // a rule it couldn't check isn't a rule that passed. A quick look has already said what it skips
  const unchecked = results.filter(x => x.status === 'na' && !/quick check/.test(x.got));
  if (unchecked.length) console.log("  NOT CHECKED, so these don't count either way");
  for (const x of unchecked) console.log(`  - ${x.id} ${x.text.split('.')[0]}: ${x.got}`);
  const fails = results.filter(x => x.status === 'fail').sort((a, b) => (a.level === 'Law' ? 0 : 1) - (b.level === 'Law' ? 0 : 1));
  if (fails.length) console.log('  GREMLINS');
  for (const x of fails){
    console.log(`  ✗ ${x.id} ${x.level}. ${x.text}\n      Found: ${x.got}${x.limit ? ` (wanted ${x.limit})` : ''}\n      Try: ${x.fix || 'see the rule book'}`);
    for (const w of x.where || []) console.log(`      At: ${w}`);
  }
  console.log(`  Files in ${outDir}: status.png, sheet.png, eye.md, frame.png, report.json`);
}

function agree(rules){
  const machine = Object.values(rules).filter(x => !x.eye).map(x => x.id), have = Object.keys(CHECKS);
  const lost = machine.filter(x => !have.includes(x)), extra = have.filter(x => !machine.includes(x));
  if (lost.length || extra.length) throw new Error(`The rule book and the checks disagree. No check for: ${lost.join(', ') || 'none'}. No rule for: ${extra.join(', ') || 'none'}.`);
}

async function main(){
  const rules = readRules();
  agree(rules);
  if (opt.selftest) return selftest(rules);
  if (!opt.page){ console.log(`Usage: the top of ${fileURLToPath(import.meta.url)} says how.`); process.exit(1); }
  const file = resolve(opt.page), root = opt.root ? resolve(opt.root) : dirname(file), server = await serve(root), port = server.address().port;
  const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio']});
  const base = {file, root, port, who: opt.who, seed: +(opt.seed || 2026)}, out = opt.out ? resolve(opt.out) : join(dirname(file), 'quest');
  let places = [opt.place && opt.place !== 'all' ? opt.place : null];
  if (opt.place === 'all'){
    const {context, page} = await openScene(browser, base);
    places = await page.evaluate(() => Object.keys(PLACES));
    await context.close();
  }
  const done = {};
  let next = 0;
  await Promise.all(Array.from({length: Math.min(places.length, +(opt.workers || 4))}, async () => {
    while (next < places.length){ const place = places[next++]; done[place] = await checkOne(browser, {...base, place}, rules); }
  }));
  // what a frame costs is measured last, one at a time, with nothing else running
  if (!opt.quick) for (const place of places) done[place].r.cost = await measureCost(browser, {...base, place});
  const table = [];
  for (const place of places){
    const dir = places.length > 1 ? join(out, place) : out, res = await finish(browser, rules, done[place], dir);
    printOne(done[place].r.name, res, dir);
    table.push({name: done[place].r.name, ...res});
  }
  if (places.length > 1){
    console.log('\n  QUEST LOG');
    for (const t of table) console.log(`  ${t.grade}  ${t.name.padEnd(10)} ${t.passed}/${t.checked}  ${t.results.filter(x => x.status === 'fail').map(x => x.id).join(' ') || 'no gremlins'}`);
  }
  if (table.some(t => t.results.some(x => x.status === 'fail' && x.level === 'Law'))) process.exitCode = 1;
  await browser.close(); server.close();
}

// Every check has to catch the thing it's for, on a page made to break it, and leave a good page alone.
async function selftest(rules){
  const dir = join(HERE, 'fixtures'), browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio']});
  const server = await serve(SKILL), port = server.address().port;
  const CASES = JSON.parse(readFileSync(join(dir, 'cases.json'), 'utf8'));
  let bad = 0;
  const caught = new Set();
  for (const [name, expected] of Object.entries(CASES)){
    const file = join(SKILL, name), saved = {...opt};
    if (expected.quick !== false) opt.quick = true;
    opt.seconds = expected.seconds || 12;
    const one = await checkOne(browser, {file, root: SKILL, port, place: expected.place}, rules);
    if (expected.quick === false) one.r.cost = await measureCost(browser, {file, root: SKILL, port, place: expected.place});
    Object.assign(opt, saved);
    if (!saved.quick) delete opt.quick;
    const results = judge(rules, one.r), failed = results.filter(x => x.status === 'fail').map(x => x.id);
    const missing = (expected.fails || []).filter(x => !failed.includes(x)), wrong = (expected.passes || []).filter(x => failed.includes(x));
    // not a rule, only a pointer for the Eye, but a pointer that cries wolf gets ignored
    if (expected.tiles === true && !one.r.stats.tiles.length) missing.push('tiles');
    if (expected.tiles === false && one.r.stats.tiles.length) wrong.push('tiles');
    if (expected.noLaws) for (const x of results) if (x.status === 'fail' && x.level === 'Law') wrong.push(x.id);
    for (const id of expected.fails || []) if (failed.includes(id)) caught.add(id);
    const ok = !missing.length && !wrong.length;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(36)} found: ${failed.join(' ') || 'nothing'}${missing.length ? `   MISSED: ${missing.join(' ')}` : ''}${wrong.length ? `   WRONGLY FLAGGED: ${wrong.join(' ')}` : ''}`);
    if (!ok) for (const x of results.filter(x => missing.includes(x.id) || wrong.includes(x.id))) console.log(`       ${x.id}: ${x.got}`);
  }
  const untested = Object.values(rules).filter(x => !x.eye && !caught.has(x.id)).map(x => x.id);
  console.log(untested.length ? `Checks never seen to catch anything: ${untested.join(', ')}` : 'Every check has been seen to catch something.');
  await browser.close(); server.close();
  if (bad || untested.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
