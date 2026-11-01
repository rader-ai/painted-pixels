// ===== A rooftop garden, high above a big city, at night =====
//
// Walking the place first, because it decides everything else.
//
// The light.  The moon, up on the left and high (MOON). It is across the city from us, so the faces of the
//             towers that we can see are turned away from it: they sit in shade, with only a rim of light on
//             the edge nearest the moon. The avenue's right-hand wall faces left, toward the moon, so that one
//             catches it. The second light is warm, low and local: a string of bulbs over the bench, and a
//             lantern on the table. Third, the city's own glow, which is the haze the far towers dissolve into.
// The key.    Indigo night with plum haze at the horizon. The one accent is amber: the bulbs, the lantern, and
//             the same amber in the windows far below. The aircraft light on the tallest tower is the only red.
// The depth.  Sky: stars, moon, cloud. The far towers, pale in the haze. The near towers and the avenue, in one
//             lens of one-point perspective. The low wall at the roof's edge. The deck, the bench, the tree and
//             the beds. Two great leaves at our shoulders.
// What moves. One wind: the tree, the beds, the grasses, the steam off a rooftop, the string of bulbs. Otherwise:
//             their own small life, clouds gathering and thinning, windows going out and coming back, traffic
//             crawling down the avenue, the beacon, moths at the bulbs.
// What lives. Moths at the bulbs. A cat that walks the wall. Now and then a plane, a shooting star, a comet, bats.
// What they do. Tends the herbs: pinches a leaf of basil and smells it. Sips tea. Takes a photo of the city.
//             Watches the sky, and the plane when it comes. Says hello to the cat.
// The moment. The bulbs warm on their shoulder, a leaf of basil at their nose, and a plane's lights sliding past the moon.
//
// Coordinates are the kit's: x, y in scene units, X, Y in canvas pixels (HD to the unit). The kit's SW is 480
// here, not 320: the world is wider than most screens, and the page crops it. See layout().

const MOON = {x: 176, y: 24, r: 7};
const R2 = v => Math.round(v * HD);
const toRamp = cols => cols.map(rgb);
const pickR = (rp, v, X, Y) => rp[clamp(Math.floor(v * rp.length + bay(X, Y)), 0, rp.length - 1)];
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// The light, written down first. Everything below reads from this, so nothing can disagree.
LIGHTS.roof = {id: 'r', dim: .8, tint: [20, 22, 66], tintAmt: .2,
  rim: '#ffb46a', rimAmt: .7, side: 1,                       // the bulbs and the lantern, on the side they face
  rim2: '#b4c4f4', rimAmt2: .42, side2: -1,                   // the moon, over their shoulder
  far: .5, ink: '#070916', seat: 131.5,
  key: {x: MOON.x, horizon: 72, long: .8, shadow: .15, col: '#b4c4f4'},
  spots: [
    {x: 262, y: 132, r: 84, col: '#ffb064', long: 1, shadow: .26},                           // the string of bulbs, over the bench
    {x: 272, y: 130, r: 34, col: '#ffa850', long: .8, shadow: .22, fire: true}]};            // the lantern on the table

// ---- the sky ----
const SKY_NIGHT = ['#05061a', '#090b27', '#0f1236', '#181845', '#25204f', '#3a2558', '#5a2e60', '#8a4468', '#c8706e'];

// ---- the city, in one lens ----
// One-point perspective down an avenue, painted once. vx, vy is where the avenue ends, on the horizon; Hc is
// how far above the street we are, in metres; F turns a metre at a distance into pixels. Everything is a box
// laid on the ground, and every face of it is worked out from that, so near towers are big and far ones small
// without anybody choosing it. Far boxes dissolve toward the haze, and most windows are dark.
const LENS = {vx: 300, vy: 70, F: 100, Hc: 28};
const AVE = 26;          // half the width of the open avenue, in metres
const FLOOR = 3.6, BAY = 3.2;
const HAZE = rgb('#7a4470');
const STREET_GLOW = rgb('#a2584c');
const fogAt = z => clamp(1 - Math.exp(-z / 800), 0, .9);
const W_SHADE = toRamp(['#060820', '#0a0d2b', '#101338', '#181a45', '#232355', '#323068']);
const W_LIT   = toRamp(['#10163a', '#1a2556', '#283672', '#3a4d8c', '#5268a4', '#7c94c8']);
const W_ROOF  = toRamp(['#0e1234', '#181e46', '#242c5a', '#343f70', '#4a5888', '#6e7fae']);
const RIM = rgb('#a4b2ee');
const WIN_WARM = toRamp(['#f4a050', '#ffbc62', '#ffcf82', '#ffe2a4']);
const WIN_WHITE = rgb('#d6e6ff'), WIN_TV = toRamp(['#4a8ae8', '#6ab0ff']);
const proj = (X, Y, Z) => [LENS.vx + X * LENS.F / Z, LENS.vy + (LENS.Hc - Y) * LENS.F / Z];

// the towers the picture is composed from, placed by hand: x0..x1 across the avenue (metres, the avenue is
// AVE * 2 wide), z0..z1 along it, h up. occ is how much of it is lit, and fill how much of a lit floor.
const TOWERS = [
  // left of the avenue. The sleeper stands right behind the bench: dark, plain, nearly every window out
  {x0: -70, x1: -AVE, z0: 70, z1: 140, h: 40, occ: .02, fill: .4, tone: 'office', bias: -.02, dark: 18, dimLit: .5},
  {x0: -60, x1: -AVE - 6, z0: 78, z1: 140, h: 54, occ: .018, fill: .4, tone: 'office', bias: -.04, dark: 18, dimLit: .5},
  {x0: -150, x1: -80, z0: 96, z1: 170, h: 31, occ: .3, fill: .55, tone: 'flats', bias: .05},
  {x0: -236, x1: -158, z0: 108, z1: 190, h: 47, occ: .3, fill: .5, tone: 'office', bias: -.03},
  {x0: -330, x1: -245, z0: 112, z1: 190, h: 27, occ: .26, fill: .6, tone: 'flats', bias: .06},
  // right of the avenue
  {x0: AVE, x1: 78, z0: 88, z1: 170, h: 40, occ: .2, fill: .5, tone: 'office', bias: 0},
  {x0: 84, x1: 150, z0: 98, z1: 170, h: 33, occ: .34, fill: .55, tone: 'flats', bias: .05},
  {x0: 156, x1: 232, z0: 108, z1: 190, h: 52, occ: .3, fill: .5, tone: 'office', bias: -.04},
  // the tallest tower, at the far end, with a crown and a mast; it carries the red light
  {x0: 34, x1: 74, z0: 1100, z1: 1200, h: 310, occ: .22, fill: .6, tone: 'office', bias: .02},
  {x0: 44, x1: 64, z0: 1110, z1: 1190, h: 352, occ: .2, fill: .6, tone: 'office', bias: .02},
];
const WINDOWS = [];     // the few windows that go out and come back: found while painting the near towers
const STEAM_AT = {x: 352.5, y: 49.4};                                        // a chimney on a roof, where the steam comes from
const BEACON = (() => { const [x, y] = proj(54, 352, 1110); return {x, y: y - 7}; })();      // the red light on the tallest tower's mast

function cityBoxes(){
  const r = mulberry32(31), boxes = TOWERS.map((b, i) => ({...b, seed: 100 + i * 17}));
  // everything else, in bands of depth: each band spans as much of the screen as can be seen at that distance
  const bands = [[200, 290, 30, 64, .3], [300, 440, 36, 96, .28], [470, 680, 44, 140, .26], [720, 1000, 56, 190, .24], [1060, 1500, 70, 250, .22], [1650, 2400, 80, 300, .2]];
  bands.forEach(([za, zb, hmin, hmax, occ], bi) => {
    const zm = (za + zb) / 2, s = LENS.F / zm, xl = (-20 - LENS.vx) / s, xr = (500 - LENS.vx) / s;
    for (let x = xl; x < xr;){
      const w = 22 + r() * 46, x0 = x, x1 = x + w, z0 = za + r() * (zb - za) * .6, h0 = hmin + (hmax - hmin) * Math.pow(r(), .8);
      const centre = 1 - Math.min(1, Math.abs((x0 + x1) / 2) / (xr - xl) * 2.4);       // the downtown cluster sits at the end of the avenue
      const h = h0 * (.7 + .6 * centre);
      x += w + (r() < .12 ? 10 + r() * 24 : r() * 4);
      if (zm < 1000 && x1 > -AVE && x0 < AVE) continue;                                // the avenue is kept open
      boxes.push({x0, x1, z0, z1: z0 + 40 + r() * 80, h, occ: occ * (.4 + r() * 1.3), fill: .45 + r() * .3, tone: r() < .5 ? 'office' : 'flats', seed: Math.floor(r() * 9999)});
    }
  });
  return boxes;
}

