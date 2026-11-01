/* 그림이 늘어나거나 눌리지 않는지 — 원본 비율과 화면 비율을 직접 비교한다. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
const r = await p.evaluate(() => {
  const out = [];
  for (const img of document.querySelectorAll('img')) {
    if (!img.naturalWidth) continue;
    const box = img.getBoundingClientRect();
    if (box.width < 4) continue;
    const nat = img.naturalWidth / img.naturalHeight;
    const shown = box.width / box.height;
    const fit = getComputedStyle(img).objectFit;
    out.push({ src: img.src.split('/').pop(), nat: +nat.toFixed(3), box: +shown.toFixed(3),
               fit, distorted: fit === 'fill' && Math.abs(nat - shown) > 0.02 });
  }
  return out;
});
const bad = r.filter(x => x.distorted);
console.log(`그림 ${r.length}개 검사`);
console.log('object-fit 값:', [...new Set(r.map(x => x.fit))].join(', '));
console.log('비율이 늘어난 그림:', bad.length ? bad.map(x => `${x.src} ${x.nat}→${x.box}`).join(', ') : '없음');
const letterboxed = r.filter(x => x.fit === 'contain' && Math.abs(x.nat - x.box) > 0.02).length;
console.log(`상자와 비율이 달라 여백이 생기는 그림: ${letterboxed}개 (contain 이므로 늘어나지는 않음)`);
await b.close();
process.exit(bad.length ? 1 : 0);
