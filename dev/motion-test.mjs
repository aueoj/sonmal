/* 자유 모드가 낱말을 서로 가르는지 본다.
   읽을 수 있는 낱말마다 사전 원문대로(손모양, 높이, 손끝 방향, 움직임) 합성 손을 만들어
   실제 읽기 코드(signReader)에 흘려 넣고, 그 낱말 하나로 읽히는지 센다.
   움직임 방향 데이터(motion.js)가 후보 묶음을 갈랐는지 확인하는 점검이다.
   합성 손은 실제 카메라가 아니다. 사람마다 다른 동작 폭과 떨림은 재지 못한다. */
import { WORD_SIGNS } from '../js/words.js';
import { landmarksFor } from '../js/mockHand.js';
import { describe } from '../js/poseFeatures.js';
import { ZONE_AT } from '../js/matcher.js';
import { createSignReader, readableSigns } from '../js/signReader.js';

const FACE = { y: 0.25, h: 0.16, x: 0.5, w: 0.14 };
const ALL = ['index', 'middle', 'ring', 'pinky'];
const SHRINK = 0.4;                      // 손 크기를 얼굴 높이와 비슷하게(실제 몸 비례에 가깝게)

/** 원래 좌표의 랜드마크. 중심을 (mx, my) 에 둔다. mx 는 거울 좌표(describe 뒤) 기준 */
function hand(fingers, c, { mx, my, scale = 1, turn = 0 }) {
  const dir = { down: 'down', side: 'right' }[c.point] ?? 'up';
  const lm = landmarksFor({ fingers, dir, view: 'palm', thumb: c.thumb === 'up' ? 'up' : 'in', special: c.ring ? 'circle' : null }, 0);
  if (c.point === 'out') for (const [m, ...r] of [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]])
    if (fingers.includes(ALL[(m - 5) / 4])) for (const i of r) { lm[i].x = lm[m].x + (lm[i].x - lm[m].x) * 0.3; lm[i].y = lm[m].y + (lm[i].y - lm[m].y) * 0.3; }
  const cx = lm.reduce((s, p) => s + p.x, 0) / lm.length, cy = lm.reduce((s, p) => s + p.y, 0) / lm.length;
  const k = SHRINK * scale, t = turn * Math.PI / 180;
  return lm.map(p => {
    let x = (p.x - cx) * k, y = (p.y - cy) * k;
    [x, y] = [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];
    return { x: (1 - mx) + x, y: my + y, z: (p.z ?? 0) * k };
  });
}

const zoneY = z => FACE.y + (ZONE_AT[z] ?? ZONE_AT.front) * FACE.h;
const spotX = s => FACE.x + (s === 'side' ? 0.8 * FACE.w : 0);

/** 한 동작의 프레임들. p 는 0 → 1 로 움직임이 진행된 정도 */
function frame(c, p, side = 1) {
  const S = 0.44 * SHRINK;               // 손 크기(손목에서 중지 뿌리)
  const A = 0.6 * S;
  let mx = spotX(c.spot), my = zoneY(c.zone), scale = 1, turn = 0, gap = 1.4 * S, dy2 = 0, sway = 0;
  const mv = c.move;
  // 방향이 없는 둘째 동작은 옆으로 옮겨 가기만 한다(앞 동작 자리에서 떠나야 다음 동작으로 친다)
  const off = { up: [0, -1], down: [0, 1], side: [side, 0], cross: [-side, 0], travel: [side, 0] }[mv];
  const t = Math.min(1, p / 0.67);
  if (off) { mx += off[0] * A * (-0.25 + t); my += off[1] * A * (-0.25 + t); }
  if (mv === 'sway') sway = Math.sin(p * Math.PI * 4) * 0.5 * S;
  if (mv === 'bob') my += Math.sin(p * Math.PI * 4) * 0.5 * S;
  if (mv === 'out') scale = 1 + 0.3 * t;
  if (mv === 'back') scale = 1 - 0.22 * t;
  if (mv === 'turn') turn = 60 * t;
  if (mv === 'together') gap = (2.6 - 1.9 * t) * S;
  if (mv === 'apart') gap = (1.0 + 1.6 * t) * S;
  if (mv === 'swap') { const h = 0.9 * S * (1 - 2 * t); my -= h; dy2 = 2 * h; }
  const dom = describe(hand(c.fingers ?? ALL, c, { mx: mx + sway, my, scale, turn }), 'Right', true);
  if ((c.hands ?? 1) === 1) return [dom];
  // 반대 손: '두 손 함께'만 따라 움직이고, 그 밖에는 움직이기 전 자리에 남는다
  const still = !(c.moving === 'both') && mv && !['together', 'swap', 'apart', 'bob'].includes(mv);
  const ox = still ? spotX(c.spot) : mx + sway, oy = still ? zoneY(c.zone) : my + dy2;
  const otherC = { ...c, point: c.point, move: undefined };
  const other = describe(hand(c.other ?? c.fingers ?? ALL, otherC, { mx: ox - side * gap, my: oy }), 'Left', true);
  return [dom, other];
}