// one pixel of wall: its tone, the glow of the street at its foot, a window or a dark pane, the rim of moonlight
function shadeWall(b, ramp, u, u0, wy, z, X, Y, edge, dyn){
  const s = LENS.F / z, fog = fogAt(z), cell = BAY * s * HD, fl = Math.floor(wy / FLOOR), fy = wy / FLOOR - fl;
  // the wall: a slow tone, a patchiness a little wider than a window, a smear of sky in the glass that
  // lightens toward the top, and a grain. It's one wall, but it isn't flat
  const v = .3 + (b.bias || 0) + (vnoise(X * .22, Y * .22, 7, b.seed) - .5) * .22 + (hash2(X, Y, b.seed) - .5) * .06
    + (vnoise(X * .045, Y * .06, 20, b.seed + 7) - .5) * .14 + (vnoise((u + wy * .6) * .07, wy * .03, 1, b.seed + 13) - .5) * .1 + clamp(wy / 70, 0, 1) * .05;
  let c = pickR(ramp, v, X, Y), lit = false;
  const foot = clamp(1 - wy / 12, 0, 1);
  if (foot > 0) c = mixA(c, STREET_GLOW, foot * foot * .3);
  const wall = c;
  if (!edge && wy > 2 + (b.dark || 0)){
    // whole floors are lit together, and most are not: a city asleep. A few lone windows are lit as well
    const floorOn = hash2(fl, 17, b.seed) < b.occ * 1.4;
    if (cell >= 3.4){
      const bi = Math.floor((u - u0) / BAY), fx = (u - u0) / BAY - bi;
      if (fx > .2 && fx < .8 && fy > .24 && fy < .78){
        const on = (floorOn && hash2(bi, fl, b.seed) < b.fill) || hash2(bi, fl, b.seed + 21) < b.occ * .14;
        if (on && !dyn(bi, fl)){
          const h = hash2(bi, fl, b.seed + 9);
          c = h < .1 ? pickR(WIN_TV, hash2(bi, fl, 3), X, Y) : h < .22 ? WIN_WHITE : pickR(WIN_WARM, hash2(bi, fl, b.seed + 4), X, Y);
          if (b.dimLit) c = mixA(wall, c, b.dimLit);
          lit = true;
        } else {
          // a dark pane: no two quite alike, some with a curtain's faint violet behind them
          const k = .6 + hash2(bi, fl, b.seed + 31) * .3;
          c = c.map(q => q * k);
          if (hash2(bi, fl, b.seed + 33) < .14) c = mixA(c, rgb('#3a3262'), .3);
        }
      }
    } else if (floorOn && fy > .3 && fy < .8 && hash2(X, Y, b.seed + 2) < b.fill * .75){ c = pickR(WIN_WARM, hash2(X, Y, 5), X, Y); if (b.dimLit) c = mixA(wall, c, b.dimLit); lit = true; }
  }
  if (edge === 1) return mixA(mixA(c, RIM, .55), HAZE, fog * .45);
  if (edge === 2) return mixA(mixA(c, RIM, .4), HAZE, fog * .45);
  return fog ? mixA(c, HAZE, lit ? fog * .7 : fog) : c;
}

// what's on a roof: a water tank, a mast, a few boxes of plant. Against the sky, so they're only shapes, with a rim on the moon's side
function roofClutter(p, b, xa, xb, Yt, rimLeft){
  const r = mulberry32(b.seed * 3 + 1), ink = mixA(pickR(W_SHADE, .15, 0, 0), HAZE, fogAt(b.z0)), rim = mixA(RIM, HAZE, fogAt(b.z0) * .6), w = xb - xa;
  if (w < 14) return;
  const put = (X, Y) => p.put(X, Y, ink), rimAt = (X, Y) => p.put(X, Y, rim);
  for (let i = 0, n = 1 + Math.floor(r() * 3); i < n; i++){
    const X0 = xa + 3 + Math.floor(r() * (w - 10)), kind = r();
    if (kind < .3 && w > 30){                      // a water tank on legs, with a cap
      const tw = 7 + Math.floor(r() * 4), th = 7 + Math.floor(r() * 3);
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) put(X0 + x, Yt - 3 - y);
      for (let x = 0; x < tw; x += tw - 1) for (let y = 0; y < 3; y++) put(X0 + x, Yt - y - 1);
      for (let x = 1; x < tw - 1; x++) put(X0 + x, Yt - 3 - th);
      rimAt(rimLeft ? X0 : X0 + tw - 1, Yt - 3 - Math.floor(th / 2));
    } else if (kind < .65){                       // a mast, with a cross-piece
      const mh = 8 + Math.floor(r() * 14);
      for (let y = 1; y <= mh; y++) put(X0, Yt - y);
      for (let x = -2; x <= 2; x++) put(X0 + x, Yt - Math.floor(mh * .7));
      rimAt(X0, Yt - mh);
    } else {                                        // plant: boxes with a vent
      const bw = 4 + Math.floor(r() * 5), bh = 2 + Math.floor(r() * 3);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) put(X0 + x, Yt - 1 - y);
      for (let x = 0; x < bw; x++) rimAt(X0 + x, Yt - bh - 1);
    }
  }
}

function paintBox(p, b){
  const {vx, vy, F, Hc} = LENS, s0 = F / b.z0, s1 = F / b.z1;
  const side = b.x1 <= -AVE ? -1 : b.x0 >= AVE ? 1 : 0, cx = vx + (b.x0 + b.x1) / 2 * s0, rimLeft = cx > MOON.x;
  const none = () => false, near = s0 >= .8;
  // the roof, when it's below our eyes
  if (b.h < Hc){
    const Ya = R2(vy + (Hc - b.h) * s1), Yb = R2(vy + (Hc - b.h) * s0);
    for (let Y = Math.max(0, Ya); Y < Math.min(DH, Yb); Y++){
      const z = (Hc - b.h) * F / ((Y + .5) / HD - vy), s = F / z, xa = R2(vx + b.x0 * s), xb = R2(vx + b.x1 * s);
      for (let X = Math.max(0, xa); X < Math.min(DW, xb); X++) p.put(X, Y, mixA(pickR(W_ROOF, .4 + (vnoise(X * .3, Y * .5, 6, b.seed) - .5) * .4 + (X === xa || X === xb - 1 ? .25 : 0), X, Y), HAZE, fogAt(z)));
    }
  }
  // its side, the face that looks down the avenue: the right-hand wall faces the moon, the left-hand one turns away
  if (side){
    const X0 = side < 0 ? b.x1 : b.x0, ramp = side > 0 ? W_LIT : W_SHADE, xa = R2(vx + X0 * s0), xb = R2(vx + X0 * s1);
    for (let X = Math.max(0, Math.min(xa, xb)); X < Math.min(DW, Math.max(xa, xb)); X++){
      const u = (X + .5) / HD - vx, z = X0 * F / u, s = F / z, Yt = R2(vy + (Hc - b.h) * s), Yb = R2(vy + Hc * s);
      for (let Y = Math.max(0, Yt); Y < Math.min(DH, Yb); Y++)
        p.put(X, Y, shadeWall(b, ramp, z, b.z0, Hc - ((Y + .5) / HD - vy) / s, z, X, Y, Y === Yt && side > 0 ? 2 : 0, none));
    }
  }
  // its front, the face turned toward us. The moon is behind it, so it's in shade, and only an edge catches the light
  const xa = R2(vx + b.x0 * s0), xb = R2(vx + b.x1 * s0), Yt = R2(vy + (Hc - b.h) * s0), Yb = R2(vy + Hc * s0);
  const dyn = (bi, fl) => near && hash2(bi, fl, b.seed + 77) < .06;
  for (let X = Math.max(0, xa); X < Math.min(DW, xb); X++){
    const u = ((X + .5) / HD - vx) / s0;
    for (let Y = Math.max(0, Yt); Y < Math.min(DH, Yb); Y++)
      p.put(X, Y, shadeWall(b, W_SHADE, u, b.x0, Hc - ((Y + .5) / HD - vy) / s0, b.z0, X, Y, (rimLeft ? X === xa : X === xb - 1) ? 1 : Y === Yt ? 2 : 0, dyn));
  }
  if (b.h >= Hc && s0 >= .3) roofClutter(p, b, xa, xb, Yt, rimLeft);
  // the windows that go out and come back are painted dark here, and lit again, now and then, in frame
  if (near) for (let fl = 1; fl * FLOOR < b.h - 2; fl++) for (let bi = 0; bi * BAY < b.x1 - b.x0 - BAY; bi++){
    if (!dyn(bi, fl) || !(hash2(fl, 17, b.seed) < b.occ * 1.8 && hash2(bi, fl, b.seed) < b.fill)) continue;
    const [sx, sy] = proj(b.x0 + (bi + .2) * BAY, (fl + .78) * FLOOR, b.z0);
    WINDOWS.push({X: R2(sx), Y: R2(sy), w: Math.max(2, R2(BAY * .6 * s0)), h: Math.max(2, R2(FLOOR * .54 * s0)), seed: b.seed + bi * 31 + fl, box: b});
  }
}

