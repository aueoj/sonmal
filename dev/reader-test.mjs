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
// 다른 손: 자모 손모양이거나, 'loose' 면 어느 자모도 아닌 손(편 손을 45도 기울여 늘어뜨린 손)
const otherHand = j => {
  if (j !== 'loose') return landmarksFor(getPose(j), 0);
  const open = landmarksFor(getPose('ㅂ'), 0), c = open[0], k = Math.SQRT1_2;
  return open.map(p => ({ ...p, x: c.x + (p.x - c.x - (p.y - c.y)) * k, y: c.y + (p.x - c.x + p.y - c.y) * k }));
};
// slide 면 손모양은 그대로 두고 손 전체를 옆으로 민다(쌍자음). wait 만큼 가만히 버틴 뒤에 민다.
// other 를 주면 그 손을 옆에 함께 띄운다
const hold = (jamo, ms = 800, slide = false, wait = 0, other = null) => {
  const lm = landmarksFor(getPose(jamo), 0), scale = describe(lm, 'Right', true).scale;
  const lm2 = other && otherHand(other).map(p => ({ ...p, x: p.x + 1.6 * scale }));
  for (let i = 0; i < ms; i += 50) {
    const dx = slide ? Math.max(0, Math.min(1, (i - wait) / 500)) * scale : 0;
    const feats = [describe(lm.map(p => ({ ...p, x: p.x + dx })), 'Right', true)];
    if (lm2) feats.push(describe(lm2, 'Left', true));
    r.feed(feats, t += 50);
  }
};
const rest = ms => { for (let i = 0; i < ms; i += 50) r.feed([], t += 50); };
// 'ㄱ>' 는 ㄱ 손모양을 곧바로 옆으로 민다. 'ㄱ~' 는 받아 적힐 때까지 버틴 뒤에 민다.
// 자모 사이에는 손을 내린다. 그래서 'ㄱㄱㅏ' 는 손을 풀었다 다시 지은 ㄱ 이다(밀지 않았으니 ㄲ 이 아니다)
const cases = [['ㄱㅏㄴㅏ', '가나'], ['ㅅㅏㄹㅏㅇ', '사랑'], ['ㅁㅜㄹ', '물'], ['ㄱㅏ', '가'], ['ㄱ>ㅏ', '까'], ['ㅅ>ㅏ', '싸'],
               ['ㄱ~ㅏ', '까'], ['ㄱㄱㅏ', composeFromJamo([...'ㄱㄱㅏ'])],
               // '+x' 는 앞 손과 함께 다른 손으로 x 를 보인다. ㅗ+ㅏ 두 손은 ㅘ, 한 손 ㄱ 은 다른 손이 보여도 ㄱ
               ['ㅇㅗ+ㅏ', '와'], ['ㄱ+looseㅏ', '가'], ['ㅇㅜ+ㅓ', '워']];
let bad = 0;
for (const [seq, want] of cases) {
  for (const j of seq.match(/.(?:[>~]|\+(?:loose|.))?/gu)) {
    if (j[1] === '~') hold(j[0], 1600, true, 900);
    else if (j[1] === '+') hold(j[0], 800, false, 0, j.slice(2));
    else hold(j[0], 800, j[1] === '>');
    rest(200);
  }
  rest(2600);
  console.log(`지은 손 ${[...seq].join(' ')} → 읽은 말 "${said}"${said === want ? '' : `  ← 기대 "${want}"`}`);
  if (said !== want) bad++;
}
// 'loose' 손이 정말 어느 자모도 아닌지(ACCEPT 0.88 아래인지) 본다. 그래야 위의 'ㄱ+loose' 가 뜻하는 바가 선다
const { ALL_POSES } = await import('../js/jamoData.js');
const { scorePose } = await import('../js/matcher.js');
const looseTop = Math.max(...ALL_POSES.map(p => scorePose(describe(otherHand('loose'), 'Left', true), p, { mirrored: true }).score));
console.log(`기울인 손의 가장 높은 자모 점수 ${looseTop.toFixed(2)}`);
if (looseTop >= 0.88) bad++;
process.exit(bad ? 1 : 0);