function perform(word, reader) {
  const w = WORD_SIGNS.find(x => x.word === word);
  let now = 1000;
  const tick = feats => { reader.feed(feats, FACE, now); now += 60; };
  w.check.forEach((c, k) => { for (let i = 0; i < 22; i++) tick(frame(k ? { ...c, move: c.move ?? 'travel' } : { ...c, move: undefined }, Math.min(1, i / 14))); });
  for (let i = 0; i < 25; i++) tick([]);
}

if (process.env.MOTION_DEBUG) {
  const { scoreCheck } = await import('../js/matcher.js');
  const w = WORD_SIGNS.find(x => x.word === process.env.MOTION_DEBUG);
  console.log(w.word, JSON.stringify(w.check));
  w.check.forEach((c, k) => { for (const i of [0, 7, 14]) {
    const f = frame(k ? { ...c, move: c.move ?? 'travel' } : c, i / 14);
    const r = scoreCheck(f, c, FACE);
    console.log(`  ${k}단계 p${(i / 14).toFixed(1)} 손 ${f.length} ok ${r.ok} ${r.hint ?? ''} 중심(${f[0].centroid.x.toFixed(3)}, ${f[0].centroid.y.toFixed(3)}) 크기 ${f[0].scale.toFixed(3)} 폄 ${Object.values(f[0].extension).map(v => v.toFixed(2))} 각 ${f[0].angle.toFixed(0)} 길이 ${f[0].reach2d.toFixed(2)}`);
  } });
  process.exit(0);
}
const { ok } = readableSigns(WORD_SIGNS);
let got = null;
const TRACE = process.env.MOTION_TRACE;
let lastLog = '';
const reader = createSignReader({ signs: WORD_SIGNS, side: () => 1,
  debug: TRACE ? (w, k, ok, moved, why, m) => { if (w !== TRACE) return; const l = `${k}단계 ok=${ok} moved=${moved} ${why ?? ''} ${m ? `maxD ${m.maxD.toFixed(2)} v(${m.vx.toFixed(2)},${m.vy.toFixed(2)}) x[${m.minX.toFixed(2)},${m.maxX.toFixed(2)}] other ${m.otherMax.toFixed(2)}` : ''}`; console.log("   ", l); lastLog = l; } : undefined,
  onWord: x => { said.push([x]); if (TRACE) console.log("   >>> 읽음", x); }, onAmbiguous: xs => { said.push(xs); if (TRACE) console.log("   >>> 후보", xs); } });
let said = [];
const unique = [], ambiguous = [], wrong = [];
for (const w of ok) {
  if (TRACE && w.word !== TRACE) continue;
  said = []; reader.reset(); perform(w.word, reader);
  got = said[0] ?? null;
  if (said.length > 1) wrong.push(`${w.word} → 말을 ${said.length}번 함: ${said.map(x => x.join('/')).join(', ')}`);
  if (got?.length === 1 && got[0] === w.word) unique.push(w.word);
  else if (got?.includes(w.word)) ambiguous.push(`${w.word} → ${got.join('/')}`);
  else wrong.push(`${w.word} → ${got ? got.join('/') : '읽지 못함'}`);
}
console.log(`읽는 낱말 ${ok.length}개: 하나로 맞게 ${unique.length}, 후보로 ${ambiguous.length}, 틀리거나 못 읽음 ${wrong.length}`);
for (const s of ambiguous) console.log('  ? ' + s);
for (const s of wrong) console.log('  ✕ ' + s);
// 방향 데이터로 가르려 한 묶음은 모두 하나로 읽혀야 한다
const SPLIT = ['감사합니다', '없다', '오늘', '그만', '도와주세요', '사랑', '칭찬하다', '너', '여기', '무엇', '이름', '왜', '하양',
  '만나다', '수어', '보다', '가다', '물고기', '내일', '어제', '노랑', '듣다', '빨강', '파랑', '검정'];
const notSplit = SPLIT.filter(x => !unique.includes(x));
if (notSplit.length) console.log('갈리지 않은 낱말: ' + notSplit.join(', '));
process.exit(wrong.length || notSplit.length ? 1 : 0);
