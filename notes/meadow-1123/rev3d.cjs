// PROTOTYPE ?rev: the intro's 3D reveal frame by frame off the canvas (the copy wt_intro on :5510), one page, per mode
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const OUT = process.env.OUT, W = +(process.env.VW || 960), H = +(process.env.VH || 540), FPS = +(process.env.FPS || 10), DUR = +(process.env.DUR || 10.4), PORT = process.env.PORT || 5510;
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.goto(`http://localhost:${PORT}/?qa&fast&rain=0&rev`, { timeout: 300000 });
  await p.waitForFunction(() => window.__qa && window.__fx && window.__qaRenderer && __qaRenderer.info.programs.length > 0, null, { timeout: 3600000, polling: 2000 }).catch((e) => { console.log(JSON.stringify({ timeout: true, errs })); throw e; });
  console.log(JSON.stringify({ loaded: new Date().toISOString(), rev: await p.evaluate(() => typeof window.__rev), errs: errs.slice(0, 3) }));
  await p.evaluate(async () => { for (let i = 0; i < 400 && window.__fdPhase !== 'home'; i++) { __qa.advance(1/15); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); } });
  for (const m of (process.env.MODES || 'black,white').split(',')) {
    await p.evaluate((m) => { __fx.setMode(m); __qa.pointer('move', innerWidth * 0.5, innerHeight * 0.5); for (let i = 0; i < 45; i++) __qa.advance(1/15); }, m);
    const n = Math.round(DUR * FPS), only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
    for (let f = 0; f <= n; f++) {
      if (only && !only.includes(f)) { await p.evaluate(([t]) => { __rev(t); }, [f / FPS]); continue; }
      const url = await p.evaluate(([t, dt]) => { __rev(t); __qa.advance(dt); return __qaRenderer.domElement.toDataURL('image/png'); }, [f / FPS, 1 / FPS]);
      fs.writeFileSync(`${OUT}/${m}_${String(f).padStart(3, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
      if (f % 10 === 0) console.log(JSON.stringify({ m, f, at: new Date().toISOString().slice(11, 19), errs: errs.slice(0, 2) }));
    }
    await p.evaluate(() => { __rev(99); });
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
