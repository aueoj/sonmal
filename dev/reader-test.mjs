/* 읽기 모드가 지문자를 받아 적어 글자로 합치는지 본다. 모의 손으로 '가나'를 짓는다. */
globalThis.performance ??= { now: () => Date.now() };
const { createReader } = await import('../js/reader.js');
const { landmarksFor } = await import('../js/mockHand.js');
const { describe } = await import('../js/poseFeatures.js');
const { getPose } = await import('../js/jamoData.js');

let said = '';
const r = createReader({ onSentence: t => { said = t; } });
let t = 0;
// slide 면 손모양은 그대로 두고 손 전체를 옆으로 민다(쌍자음)
const hold = (jamo, ms = 800, slide = false) => {
  const lm = landmarksFor(getPose(jamo), 0), scale = describe(lm, 'Right', true).scale;
  for (let i = 0; i < ms; i += 50) {
    const dx = slide ? Math.min(1, i / 500) * scale : 0;
    r.feed([describe(lm.map(p => ({ ...p, x: p.x + dx })), 'Right', true)], t += 50);
  }
};
const rest = ms => { for (let i = 0; i < ms; i += 50) r.feed([], t += 50); };
// 'ㄱ>' 는 ㄱ 손모양을 옆으로 민다
const cases = [['ㄱㅏㄴㅏ', '가나'], ['ㅅㅏㄹㅏㅇ', '사랑'], ['ㅁㅜㄹ', '물'], ['ㄱㅏ', '가'], ['ㄱ>ㅏ', '까'], ['ㅅ>ㅏ', '싸']];
let bad = 0;
for (const [seq, want] of cases) {
  for (const j of seq.match(/.>?/gu)) { hold(j[0], 800, j.length > 1); rest(200); }
  rest(2600);
  console.log(`지은 손 ${[...seq].join(' ')} → 읽은 말 "${said}"${said === want ? '' : `  ← 기대 "${want}"`}`);
  if (said !== want) bad++;
}
process.exit(bad ? 1 : 0);
