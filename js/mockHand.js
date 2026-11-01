/* mockHand.js — 자세 레코드에서 합성 랜드마크를 만든다.
 *
 * 카메라 없이 전체 인식 파이프라인(랜드마크 → 특징 → 판정 → 피드백)을
 * 그대로 돌려보기 위한 장치다. 개발용이며 ?mock=1 일 때만 쓰인다.
 */

const BONES = {
  index:  [0.30, 0.18, 0.13],
  middle: [0.33, 0.19, 0.14],
  ring:   [0.30, 0.18, 0.13],
  pinky:  [0.24, 0.15, 0.11],
  thumb:  [0.24, 0.19, 0.15]
};
const MCP = {
  index:  [-0.24, 0.42, 0], middle: [-0.06, 0.50, 0],
  ring:   [0.12, 0.45, 0],  pinky:  [0.28, 0.34, 0],
  thumb:  [-0.40, -0.18, 0.06]
};
const BASE_TILT = { index: -6, middle: -1, ring: 6, pinky: 14, thumb: -46 };
const WRIST = [0, -0.55, 0];
const CURL_BUDGET = [92, 96, 68];
const d2r = d => (d * Math.PI) / 180;

const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const rotZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

function digit(name, curls, spreadDeg) {
  const bones = BONES[name];
  const out = [MCP[name].slice()];
  let acc = 0;
  for (let i = 0; i < bones.length; i++) {
    acc += d2r(CURL_BUDGET[i] ?? 60) * (curls[i] ?? 0);
    // 손가락은 손바닥 쪽(-Z)으로 말린다
    let v = rotX([0, bones[i], 0], -acc);
    v = rotZ(v, d2r(BASE_TILT[name] + spreadDeg));
    out.push(add(out[out.length - 1], v));
  }
  return out;
}

const VIEW_Y = { palm: 0, back: 180, side: 86 };
const DIR_Z  = { up: 0, right: -90, down: 180 };

/** @returns {Array<{x:number,y:number,z:number}>} MediaPipe 규약 순서의 랜드마크 21개 */
export function landmarksFor(pose, jitter = 0) {
  const ext = new Set(pose.fingers ?? []);
  const wide = pose.spreadWide ? 24 : 2;
  const extList = ['index', 'middle', 'ring', 'pinky'].filter(f => ext.has(f));

  const parts = { thumb: null, index: null, middle: null, ring: null, pinky: null };
  for (const name of ['index', 'middle', 'ring', 'pinky']) {
    const i = extList.indexOf(name);
    const spread = i < 0 ? 0 : (i - (extList.length - 1) / 2) * wide;
    let curls;
    if (pose.special === 'circle' && name === 'index') curls = [0.45, 0.5, 0.35];
    else if (ext.has(name)) curls = pose.bent && name === 'index' ? [0, 0.9, 0.15] : [0.03, 0.04, 0.04];
    else curls = [0.95, 0.95, 0.85];
    parts[name] = digit(name, curls, spread);
  }
  const thumbCurl = pose.thumb === 'in' ? [0.75, 0.7, 0.5]
    : pose.thumb === 'circle' ? [0.4, 0.45, 0.3] : [0.05, 0.06, 0.06];
  const thumbSpread = pose.thumb === 'out' ? -26 : pose.thumb === 'up' ? 30 : 24;
  parts.thumb = digit('thumb', thumbCurl, thumbSpread);

  // 고리를 만드는 자모는 엄지 끝을 검지 끝에 붙인다. 일러스트와 같은 처리다.
  if (pose.special === 'circle') {
    const tip = parts.thumb[parts.thumb.length - 1];
    const target = parts.index[parts.index.length - 1];
    const d = [target[0] - tip[0], target[1] - tip[1], target[2] - tip[2]];
    const n = parts.thumb.length - 1;
    parts.thumb = parts.thumb.map((p, i) => [p[0] + d[0] * (i / n), p[1] + d[1] * (i / n), p[2] + d[2] * (i / n)]);
  }

  const flat = [WRIST, ...parts.thumb, ...parts.index, ...parts.middle, ...parts.ring, ...parts.pinky];

  const ry = d2r(VIEW_Y[pose.view] ?? 0);
  const rz = d2r(DIR_Z[pose.dir] ?? 0);
  const j = () => (jitter ? (Math.random() - 0.5) * jitter : 0);

  return flat.map(p => {
    const q = rotZ(rotY(p, ry), rz);
    return {
      x: 0.5 + q[0] * 0.42 + j(),
      y: 0.5 - q[1] * 0.42 + j(),
      z: -q[2] * 0.42 + j()
    };
  });
}
