/* 페이지가 실제로 어디에 접속하는지 전부 기록한다. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const hits = new Map();
p.on('request', r => {
  const u = new URL(r.url());
  if (u.hostname === 'localhost') return;
  const k = `${r.method()} ${u.origin}${u.pathname.split('/').slice(0,3).join('/')}`;
  hits.set(k, (hits.get(k) ?? 0) + 1);
});
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.click('#btn-cam');
await p.waitForTimeout(2500);
await p.fill('#typed', '과자'); await p.press('#typed', 'Enter');
await p.waitForTimeout(3500);
console.log('페이지가 접속한 곳 (localhost 제외)');
if (!hits.size) console.log('  없음');
for (const [k, n] of [...hits].sort()) console.log(`  ${k}  ×${n}`);
await b.close();