function paintCity(p){
  const {vx, vy, F, Hc} = LENS, GROUND = toRamp(['#0a0c28', '#14153a', '#241e4c', '#3c2a5a', '#5e3868', '#8a4a6c']);
  // the ground under all of it: dim and warm at the horizon, dark near us
  for (let Y = R2(vy); Y < R2(118); Y++){
    const f = (Y / HD - vy) / (118 - vy);
    for (let X = 0; X < DW; X++) p.put(X, Y, pickR(GROUND, 1 - Math.pow(f, .55) + (vnoise(X * .1, Y * .4, 11, 3) - .5) * .1, X, Y));
  }
  for (const b of cityBoxes().sort((a, c) => c.z0 - a.z0)) paintBox(p, b);
  // a window that a nearer tower has painted over mustn't light up in front of it: keep only the ones still showing their dark pane
  const keep = WINDOWS.filter(w => {
    const b = w.box, s0 = F / b.z0, u = ((w.X + .5) / HD - vx) / s0, wy = Hc - ((w.Y + .5) / HD - vy) / s0;
    const want = shadeWall(b, W_SHADE, u, b.x0, wy, b.z0, w.X, w.Y, 0, () => true), got = p.get(w.X, w.Y);
    return Math.abs(want[0] - got[0]) < 3 && Math.abs(want[1] - got[1]) < 3 && Math.abs(want[2] - got[2]) < 3;
  });
  WINDOWS.length = 0; WINDOWS.push(...keep);
  // a chimney on the right-hand tower, and the mast on the tallest tower
  const ink = mixA(pickR(W_SHADE, .12, 0, 0), HAZE, .1);
  p.rect(STEAM_AT.x - 1.5, STEAM_AT.y, 3, 7, ink); p.rect(STEAM_AT.x - 2, STEAM_AT.y - .5, 4, .5, ink); p.rect(STEAM_AT.x - 1.5, STEAM_AT.y, .5, 7, '#6a7ab8');
  p.rect(BEACON.x - .25, BEACON.y, .5, 7, mixA(ink, HAZE, .3));
  // the avenue's lamps: two lines of warm dots running to the end of it
  for (let z = 80; z < 1400; z += 28 + z * .035){
    for (const side of [-1, 1]){
      const s = F / z, X = side * 17, [hx, hy] = proj(X, 9, z), [, by] = proj(X, 0, z);
      if (s > .45) for (let Y = R2(hy); Y < R2(by); Y++) p.put(R2(hx), Y, rgb('#1a1a3a'));
      p.glow(hx, hy, Math.max(1.2, 4 * s), '#ffb468', .5);
      if (s > .2) p.glow(hx - side * 5 * s, by + .4, 7 * s, '#ff9a50', .28, 1.6 * s);          // and a pool of it on the street
      p.put(R2(hx), R2(hy), rgb('#ffe0a0'));
    }
  }
}


