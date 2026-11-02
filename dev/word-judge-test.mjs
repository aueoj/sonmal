/* 낱말 판정이 아무 동작이나 통과시키지 않는지 본다.
   단계마다 맞는 손모양은 통과하고, 틀린 손모양(손가락, 손 수, 높이)은 걸려야 한다. */
import { WORD_BANK } from '../js/wordBank.js';
import { landmarksFor } from '../js/mockHand.js';
import { describe } from '../js/poseFeatures.js';
import { scoreCheck } from '../js/matcher.js';

const ALL = ['index', 'middle', 'ring', 'pinky'];
const hand = (fingers, { ring = false, thumb = 'in', dy = 0 } = {}) => {
  const lm = landmarksFor({ fingers, dir: 'up', view: 'palm', thumb, special: ring ? 'circle' : null }, 0);
  for (const p of lm) p.y += dy;
  return describe(lm, 'Right', true);
};
const DY = { belly: 0.35, chest: 0.15, front: 0.1 };
const right = c => {
  const h = hand(c.fingers ?? ALL, { ring: c.ring, thumb: c.thumb === 'up' ? 'up' : 'in', dy: DY[c.zone] ?? 0 });
  return Array((c.hands ?? 1)).fill(h);
};

let pass = 0, missed = [], falsePass = [];
for (const w of WORD_BANK.filter(x => x.status === 'ok')) {
  w.check.forEach((c, i) => {
    const tag = `${w.word} ${i + 1}단계`;
    if (scoreCheck(right(c), c).ok) pass++; else missed.push(tag + ' ← 맞게 했는데 걸림: ' + scoreCheck(right(c), c).hint);
    // 틀린 것들
    const wrongs = [];
    if (c.fingers) {
      const other = c.fingers.length >= 3 ? [] : ALL;            // 펴야 할 것을 접거나, 접어야 할 것을 편다
      wrongs.push(['손가락', Array(c.hands ?? 1).fill(hand(other, { dy: DY[c.zone] ?? 0 }))]);
    }
    if ((c.hands ?? 1) === 2) wrongs.push(['손 하나', right(c).slice(0, 1)]);
    if (c.zone === 'face' || c.zone === 'chin') wrongs.push(['배 높이', right({ ...c, zone: 'belly' })]);
    if (c.zone === 'belly') wrongs.push(['얼굴 높이', right({ ...c, zone: 'face' })]);
    for (const [why, feats] of wrongs) if (scoreCheck(feats, c).ok) falsePass.push(`${tag} ← ${why} 틀렸는데 통과`);
  });
}
console.log(`맞게 한 단계 통과 ${pass}개`);
for (const s of missed) console.log('  ✕ ' + s);
for (const s of falsePass) console.log('  ✕ ' + s);
if (!missed.length && !falsePass.length) console.log('틀린 손모양, 손 수, 높이는 모두 걸렸다');
process.exit(missed.length || falsePass.length ? 1 : 0);
