import assert from 'node:assert/strict';
import { getPose, MOTION_LETTERS } from '../js/jamoData.js';
import { detectLateralShift, scorePose } from '../js/matcher.js';
import { landmarksFor } from '../js/mockHand.js';
import { describe } from '../js/poseFeatures.js';
import { jamoArt } from '../js/illustrations.js';
for (const p of MOTION_LETTERS) {
  const base = getPose(p.base);
  assert.equal(p.hands, 1);
  for (const key of ['fingers','dir','view','thumb','special','spreadWide']) assert.deepEqual(p[key],base[key]);
  assert.ok(p.motion);
  assert.ok(!jamoArt(p.jamo).includes('sheet-3'));
}
for (const fps of [15,30,60]) {
  const trail = Array.from({length:Math.ceil(fps*.6)},(_,i)=>({x:.3+.2*i/(Math.ceil(fps*.6)-1),t:i*1000/fps}));
  assert.ok(detectLateralShift(trail,.4)>=.35);
  assert.equal(detectLateralShift(trail.map(p=>({...p,x:.3})),.4),0);
  assert.ok(detectLateralShift(trail.map((p,i)=>({...p,x:.3+(i%2)*.005})),.4)<.35);
  assert.equal(detectLateralShift(trail,.4,3000),0);
}
for(const [want,wrong] of [['ㄹ','ㅊ'],['ㅊ','ㄹ']]) {
  const feat=describe(landmarksFor(getPose(want),0),'Right',false);
  assert.ok(scorePose(feat,getPose(want)).score>scorePose(feat,getPose(wrong)).score+.2);
}
console.log('쌍자음 5개 한 손 기본 수형 · 정지/떨림/오래된 이동 거부 · ㄹ/ㅊ 구분 통과');
