/* handRenderer.js — 손 자세 데이터로 손 일러스트 SVG를 그린다.
 *
 * 36자를 따로 작화하지 않고 손 하나를 각도로 구동한다. 선 굵기·비례·시점이
 * 전부 일치하고, 같은 표현을 인식기가 그대로 쓴다.
 *
 * 그림은 면을 채우고 테두리를 두르는 방식이다. 겹치는 손가락은 뒤에서 앞 순서로
 * 그려 각자의 테두리가 경계를 만든다.
 */

const VB = { w: 240, h: 300 };
const PIVOT = { x: 120, y: 206 };
const FINGERS = ['index', 'middle', 'ring', 'pinky'];

const RIG = {
  index:  { root: [100, 170], base: -8, len: [48, 28, 20], w: 20 },
  middle: { root: [122, 163], base: -1, len: [52, 30, 21], w: 21 },
  ring:   { root: [143, 168], base: 7,  len: [49, 28, 20], w: 20 },
  pinky:  { root: [161, 180], base: 17, len: [40, 24, 17], w: 17 },
  thumb:  { root: [92, 228],  base: -54, len: [44, 34],    w: 24 }
};

const BEND = [60, 70, 44];
const FORESHORTEN = 0.24;
const OUTLINE = 5.5;          // 테두리 두께(한쪽)
const SIDE_SQUEEZE = 0.56;    // 손날이 보일 때 손바닥이 좁아지는 비율

const DIR_ROT = { up: 0, right: 90, down: 180 };

const d2r = d => (d * Math.PI) / 180;
const P = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

function chain(rig, curl, spreadDeg, sign) {
  const pts = [rig.root.slice()];
  let ang = rig.base + spreadDeg, cum = 0;
  for (let i = 0; i < rig.len.length; i++) {
    const c = Math.min(1, Math.max(0, curl[i] ?? 0));
    cum = Math.min(1, cum + c / rig.len.length);
    ang += sign * BEND[i] * c;
    const L = rig.len[i] * (1 - FORESHORTEN * cum);
    const [px, py] = pts[pts.length - 1];
    pts.push([px + L * Math.sin(d2r(ang)), py - L * Math.cos(d2r(ang))]);
  }
  return pts;
}

/* 접은 손가락은 관절을 다 돌리지 않고 짧은 뭉치로 그린다.
   그래야 주먹이 소용돌이가 아니라 너클 덩어리로 읽힌다. */
function folded(rig, spreadDeg) {
  const total = rig.len.reduce((a, b) => a + b, 0);
  const ang = rig.base + spreadDeg + 58;
  const [x, y] = rig.root;
  const L = total * 0.34;
  return [[x, y], [x + L * Math.sin(d2r(ang)), y - L * Math.cos(d2r(ang))]];
}

function palmPath() {
  return 'M88 236 C82 208 82 184 90 170 C97 158 110 152 122 152 '
       + 'C135 152 148 156 156 164 C166 173 172 190 172 210 '
       + 'C172 234 164 254 154 264 C140 276 102 274 92 262 Z';
}
const wristPath = () => 'M98 250 L94 298 L162 298 L160 250 Z';

const creases = () => `<path class="sm-line" d="M101 212 C116 204 140 203 158 209"/>
  <path class="sm-line" d="M97 234 C113 227 138 226 155 232"/>`;

const knuckleDots = () => FINGERS.map(n => {
  const [x, y] = RIG[n].root;
  return `<circle class="sm-dot" cx="${x}" cy="${y + 9}" r="2.6"/>`;
}).join('');

/**
 * @param {object} pose jamoData의 자세 레코드
 * @param {{size?:number}} opts
 */
