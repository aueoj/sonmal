/* 읽기 모드가 지문자를 받아 적어 글자로 합치는지 본다. 모의 손으로 '가나'를 짓는다. */
globalThis.performance ??= { now: () => Date.now() };
const { createReader } = await import('../js/reader.js');
const { landmarksFor } = await import('../js/mockHand.js');
const { describe } = await import('../js/poseFeatures.js');
const { getPose } = await import('../js/jamoData.js');

let said = '';
const r = createReader({ onSentence: t => { said = t; } });
let t = 0;
const hold = (jamo, ms = 800) => { const f = describe(landmarksFor(getPose(jamo), 0), 'Right', true); for (let i = 0; i < ms; i += 50) r.feed([f], t += 50); };
const rest = ms => { for (let i = 0; i < ms; i += 50) r.feed([], t += 50); };
const cases = [['ㄱㅏㄴㅏ', '가나'], ['ㅅㅏㄹㅏㅇ', '사랑'], ['ㅁㅜㄹ', '물']];
let bad = 0;
for (const [seq, want] of cases) {
  for (const j of seq) { hold(j); rest(200); }
  rest(2600);
  console.log(`지은 손 ${[...seq].join(' ')} → 읽은 말 "${said}"${said === want ? '' : `  ← 기대 "${want}"`}`);
  if (said !== want) bad++;
}
process.exit(bad ? 1 : 0);
