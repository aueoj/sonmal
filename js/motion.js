/* motion.js — 낱말의 한 동작에서 다음 동작으로 손이 어떻게 옮겨 갔는지 본다.
 *
 * 손모양과 높이만으로는 가를 수 없는 낱말이 많다. '내일'과 '어제'는 같은 검지를 같은 자리에서
 * 시작해 앞으로 내미느냐 어깨 너머로 넘기느냐만 다르다. 사전 원문의 움직임을 판정 힌트로 옮긴다.
 *
 * 판정 힌트(wordBank 의 check, 둘째 동작부터)
 *   move    앞 동작을 끝낸 자리에서 이 동작까지 손이 간 길
 *           up, down       위, 아래
 *           side, cross    쓰는 손 쪽 옆, 반대쪽 옆 (오른손잡이면 오른쪽, 왼쪽)
 *           out, back      카메라 쪽으로 내밂, 몸 뒤로 넘김 (손이 커지고 작아지는 것으로 잰다)
 *           together       두 손이 가운데로 모인다
 *           swap           두 손의 위아래가 바뀐다
 *           sway           좌우로 오간다
 *           bob            위아래로 오간다
 *           apart          두 손이 양옆으로 벌어진다
 *           turn           손이 제자리에서 돈다
 *   moving  두 손 낱말에서 one 이면 반대 손은 그대로, both 면 두 손이 함께 움직인다
 *
 * 좌표는 describe 가 거울처럼 뒤집은 화면 좌표다. 쓰는 손 쪽은 오른손잡이면 +x, 왼손잡이면 -x 다.
 * 거리는 손 크기(손목에서 중지 뿌리)로 나눠 카메라와 떨어진 거리에 흔들리지 않게 한다.
 * 문턱은 몸 비례로 어림했고 실제 카메라로는 아직 맞춰 보지 못했다. 특히 out/back 은 손 크기 변화로
 * 깊이를 어림하는 것이라 평면 방향보다 덜 믿을 만하다.
 */

const DIR_T = 0.35;        // 한쪽으로 이만큼(손 크기 대비) 가야 그 방향으로 친다
const OUT_RATIO = 1.12, BACK_RATIO = 0.88;
const TOGETHER_RATIO = 0.75, APART_RATIO = 1.33;
const SWAY_T = 0.2;
const TURN_DEG = 30;
const STILL_T = 0.35;      // 반대 손이 이보다 덜 움직였으면 그대로 둔 것

const angleGap = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

/** 쓰는 손: 손이 둘이면 쓰는 손 쪽에 있는 손 */
export function dominant(feats, side) {
  if (feats.length < 2) return { dom: feats[0], other: null };
  const [a, b] = [...feats].sort((p, q) => q.centroid.x * side - p.centroid.x * side);
  return { dom: a, other: b };
}

/** 한 동작을 끝낸 자리. 다음 동작의 움직임을 여기서부터 잰다 */
export function motionStart(feats, side) {
  const { dom, other } = dominant(feats, side);
  if (!dom) return null;
  return {
    from: {
      c: dom.centroid, scale: dom.scale || 1, angle: dom.angle,
      c2: other?.centroid ?? null,
      gap: other ? Math.hypot(dom.centroid.x - other.centroid.x, dom.centroid.y - other.centroid.y) : 0
    },
    maxD: 0, vx: 0, vy: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, osc: { y: { ext: 0, dir: 0, rev: 0 } }, sMax: 1, sMin: 1, gMin: 1, gMax: 1, above: false, below: false, turn: 0, otherMax: 0
  };
}

