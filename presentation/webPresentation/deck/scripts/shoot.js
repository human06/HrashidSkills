// Screenshot every step of a deck, in one or both themes, and report what a reader would trip on.
//
//   node shoot.js <deck.html> <outdir> [--theme dark|light|both] [--only 3:0,3:2,...]
//
// Shots are named <theme>-<frame 01-based>-<step>.png. `--only` takes 1-based frame numbers,
// matching the HUD counter. Needs playwright-core resolvable from the current directory
// (npm i playwright-core) and Edge or Chrome installed.
const path = require('path');
const { createRequire } = require('module');
const { chromium } = createRequire(path.join(process.cwd(), 'noop.js'))('playwright-core');

const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args.splice(i, 2)[1]; };
const theme = flag('--theme', 'both'), only = flag('--only', '');
const [deck, outdir] = args;
if (!deck || !outdir) { console.error('usage: node shoot.js <deck.html> <outdir> [--theme dark|light|both] [--only 3:0,3:2]'); process.exit(1); }
require('fs').mkdirSync(outdir, { recursive: true });

async function launch() {
  for (const channel of ['msedge', 'chrome', undefined]) {
    try { return await chromium.launch(channel ? { channel } : {}); } catch (e) { /* try the next browser */ }
  }
  throw new Error('no Edge, Chrome or bundled Chromium found');
}

(async () => {
  const b = await launch();
  const problems = [];
  for (const t of theme === 'both' ? ['dark', 'light'] : [theme]) {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    p.on('pageerror', e => problems.push(`[${t}] page error: ${e.message}`));
    p.on('console', m => m.type() === 'error' && problems.push(`[${t}] console: ${m.text()}`));
    await p.goto('file://' + path.resolve(deck) + '?theme=' + t);
    await p.waitForTimeout(3500);
    const steps = await p.evaluate(() => window.__deck.steps);
    const list = only ? only.split(',').map(x => x.split(':').map(Number)).map(([f, s]) => [f - 1, s])
                      : steps.flatMap((n, i) => Array.from({ length: n + 1 }, (_, s) => [i, s]));
    for (const [i, s] of list) {
      const name = `${t}-${String(i + 1).padStart(2, '0')}-${s}`;
      try { await p.evaluate(([i, s]) => window.__deck.go(i, s), [i, s]); }
      catch (e) { problems.push(`[${name}] go() threw: ${e.message.split('\n')[0]}`); continue; }
      const finale = i === steps.length - 1 && s === steps[i];
      await p.waitForTimeout(finale ? 6500 : 4200);
      await p.screenshot({ path: `${outdir}/${name}.png` });
      if (finale) continue;
      // text that the camera can't see while the frame is framed at full size
      const off = await p.evaluate(() => {
        if (Math.abs(window.__deck.cam().s - 1) > .01) return [];
        const out = [];
        document.querySelectorAll('.frame.is-active .in :is(h1,h2,h3,p,li,b,span,text)').forEach(el => {
          const rg = document.createRange(); rg.selectNodeContents(el);
          const r = el instanceof SVGElement ? el.getBoundingClientRect() : rg.getBoundingClientRect(), st = getComputedStyle(el);
          if (!r.width || st.visibility === 'hidden' || +st.opacity === 0 || !el.textContent.trim()) return;
          const stage = document.getElementById('stage').getBoundingClientRect(), k = stage.width / 1600;
          const x = (r.left - stage.left) / k, y = (r.top - stage.top) / k, w = r.width / k, h = r.height / k;
          if (x < 40 || y < 30 || x + w > 1560 || y + h > 870) out.push(`"${el.textContent.trim().slice(0, 40)}" at ${Math.round(x)},${Math.round(y)} ${Math.round(w)}×${Math.round(h)}`);
        });
        return [...new Set(out)].slice(0, 6);
      });
      off.forEach(o => problems.push(`[${name}] near/over the edge: ${o}`));
    }
    await p.close();
  }
  await b.close();
  console.log(problems.length ? problems.join('\n') : 'no problems found');
})();
