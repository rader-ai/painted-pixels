// The palette sheet in assets/gallery: each world's frame, with its colours by how much of it they cover.
// Reads what validate.mjs wrote: node scripts/validate.mjs --page lofi-studio/index.html --place all --out quest
//   node docs/style-sheets.mjs quest assets/gallery/style-palettes.png
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), [quest, out] = process.argv.slice(2);
const { chromium } = createRequire(join(HERE, '../scripts/'))('playwright-core');
const WORLDS = [['castle', 'The castle wall', 'Violet night, warm windows'], ['office', 'The rainy office', 'Plum and navy, an amber lamp'], ['cafe', 'The corner booth', 'Warm brown, blue daylight'], ['garden', 'The garden', 'Greens and morning blue, a gold sun'], ['forest', 'The campfire', 'Navy, an orange fire'], ['lake', 'The lake', 'Deep blue, a silver moon'], ['park', 'The park', 'Greens and sky, pink blossom'], ['beach', 'The beach', 'Violet sea, a gold sun']];
const lum = h => .3 * parseInt(h.slice(1, 3), 16) + .59 * parseInt(h.slice(3, 5), 16) + .11 * parseInt(h.slice(5, 7), 16);
const font = name => readFileSync(join(HERE, '../assets/fonts', name)).toString('base64');
const rows = WORLDS.map(([id, name, key]) => {
  const report = JSON.parse(readFileSync(join(quest, id, 'report.json'), 'utf8')), frame = readFileSync(join(quest, id, 'frame.png')).toString('base64');
  const pal = report.measured.palette.slice().sort((a, b) => lum(a[0]) - lum(b[0]));
  return `<div class="w"><img src="data:image/png;base64,${frame}"><div><h2>${name}</h2><p>${key}. ${report.measured.colours.toLocaleString('en-US')} colours.</p><div class="bar">${pal.map(([hex, n]) => `<i style="flex-grow:${n};background:${hex}"></i>`).join('')}</div></div></div>`;
}).join('');
const browser = await chromium.launch({channel: 'chrome', headless: true});
const page = await browser.newPage({viewport: {width: 1000, height: 1200}, deviceScaleFactor: 1});
await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:P;src:url(data:font/woff2;base64,${font('press-start-2p-latin-400-normal.woff2')})}
  @font-face{font-family:V;src:url(data:font/woff2;base64,${font('vt323-latin-400-normal.woff2')})}
  html,body{margin:0;background:#120c28;color:#ece6ff} #s{width:1000px;padding:16px;box-sizing:border-box}
  .w{display:grid;grid-template-columns:320px 1fr;gap:16px;margin-bottom:12px;align-items:center}
  img{display:block;width:320px;image-rendering:pixelated}
  h2{margin:0 0 8px;font:14px/1.2 P;font-weight:normal;color:#f5c542} p{margin:0 0 10px;font:22px/1 V;color:#a79dd6}
  .bar{display:flex;height:56px} .bar i{display:block;flex-basis:0}
</style><div id="s">${rows}</div>`);
await page.evaluate(() => Promise.all([document.fonts.load('14px P'), document.fonts.load('22px V')]));
await page.locator('#s').screenshot({path: out});
await browser.close();