/** 프레임마다 쌓는다. 가장 멀리 간 순간의 방향을 그 동작의 방향으로 본다(두 번 대는 동작은 돌아오므로) */
export function motionFeed(acc, feats, side) {
  if (!acc || !feats.length) return acc;
  const { dom, other } = dominant(feats, side);
  const f = acc.from, s = f.scale;
  const dx = (dom.centroid.x - f.c.x) / s, dy = (dom.centroid.y - f.c.y) / s;
  const d = Math.hypot(dx, dy);
  if (d > acc.maxD) { acc.maxD = d; acc.vx = dx; acc.vy = dy; }
  acc.minX = Math.min(acc.minX, dx * side); acc.maxX = Math.max(acc.maxX, dx * side);
  acc.minY = Math.min(acc.minY, dy); acc.maxY = Math.max(acc.maxY, dy);
  // 위아래로 오감은 방향이 바뀐 횟수로 센다. 앞 동작과 높이가 다른 자리('비'는 얼굴에서 가슴으로)에서
  // 오르내려도, 내려가기만 하는 것과 가를 수 있다
  const o = acc.osc.y;
  if (o.dir >= 0 && dy > o.ext) { o.ext = dy; if (o.dir === 0 && dy > SWAY_T) o.dir = 1; }
  if (o.dir <= 0 && dy < o.ext) { o.ext = dy; if (o.dir === 0 && dy < -SWAY_T) o.dir = -1; }
  if (o.dir === 1 && o.ext - dy > SWAY_T) { o.rev++; o.dir = -1; o.ext = dy; }
  else if (o.dir === -1 && dy - o.ext > SWAY_T) { o.rev++; o.dir = 1; o.ext = dy; }
  const r = (dom.scale || s) / s;
  acc.sMax = Math.max(acc.sMax, r); acc.sMin = Math.min(acc.sMin, r);
  if (Number.isFinite(dom.angle) && Number.isFinite(f.angle)) acc.turn = Math.max(acc.turn, angleGap(dom.angle, f.angle));
  if (other && f.c2) {
    acc.otherMax = Math.max(acc.otherMax, Math.hypot(other.centroid.x - f.c2.x, other.centroid.y - f.c2.y) / s);
    const gap = Math.hypot(dom.centroid.x - other.centroid.x, dom.centroid.y - other.centroid.y);
    if (f.gap > 0) { acc.gMin = Math.min(acc.gMin, gap / f.gap); acc.gMax = Math.max(acc.gMax, gap / f.gap); }
    // 위아래 바꿈: 이 동작 동안 쓰는 손이 반대 손보다 위에 있던 때와 아래에 있던 때가 둘 다 있어야 한다
    const dyHands = (dom.centroid.y - other.centroid.y) / s;
    if (dyHands < -0.15) acc.above = true;
    if (dyHands > 0.15) acc.below = true;
  }
  return acc;
}

/** 손이 옮겨 갔다고 볼 만큼 움직였는가. 방향을 정하지 않은 동작은 거리만 본다 */
export const travelled = (acc, need) => (acc?.maxD ?? 0) >= need;

const SIDE_KO = side => (side > 0 ? '오른쪽' : '왼쪽');
const OTHER_KO = side => (side > 0 ? '왼손' : '오른손');

/** 사전 원문의 움직임과 맞는가. 맞으면 null, 아니면 짚어 줄 말 */
export function moveHint(check, acc, side) {
  if (!check?.move && !check?.moving) return null;
  if (!acc) return '앞 동작을 마친 자리에서 시작하세요';
  const { vx, vy } = acc;
  const horiz = Math.abs(vx) >= Math.abs(vy);
  const ok = {
    up: () => vy < -DIR_T && !horiz,
    down: () => vy > DIR_T && !horiz,
    // 한쪽으로 가는 것과 좌우로 오가는 것을 가른다: 반대쪽으로도 크게 갔으면 옆이 아니라 흔듦이다
    side: () => vx * side > DIR_T && horiz && acc.minX > -SWAY_T,
    cross: () => vx * side < -DIR_T && horiz && acc.maxX < SWAY_T,
    out: () => acc.sMax >= OUT_RATIO,
    back: () => acc.sMin <= BACK_RATIO,
    together: () => acc.gMin <= TOGETHER_RATIO,
    swap: () => acc.above && acc.below,
    sway: () => acc.maxX > SWAY_T && acc.minX < -SWAY_T,
    bob: () => acc.osc.y.rev >= 1,
    apart: () => acc.gMax >= APART_RATIO,
    turn: () => acc.turn >= TURN_DEG
  };
  const say = {
    up: '손을 위로 올리세요', down: '손을 아래로 내리세요',
    side: `손을 ${SIDE_KO(side)}으로 옮기세요`, cross: `손을 ${SIDE_KO(-side)}으로 옮기세요`,
    out: '손을 앞으로 내미세요', back: '손을 어깨 너머 뒤로 넘기세요',
    together: '두 손을 가운데로 모으세요', swap: '두 손의 위아래를 바꾸세요',
    sway: '손을 좌우로 움직이세요', bob: '손을 위아래로 움직이세요', apart: '두 손을 양옆으로 벌리세요',
    turn: '손을 제자리에서 돌리세요'
  };
  if (check.move && ok[check.move] && !ok[check.move]()) return say[check.move];
  if (check.moving === 'one' && acc.otherMax > STILL_T) return `${OTHER_KO(side)}은 그대로 두고 움직이세요`;
  if (check.moving === 'both' && acc.otherMax < STILL_T) return '두 손을 함께 움직이세요';
  return null;
}
