/* 카메라를 쓸 수 없는 자리(내장 프레임, 비보안 컨텍스트, 권한 거부)에서도
   '카메라 없이 둘러보기'로 전체 흐름을 볼 수 있는지 확인한다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
// 진단은 일부러 바깥 서버를 두드려 본다. 그 실패는 앱의 잘못이 아니다.
const noise = /net::ERR_|Failed to load resource|storage\.googleapis|cdn\.jsdelivr/;
p.on('console', m => { if (m.type() === 'error' && !noise.test(m.text())) errs.push(m.text()); });

// 카메라 API 자체가 없는 상태를 만든다
await p.addInitScript(() => {
  Object.defineProperty(navigator, 'mediaDevices', { get: () => undefined });
});
await p.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });

const PHRASE = process.argv[2] || '안녕하세요';
await p.fill('#typed', PHRASE);
await p.press('#typed', 'Enter');

const st = await p.evaluate(() => ({
  camDisabled: document.getElementById('btn-cam').disabled,
  demo: !!document.getElementById('btn-demo'),
  units: document.querySelectorAll('#seq .unit[data-i]').length
}));
console.log(`카메라 API 없음 → 둘러보기 버튼 ${st.demo} | 칸 ${st.units}개`);

// 눌러 보면 조용히 죽는 대신 왜 안 되는지 말해야 한다
await p.click('#btn-cam');
let verdict = '';
try {
  await p.locator('#diag .diag-list li').first().waitFor({ timeout: 20000 });
  verdict = (await p.locator('#diag-verdict').textContent() || '').trim();
} catch { /* 아래에서 걸린다 */ }
const camBackOn = await p.evaluate(() => !document.getElementById('btn-cam').disabled);
console.log(`카메라를 눌렀을 때 → "${verdict}" | 버튼 되살아남 ${camBackOn}`);

// 진단 화면에서도 둘러보기로 빠져나갈 수 있어야 한다
const escape = await p.isVisible('#diag-demo');
console.log(`진단 화면에 둘러보기 길 ${escape ? '있음' : '없음  ← 막다른 길이다'}`);
await p.click('#diag-demo');
let done = 0, stuck = false;
try {
  await p.waitForFunction(() => {
    const u = document.querySelectorAll('#seq .unit[data-i]');
    return u.length > 0 && [...u].every(n => n.dataset.state === 'done');
  }, null, { timeout: 60000 });
} catch { stuck = true; }
const r = await p.evaluate(() => ({
  done: [...document.querySelectorAll('#seq .unit[data-i]')].filter(n => n.dataset.state === 'done').length,
  total: document.querySelectorAll('#seq .unit[data-i]').length,
  read: document.getElementById('read').textContent.trim()
}));
console.log(`둘러보기로 ${r.done}/${r.total} 완주 → "${r.read}"${stuck ? '  ← 중간에 멈췄다' : ''}`);
console.log('콘솔 오류', errs.length ? errs.slice(0, 3).join(' | ') : '없음');
await b.close();

const ok = !stuck && st.demo && escape && !!verdict && camBackOn && r.total > 0 && r.done === r.total && !errs.length;
process.exit(ok ? 0 : 1);