// ---- ramps for this night. A ramp belongs to its light: the kit's daylight greens and browns would glow here ----
const PAGE = (() => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--page').trim() || '#0b0a1f'; return rgb(c.fillStyle); })();
const LEAF_COOL = ['#050d13', '#0a1b24', '#102e3a', '#194a52', '#2a6c6c', '#74b0a4'];      // moonlit leaf: teal in the dark, silver on the lit edge
const LEAF_HERB = ['#060d12', '#0b1c1e', '#12302c', '#1f4a38', '#356a4c', '#82aa8c'];      // herbs lean greener than the birch, but they are still lit by the moon
const LEAF_WARM = LEAF_COOL.map((c, i) => css(mixA(rgb(c), rgb('#d8a860'), [0, .05, .15, .26, .36, .48][i])));      // the same leaf under the bulbs: a tint, not another tree
const GRASS_MOON = ['#06100f', '#0b1c1a', '#122c28', '#1c4036', '#2c5c48', '#5a8c6c'];
const BARK_BIRCH = ['#14101e', '#403a58', '#79759a', '#a2a0c2', '#c4c2de'].map(rgb);        // a birch: pale trunk, dark streaks, silver in the moon
const WOOD_N = toRamp(['#0b0914', '#150f20', '#211830', '#31243f', '#44345a', '#5c4a78']);   // moonlit wood leans violet
const DECK_N = toRamp(['#0a0813', '#130f20', '#1e1730', '#2c2342', '#3f3358', '#584a70']);
const WALL_N = toRamp(['#080a22', '#0e1236', '#161b48', '#20285c', '#2f3a74', '#44528c']);
const COPING = toRamp(['#4a5496', '#6674b4', '#8896d0', '#aab6e8']);
const POT_N = toRamp(['#150b14', '#26141e', '#3a2030', '#533044', '#70445a']);
const sunFor = x => x < MOON.x ? 1 : -1;                                                     // which side of a thing the moon is on

// how far the bulbs and the lantern reach, for everything painted once (the moving things ask the kit's lightAt)
const POOLS = [{x: 284, y: 110, rx: 62, ry: 18, a: .55}, {x: 262, y: 132, rx: 84, ry: 24, a: 1}, {x: 272, y: 128, rx: 32, ry: 13, a: 1}];
function warmAt(x, y){
  let w = 0;
  for (const P of POOLS) w = Math.max(w, Math.pow(Math.max(0, 1 - Math.hypot((x - P.x) / P.rx, (y - P.y) / P.ry)), 1.5) * P.a);
  return w;
}
const WARM = rgb('#ffa458');

// ---- the roof's edge ----
// A wall about as high as a person's chest, with a stone coping, in sections that step a little and with pillars,
// so that its top is never one ruled line.
const PAR = {top: 105, base: 120};
const PILLARS = [30, 114, 201, 287, 372, 451], WALL_STEP = [0, 2, -2, 0, 3, -2, 2];
const parTop = x => { let i = 0; while (i < PILLARS.length && x >= PILLARS[i] + 3) i++; return PAR.top + WALL_STEP[i]; };
function paintParapet(p){
  const r = mulberry32(61), joints = [];
  for (let x = 6; x < SW; x += 17 + r() * 18) joints.push(Math.round(x * HD));
  for (let X = 0; X < DW; X++){
    const x = X / HD, pillar = PILLARS.some(P => Math.abs(x - P) < 3), top = R2(parTop(x) - (pillar ? 3 : 0)) + (pillar ? 0 : Math.floor(vnoise(X, 0, 26, 77) * 2.6) - 1), joint = joints.includes(X) || joints.includes(X - 1) && hash2(X, 3, 9) < .3;
    for (let Y = top; Y < R2(PAR.base); Y++){
      const d = Y - top, y = Y / HD, w = warmAt(x, y);
      let c;
      if (d < 2) c = COPING[clamp(Math.floor(.5 + (pillar ? 2 : 1) * (hash2(X >> 2, 5, 7) + .3) + bay(X, Y)), 0, 3)];
      else if (d === 2) c = WALL_N[0];
      else {
        const streak = vnoise(X * .12, Y * .02, 5, 31) - .5, v = .3 - (Y - top) / (R2(PAR.base) - top) * .12 + streak * .26 + (hash2(X, Y, 4) - .5) * .06;
        c = pickR(WALL_N, v + w * .1, X, Y);
        if (joint && !pillar && d > 2) c = WALL_N[0];
        if (pillar && (X === R2(PILLARS.find(P => Math.abs(x - P) < 3)) - R2(3))) c = WALL_N[4];
        c = mixA(c, WARM, w * .2);
      }
      p.put(X, Y, d < 2 ? mixA(c, WARM, warmAt(x, y) * .3) : c);
    }
  }
}

// ---- the deck ----
const PLANK_Y = [120, 123, 126.4, 130.2, 134.6, 139.6, 145.2, 151.5];
function paintDeck(p){
  for (let Y = R2(PAR.base); Y < DH; Y++){
    const y = Y / HD, i = PLANK_Y.findIndex((a, k) => y >= a && y < PLANK_Y[k + 1]), top = R2(PLANK_Y[i]), tone = .26 + hash2(i, 5, 71) * .16, row = Y - top;
    const butt = hash2(i, 9, 71) * 140 + 60;
    for (let X = 0; X < DW; X++){
      const x = X / HD, w = warmAt(x, y), cut = Math.floor((X + hash2(i, 3, 71) * 300) / (butt + 40 * hash2(i, 4, 71)));
      let v = tone + hash2(cut, i, 17) * .1 + (vnoise(X * .07, Y * 1.6, 9, 23 + i) - .5) * .18 + (hash2(X, Y, 3) - .5) * .05 + w * .2;
      if (row === 0) v -= .3; else if (row === 1) v += .08;                              // the gap between boards, and the lip catching the moon
      if (Math.floor((X + hash2(i, 3, 71) * 300) % (butt + 40 * hash2(i, 4, 71))) === 0) v -= .25;       // a butt joint
      let c = mixA(pickR(DECK_N, v, X, Y), WARM, w * .3 * (row ? 1 : .3));
      // it melts into the page: the nearest boards are the page's own colour, so the picture has no bottom edge
      const fade = smooth(139, 149.4, y);
      if (fade > 0) c = mixA(c, PAGE, clamp(fade + bay(X, Y) * .25 * (1 - fade), 0, 1));
      p.put(X, Y, c);
    }
  }
}

// where it touches the ground: a little dark glow under something that stands on something, tinted, not black
const groundShadow = (p, cx, cy, rx, ry, a = .5) => p.glow(cx, cy, rx * .8, '#070916', a * .8, ry);
// and the shadow it throws. Things that stand still get the same shadows as things that move: the kit's own
// shadowsOf, one running away from the moon and one from the lantern, in the shape of what casts it (a footprint
// swept along), longer for something taller, thinning to nothing. A tall post throws a long one, a low box a short one.
// The lantern's flicker is left out here: this is painted once.
const L_STATIC = {...LIGHTS.roof, veiled: 0, spots: LIGHTS.roof.spots.map(s => ({...s, fire: false}))};
function castFoot(p, x0, x1, yb, h, depth = 1){
  for (const sd of shadowsOf(L_STATIC, (x0 + x1) / 2, yb)){
    const len = Math.min(26, Math.hypot(sd.dx, sd.dy) * h), n = Math.hypot(sd.dx, sd.dy) || 1, vx = sd.dx / n * len, vy = Math.max(.5, sd.dy / n * len), ink = rgb(sd.ink);
    const steps = Math.max(2, Math.ceil(Math.hypot(vx, vy) * HD));
    for (let i = 0; i <= steps; i++){
      const f = i / steps, a = sd.alpha * 2.6 * (1 - f * .75), Y = R2(yb + vy * f), X0 = R2(x0 + vx * f), X1 = Math.max(R2(x1 + vx * f), X0 + 1);
      for (let X = X0; X < X1; X++) for (let dy = 0; dy < Math.max(1, R2(depth)); dy++) if (bay(X, Y + dy) + .5 < a) p.put(X, Y + dy, [ink[0], ink[1], ink[2], .5]);
    }
  }
}

// a raised wooden bed: slatted front, a lit rim, a dark top of soil
function paintBed(p, x0, x1, yb, h, seed){
  groundShadow(p, (x0 + x1) / 2 + 2, yb + .5, (x1 - x0) / 2 + 3, 2.4, .7);
  castFoot(p, x0, x1, yb + .5, h, 1.5);
  const top = yb - h;
  for (let X = R2(x0); X < R2(x1); X++) for (let Y = R2(top); Y < R2(yb); Y++){
    const x = X / HD, y = Y / HD, d = Y - R2(top), slat = Math.floor(d / 3), edge = X < R2(x0) + 2 || X >= R2(x1) - 2;
    let v = .34 + (hash2(slat, 3, seed) - .5) * .16 + (vnoise(X * .5, Y * .2, 5, seed) - .5) * .2 - (d / (R2(yb) - R2(top))) * .1 + warmAt(x, y) * .2;
    if (d % 3 === 2) v -= .22;
    if (edge) v -= .12;
    if (d === 0) v = .88;
    p.put(X, Y, mixA(pickR(WOOD_N, v, X, Y), WARM, warmAt(x, y) * .3));
  }
  // the soil, from just above
  for (let X = R2(x0) + 2; X < R2(x1) - 2; X++) for (let Y = R2(top) - 3; Y < R2(top); Y++) p.put(X, Y, pickR(toRamp(['#0c080e', '#160e16', '#221620']), hash2(X, Y, seed) * .9, X, Y));
  for (let i = 0, r = mulberry32(seed), n = Math.round((x1 - x0) * .5); i < n; i++) p.put(R2(x0) + 3 + Math.floor(r() * (R2(x1 - x0) - 6)), R2(top) - 1 - Math.floor(r() * 2), rgb('#4a3848'));
}
// a round pot: lit on the side that faces the moon
function paintPot(p, cx, yb, w, h, seed){
  groundShadow(p, cx + 2, yb + .5, w * .62, 2, .7);
  castFoot(p, cx - w * .3, cx + w * .3, yb + .5, h, 1.5);
  const sun = sunFor(cx);
  for (let Y = R2(yb - h); Y < R2(yb); Y++){
    const f = (Y - R2(yb - h)) / R2(h), half = R2(w / 2) * (1 - f * .26) + (f < .12 ? 1 : 0);
    for (let X = R2(cx) - Math.round(half); X <= R2(cx) + Math.round(half); X++){
      const u = (X - R2(cx)) / half, v = .42 + u * sun * .28 - f * .12 + (hash2(X, Y, seed) - .5) * .08 + (f < .12 ? .14 : 0);
      p.put(X, Y, mixA(pickR(POT_N, v, X, Y), WARM, warmAt(X / HD, Y / HD) * .3));
    }
  }
}

// the tree's planter, the bench, the table and the pole
function paintFurniture(p){
  // the timber post that the bulbs hang from
  groundShadow(p, 314, 129.5, 9, 1.8, .6);
  castFoot(p, 310, 314, 129, 43, 1.4);
  p.box(307, 126.5, 10, 3.5, ['#0c0a18', '#1e1a34', '#3a3660']);
  p.sun = -1;
  p.wood(310, 84, 4, 43, ['#0b0814', '#150f20', '#211830', '#31243f', '#44345a'], 55, true);
  p.box(308.5, 82.8, 7, 1.6, ['#0c0a18', '#241c3a', '#4a4070']);
  p.rect(303, 84, 7, .7, '#1c1830'); p.rect(303, 84, 7, .3, '#4a4478'); p.rect(311.5, 90, 1, 6, '#3a3660');           // the arm the string is hooked on, and a bracket
  // the bench: low enough that they can put their feet on the deck
  groundShadow(p, 240, 132, 30, 2.2, .8);
  castFoot(p, 214, 266, 131.5, 5, 2);
  p.sun = -1;
  p.wood(213, 126.5, 54, 2.5, ['#0e0a18', '#1c1428', '#2e2240', '#46345c', '#625080'], 41);
  p.wood(214, 129, 52, 1.5, ['#0b0814', '#150f20', '#1e1630', '#2c2142', '#3a2c54'], 42);
  p.rect(216, 130.5, 2, 1.5, '#0c0916'); p.rect(262, 130.5, 2, 1.5, '#0c0916'); p.rect(216, 130.5, 1, 1.5, '#2a2442'); p.rect(262, 130.5, 1, 1.5, '#2a2442');
  // the little table, with a lantern on it and a pot of basil
  groundShadow(p, 269, 132.5, 12, 1.6, .75);
  castFoot(p, 258, 276, 132, 12, 2);
  p.ellipse(266, 124.4, 12, 2.4, '#0d0a18');
  p.ellipse(266, 123.8, 11.4, 2, '#3c3258'); p.ellipse(266, 123.6, 10, 1.4, '#5e5088');
  p.rect(265, 125.4, 2, 6.4, '#15111f'); p.rect(264.5, 125.4, .5, 6.4, '#34305a'); p.ellipse(266, 131.8, 6, 1, '#15111f');
  p.pixels(['...aaa...', '..a...a..', '.bbbbbbb.', '.bdeeedb.', '.bdeeedb.', '.bdefedb.', '.bdefedb.', '.bdeeedb.', '.bdeeedb.', '.bbbbbbb.', '..bbbbb..'],
    {a: '#2a2440', b: '#15101e', d: '#ffb458', e: '#ffd890', f: '#fff4d0'}, 269.75, 117.9);
  p.rect(271.2, 123.7, 1.8, 1, '#c8844a'); p.rect(271.7, 124.7, .9, .5, '#8a5a40');                 // the lantern, mirrored in the polished top
  p.rect(255.6, 120.2, 5, 3.4, '#3a2030'); p.rect(255.2, 119.8, 5.8, .8, '#5a3444'); p.rect(255.6, 120.4, 1, 3, '#6a4258');
}
// the birch's big planter and trunk
// a multi-stem birch in one big planter: three pale stems, each with its own airy crown, leaning apart
const STEMS = [
  treeModel({x: 190, y: 120.8, h: 19, rx: 19, ry: 13, pal: LEAF_COOL, pal2: LEAF_COOL, seed: 12, lean: -3.5, w: 2.4, sun: -1, lobes: 2}),
  treeModel({x: 197, y: 120.8, h: 27, rx: 21, ry: 14.5, pal: LEAF_COOL, pal2: LEAF_COOL, seed: 14, lean: .5, w: 2.8, sun: -1, lobes: 2}),
  treeModel({x: 204, y: 120.8, h: 17, rx: 18, ry: 12.5, pal: LEAF_COOL, pal2: LEAF_COOL, seed: 16, lean: 3.5, w: 2.3, sun: -1, lobes: 2}),
];
const BIRCH = {clumps: STEMS.flatMap(m => m.clumps).sort((a, b) => (a.cy - a.r * .3) - (b.cy - b.r * .3))};
for (const c of BIRCH.clumps) c.pal = c.cx > 207 && c.cy > 80 ? LEAF_WARM : LEAF_COOL;       // the leaves nearest the bulbs take a little warmth
function paintTreeBase(p){
  paintBed(p, 182, 211, 129, 9.5, 17);
  groundShadow(p, 197, 121, 24, 2, .4);
  for (const m of STEMS) castFoot(p, m.s.x - 1, m.s.x + 1, 120.8, m.s.h * .9, 1);
  for (const m of STEMS){
    for (const b of m.branches) stroke(p, b, BARK_BIRCH, -1);
    for (const rt of m.roots) stroke(p, rt, BARK_BIRCH, -1);
    stroke(p, m.trunk, BARK_BIRCH, -1);
  }
}

// ---- what grows here ----
// Every bed is a few kinds of thing, because a bed of one kind looks planted by a machine. Leaves are clumps that
// the wind moves, so a gust crosses from one bed to the next. Light for each is the moon's, from whichever side
// it is on, and warm where the bulbs reach.
const SOIL_Y = 117.6;
const BLOOM_N = [['#f0d4e8', '#c488b0', '#744070'], ['#e8c8e0', '#b47aa6', '#6a3868']];
const bush = (x, w, h, pal, pal2, seed, blooms, y = SOIL_Y + .6) => bushModel({x, y, w, h, pal, pal2, seed, blooms, sun: sunFor(x)});
const BUSHES = [
  bush(70, 14, 8, LEAF_HERB, LEAF_COOL, 31), bush(91, 15, 8, LEAF_HERB, LEAF_COOL, 32),         // basil, between the tomatoes
  bush(131, 14, 9, LEAF_HERB, LEAF_COOL, 33), bush(161, 12, 8, LEAF_HERB, LEAF_COOL, 34),       // rosemary, at the ends of the lavender
  bush(412, 34, 17, LEAF_COOL, LEAF_COOL, 35, BLOOM_N),                                         // a rose
  bush(188, 9, 5, LEAF_COOL, LEAF_COOL, 36, null, 121.4), bush(207, 8, 5, LEAF_COOL, LEAF_COOL, 37, null, 121.4),   // ferns at the birch's foot
  bush(258.4, 8, 6, LEAF_HERB, LEAF_COOL, 38, null, 120.4),                                    // the basil on the table
];
function tomatoPlant(x, seed){
  const r = mulberry32(seed), clumps = [], fruits = [];
  for (let i = 0; i < 5; i++){
    const f = i / 4, cx = x + (r() - .5) * 4;
    clumps.push({cx, cy: SOIL_Y - 3.5 - f * 17 + (r() - .5) * 2, r: 3.7 + r() * 1.3 - f * .6, variant: seed + i * 5, pal: LEAF_HERB, shade: i % 2 ? -1 : 0, sun: sunFor(x), amp: .5 + f * 1.1});
  }
  for (let i = 0; i < 4; i++) fruits.push({dx: (r() - .5) * 8, y: SOIL_Y - 5 - r() * 11, i: Math.min(4, Math.floor((SOIL_Y - 5 - 0) / 3.8))});
  return {x, clumps, fruits};
}
const TOMATOES = [tomatoPlant(60, 51), tomatoPlant(79, 52), tomatoPlant(101, 53)];
function drawTomatoes(k, t, still){
  for (const T of TOMATOES){
    drawClumps(k, T.clumps, t, still);
    for (const f of T.fruits){
      const amp = .5 + (1 - (f.y - (SOIL_Y - 22)) / 22) * .7, dx = still ? 0 : Math.round(WIND(T.x) * amp), X = Math.round((T.x + f.dx) * HD) + dx, Y = Math.round(f.y * HD);
      k.g.fillStyle = '#4e1628'; k.g.fillRect(X, Y, 3, 3);
      k.g.fillStyle = '#862a42'; k.g.fillRect(X, Y, 2, 2);
      k.g.fillStyle = '#b8586c'; k.g.fillRect(X, Y, 1, 1);
    }
  }
}
function lavenderStalks(x0, x1, seed){
  const r = mulberry32(seed), list = [];
  for (let x = x0; x < x1; x += .7 + r() * 1.5) list.push({x, h: 10 + r() * 6, lean: (r() - .5) * 1.6});
  return list;
}
const LAVENDER = lavenderStalks(138, 156, 61).concat(lavenderStalks(166, 170, 62));
const SPIKE = ['#4a3c88', '#6e5cb4', '#9a8ae0', '#c4baf4'], STEM = ['#17332c', '#24503a'];
function drawLavender(k, list, t, still){
  const g = k.g;
  for (const s of list){
    const w = still ? 0 : WIND(s.x) * (1 + s.h * .11), n = Math.round(s.h * HD);
    for (let j = 0; j < n; j++){
      const f = j / n, X = Math.round((s.x + s.lean * f + w * f * f) * HD), Y = Math.round(SOIL_Y * HD) - j;
      if (f < .66){ g.fillStyle = STEM[j & 1]; g.fillRect(X, Y, 1, 1); }
      else { g.fillStyle = SPIKE[clamp(Math.floor((f - .66) / .34 * 3.2 + (j & 1) * .8), 0, 3)]; g.fillRect(X, Y, f < .9 ? 2 : 1, 1); }
    }
  }
}
const GRASS_R = fringe(() => SOIL_Y + .5, 324, 371, 21, {size: 19, lv: 1, dense: .75, depth: 1.2});
const GRASS_RW = GRASS_R.filter(tf => tf.x < 331), GRASS_RM = GRASS_R.filter(tf => tf.x >= 331 && tf.x < 347), GRASS_RC = GRASS_R.filter(tf => tf.x >= 347);
const GRASS_POT = fringe(() => 118, 22, 40, 22, {size: 26, lv: 1, dense: 1.3, depth: 1});
const GRASS_POT2 = fringe(() => 118, 462, 478, 23, {size: 22, lv: 1, dense: 1.3, depth: 1});
const GRASS_WARM = GRASS_MOON.map(c => css(mixA(rgb(c), rgb('#c8a050'), .22)));       // the grass nearest the bulbs, warmed a little
const GRASS_MID = GRASS_MOON.map(c => css(mixA(rgb(c), rgb('#c8a050'), .1)));
const FLOWERS_A = flowerPatches(54, 106, 118.6, 119.6, 7, ['daisy', 'pink'], 41);
const FLOWERS_B = flowerPatches(384, 440, 118.6, 120, 9, ['pink', 'blue', 'daisy'], 42);
const FLOWERS_C = flowerPatches(122, 168, 118.6, 120, 6, ['blue', 'daisy'], 43);
// a flower painted in daylight colours would glow: blit lights it as this place is lit, warmer near a lamp
function drawFlowersLit(k, list, t, still){
  const L = k.light;
  for (const f of list){
    const cv = flowerSprite(f.kind, still ? 0 : leanAt(f.x, t, 1.2), f.stem, f.big), at = f.at ||= lightAt(L, f.x, f.y);      // where the light is doesn't change: ask once
    k.g.drawImage(litSprite(cv, L, at.level, at.side, at.spot), Math.round(f.x * HD) - 6, Math.round(f.y * HD) - cv.height + 1);
  }
}
function drawGarden(k, t, still){
  drawTufts(k, GRASS_POT, GRASS_MOON, t, still);
  for (const m of BUSHES.slice(0, 4)) drawClumps(k, m.clumps, t, still);
  drawTomatoes(k, t, still);
  drawLavender(k, LAVENDER, t, still);
  drawTufts(k, GRASS_RW, GRASS_WARM, t, still);
  drawTufts(k, GRASS_RM, GRASS_MID, t, still);
  drawTufts(k, GRASS_RC, GRASS_MOON, t, still);
  drawClumps(k, BIRCH.clumps, t, still);
  for (const m of BUSHES.slice(5)) drawClumps(k, m.clumps, t, still);
  drawClumps(k, BUSHES[4].clumps, t, still);
  drawTufts(k, GRASS_POT2, GRASS_MOON, t, still);
  drawFlowersLit(k, FLOWERS_A, t, still); drawFlowersLit(k, FLOWERS_B, t, still); drawFlowersLit(k, FLOWERS_C, t, still);
}

// ---- the string of bulbs, and the lantern ----
// They hang until a gust takes them: the wire sags a little further and the bulbs swing. Nothing else moves them.
const STRING = {ax: 214, ay: 88, bx: 308, by: 83, sag: 9, n: 9};
const stringAt = (u, still) => {
  const x = lerp(STRING.ax, STRING.bx, u), w = still ? 0 : WIND(x);
  return [x + w * 1.6 * Math.sin(u * Math.PI), lerp(STRING.ay, STRING.by, u) + STRING.sag * 4 * u * (1 - u) + Math.abs(w) * .5 * Math.sin(u * Math.PI)];
};
const BULBS = (() => { const r = mulberry32(5); return Array.from({length: STRING.n}, (_, i) => (i + .6 + (r() - .5) * .55) / (STRING.n + .2)); })(), BULB_NOW = [];
function drawBulbs(k, t, still){
  const g = k.g;
  g.fillStyle = '#3a3562';          // a thin wire, with a thread of moonlight on it
  let px = null, py = null;
  for (let X = R2(STRING.ax); X <= R2(STRING.bx); X++){
    const u = (X / HD - STRING.ax) / (STRING.bx - STRING.ax), [, y] = stringAt(u, still), [x] = stringAt(u, still), Y = Math.round(y * HD);
    g.fillRect(Math.round(x * HD), Y, 1, 1);
    if (px !== null && Math.abs(Y - py) > 1) g.fillRect(Math.round(x * HD), Math.round((Y + py) / 2), 1, 1);
    px = X; py = Y;
  }
  BULB_NOW.length = 0;
  for (const u of BULBS){
    const [x, y] = stringAt(u, still), X = Math.round(x * HD), Y = Math.round((y + .6) * HD);
    BULB_NOW.push([x, y]);
    k.glow(x, y + .6, 8, '#ffb464', .46); k.glow(x, y + .6, 3, '#ffe0a0', .66);
    g.fillStyle = '#3a2a2a'; g.fillRect(X - 1, Y - 2, 2, 1);
    g.fillStyle = '#ffd890'; g.fillRect(X - 1, Y - 1, 3, 3);
    g.fillStyle = '#fff6d8'; g.fillRect(X, Y, 1, 1);
  }
}
function drawLantern(k, t, still){
  const f = still ? .5 : vnoise(t * 6, 3, 1, 5);
  k.glow(272, 120.8, 19, '#ffa850', .34 + f * .12, 13);
  k.glow(272, 120.8, 6, '#ffd890', .46 + f * .14);
}


// ---- the city's own small life ----
// Windows go out and come back: somebody gets a glass of water. Each has its own clock, and they fade over a second or two.
function windowLife(k, t, dt, still){
  const g = k.g, st = pst.win ||= WINDOWS.map((w, i) => { const r = mulberry32(w.seed); return {on: r() < .6, left: 10 + r() * 240, fade: 0, col: pickR(WIN_WARM, r(), i, 3), cool: r() < .16}; });
  WINDOWS.forEach((w, i) => {
    const q = st[i];
    if (!still && (q.left -= dt) <= 0){ q.on = !q.on; q.left = q.on ? 120 + Math.random() * 200 : 40 + Math.random() * 90; }
    q.fade += ((q.on ? 1 : 0) - q.fade) * Math.min(1, dt * (still ? 99 : .9));
    if (q.fade < .06) return;
    g.globalAlpha = Math.ceil(q.fade * 4) / 4;
    g.fillStyle = q.cool ? '#d6e6ff' : css(q.col);
    g.fillRect(w.X, w.Y, w.w, w.h);
  });
  g.globalAlpha = 1;
}
// the red light on the mast: it swells and fades on a slow count, as they do
function drawBeacon(k, t, still){
  const ph = still ? .2 : (t / 2.7) % 1, a = smooth(0, .22, ph) * (1 - smooth(.3, .78, ph));
  if (a > .05){ k.glow(BEACON.x, BEACON.y, 4.2, '#ff3a3a', a * .5); k.g.globalAlpha = Math.min(1, a * 1.2); k.g.fillStyle = '#ff7a64'; k.g.fillRect(Math.round(BEACON.x * HD) - 1, Math.round(BEACON.y * HD) - 1, 2, 2); k.g.globalAlpha = 1; }
  else { k.g.fillStyle = '#5a1a2e'; k.g.fillRect(Math.round(BEACON.x * HD) - 1, Math.round(BEACON.y * HD) - 1, 2, 2); }
}
// steam off a chimney: warm where the street lights it from below, silver where it climbs into the moon, and bent by the same wind as everything else
const STEAM_COL = ['#d89870', '#b48a88', '#9a8aa8', '#8c98c0'];
function drawSteam(k, t, dt, still){
  const list = pst.steam ||= Array.from({length: 16}, (_, i) => ({age: i / 16 * 9, x: STEAM_AT.x, y: STEAM_AT.y}));
  for (const q of list){
    if (!still){
      q.age += dt;
      if (q.age > 9){ q.age = 0; q.x = STEAM_AT.x + (Math.random() - .5) * 1.2; q.y = STEAM_AT.y; }
      q.x += (WIND(q.x) * 11 + (vnoise(t * .3, q.age, 1, 8) - .5) * 2) * dt * (.4 + q.age * .12);
      q.y -= (3.4 - q.age * .22) * dt;
    }
    const f = still ? (list.indexOf(q) / 16) : q.age / 9, a = Math.min(1, f * 6) * (1 - f) * .6;
    if (a > .04) k.glow(still ? STEAM_AT.x + f * 3 : q.x, still ? STEAM_AT.y - f * 26 : q.y, 1.2 + f * 3.4, STEAM_COL[Math.min(3, Math.floor(f * 4))], a);
  }
}
// cars on the avenue: white lights coming toward us on the left, red going away on the right. They keep their own pace
const CARS = Array.from({length: 12}, (_, i) => ({lane: [-10.5, -4.5, 4.5, 10.5][i % 4], z: 110 + (i * 131) % 950, v: 8 + (i * 3.1) % 7, p: i * 5.3}));
function drawTraffic(k, t, dt, still){
  const g = k.g;
  for (const c of CARS){
    if (!still){
      const sp = c.v * (.5 + .5 * vnoise(t * .04, c.p, 1, 3)), dir = c.lane < 0 ? -1 : 1;
      c.z += dir * sp * dt;
      if (c.z < 100) c.z = 1050 + Math.random() * 300; else if (c.z > 1400) c.z = 102 + Math.random() * 20;
    }
    const s = LENS.F / c.z, [x, y] = proj(c.lane, .9, c.z), col = c.lane < 0 ? '#fff0c8' : '#ff4a3c', hw = .85 * s * HD;
    if (c.z < 90 && y * HD > R2(PAR.top)) continue;
    g.fillStyle = col;
    g.fillRect(Math.round(x * HD - hw), Math.round(y * HD), 1, 1);
    if (hw > 1.5) g.fillRect(Math.round(x * HD + hw), Math.round(y * HD), 1, 1);
    if (s > .3) k.glow(x, y, 1.4 + s * 1.6, c.lane < 0 ? '#ffb860' : col, .3);
  }
}
// moths round the bulbs: each keeps to one bulb for a while, then drifts to another
const MOTHS = Array.from({length: 3}, (_, i) => ({bulb: i * 3 + 1, until: 6 + i * 4, p: i * 2.7 + 1}));
// dust, which only shows where the light falls through it: near a bulb, or the lantern
function drawDust(k, t, dt, still){
  motes(k, t, dt, 'dust', 28, 208, 314, 78, 128, (x, y) => {
    for (const [bx, by] of BULB_NOW) if (Math.hypot(x - bx, (y - by) * 1.2) < 9) return '#ffdca0';
    return Math.hypot(x - 272, (y - 121) * 1.2) < 13 ? '#ffc880' : null;
  });
}
function drawMoths(k, t, dt, still){
  if (still) return;
  for (const m of MOTHS){
    if ((m.until -= dt) <= 0){ m.bulb = Math.floor(Math.random() * BULBS.length); m.until = 8 + Math.random() * 14; }
    const [bx, by] = stringAt(BULBS[m.bulb], false), x = bx + (vnoise(t * 1.5, m.p, 1, 7) - .5) * 15, y = by + (vnoise(t * 1.3, m.p + 9, 1, 9) - .5) * 11, flap = Math.floor(t * 16 + m.p * 3) % 2;
    k.g.fillStyle = '#f2e6d4';
    k.g.fillRect(Math.round(x * HD), Math.round(y * HD), flap ? 2 : 1, flap ? 1 : 2);
    k.g.fillStyle = '#8a7a8a'; k.g.fillRect(Math.round(x * HD), Math.round(y * HD) + (flap ? 1 : 0), 1, 1);
  }
}

// ---- the person ----
// They sit on the bench with a mug of tea, feet on the deck, in profile, looking down the avenue. The wall
// behind them is plain and dark, so their head is the clearest shape in the frame.
const SEAT = {x: 236, y: 126.5};
const HOLD = {near: [22, 24], far: [24, 25]};
// the kit's mug is white and would glow: this one is dim cream, with tea in it
PROPS.mug = (k, p, a, X, Y) => {
  const g = k.g, x = X + p.near[0] + 1, y = Y + p.near[1] - 2;
  g.fillStyle = '#1a1020'; g.fillRect(x - 1, y - 3, 8, 7); g.fillRect(x + 7, y - 2, 2, 4);
  g.fillStyle = '#d8c4a4'; g.fillRect(x, y - 2, 6, 5); g.fillStyle = '#a89478'; g.fillRect(x + 4, y - 2, 2, 5);
  g.fillStyle = '#6a3c22'; g.fillRect(x, y - 2, 6, 1);
};
addAction('sipTea', [[.5, {eyes: 'down', tilt: 3}], [1.25, {near: [21, 15], far: [23, 17], tilt: -3, eyes: 'open'}], [1.6, {tilt: -9, eyes: 'shut'}], [3.1, {}],
  [3.5, {tilt: -3, near: [22, 20], far: [24, 21], eyes: 'happy'}], [4.7, {}], [5.4, {near: null, far: null, tilt: 0, eyes: 'open'}]]);
// pinches a leaf of basil off the pot on the table, and breathes it in
addAction('basil', [[.6, {tilt: 3, eyes: 'down'}], [1.4, {far: [36, 26, .7], tilt: 3, lean: 2, eyes: 'down'}], [2, {far: [39, 24, .7]}], [2.4, {}],
  [3.2, {far: [24, 16, .5], lean: 0, tilt: -3, eyes: 'open'}], [3.9, {far: [22, 17, .5], tilt: -6, eyes: 'shut', mouth: 'smile'}], [5.5, {}],
  [5.8, {eyes: 'open'}], [6.5, {far: null, tilt: 0, mouth: 'none', eyes: 'happy'}], [7.3, {eyes: 'open'}]]);
ALWAYS.splice(0, ALWAYS.length, 'look', 'sky', 'muse', 'sigh', 'wink', 'back');     // nothing that would fling the mug about
SITTING.splice(0, SITTING.length, 'shift', 'dangle');
LOCAL.roof = ['sipTea', 'basil', 'sky', 'sipTea', 'basil'];
function steam(k, mx, my, t, still){
  const g = k.g, gone = still ? 0 : t;
  for (let i = 0; i < 3; i++){
    const age = (gone * .42 + i / 3) % 1, wob = (vnoise(gone * .9, i * 7, 1, 44) - .5) * 5 * age + (still ? 0 : WIND(mx / HD) * 9 * age * age);
    g.fillStyle = '#e8e4f0'; g.globalAlpha = (1 - age) * Math.min(1, age * 5) * .7;
    g.fillRect(Math.round(mx + 2.5 + wob), Math.round(my - 4 - age * 15), 1, 1);
  }
  g.globalAlpha = 1;
}
function roofHero(k, t, dt){
  const c = CHARS[k.who], X = R2(SEAT.x), Y = R2(SEAT.y) - SEAT_ROW, g = k.g;
  scene.heroX = SEAT.x; scene.heroY = Y / HD;
  k.holding = 'mug';
  const p = livePose({...REST, sit: true, ...HOLD}, k.live);
  heroDraw(k, c, p, X, Y, SEAT_ROW + 9 + RIG_Y, k.light && k.light.seat);
  steam(k, X + p.near[0] + 1, Y + p.near[1] - 2, t, reduceMotion);
  // the leaf, while they have it
  if (life.act === ACTIONS.basil && life.at > 2 && life.at < 5.6){
    g.fillStyle = '#4a8a52'; g.fillRect(X + Math.round(p.far[0]) + 1, Y + Math.round(p.far[1]) - 1, 3, 2);
    g.fillStyle = '#8acb86'; g.fillRect(X + Math.round(p.far[0]) + 1, Y + Math.round(p.far[1]) - 1, 1, 1);
  }
}


// ---- what comes by ----
// A plane, high up, with its lights going and a faint trail of cloud behind it: now and then it crosses the moon.
// He looks up when it does.
function planeSight(){
  const dir = Math.random() < .5 ? 1 : -1, across = Math.random() < .5, y0 = across ? MOON.y + (Math.random() - .5) * 5 : 12 + Math.random() * 32, sp = 8.5 + Math.random() * 2;
  let x = dir > 0 ? -8 : SW + 8, age = 0;
  const lookAt = across ? 6 : 3, trail = [];
  return (k, t, dt) => {
    age += dt; x += dir * sp * dt;
    trail.push([x, age]);
    while (trail.length && age - trail[0][1] > 5) trail.shift();
    const X = Math.round(x * HD), Y = Math.round(y0 * HD), g = k.g, over = Math.hypot(x - MOON.x, y0 - MOON.y) < MOON.r + 1;
    if (age > lookAt && !pst.planeSeen){ pst.planeSeen = true; if (!life.act){ life.next = 'sky'; life.wait = Math.min(life.wait, 1.2); } }
    // the trail it leaves, thin and pale where the moon catches it, fading with age
    for (const [tx, ta] of trail){
      const f = (age - ta) / 5, TX = Math.round(tx * HD);
      if ((TX + Math.round(ta * 7)) % 2) continue;
      g.globalAlpha = (1 - f) * .42; g.fillStyle = '#9aa8e0'; g.fillRect(TX, Y, 1, 1);
    }
    g.globalAlpha = 1;
    // against the moon it is a small dark cross; elsewhere only its lights show
    if (over){ g.fillStyle = '#0e1026'; g.fillRect(X - 3 * dir, Y, 7, 1); g.fillRect(X, Y - 1, 1, 3); g.fillRect(X - 3 * dir, Y - 1, 1, 1); }
    g.fillStyle = dir > 0 ? '#ff5a4a' : '#4aff9a'; g.fillRect(X + dir, Y + 1, 1, 1);          // the wing light on the side we see
    const flash = (age * .72) % 1 < .1;                                                         // and the white strobe, now and then
    if (flash){ g.fillStyle = '#ffffff'; g.fillRect(X - 1, Y - 1, 2, 2); k.glow(x, y0, 3.2, '#dfe8ff', .55); }
    if (x < -10 || x > SW + 10){ pst.planeSeen = false; return false; }
  };
}
// a cat walks the top of the wall, stops to sit above the table for a while, and goes on
function catSight(){
  const dir = Math.random() < .55 ? -1 : 1, stopAt = 252 + Math.random() * 40, speed = 11;
  let x = dir < 0 ? SW + 12 : -12, state = 'walk', sat = 0, dist = 0, tail = 0, tailIn = 1, noticed = false;
  return (k, t, dt) => {
    if (state === 'walk'){
      x += dir * speed * dt; dist += speed * dt;
      if (!sat && (dir < 0 ? x < stopAt : x > stopAt)){ state = 'sit'; sat = 8 + Math.random() * 7; }
    } else {
      sat -= dt;
      if ((tailIn -= dt) <= 0){ tail = tail ? 0 : 1 + Math.floor(Math.random() * 2); tailIn = tail ? .5 : 1.5 + Math.random() * 3; }
      if (!noticed){ noticed = true; if (!life.act){ life.next = 'sky'; life.wait = Math.min(life.wait, 1.5); } }
      if (sat <= 0){ state = 'walk'; sat = -1; }
    }
    const top = R2(parTop(x) - (PILLARS.some(P => Math.abs(x - P) < 3) ? 3 : 0)), pose = state === 'sit' ? 'sit' : 'walk';
    const cv = catSprite(pose, state === 'walk' ? Math.floor(dist / 1.7) % 4 : 0, state === 'sit' ? tail : 0, CAT_TABBY, dir);
    blit(k, cv, Math.round(x * HD) - 12, top - 14);
    return !(dir < 0 ? x < -14 : x > SW + 14);
  };
}


// ---- near the viewer ----
// A watering can and a few pots on the deck in front of the bench, and a folded blanket on it: things that say somebody lives here
function paintForeground(p){
  p.sun = -1;
  // the watering can: lit on the side that faces the moon, with a long spout and a handle
  groundShadow(p, 226, 139.4, 9, 1.6, .7);
  castFoot(p, 222, 228, 139.2, 6, 1.5);
  for (let Y = R2(134.6), Y1 = R2(139.2); Y < Y1; Y++) for (let X = R2(222), X1 = R2(228.5); X < X1; X++){
    const u = (X - R2(222)) / (X1 - R2(222)), v = .78 - u * .55 - (Y - R2(134.6)) / (Y1 - R2(134.6)) * .15 + (Y === R2(134.6) ? .15 : 0) + (hash2(X, Y, 3) - .5) * .06;
    p.put(X, Y, pickR(toRamp(['#0c1424', '#182640', '#2a3e68', '#42608c', '#6a8cb4']), v, X, Y));
  }
  for (let i = 0; i < 9; i++) p.put(R2(228.5) + i, R2(138) - i, rgb(i % 2 ? '#3e5a8a' : '#5278a8'));
  p.put(R2(228.5) + 9, R2(138) - 9, rgb('#8ab0d4')); p.put(R2(228.5) + 10, R2(138) - 9, rgb('#8ab0d4')); p.put(R2(228.5) + 10, R2(138) - 10, rgb('#8ab0d4'));
  for (let i = 0; i < 6; i++){ p.put(R2(221.4), R2(134.4) + i, rgb('#243656')); if (i === 0 || i === 5) for (let j = 1; j < 4; j++) p.put(R2(221.4) - j, R2(134.4) + i, rgb('#243656')); }
  // a stack of pots
  groundShadow(p, 351, 140, 11, 1.6, .7);
  paintPot(p, 346, 140, 11, 7, 11); paintPot(p, 357, 140, 10, 6, 12); paintPot(p, 351.5, 135.4, 9, 6, 13);
  // the blanket, folded on the bench: wine-coloured wool with one pale stripe, warm where the lantern reaches
  for (let Y = R2(124.6); Y < R2(126.5); Y++) for (let X = R2(216); X < R2(227.5); X++){
    const top = Y < R2(125.6), v = (top ? .64 : .4) + (hash2(X, Y, 5) - .5) * .1 + (X - R2(216) === 11 || X - R2(216) === 12 ? .14 : 0);
    p.put(X, Y, mixA(pickR(toRamp(['#2a1018', '#4a1c2c', '#6e2c42', '#8e445a']), v, X, Y), WARM, warmAt(X / HD, Y / HD) * .35));
  }
}
// leaves at our shoulders: the nearest of everything is nearly black, and it frames what's behind. They keep to the corners of what a person actually sees
const VIEW = {x0: 0, w: DW};
const FLIPPED = new WeakMap();
const flipped = cv => FLIPPED.get(cv) || (() => { const c = Object.assign(document.createElement('canvas'), {width: cv.width, height: cv.height}), q = c.getContext('2d'); q.imageSmoothingEnabled = false; q.translate(cv.width, 0); q.scale(-1, 1); q.drawImage(cv, 0, 0); FLIPPED.set(cv, c); return c; })();
function drawViewFronds(k, t, still){
  const g = k.g, x0 = Math.round(VIEW.x0), x1 = Math.round(VIEW.x0 + VIEW.w);
  const L = frondSprite(still ? 0 : leanAt(x0 / HD + 8, t), PAL_FROND_NIGHT, 3), R = flipped(frondSprite(still ? 0 : -leanAt(x1 / HD - 8, t), PAL_FROND_NIGHT, 8));
  g.drawImage(L, x0 - 6, DH - L.height);
  g.drawImage(R, x1 + 6 - R.width, DH - R.height);
}

PLACES.roof = {
  // painted once: what the stars, moon and clouds go in front of
  sky(p){ p.sky(SKY_NIGHT, 0, LENS.vy); },

  // painted once: everything that doesn't move and is nearer than the city
  bg(p){
    paintParapet(p);
    paintDeck(p);
    paintFurniture(p);
    paintTreeBase(p);
    for (const [x0, x1, seed] of [[52, 108, 3], [120, 170, 4], [322, 372, 5], [382, 440, 6]]) paintBed(p, x0, x1, 129, 9.5, seed);
    paintPot(p, 30, 131, 22, 14, 7);
    paintPot(p, 470, 131, 20, 13, 8);
    for (const T of TOMATOES) p.rect(T.x - .25, SOIL_Y - 24, .5, 25, '#2a2034');            // the stakes
    // trailing leaves over the coping, in a few places
    for (const [x, y, rx, ry, seed] of [[64, 111, 13, 5, 3], [96, 112, 10, 4.5, 7], [149, 112, 10, 5, 4], [306, 111, 9, 4, 8], [336, 111, 14, 5, 5], [364, 112, 10, 4.5, 9], [418, 112, 12, 5, 6], [446, 112, 10, 4.5, 10]]) { p.leaves(x, y, rx, ry, PAL_IVY, seed, sunFor(x)); p.strands(x, parTop(x) + .6, rx * .85, 9 + seed % 4, PAL_IVY, seed); }
    p.vignette(.42);
  },
  // painted once, and drawn after the person: what's nearer than them
  front(p){ paintForeground(p); },

  // every frame, back to front:
  //   sky, stars, moon, cloud, what crosses the sky; the far city and its small life; the wall, the deck and the beds;
  //   what walks the wall; things that grow and sway; them; whatever is nearer than them; the moon's light, covered
  //   by cloud over everything so far; then what has its own light (bulbs, lantern, beacon); then leaves at our shoulders
  draw(g, t, dt, k){
    const still = reduceMotion;
    k.img(placeSky('roof'), 0, 0);
    starField(k, t, 'stars', 60, 62, 77);
    shootingStars(k, dt, 'shooting', 100, 300, 6, 40);
    moonOrb(k, MOON.x, MOON.y, MOON.r, .3 * (1 - (pst.roofDim || 0) * .6));
    const cover = cloudDeck(k, t, dt, 'clouds', {n: 3, y0: 4, y1: 20, w0: 70, w1: 140, speed: 1.2, cols: C_MOONLIT, seed: 7, tall: .12, mix: [.15, .35, .4, .1], moon: MOON});
    rare(k, t, dt, 'roofSky', {plane: planeSight, comet: cometSight, bats: () => batSight(MOON.x + 8, MOON.y + 6)}, [24, 60]);
    k.img(cityLayer(), 0, 0);
    windowLife(k, t, dt, still);
    drawSteam(k, t, dt, still);
    drawTraffic(k, t, dt, still);
    k.img(placeBg('roof'), 0, 0);
    rare(k, t, dt, 'roofWall', {cat: catSight}, [45, 100]);
    drawGarden(k, t, still);
    roofHero(k, t, dt);
    k.img(placeFg('roof'), 0, 0);
    skyDim(k, 'roofDim', cover, dt, '4,5,22', .24, LIGHTS.roof);
    drawBulbs(k, t, still);
    drawLantern(k, t, still);
    drawDust(k, t, dt, still);
    drawMoths(k, t, dt, still);
    drawBeacon(k, t, still);
    drawViewFronds(k, t, still);
  },
};
const LAYER = {};
const cityLayer = () => LAYER.city ||= (() => { const p = painter(); paintCity(p); return p.canvas(); })();

// ===== running it =====
const hero = document.querySelector('.hero'), cv = document.getElementById('world');
const g0 = cv.getContext('2d'), k0 = ck(g0);
k0.who = 'guy'; k0.live = true; k0.light = LIGHTS.roof;
cv.width = DW; cv.height = DH;
g0.imageSmoothingEnabled = false;
// Pixels only stay square at a whole number of device pixels, and dither turns to moire at anything else. So the
// scale is a whole number, and the world is wider than most screens: what doesn't fit is cropped, the bench stays
// in frame, and a phone sees it larger, not smaller.
const FOCUS_X = 500, FOCUS_W = 400, HERO_MAX = .8;     // canvas pixels: where the eye is, and the least of the world a phone should see
function layout(){
  const dpr = devicePixelRatio || 1, vw = document.documentElement.clientWidth, vh = innerHeight, dev = Math.round(vw * dpr);
  const D = Math.max(1, Math.ceil(dev / DW), Math.min(Math.floor(dev / FOCUS_W), Math.floor(HERO_MAX * vh * dpr / DH)));
  const wide = DW * D, off = Math.round(clamp(FOCUS_X * D - dev / 2, 0, Math.max(0, wide - dev)));
  cv.style.width = wide / dpr + 'px'; cv.style.height = DH * D / dpr + 'px'; cv.style.left = -off / dpr + 'px';
  VIEW.x0 = off / D; VIEW.w = Math.min(DW, dev / D);
  hero.style.height = DH * D / dpr + 'px';
}
let onScreen = true, last = 0, drawn = 0, layoutSoon = 0;
function frame(){
  requestAnimationFrame(frame);
  const now = performance.now() / 1000;
  // nobody needs more frames than this, least of all a phone; and nothing at all when it's off screen
  if (!onScreen || now - drawn < (reduceMotion ? .12 : 1 / 45)) return;
  const dt = Math.min(.1, now - last); last = drawn = now;
  if (!reduceMotion) windTick(now, dt);
  lifeTick(dt, 'roof', k0.who, true);
  PLACES.roof.draw(g0, now, dt, k0);
  lifeFxDraw(k0, dt);
}
(async () => {
  layout();
  for (const step of [() => placeSky('roof'), cityLayer, () => placeBg('roof'), () => placeFg('roof')]){ step(); await new Promise(go => setTimeout(go)); }
  addEventListener('resize', () => { clearTimeout(layoutSoon); layoutSoon = setTimeout(layout, 120); });
  if ('IntersectionObserver' in window) new IntersectionObserver(e => { onScreen = e[e.length - 1].isIntersecting; }).observe(cv);
  document.getElementById('splash')?.remove();
  last = drawn = performance.now() / 1000;
  life.awake = true;
  requestAnimationFrame(frame);
})();
