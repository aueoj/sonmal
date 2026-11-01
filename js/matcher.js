/* matcher.js — 특징과 자세 데이터를 맞춰 보고, 어긋난 곳을 수어의 말로 돌려준다.
 *
 * 되돌려 주는 피드백은 '다시 해보세요'가 아니라 수형·수향·수위·수동 중
 * 무엇이 어긋났는지를 짚는다. 문화체육관광부 수어 안내가 설명하는 네 요소다.
 */

import { FINGERS, angleToDir } from './poseFeatures.js';

const DIR_DEG = { up: 0, right: 90, down: 180, left: 270 };
const DIR_KO = { up: '위', right: '옆', down: '아래', left: '반대쪽' };
const FINGER_KO = { index: '검지', middle: '중지', ring: '약지', pinky: '새끼손가락' };
const VIEW_KO = { palm: '손바닥이 보이게', back: '손등이 보이게', side: '손날이 보이게' };

/** 두 각도 사이의 원형 거리(0~180도) */
const angleGap = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

/**
 * @param {object} feat poseFeatures.describe 결과
 * @param {object} pose jamoData 자세 레코드
 * @returns {{score:number, parts:object, hint:?string, hintKind:?string}}
 */
export function scorePose(feat, pose) {
  const want = new Set(pose.fingers ?? []);

  // 수형 — 펴야 할 손가락은 펴고, 접어야 할 손가락은 접었는가
  let shape = 0, worst = null, worstGap = 0;
  for (const f of FINGERS) {
    // 꺾어 펴는 자모(ㄱ)와 고리를 만드는 자모(ㅇ·ㅎ)의 검지는
    // 곧게 편 것도 접은 것도 아닌 중간값이 정답이다
    const midIndex = f === 'index' && (pose.bent || pose.special === 'circle');
    const target = midIndex ? 0.5 : (want.has(f) ? 1 : 0);
    const got = feat.extension[f];
    const gap = Math.abs(target - got);
    shape += 1 - Math.min(1, gap / (midIndex ? 0.4 : 0.7));
    if (gap > worstGap) { worstGap = gap; worst = f; }
  }
  shape /= FINGERS.length;

  // 엄지 — 폄·접음·고리
  const thumbTarget = pose.thumb === 'in' ? 0.25 : pose.thumb === 'circle' ? 0.45 : 0.95;
  const thumbScore = 1 - Math.min(1, Math.abs(thumbTarget - feat.thumbExtension) / 0.55);

  // 수향
  const viewScore = feat.facing === pose.view ? 1 : (feat.facing === 'side' || pose.view === 'side' ? 0.35 : 0.1);

  // 수동(방향) — 주먹처럼 펴진 손가락이 없으면 방향을 따지지 않는다
  // 꺾은 손가락은 끝 방향이 흔들리므로 방향을 느슨하게 본다
  const hasDir = (pose.fingers ?? []).length > 0 && !pose.bent;
  const dirGap = hasDir ? angleGap(feat.angle, DIR_DEG[pose.dir] ?? 0) : 0;
  const dirScore = hasDir ? Math.max(0, 1 - dirGap / 75) : 1;

  // 벌림 — 검지와 중지를 둘 다 펴는 자모에서만 본다
  const bothUp = want.has('index') && want.has('middle');
  const spreadTarget = pose.spreadWide ? 26 : 4;      // 도
  const spreadScore = bothUp ? Math.max(0, 1 - Math.abs(feat.spread - spreadTarget) / 20) : 1;

  // 고리 — 엄지와 검지 끝이 붙었는가. ㅇ·ㅎ에서만 본다.
  const wantRing = pose.special === 'circle';
  const pinchScore = wantRing ? Math.max(0, 1 - Math.max(0, feat.pinch - 0.22) / 0.33)
                              : Math.min(1, 0.45 + feat.pinch);

  const score = 0.33 * shape + 0.12 * thumbScore + 0.17 * viewScore + 0.22 * dirScore + 0.10 * spreadScore + 0.09 * pinchScore;

  let hint = null, hintKind = null;
  if (wantRing && pinchScore < 0.6) {
    hint = '엄지와 검지 끝을 맞붙여 고리를 만드세요'; hintKind = '수형';
  } else if (hasDir && dirScore < 0.6) {
    hint = `손끝을 ${DIR_KO[pose.dir]}으로 향하게 하세요`; hintKind = '수동';
  } else if (viewScore < 0.6) {
    hint = `손을 돌려 ${VIEW_KO[pose.view]} 하세요`; hintKind = '수향';
  } else if (worst && worstGap > 0.35) {
    hint = (pose.bent && worst === 'index') ? '검지 둘째 마디를 직각으로 꺾으세요'
         : want.has(worst) ? `${FINGER_KO[worst]}를 끝까지 펴세요` : `${FINGER_KO[worst]}를 접으세요`;
    hintKind = '수형';
  } else if (bothUp && spreadScore < 0.55) {
    hint = pose.spreadWide ? '검지와 중지를 벌리세요' : '검지와 중지를 붙이세요'; hintKind = '수형';
  } else if (thumbScore < 0.6) {
    hint = pose.thumb === 'in' ? '엄지를 접으세요' : '엄지를 펴세요'; hintKind = '수형';
  }

  return {
    score,
    parts: { shape, thumb: thumbScore, view: viewScore, dir: dirScore, spread: spreadScore, pinch: pinchScore },
    hint, hintKind
  };
}

/** 모든 자모 중 가장 가까운 것 — 사용자가 다른 자모를 만들고 있을 때 알려준다. */
export function bestMatch(feat, poses) {
  let best = null;
  for (const p of poses) {
    const r = scorePose(feat, p);
    if (!best || r.score > best.score) best = { ...r, pose: p };
  }
  return best;
}

/**
 * 쌍자음 판정. 기본 자음 수형을 유지한 채 손이 옆으로 옮겨졌는지 본다.
 * 지문자 인식 연구가 쓰는 손 무게중심 이동 검출과 같은 방식이다.
 *
 * 창은 프레임 수가 아니라 시간으로 잡는다. 프레임 수로 잡으면 60fps 카메라와
 * 그보다 느린 환경에서 같은 코드가 서로 다른 길이의 움직임을 보게 된다.
 * @param {Array<{x:number, t:number}>} trail 손 무게중심의 x와 시각(ms)
 */
export const MOTION_WINDOW_MS = 700;

export function detectLateralShift(trail, scale, now = trail.at(-1)?.t ?? 0) {
  const win = trail.filter(p => now - p.t <= MOTION_WINDOW_MS);
  if (win.length < 4) return 0;
  const xs = win.map(p => p.x);
  return (Math.max(...xs) - Math.min(...xs)) / (scale || 1);
}

export const PARAM_NAMES = { 수형: '손 모양', 수향: '손바닥 방향', 수위: '손 위치', 수동: '손 움직임' };
export { angleToDir };
