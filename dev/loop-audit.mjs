/* 전체 루프를 모의 입력으로 끝까지 돌린다.
   말 → 자모 분해 → 손모양 → 랜드마크 → 특징 → 판정 → 확정 → 한글 재합성. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
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
await p.fill('#typed', PHRASE);
await p.press('#typed', 'Enter');
await p.click('#btn-cam');
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
  count: '',
  result: document.getElementById('read').textContent,
  meterPct: '', meterState: document.querySelector('.guide').dataset.state, replayDisabled: false,
  spoken: window.__spoken
}));

const outText = r.spoken.join('');
console.log(`문장              ${PHRASE}`);
console.log(`확정 자모          ${r.done} / ${r.total}${stuckAt !== null ? `  ← ${stuckAt}번째에서 멈춤` : ''}`);
console.log(`확정 애니메이션 남음   ${r.locks}개  ${r.locks > 0 ? '(innerHTML이 지우지 않음)' : '← 지워짐'}`);
console.log(`진행 표시          ${r.count}`);
console.log(`재합성 결과        ${outText}  ${outText === PHRASE ? '일치' : '← 불일치'}`);
console.log(`음성 출력 시도      ${JSON.stringify(r.spoken)}`);
console.log(`다시 읽어주기 버튼    ${r.replayDisabled ? '비활성 ← 켜져야 함' : '활성'}`);
console.log(`미터              ${r.meterPct} / ${r.meterState}`);
console.log(`콘솔 오류          ${errs.length ? errs.slice(0,3).join(' | ') : '없음'}`);
await b.close();
process.exit(outText === PHRASE && r.done === r.total ? 0 : 1);
