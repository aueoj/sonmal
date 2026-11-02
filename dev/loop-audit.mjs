/* 전체 루프를 모의 입력으로 끝까지 돌린다.
   말 → 자모 분해 → 손모양 → 랜드마크 → 특징 → 판정 → 확정 → 한글 재합성. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
const GOTO = 'http://localhost:8777/index.html?mock=1';
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));

// speechSynthesis는 쓰기 불가 접근자라 통째로 바꿀 수 없다.
// 생성자와 speak만 가로채 무엇을 읽으려 했는지 잡는다.
await p.addInitScript(() => {
  window.__spoken = [];
  const U = window.SpeechSynthesisUtterance;
  window.SpeechSynthesisUtterance = function (t) { const u = new U(t); u.__t = t; return u; };
  const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = u => { window.__spoken.push(u.__t ?? u.text); try { orig(u); } catch {} };
});

await p.goto(GOTO, { waitUntil: 'networkidle' });
const PHRASE = process.argv[2] || '고맙습니다';
// '고맙습니다'와 '감사합니다'는 같은 수어다. 앱은 대표말로 읽어 준다.
// 들은 말 그대로가 아니라 '그 수어가 뜻하는 말'이 나와야 맞다.
const EXPECT = await p.evaluate(async (ph) => {
  const m = await import('/js/words.js');
  // 어절마다 읽는다. 사전에 있는 말은 대표말로 바뀐다.
  return ph.trim().split(/\s+/).map(t => m.lookupWord(t)?.word ?? t).join(' ');
}, PHRASE).catch(() => PHRASE);
await p.fill('#typed', PHRASE);
await p.press('#typed', 'Enter');
await p.waitForSelector('.camera.live', { timeout: 20000 });  // 카메라는 스스로 켜진다
await p.waitForTimeout(600);

const total = await p.evaluate(() => document.querySelectorAll('#seq .unit[data-i]').length);
// 멈춤은 '시간이 얼마 지났나'가 아니라 '진행이 멈춘 채 얼마나 있었나'로 본다.
const STALL_MS = 6000, DEADLINE = Date.now() + 60000;
let last = -1, lastChange = Date.now(), stuckAt = null;
while (Date.now() < DEADLINE) {
  const done = await p.evaluate(() => document.querySelectorAll('#seq .unit[data-state="done"]').length);
  if (done >= total) break;
  // 단어 수어 구간은 인식하지 않는다. 사람이 누르듯 '다음'을 눌러 넘긴다.
  if (done !== last) { last = done; lastChange = Date.now(); }
  else if (Date.now() - lastChange > STALL_MS) { stuckAt = done; break; }
  await p.waitForTimeout(250);
}

const r = await p.evaluate(() => ({
  done: document.querySelectorAll('#seq .unit[data-state="done"]').length,
  total: document.querySelectorAll('#seq .unit[data-i]').length,
  locks: document.querySelectorAll('#seq .unit[data-lock="1"]').length,
  result: document.getElementById('read').textContent,
  guideState: document.querySelector('.guide').dataset.state,
  spoken: window.__spoken
}));

const outText = r.spoken.join(' ');
console.log(`문장              ${PHRASE}`);
console.log(`확정 자모          ${r.done} / ${r.total}${stuckAt !== null ? `  ← ${stuckAt}번째에서 멈춤` : ''}`);
console.log(`확정 표시 남음       ${r.locks}개 / ${r.total}칸${r.locks > r.total ? '  ← 쌓이고 있다' : ''}`);
console.log(`읽어 준 말         ${outText}  ${outText === EXPECT ? '일치' : `← 기대한 것은 ${EXPECT}`}`);
console.log(`음성 출력 시도      ${JSON.stringify(r.spoken)}`);
console.log(`가이드 상태        ${r.guideState || '(없음)'}`);
console.log(`콘솔 오류          ${errs.length ? errs.slice(0,3).join(' | ') : '없음'}`);
await b.close();
process.exit(outText === EXPECT && r.done === r.total && r.total > 0 && r.locks <= r.total ? 0 : 1);
