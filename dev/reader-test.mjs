/* 읽기 모드가 지문자를 받아 적어 글자로 합치는지 본다. 모의 손으로 '가나'를 짓는다. */
globalThis.performance ??= { now: () => Date.now() };
const { createReader } = await import('../js/reader.js');
const { landmarksFor } = await import('../js/mockHand.js');
const { describe } = await import('../js/poseFeatures.js');
const { getPose } = await import('../js/jamoData.js');
const { composeFromJamo } = await import('../js/hangul.js');

let said = '';
const r = createReader({ onSentence: t => { said = t; } });
let t = 0;
// slide 면 손모양은 그대로 두고 손 전체를 옆으로 민다(쌍자음). wait 만큼 가만히 버틴 뒤에 민다
const hold = (jamo, ms = 800, slide = false, wait = 0) => {
  const lm = landmarksFor(getPose(jamo), 0), scale = describe(lm, 'Right', true).scale;
  for (let i = 0; i < ms; i += 50) {
    const dx = slide ? Math.max(0, Math.min(1, (i - wait) / 500)) * scale : 0;
    r.feed([describe(lm.map(p => ({ ...p, x: p.x + dx })), 'Right', true)], t += 50);
  }
};
const rest = ms => { for (let i = 0; i < ms; i += 50) r.feed([], t += 50); };
// 'ㄱ>' 는 ㄱ 손모양을 곧바로 옆으로 민다. 'ㄱ~' 는 받아 적힐 때까지 버틴 뒤에 민다.
// 자모 사이에는 손을 내린다. 그래서 'ㄱㄱㅏ' 는 손을 풀었다 다시 지은 ㄱ 이다(밀지 않았으니 ㄲ 이 아니다)
const cases = [['ㄱㅏㄴㅏ', '가나'], ['ㅅㅏㄹㅏㅇ', '사랑'], ['ㅁㅜㄹ', '물'], ['ㄱㅏ', '가'], ['ㄱ>ㅏ', '까'], ['ㅅ>ㅏ', '싸'],
               ['ㄱ~ㅏ', '까'], ['ㄱㄱㅏ', composeFromJamo([...'ㄱㄱㅏ'])]];
let bad = 0;
for (const [seq, want] of cases) {
  for (const j of seq.match(/.[>~]?/gu)) {
    if (j[1] === '~') hold(j[0], 1600, true, 900);
    else hold(j[0], 800, j[1] === '>');
    rest(200);
  }
  rest(2600);
  console.log(`지은 손 ${[...seq].join(' ')} → 읽은 말 "${said}"${said === want ? '' : `  ← 기대 "${want}"`}`);
  if (said !== want) bad++;
}
process.exit(bad ? 1 : 0);
