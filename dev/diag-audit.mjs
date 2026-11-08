/* 카메라가 막혔을 때 진단이 뜨는지, 무엇을 짚는지 확인한다.
   쓰는 중에 카메라가 끊기거나 손 인식이 잇달아 실패해도 진단이 뜨는지, 한 번 실패로 멈추지 않는지 본다. */
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

// 쓰는 중에 끊기는 자리. 손 인식 모듈을 가짜로 바꿔 카메라와 손 인식 실패를 마음대로 낸다
const FAKE_VISION = `
export const FilesetResolver = { forVisionTasks: async () => ({}) };
export const HandLandmarker = { createFromOptions: async () => ({
  detectForVideo() {
    const n = window.__detect = (window.__detect || 0) + 1;
    if (window.__throwAll || n === 3) throw new Error('detect boom');
    return { landmarks: [] };
  },
  close() {}
}) };`;
const livePage = async (throwAll) => {
  const pg = await ctx.newPage();
  await pg.addInitScript(all => {
    window.__throwAll = all;
    navigator.mediaDevices.getUserMedia = async () => {
      const c = document.createElement('canvas'); c.width = 64; c.height = 48;
      const g = c.getContext('2d');
      setInterval(() => g.fillRect(0, 0, 64, Math.random() * 48), 100);   // 프레임이 계속 나오게
      return window.__stream = c.captureStream(10);
    };
  }, throwAll);
  await pg.route(/tasks-vision@[^/]+\/vision_bundle\.mjs/, rt => rt.fulfill({
    contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: FAKE_VISION }));
  await pg.goto('http://localhost:8777/index.html', { waitUntil: 'domcontentloaded' });
  if (!throwAll) await pg.waitForSelector('.camera.live', { timeout: 20000 });
  return pg;
};
const diagOf = pg => pg.evaluate(() => ({
  shown: !document.getElementById('diag').hidden && !document.getElementById('camera').classList.contains('live'),
  verdict: document.getElementById('diag-verdict').textContent
}));

// 한 번 실패해도 다음 프레임을 본다
const once = await livePage(false);
await once.waitForTimeout(1500);
const onceR = { frames: await once.evaluate(() => window.__detect), ...(await diagOf(once)) };
console.log('손 인식 한 번 실패 → 이어 본 프레임', onceR.frames, '| 진단 뜸', onceR.shown);
// 카메라가 빠지면 영상이 끝난다(브라우저는 ended 를 보낸다. stop() 만으로는 보내지 않는다)
await once.evaluate(() => { const t = window.__stream.getVideoTracks()[0]; t.stop(); t.dispatchEvent(new Event('ended')); });
await once.waitForSelector('#diag:not([hidden]) .diag-list li', { timeout: 20000 }).catch(() => {});
const ended = await diagOf(once);
console.log('카메라 끊김 → 진단 뜸', ended.shown, '| 판정:', ended.verdict);

// 잇달아 실패하면 조용히 돌지 않고 알린다
const all = await livePage(true);
await all.waitForSelector('#diag:not([hidden]) .diag-list li', { timeout: 20000 }).catch(() => {});
const failing = await diagOf(all);
console.log('손 인식 계속 실패 → 진단 뜸', failing.shown, '| 판정:', failing.verdict);
await b.close();

const lostOk = onceR.frames > 10 && !onceR.shown && ended.shown && ended.verdict === '카메라가 끊어졌습니다'
  && failing.shown && failing.verdict === '손 인식이 멈췄습니다';
const ok = lostOk && r.verdict === '카메라 권한이 거부되었습니다' && r.gum === 1 && r.focus === 'diag-retry' && !errs.length
  && !w.verdict.includes('쓸 수 있습니다') && !!w.advice && w.rows.some(x => x.startsWith('bad') && x.includes('손 인식 준비'));
process.exit(ok ? 0 : 1);
