// (EXPERIMENT) the right jacket in «Белая» from two camera places, variants of its reflections at grazing (wt_intro on :5510)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const OUT = process.env.OUT, W = +(process.env.VW || 1440), H = +(process.env.VH || 810), PORT = process.env.PORT || 5510, J = +(process.env.J || 2), ST = +(process.env.ST || 12);
  const VAR = JSON.parse(process.env.VAR || '{"base":{}}');
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/?qa&fast&rain=0&mode=white`, { timeout: 300000 });
  await p.waitForFunction(() => window.__qa && window.__fx && window.__qaRenderer && __qaRenderer.info.programs.length > 0, null, { timeout: 1800000, polling: 2000 });
  await p.evaluate(async () => { for (let i = 0; i < 400 && window.__fdPhase !== 'home'; i++) { __qa.advance(1/15); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); } });
  await p.evaluate(() => __fx.setMode('white'));
  for (const [k, x] of (process.env.POS || 'LR').split('').map((c) => [c, c === 'R' ? W - 2 : c === 'L' ? 2 : W / 2])) {
    for (const [name, v] of Object.entries(VAR)) {
      const url = await p.evaluate(([x, y, j, v, st]) => { const u = __qa.homeU(j);
        u.uGraz.value.set(...(v.graz || [1, 5, 1, 1])); u.uEnvK.value.set(...(v.envk || [1, 1]));
        __qa.pointer('move', x, y); for (let i = 0; i < st; i++) __qa.advance(1/15); return __qaRenderer.domElement.toDataURL('image/png'); }, [x, H / 2, J, v, ST]);
      fs.writeFileSync(`${OUT}/${k}_${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
      console.log(JSON.stringify({ k, name, at: new Date().toISOString().slice(11, 19), errs: errs.slice(0, 2) }));
    }
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
