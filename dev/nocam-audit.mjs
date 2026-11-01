/* 카메라를 쓸 수 없는 자리(내장 프레임, 비보안 컨텍스트)에서도
   전체 흐름을 볼 수 있는지 확인한다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.addInitScript(() => {
  Object.defineProperty(navigator, 'mediaDevices', { get: () => undefined });
});
await p.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
await p.fill('#typed', '안녕하세요');
await p.click('.typed button[type=submit]');
const st = await p.evaluate(() => ({
  camDisabled: document.getElementById('btn-cam').disabled,
  demo: !!document.getElementById('btn-demo')
}));
console.log('카메라 API 없음 → 카메라 버튼 비활성', st.camDisabled, '| 둘러보기 버튼 있음', st.demo);
await p.click('#btn-demo');
await p.waitForFunction(() => document.querySelectorAll('#strip .unit[data-state="done"]').length >= 12,
  null, { timeout: 45000 });
const r = await p.evaluate(() => document.getElementById('result').textContent.trim());
console.log('둘러보기로 완주 →', r);
console.log('콘솔 오류', errs.length ? errs.slice(0, 2).join(' | ') : '없음');
await b.close();
process.exit(r.includes('안녕하세요') ? 0 : 1);
