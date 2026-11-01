/* 자모 데이터를 고친 뒤 28자가 여전히 서로 구별되는지 확인한다.
 *   node dev/selftest.mjs
 *
 * 합성 랜드마크로 도는 자기인식 시험이다. 실제 카메라 정확도가 아니라,
 * 이 특징 집합으로 자모들이 서로 갈라지는지만 본다. */
import { landmarksFor } from '../js/mockHand.js';
import { describe } from '../js/poseFeatures.js';
import { bestMatch } from '../js/matcher.js';
import { ALL_POSES } from '../js/jamoData.js';

const STATIC = ALL_POSES.filter(p => !p.motion);
let ok = 0; const clash = [];
for (const p of STATIC) {
  const b = bestMatch(describe(landmarksFor(p), 'Right', false), STATIC);
  if (b.pose.jamo === p.jamo) ok++; else clash.push(`${p.jamo} → ${b.pose.jamo}`);
}
console.log(`자기인식  ${ok}/${STATIC.length}` + (clash.length ? `\n충돌      ${clash.join(', ')}` : '  충돌 없음'));

for (const amp of [0.02, 0.04, 0.06]) {
  let hit = 0; const N = 80;
  for (const p of STATIC) for (let i = 0; i < N; i++) {
    if (bestMatch(describe(landmarksFor(p, amp), 'Right', false), STATIC).pose.jamo === p.jamo) hit++;
  }
  console.log(`잡음 ±${amp / 2}  ${(100 * hit / (STATIC.length * N)).toFixed(1)}%`);
}
process.exit(clash.length ? 1 : 0);
