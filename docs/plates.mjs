// The README's title, section plates and buttons, in the same dress as Lofi Studio's: its colours,
// its pixel font and pixel icons made of little squares. Called by make.sh.
//   node plates.mjs output-folder
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(new URL('../scripts/', import.meta.url));
const { chromium } = require('playwright-core');

const OUT = process.argv[2];
const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio']});
const page = await browser.newPage({viewport: {width: 1300, height: 700}, deviceScaleFactor: 2});

const icon = squares => `<svg class="ti" viewBox="0 0 8 8">${squares.map(([x, y, w, h, kind]) => `<rect ${kind ? `class="${kind}" ` : ''}x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</svg>`;
const ICONS = {
  pen: icon([[6, 0, 2, 2, 'acc'], [5, 1, 2, 2], [4, 2, 2, 2], [3, 3, 2, 2], [2, 4, 2, 2], [1, 5, 2, 2], [0, 7, 1, 1, 'acc']]),
  sun: icon([[2, 2, 4, 4, 'acc'], [3, 0, 2, 1], [3, 7, 2, 1], [0, 3, 1, 2], [7, 3, 1, 2], [1, 1, 1, 1], [6, 1, 1, 1], [1, 6, 1, 1], [6, 6, 1, 1]]),
  cloud: icon([[3, 1, 3, 1], [2, 2, 5, 1], [1, 3, 7, 1], [0, 4, 8, 2], [1, 6, 6, 1, 'gv'], [3, 2, 2, 1, 'acc']]),
  person: icon([[3, 0, 2, 2, 'acc'], [2, 2, 4, 3], [2, 5, 1, 3], [5, 5, 1, 3]]),
  arrow: icon([[3, 0, 2, 3], [1, 3, 6, 1], [2, 4, 4, 1], [3, 5, 2, 1], [0, 7, 8, 1, 'acc']]),
  talk: icon([[0, 0, 8, 5], [1, 5, 2, 1], [1, 6, 1, 1], [2, 2, 1, 1, 'gv'], [4, 2, 1, 1, 'gv'], [6, 2, 1, 1, 'gv']]),
  book: icon([[0, 1, 3, 6], [5, 1, 3, 6], [3, 2, 2, 5, 'acc'], [1, 3, 1, 1, 'gv'], [1, 5, 1, 1, 'gv'], [6, 3, 1, 1, 'gv'], [6, 5, 1, 1, 'gv']]),
  play: icon([[0, 0, 2, 8], [2, 1, 2, 6], [4, 2, 2, 4], [6, 3, 2, 2]]),
  shield: icon([[0, 0, 8, 4], [1, 4, 6, 2], [2, 6, 4, 1], [3, 7, 2, 1], [3, 1, 2, 4, 'acc'], [2, 2, 4, 1, 'acc']]),
};

await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;background:transparent}
  .ti{display:block;flex:none;fill:currentColor;shape-rendering:crispEdges;overflow:visible}
  .ti .acc{fill:#f5c542} .ti .gv{fill:rgba(7,4,15,.45)}
  #stage{display:inline-block;padding:4px}
  .plate{box-sizing:border-box;width:822px;display:flex;align-items:center;gap:18px;padding:17px 24px 16px;position:relative;
    background:linear-gradient(180deg,#2a2058 0 4px,#1d1640 4px);border:4px solid #5b4a9e;
    box-shadow:0 0 0 4px #07040f, inset 0 0 0 3px #07040f, inset 0 0 0 6px #241b4c;color:#ece6ff}
  .plate::before,.plate::after{content:"";position:absolute;top:6px;width:6px;height:6px;background:#f5c542;box-shadow:0 0 0 2px #07040f}
  .plate::before{left:6px} .plate::after{right:6px}
  .plate .ti{width:32px;height:32px}
  .plate b{font:20px/1.2 "Press Start 2P";font-weight:normal;color:#f5c542;text-shadow:2px 2px 0 #07040f, 4px 4px 0 #3b2a7a}
  .btn{display:inline-flex;align-items:center;gap:14px;font:16px/1 "Press Start 2P";padding:20px 26px;margin:3px;
    box-shadow:0 0 0 3px #07040f, inset -4px -4px 0 rgba(0,0,0,.4), inset 4px 4px 0 rgba(255,255,255,.14)}
  .btn .ti{width:20px;height:20px}
  .btn.go{background:#e8692c;color:#07040f} .btn.go .ti .acc{fill:#07040f}
  .btn.own{background:#2a2058;color:#ece6ff}
  .title{font:32px/1.5 "Press Start 2P";color:#f5c542;text-align:right;padding:8px 12px 12px 8px;
    text-shadow:-2px 0 0 #07040f,2px 0 0 #07040f,0 -2px 0 #07040f,0 2px 0 #07040f,-2px -2px 0 #07040f,2px -2px 0 #07040f,-2px 2px 0 #07040f,2px 2px 0 #07040f,4px 4px 0 #07040f,6px 6px 0 #3b2a7a}
</style></head><body><div id="stage"></div></body></html>`);
await page.evaluate(() => Promise.all([document.fonts.load('20px "Press Start 2P"'), document.fonts.load('16px "Press Start 2P"'), document.fonts.load('32px "Press Start 2P"')]));

async function shot(html, file){
  await page.evaluate(h => { document.getElementById('stage').innerHTML = h; }, html);
  await page.locator('#stage').screenshot({path: join(OUT, file), omitBackground: true});
}
const PLATES = [
  ['place', 'pen', 'Paint a place, not a picture'],
  ['light', 'sun', 'Light comes from somewhere'],
  ['lives', 'cloud', 'Everything has a life of its own'],
  ['people', 'person', 'People, not sprites'],
  ['rules', 'shield', 'A rule book and a referee'],
  ['get', 'arrow', 'Get it'],
  ['ask', 'talk', 'Then just ask'],
  ['guides', 'book', 'A guide for every element'],
];
for (const [name, ic, title] of PLATES) await shot(`<div class="plate">${ICONS[ic]}<b>${title}</b></div>`, `plate-${name}.png`);
await shot(`<div class="btn go">${ICONS.arrow}INSTALL IT</div>`, 'button-install.png');
await shot(`<div class="btn own">${ICONS.play}SEE IT LIVE</div>`, 'button-live.png');
await shot('<div class="title">PAINTED<br>PIXELS</div>', 'title.png');
await browser.close();
