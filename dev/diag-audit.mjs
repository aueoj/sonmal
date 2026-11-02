/* 카메라가 막혔을 때 진단이 뜨는지, 무엇을 짚는지 확인한다. */
import { launch } from './browser.mjs';
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, permissions: [] });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
// 권한이 거부된 자리를 흉내 낸다
await p.addInitScript(() => {
  navigator.mediaDevices.getUserMedia = () =>
    Promise.reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
});
await p.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
// 카메라는 스스로 켜려 한다. 막히면 누르지 않아도 진단이 떠야 한다
await p.waitForSelector('#diag:not([hidden]) .diag-list li', { timeout: 20000 });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => ({
  verdict: document.getElementById('diag-verdict').textContent,
  advice: document.getElementById('diag-advice').textContent,
  rows: [...document.querySelectorAll('.diag-list li')].map(li => li.dataset.state + ' ' + li.textContent.replace(/\s+/g,' ').trim()),
  retry: !!document.getElementById('diag-retry'),
  camBtnEnabled: !document.getElementById('btn-cam').disabled
}));
console.log('판정:', r.verdict);
console.log('안내:', r.advice);
r.rows.forEach(x => console.log('  ', x));
console.log('다시 시도 버튼', r.retry, '| 카메라 버튼 누를 수 있음', r.camBtnEnabled);
console.log('콘솔 오류', errs.length ? errs.slice(0,2) : '없음');
await p.screenshot({ path: '/tmp/claude-0/-home-user/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/diag.png' });
await b.close();
