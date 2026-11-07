/* 카메라가 막혔을 때 진단이 뜨는지, 무엇을 짚는지 확인한다. */
import { launch } from './browser.mjs';
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, permissions: [] });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
// 권한이 거부된 자리를 흉내 낸다. 몇 번 열려고 했는지 센다
await p.addInitScript(() => {
  window.__gum = 0;
  navigator.mediaDevices.getUserMedia = () => {
    window.__gum++;
    return Promise.reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
  };
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
  camBtnEnabled: !document.getElementById('btn-cam').disabled,
  gum: window.__gum,
  focus: document.activeElement?.id
}));
console.log('판정:', r.verdict);
console.log('안내:', r.advice);
r.rows.forEach(x => console.log('  ', x));
console.log('다시 시도 버튼', r.retry, '| 카메라 버튼 누를 수 있음', r.camBtnEnabled);
console.log('콘솔 오류', errs.length ? errs.slice(0,2) : '없음');
// 진단이 카메라를 다시 열면 막 닫은 권한 창이 또 뜬다
console.log('카메라 열기 시도', r.gum, '번 | 초점', r.focus);

// 카메라는 열렸는데 손 인식(wasm)만 막힌 자리. '쓸 수 있습니다'라고 하면 거꾸로 말하는 것이다
const q = await ctx.newPage();
await q.addInitScript(() => {
  navigator.mediaDevices.getUserMedia = async () => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 48;
    c.getContext('2d').fillRect(0, 0, 64, 48);
    return c.captureStream(5);
  };
});
await q.route(/tasks-vision@[^/]+\/wasm\//, rt => rt.abort());
await q.goto('http://localhost:8777/index.html', { waitUntil: 'domcontentloaded' });
await q.waitForSelector('#diag:not([hidden]) .diag-list li', { timeout: 60000 });
const w = await q.evaluate(() => ({
  verdict: document.getElementById('diag-verdict').textContent,
  advice: document.getElementById('diag-advice').textContent,
  rows: [...document.querySelectorAll('.diag-list li')].map(li => li.dataset.state + ' ' + li.textContent.replace(/\s+/g,' ').trim())
}));
console.log('손 인식만 막힘 → 판정:', w.verdict, '| 안내:', w.advice);
w.rows.forEach(x => console.log('  ', x));
await b.close();

const ok = r.verdict === '카메라 권한이 거부되었습니다' && r.gum === 1 && r.focus === 'diag-retry' && !errs.length
  && !w.verdict.includes('쓸 수 있습니다') && !!w.advice && w.rows.some(x => x.startsWith('bad') && x.includes('손 인식 준비'));
process.exit(ok ? 0 : 1);
