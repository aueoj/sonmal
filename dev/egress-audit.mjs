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
/* 이 셋 말고 다른 곳에 접속하면 실패한다. 영상이나 소리가 새어 나가는 변경을
   사람이 알아채기 전에 여기서 막는다. */
const ALLOWED = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com',
                 'https://cdn.jsdelivr.net', 'https://storage.googleapis.com'];
console.log('페이지가 접속한 곳 (localhost 제외)');
if (!hits.size) console.log('  없음');
const bad = [];
for (const [k, n] of [...hits].sort()) {
  const ok = ALLOWED.some(a => k.includes(a));
  console.log(`  ${ok ? '○' : '✕'} ${k}  ×${n}`);
  if (!ok) bad.push(k);
}
const posted = [...hits.keys()].filter(k => !k.startsWith('GET '));
if (posted.length) console.log('내보내는 요청:', posted);
await b.close();
if (bad.length) { console.error('허용하지 않은 곳에 접속했습니다:', bad.join(', ')); process.exit(1); }
if (posted.length) { console.error('GET 이 아닌 요청이 있습니다:', posted.join(', ')); process.exit(1); }
console.log('→ 허용한 곳에만, 내려받기만 했습니다');
