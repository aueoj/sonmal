/* 낱말 판정이 아무 동작이나 통과시키지 않는지 본다.
   단계마다 맞는 손모양은 통과하고, 틀린 손모양(손가락, 손 수, 높이)은 걸려야 한다. */
import { WORD_BANK } from '../js/wordBank.js';
import { landmarksFor } from '../js/mockHand.js';
import { describe } from '../js/poseFeatures.js';
import { scoreCheck, ZONE_AT } from '../js/matcher.js';

const ALL = ['index', 'middle', 'ring', 'pinky'];
/* 앱의 모의 입력과 같은 얼굴 자리. 손은 그 높이의 보통 자리(ZONE_AT)에 둔다. */
const FACE = { y: 0.2, h: 0.16 };
const at = zone => FACE.y + (zone === 'below' ? 5.0 : (ZONE_AT[zone] ?? ZONE_AT.front)) * FACE.h;
const hand = (fingers, { ring = false, thumb = 'in', zone } = {}) => {
  const lm = landmarksFor({ fingers, dir: 'up', view: 'palm', thumb, special: ring ? 'circle' : null }, 0);
  const cy = lm.reduce((s, p) => s + p.y, 0) / lm.length;
  for (const p of lm) p.y += at(zone) - cy;
  return describe(lm, 'Right', true);
};
const right = c => {
  const opt = { ring: c.ring, thumb: c.thumb === 'up' ? 'up' : 'in', zone: c.zone };
  const h = hand(c.fingers ?? ALL, opt);
  if ((c.hands ?? 1) === 1) return [h];
  return [h, c.other ? hand(c.other, { zone: c.zone }) : h];
};

/* 얼굴이 보일 때와 안 보일 때(화면 비율로 어림) 둘 다 시험한다 */
for (const [label, face] of [['얼굴 기준', FACE], ['얼굴 없음', null]]) {
console.log(`── ${label} ──`);

var pass = 0, missed = [], falsePass = [];
for (const w of WORD_BANK.filter(x => x.status === 'ok')) {
  w.check.forEach((c, i) => {
    const tag = `${w.word} ${i + 1}단계`;
    if (scoreCheck(right(c), c, face).ok) pass++; else missed.push(tag + ' ← 맞게 했는데 걸림: ' + scoreCheck(right(c), c, face).hint);
    // 틀린 것들
    const wrongs = [];
    if (c.fingers) {
      const other = c.fingers.length >= 3 ? [] : ALL;            // 펴야 할 것을 접거나, 접어야 할 것을 편다
      wrongs.push(['손가락', Array(c.hands ?? 1).fill(hand(other, { zone: c.zone }))]);
    }
    if ((c.hands ?? 1) === 2) wrongs.push(['손 하나', right(c).slice(0, 1)]);
    // 두 손 낱말: 한 손만 맞고 다른 손은 엉뚱하면 걸려야 한다
    if ((c.hands ?? 1) === 2 && c.fingers) {
      const want2 = c.other ?? c.fingers;
      const wrong2 = want2.length >= 3 ? [] : ALL;
      wrongs.push(['다른 손', [right(c)[0], hand(wrong2, { zone: c.zone })]]);
    }
    if (c.zone === 'face' || c.zone === 'chin') wrongs.push(['배 높이', right({ ...c, zone: 'belly' })]);
    if (c.zone === 'belly') wrongs.push(['얼굴 높이', right({ ...c, zone: 'face' })]);
    // 가슴 높이는 얼굴이 보일 때만 본다
    if (face && c.zone === 'chest') {
      wrongs.push(['얼굴 높이', right({ ...c, zone: 'face' })]);
      wrongs.push(['무릎 높이', right({ ...c, zone: 'below' })]);
    }
    for (const [why, feats] of wrongs) if (scoreCheck(feats, c, face).ok) falsePass.push(`${tag} ← ${why} 틀렸는데 통과`);
  });
}
// 되풀이 막기: 주먹을 위아래로 포갠 '만들다'는 위 주먹이 목 가까이 와도 가슴 동작이다
if (face) {
  const fistAt = u => { const lm = landmarksFor({ fingers: [], dir: 'up', view: 'palm', thumb: 'in' }, 0);
    const cy = lm.reduce((s, p) => s + p.y, 0) / lm.length;
    for (const p of lm) p.y += FACE.y + u * FACE.h - cy; return describe(lm, 'Right', true); };
  for (const [top, bot] of [[0.5, 1.0], [3.6, 4.1]]) {
    const r = scoreCheck([fistAt(top), fistAt(bot)], { hands: 2, fingers: [], zone: 'chest' }, face);
    if (r.ok) pass++; else missed.push(`만들다 포갠 주먹(${top}, ${bot}) ← 맞게 했는데 걸림: ${r.hint}`);
  }
}
console.log(`맞게 한 단계 통과 ${pass}개`);
for (const s of missed) console.log('  ✕ ' + s);
for (const s of falsePass) console.log('  ✕ ' + s);
if (!missed.length && !falsePass.length) console.log('틀린 손모양, 손 수, 높이는 모두 걸렸다');
if (missed.length || falsePass.length) process.exit(1);
}
