/* poseFeatures.js — MediaPipe 손 랜드마크 21개를 자세 데이터와 같은 어휘로 바꾼다.
 *
 * 일러스트를 그리는 모델과 판정하는 모델을 하나로 맞추기 위해, 랜드마크에서
 * 바로 '펴진 손가락 / 방향 / 수향'을 뽑는다. 좌표 자체를 비교하지 않으므로
 * 손 크기·카메라 거리·화면 위치에 흔들리지 않는다.
 *
 * 랜드마크 번호는 MediaPipe Hands 규약을 따른다.
 *   0 손목 · 1~4 엄지 · 5~8 검지 · 9~12 중지 · 13~16 약지 · 17~20 새끼
 */

export const LM = {
  WRIST: 0,
  thumb:  [1, 2, 3, 4],
  index:  [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring:   [13, 14, 15, 16],
  pinky:  [17, 18, 19, 20]
};
export const FINGERS = ['index', 'middle', 'ring', 'pinky'];

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) });
const len = v => Math.hypot(v.x, v.y, v.z);
const len2 = v => Math.hypot(v.x, v.y);
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x
});

/** 폄 정도 0~1. 마디를 모두 편 길이 대비 뿌리에서 끝까지의 직선 거리. */
export function extension(lms, name) {
  const idx = LM[name];
  const pts = idx.map(i => lms[i]);
  let bone = 0;
  for (let i = 0; i < pts.length - 1; i++) bone += len(sub(pts[i + 1], pts[i]));
  if (bone === 0) return 0;
  const direct = len(sub(pts[pts.length - 1], pts[0]));
  // 완전히 편 손가락도 직선 비율이 1에 못 미치므로 0.55~0.98 구간을 0~1로 편다
  return Math.min(1, Math.max(0, (direct / bone - 0.55) / 0.43));
}

/** 손 전체 크기 — 손목에서 중지 뿌리까지. 거리 정규화에 쓴다. */
export const handScale = lms => len2(sub(lms[LM.middle[0]], lms[LM.WRIST])) || 1e-6;

/**
 * 펴진 손가락이 가리키는 방향. 화면 좌표 기준 각도(도)로, 0이 위, 90이 오른쪽.
 * 펴진 손가락이 없으면 손목에서 중지 뿌리로 향하는 손 전체의 방향을 쓴다.
 */
export function pointingAngle(lms, extended) {
  let vx = 0, vy = 0, n = 0;
  for (const f of extended) {
    const [mcp, , , tip] = LM[f];
    vx += lms[tip].x - lms[mcp].x;
    vy += lms[tip].y - lms[mcp].y;
    n++;
  }
  if (!n) {
    vx = lms[LM.middle[0]].x - lms[LM.WRIST].x;
    vy = lms[LM.middle[0]].y - lms[LM.WRIST].y;
  }
  return (Math.atan2(vx, -vy) * 180) / Math.PI;
}

/**
 * 수향. 손바닥 평면의 법선이 카메라를 향하는 정도와, 손이 모로 섰는지를 본다.
 * @returns {{facing:'palm'|'back'|'side', normalZ:number, edgeOn:number}}
 */
export function palmFacing(lms, handedness = 'Right') {
  const w = lms[LM.WRIST];
  const a = sub(lms[LM.index[0]], w);
  const b = sub(lms[LM.pinky[0]], w);
  const n = cross(a, b);
  const nl = len(n) || 1e-6;
  // 오른손과 왼손은 법선 부호가 반대다
  const sign = handedness === 'Left' ? -1 : 1;
  const normalZ = (sign * n.z) / nl;

  // 법선이 카메라 축과 직각에 가까우면 손이 모로 선 것이다.
  // 손 크기 비율이 아니라 법선만 보므로 사람마다 다른 손 비례에 흔들리지 않는다.
  const edgeOn = 1 - Math.abs(normalZ);

  let facing;
  if (Math.abs(normalZ) < 0.45) facing = 'side';
  else facing = normalZ > 0 ? 'palm' : 'back';
  return { facing, normalZ, edgeOn };
}

/** 자세 하나를 요약한 특징. matcher가 이것만 본다. */
export function describe(lms, handedness = 'Right', mirrored = true) {
  const pts = mirrored ? lms.map(p => ({ ...p, x: 1 - p.x })) : lms;
  const hd = mirrored ? (handedness === 'Left' ? 'Right' : 'Left') : handedness;

  const ext = {};
  for (const f of FINGERS) ext[f] = extension(pts, f);
  const thumbExt = extension(pts, 'thumb');

  const extended = FINGERS.filter(f => ext[f] > 0.6);
  const { facing, normalZ, edgeOn } = palmFacing(pts, hd);

  return {
    extension: ext,
    thumbExtension: thumbExt,
    extended,
    angle: pointingAngle(pts, extended),
    facing, normalZ, edgeOn,
    // 검지와 중지가 벌어진 각도(도) — ㄷ와 ㅌ처럼 벌림으로만 갈리는 쌍을 가른다.
    // 끝점 거리가 아니라 각도를 쓴다. 손가락 뿌리 간격은 사람마다 다르기 때문이다.
    spread: fingerSpread(pts),
    // 엄지 끝과 검지 끝 사이 거리 — ㅇ·ㅎ의 고리를 가른다
    pinch: len2(sub(pts[LM.thumb[3]], pts[LM.index[3]])) / handScale(pts),
    // 펴진 손가락이 화면에서 보이는 길이(손 크기 대비). 카메라를 향해 가리키면 짧아진다('너')
    reach2d: extended.length
      ? extended.reduce((s, f) => s + len2(sub(pts[LM[f][3]], pts[LM[f][0]])), 0) / extended.length / handScale(pts)
      : 0,
    centroid: {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length
    },
    scale: handScale(pts)
  };
}

/** 검지와 중지가 이루는 각(도). 붙이면 0에 가깝고 벌리면 커진다. */
export function fingerSpread(lms) {
  const dirOf = name => {
    const [mcp, , , tip] = LM[name];
    return { x: lms[tip].x - lms[mcp].x, y: lms[tip].y - lms[mcp].y };
  };
  const a = dirOf('index'), b = dirOf('middle');
  const na = len2(a), nb = len2(b);
  if (na < 1e-6 || nb < 1e-6) return 0;
  const cos = Math.min(1, Math.max(-1, (a.x * b.x + a.y * b.y) / (na * nb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** 각도를 지문자 데이터의 방향 이름으로 */
export function angleToDir(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d < 45 || d >= 315) return 'up';
  if (d < 135) return 'right';
  if (d < 225) return 'down';
  return 'left';
}