export function renderHand(pose, opts = {}) {
  const size = opts.size ?? 240;
  const ext = new Set(pose.fingers ?? []);
  const wide = pose.spreadWide ? 13 : 0;
  const side = pose.view === 'side';

  // 펴는 손가락이 여럿이면 가운데를 기준으로 벌린다
  const extList = FINGERS.filter(n => ext.has(n));
  const spreadOf = name => {
    if (!ext.has(name)) return 0;
    const i = extList.indexOf(name);
    const mid = (extList.length - 1) / 2;
    return (i - mid) * wide;
  };

  const geo = {};
  for (const name of FINGERS) {
    if (pose.special === 'circle' && name === 'index') {
      geo[name] = chain(RIG[name], [0.42, 0.5, 0.34], -16, -1);
      continue;
    }
    if (!ext.has(name)) { geo[name] = folded(RIG[name], 0); continue; }
    const curl = (pose.bent && name === 'index') ? [0, 0.85, 0.12] : [0.04, 0.05, 0.05];
    geo[name] = chain(RIG[name], curl, spreadOf(name), -1);
  }

  // 엄지
  const thumbSpec = {
    in:     { curl: [0.9, 0.72], spread: 36 },
    out:    { curl: [0.06, 0.06], spread: -32 },
    up:     { curl: [0.04, 0.04], spread: 30 },
    circle: { curl: [0.3, 0.34], spread: -4 }
  }[pose.thumb] ?? { curl: [0.9, 0.72], spread: 36 };

  let thumb = chain(RIG.thumb, thumbSpec.curl, thumbSpec.spread, 1);
  if (pose.special === 'circle') {
    const target = geo.index[geo.index.length - 1];
    const tip = thumb[thumb.length - 1];
    const dx = target[0] - tip[0], dy = target[1] - tip[1], n = thumb.length - 1;
    thumb = thumb.map(([x, y], i) => [x + dx * (i / n), y + dy * (i / n)]);
  }
  if (pose.special === 'thumbup') {
    thumb = chain({ ...RIG.thumb, len: [52, 38] }, [0.02, 0.02], 48, 1);
  }

  const digit = (pts, w) =>
    `<path class="sm-edge" d="${P(pts)}" stroke-width="${w + OUTLINE * 2}"/>` +
    `<path class="sm-skin" d="${P(pts)}" stroke-width="${w}"/>`;

  const body = [];
  body.push(`<path class="sm-fill" d="${wristPath()}"/>`);
  body.push(`<path class="sm-fill" d="${palmPath()}"/>`);

  // 뒤에서 앞으로 — 새끼손가락이 가장 멀다
  for (const name of ['pinky', 'ring', 'middle', 'index']) {
    body.push(digit(geo[name], RIG[name].w));
  }
  body.push(digit(thumb, RIG.thumb.w));

  // 손바닥 면을 다시 덮어 손가락 밑동의 테두리를 지우고, 그 위에 결을 올린다
  const detail = side ? '' : (pose.view === 'palm' ? creases() : knuckleDots());

  const squeeze = side ? ` translate(${PIVOT.x} 0) scale(${SIDE_SQUEEZE} 1) translate(${-PIVOT.x} 0)` : '';
  const rot = DIR_ROT[pose.dir] ?? 0;
  const rotAttr = rot ? `rotate(${rot} ${PIVOT.x} ${PIVOT.y})` : '';

  const motion = pose.motion
    ? `<path class="sm-motion" d="M168 286 L212 286"/>`
      + `<path class="sm-motion" d="M202 277 L213 286 L202 295"/>`
    : '';

  return `<svg class="sm-hand" viewBox="0 0 ${VB.w} ${VB.h}" width="${size}" height="${(size * VB.h) / VB.w}"
  role="img" aria-label="${pose.jamo} 지문자 손모양. ${pose.note}">
  <g transform="${rotAttr}${squeeze}">${body.join('')}${detail}</g>${motion}
</svg>`;
}

export const HAND_RIG = { RIG, BEND, FORESHORTEN, PIVOT, VB, FINGERS, DIR_ROT, OUTLINE };
