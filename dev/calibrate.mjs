/* 문턱을 감으로 정하지 않는다.
   맞는 자세의 점수와 틀린 자세의 점수를 전부 재서, 둘을 가르는 자리를 찾는다. */
import { landmarksFor } from '../js/mockHand.js';
import { describe } from '../js/poseFeatures.js';
import { scorePose } from '../js/matcher.js';
import { ALL_POSES, getPose } from '../js/jamoData.js';

const STATIC = ALL_POSES.filter(p => !p.motion);
const N = 30, NOISE = 0.02;

const self = [], other = [];
for (const p of STATIC) {
  for (let i = 0; i < N; i++) {
    const f = describe(landmarksFor(p, NOISE), 'Right', false);
    self.push({ j: p.jamo, s: scorePose(f, p).score });
    // 다른 자모로 채점하면 떨어져야 한다
    for (const q of STATIC) {
      if (q.jamo === p.jamo) continue;
      if (Math.random() > 0.12) continue;
      other.push({ j: p.jamo + '→' + q.jamo, s: scorePose(f, q).score });
    }
  }
}
const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(q * (b.length - 1))]; };
const S = self.map(x => x.s), O = other.map(x => x.s);

console.log(`맞는 자세 ${S.length}회 · 틀린 자세 ${O.length}회`);
console.log(`맞는 자세 점수  최저 ${pct(S,0).toFixed(2)}  5% ${pct(S,.05).toFixed(2)}  중앙 ${pct(S,.5).toFixed(2)}`);
console.log(`틀린 자세 점수  중앙 ${pct(O,.5).toFixed(2)}  95% ${pct(O,.95).toFixed(2)}  최고 ${pct(O,1).toFixed(2)}`);
console.log('');
console.log('문턱   통과(맞음)  오통과(틀림)');
for (const t of [0.74, 0.78, 0.80, 0.82, 0.84, 0.86, 0.88]) {
  const pass = S.filter(s => s >= t).length / S.length;
  const wrong = O.filter(s => s >= t).length / O.length;
  console.log(`${t.toFixed(2)}   ${(pass*100).toFixed(1)}%      ${(wrong*100).toFixed(1)}%`);
}
console.log('');
const low = [...new Set(self.filter(x => x.s < pct(S,.05)).map(x => x.j))];
console.log('점수가 낮게 나오는 자모:', low.length ? low.join(' ') : '없음');
for (const j of ['ㅇ','ㅎ']) {
  const xs = self.filter(x => x.j === j).map(x => x.s);
  const f = describe(landmarksFor(getPose(j)), 'Right', false);
  const r = scorePose(f, getPose(j));
  console.log(`  ${j} 중앙 ${pct(xs,.5).toFixed(2)} 최저 ${pct(xs,0).toFixed(2)} | ` +
    Object.entries(r.parts).map(([k,v])=>k+' '+v.toFixed(2)).join(' '));
}
