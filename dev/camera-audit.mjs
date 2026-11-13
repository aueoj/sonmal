/* 카메라 끄기, 탭 숨김, 둘러보기 표시를 본다.
 *
 *  1. 둘러보기(합성 손)에서는 '합성 손으로 둘러보는 중입니다'와 '카메라 켜기'가 보인다
 *  2. 탭이 숨으면 판정이 멈추고(칸이 더 차지 않는다), 돌아오면 이어 간다
 *  3. '둘러보기 끝내기'를 누르면 처음 화면으로 돌아가고 '카메라 켜기'가 살아 있다
 *  4. 가짜 카메라로 '카메라 켜기'를 누르면 진짜 카메라 경로로 켜지고, 둘러보기 표시는 사라진다
 *  5. 카메라를 쓰는 중에 탭이 숨으면 카메라를 놓고(영상 없음), 돌아오면 다시 연다
 *  6. '카메라 끄기'를 누르면 카메라를 놓고 처음 화면으로 돌아간다
 */
import { launch } from './browser.mjs';

const b = await launch({ args: ['--no-sandbox', '--mute-audio', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
await p.addInitScript(() => {
  speechSynthesis.speak = () => {};
  // 탭 숨김을 흉내 낸다. 진짜 탭 전환은 헤드리스에서 일어나지 않는다
  let hidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
  window.__setHidden = h => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); };
});
/* page.waitForFunction 은 페이지 CSP(unsafe-eval 금지)에 막힌다. evaluate 로 되묻는다 */
const until = async (fn, arg, ms = 15000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(150); }
  return false;
};
const bad = [];
const check = (ok, msg) => { console.log(`  ${ok ? '○' : '✕'} ${msg}`); if (!ok) bad.push(msg); };
const st = () => p.evaluate(() => {
  const v = id => { const n = document.getElementById(id); return !!n && !n.hidden && n.getClientRects().length > 0; };
  const units = [...document.querySelectorAll('#seq .unit[data-i]')];
  return {
    live: document.getElementById('camera').classList.contains('live'),
    stateBar: v('cam-state'), note: v('cam-state-note'), camOn: v('cam-on'), camOff: v('cam-off'),
    offText: document.getElementById('cam-off').textContent,
    prompt: v('btn-cam'), btnCam: document.getElementById('btn-cam').textContent, btnCamOff: document.getElementById('btn-cam').disabled,
    title: document.getElementById('cam-title').textContent,
    stream: !!document.getElementById('cam').srcObject,
    tracks: document.getElementById('cam').srcObject?.getVideoTracks().map(t => t.readyState).join(',') ?? '',
    done: units.filter(u => u.dataset.state === 'done').length, total: units.length,
    fill: document.getElementById('fill').style.transform
  };
});

// 1. 둘러보기
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForSelector('.camera.live', { timeout: 20000 });
let s = await st();
check(s.note && s.camOn && s.offText === '둘러보기 끝내기', `둘러보기 표시 note=${s.note} 카메라켜기=${s.camOn} 끄기="${s.offText}"`);

// 2. 탭 숨김: 여러 칸 문장을 하는 동안 숨기면 칸이 더 차지 않는다
await p.fill('#typed', '가나다라마바'); await p.press('#typed', 'Enter');
await until(() => document.querySelectorAll('#seq .unit[data-state="done"]').length >= 1);
await p.evaluate(() => window.__setHidden(true));
const before = (await st()).done;
await p.waitForTimeout(3000);
const whileHidden = (await st()).done;
check(whileHidden === before, `숨긴 3초 동안 칸 ${before} → ${whileHidden}`);
await p.evaluate(() => window.__setHidden(false));
await until(n => document.querySelectorAll('#seq .unit[data-state="done"]').length > n, whileHidden);
const afterShow = (await st()).done;
check(afterShow > whileHidden, `돌아온 뒤 칸 ${whileHidden} → ${afterShow}`);

// 3. 둘러보기 끝내기
await p.click('#cam-off');
await p.waitForTimeout(300);
s = await st();
check(!s.live && s.prompt && !s.btnCamOff && s.btnCam === '카메라 켜기' && !s.stateBar,
  `끝낸 뒤 라이브=${s.live} 켜기 버튼="${s.btnCam}" 눌림=${!s.btnCamOff} 위 줄=${s.stateBar} 제목="${s.title}"`);
const frozen = (await st()).done;
await p.waitForTimeout(1500);
check((await st()).done === frozen, '끈 뒤에는 칸이 더 차지 않는다');

// 4. 다시 둘러보기 → 카메라 켜기(가짜 카메라)
await p.click('#btn-demo');
await p.waitForSelector('.camera.live', { timeout: 20000 });
await p.click('#cam-on');
await until(() => document.getElementById('camera').classList.contains('live') && !!document.getElementById('cam').srcObject, null, 45000);
s = await st();
check(s.live && s.stream && !s.note && !s.camOn && s.offText === '카메라 끄기',
  `카메라 켜기 → 라이브=${s.live} 영상=${s.stream} 둘러보기 표시=${s.note} 끄기="${s.offText}"`);

// 5. 카메라 쓰는 중 탭 숨김
await p.evaluate(() => window.__setHidden(true));
await p.waitForTimeout(300);
s = await st();
check(!s.stream, `숨기면 카메라를 놓는다 (영상 ${s.stream ? '남음' : '없음'})`);
await p.evaluate(() => window.__setHidden(false));
await until(() => !!document.getElementById('cam').srcObject);
s = await st();
check(s.stream && s.tracks === 'live' && s.live, `돌아오면 다시 연다 (영상 ${s.tracks || '없음'})`);

// 6. 카메라 끄기
await p.click('#cam-off');
await p.waitForTimeout(300);
s = await st();
check(!s.live && !s.stream && s.prompt && s.title === '카메라를 껐습니다', `끄기 → 라이브=${s.live} 영상=${s.stream} 제목="${s.title}"`);
const focus = await p.evaluate(() => document.activeElement?.id);
check(focus === 'btn-cam', `끈 뒤 초점이 카메라 켜기에 (${focus})`);

console.log('콘솔 오류', errs.length ? errs.join(' | ') : '없음');
await b.close();
if (errs.length) bad.push('페이지 오류');
if (bad.length) { console.log('\n' + bad.join('\n')); process.exit(1); }
console.log('\n카메라를 끄고, 숨으면 쉬고, 둘러보기를 알린다');
