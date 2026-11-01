/* 화면을 쓰는 동안 각 영역이 세로로 얼마를 차지하는지 잰다. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
for (const [w, h] of [[1440, 900], [1440, 760], [1280, 720]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
  await p.fill('#typed', '과자'); await p.click('.typed button[type=submit]');
  await p.click('#btn-cam'); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const m = {};
    for (const [k, sel] of [['상단바','.bar'],['무대','.stage'],['카메라','.camera'],
                            ['코치레일','.rail'],['자모줄','.strip'],['조작부','.controls']]) {
      const n = document.querySelector(sel);
      if (n) m[k] = Math.round(n.getBoundingClientRect().height);
    }
    m.창 = window.innerHeight;
    return m;
  });
  const bottom = r.자모줄 + r.조작부;
  console.log(`${w}x${h} → 자모줄 ${r.자모줄} + 조작부 ${r.조작부} = 하단 ${bottom}px (화면의 ${(100*bottom/r.창).toFixed(0)}%) | 카메라 ${r.카메라} | 레일 ${r.코치레일}`);
  if (w === 1440 && h === 900)
    await p.screenshot({ path: '/tmp/claude-0/-home-user-sonmal/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/inuse.png' });
  await p.close();
}
await b.close();
