/* 낱말 판정이 아무 동작이나 통과시키지 않는지 본다.
   단계마다 맞는 손모양은 통과하고, 틀린 손모양(손가락, 손 수, 높이)은 걸려야 한다. */
import { WORD_BANK } from '../js/wordBank.js';
import { landmarksFor } from '../js/mockHand.js';
import { describe } from '../js/poseFeatures.js';
import { scoreCheck, ZONE_AT } from '../js/matcher.js';

const ALL = ['index', 'middle', 'ring', 'pinky'];
/* 앱의 모의 입력과 같은 얼굴 자리. 손은 그 높이의 보통 자리(ZONE_AT)에 둔다. */
const FACE = { y: 0.2, h: 0.16 };
const at = zone => FACE.y + (zone === 'below' ? 5.0 : (ZONE_AT[zone] ?? ZONE_AT.front)) * FACE.h;
const hand = (fingers, { ring = false, thumb = 'in', zone, point } = {}) => {
  const dir = { down: 'down', side: 'right' }[point] ?? 'up';
  const lm = landmarksFor({ fingers, dir, view: 'palm', thumb, special: ring ? 'circle' : null }, 0);
  // 손끝이 앞(카메라)을 향하면 펴진 손가락이 화면에서 짧아진다
  if (point === 'out') for (const [m, ...r] of [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]])
    if (fingers.includes(['index', 'middle', 'ring', 'pinky'][(m - 5) / 4]))
      for (const i of r) { lm[i].x = lm[m].x + (lm[i].x - lm[m].x) * 0.3; lm[i].y = lm[m].y + (lm[i].y - lm[m].y) * 0.3; }
  const cy = lm.reduce((s, p) => s + p.y, 0) / lm.length;
  for (const p of lm) p.y += at(zone) - cy;
  return describe(lm, 'Right', true);
};
const right = c => {
  const opt = { ring: c.ring, thumb: c.thumb === 'up' ? 'up' : 'in', zone: c.zone, point: c.point };
  const h = hand(c.fingers ?? ALL, opt);
  if ((c.hands ?? 1) === 1) return [h];
  return [h, c.other ? hand(c.other, { zone: c.zone }) : h];
};

/* 얼굴이 보일 때와 안 보일 때(화면 비율로 어림) 둘 다 시험한다 */
for (const [label, face] of [['얼굴 기준', FACE], ['얼굴 없음', null]]) {
console.log(`── ${label} ──`);

var pass = 0, missed = [], falsePass = [];
for (const w of WORD_BANK.filter(x => x.status === 'ok')) {
  w.check.forEach((c, i) => {
    const tag = `${w.word} ${i + 1}단계`;
    if (scoreCheck(right(c), c, face).ok) pass++; else missed.push(tag + ' ← 맞게 했는데 걸림: ' + scoreCheck(right(c), c, face).hint);
    // 틀린 것들
    const wrongs = [];
    if (c.fingers) {
      const other = c.fingers.length >= 3 ? [] : ALL;            // 펴야 할 것을 접거나, 접어야 할 것을 편다
      wrongs.push(['손가락', Array(c.hands ?? 1).fill(hand(other, { zone: c.zone }))]);
    }
    if ((c.hands ?? 1) === 2) wrongs.push(['손 하나', right(c).slice(0, 1)]);
    // 두 손 낱말: 한 손만 맞고 다른 손은 엉뚱하면 걸려야 한다
    if ((c.hands ?? 1) === 2 && c.fingers) {
      const want2 = c.other ?? c.fingers;
      const wrong2 = want2.length >= 3 ? [] : ALL;
      wrongs.push(['다른 손', [right(c)[0], hand(wrong2, { zone: c.zone })]]);
    }
    if (c.zone === 'face' || c.zone === 'chin') wrongs.push(['배 높이', right({ ...c, zone: 'belly' })]);
    if (c.zone === 'belly') wrongs.push(['얼굴 높이', right({ ...c, zone: 'face' })]);
    // 가슴 높이는 얼굴이 보일 때만 본다
    if (face && c.zone === 'chest') {
      wrongs.push(['얼굴 높이', right({ ...c, zone: 'face' })]);
      wrongs.push(['무릎 높이', right({ ...c, zone: 'below' })]);
    }
    for (const [why, feats] of wrongs) if (scoreCheck(feats, c, face).ok) falsePass.push(`${tag} ← ${why} 틀렸는데 통과`);
  });
}
// 되풀이 막기: 주먹을 위아래로 포갠 '만들다'는 위 주먹이 목 가까이 와도 가슴 동작이다
if (face) {
  const fistAt = u => { const lm = landmarksFor({ fingers: [], dir: 'up', view: 'palm', thumb: 'in' }, 0);
    const cy = lm.reduce((s, p) => s + p.y, 0) / lm.length;
    for (const p of lm) p.y += FACE.y + u * FACE.h - cy; return describe(lm, 'Right', true); };
  for (const [top, bot] of [[0.5, 1.0], [3.6, 4.1]]) {
    const r = scoreCheck([fistAt(top), fistAt(bot)], { hands: 2, fingers: [], zone: 'chest' }, face);
    if (r.ok) pass++; else missed.push(`만들다 포갠 주먹(${top}, ${bot}) ← 맞게 했는데 걸림: ${r.hint}`);
  }
}
console.log(`맞게 한 단계 통과 ${pass}개`);
for (const s of missed) console.log('  ✕ ' + s);
for (const s of falsePass) console.log('  ✕ ' + s);
if (!missed.length && !falsePass.length) console.log('틀린 손모양, 손 수, 높이는 모두 걸렸다');
if (missed.length || falsePass.length) process.exit(1);
}

/* 손가락 허용 범위. 코에 댄 주먹('좋아요')은 옆에서 보여 MediaPipe 가 가려진 손가락을
   반쯤 편 것으로 어림한다. 느슨한 주먹은 통과하고, 손가락 하나라도 분명히 틀리면 걸려야 한다.
   예전 판정은 느슨한 주먹(0.60)을 검지 하나 편 틀린 손(0.70)보다 멀게 보았다. */
{
  const F = ['index', 'middle', 'ring', 'pinky'];
  const feat = (e, zone) => ({ extension: Object.fromEntries(F.map((f, i) => [f, e[i]])), thumbExtension: 0.5, pinch: 1,
    centroid: { x: 0.5, y: at(zone) }, scale: 0.1 });
  const bad = [];
  const good = WORD_BANK.find(w => w.word === '좋아요').check[0];
  for (const e of [[0.3, 0.3, 0.3, 0.3], [0.4, 0.35, 0.35, 0.3]])
    if (!scoreCheck([feat(e, good.zone)], good, FACE).ok) bad.push(`좋아요 느슨한 주먹 [${e}] ← 맞게 했는데 걸림`);
  let n = 0;
  for (const w of WORD_BANK) for (const c of w.check ?? []) {
    if (!c.fingers || (c.hands ?? 1) !== 1) continue;
    for (let i = 0; i < 4; i++) {
      const e = F.map(f => (c.fingers.includes(f) ? 0.95 : 0.05)); e[i] = e[i] > 0.5 ? 0.05 : 0.95; n++;
      if (scoreCheck([feat(e, c.zone)], c, FACE).ok) bad.push(`${w.word} ${F[i]} 하나 틀렸는데 통과`);
    }
  }
  console.log(`── 손가락 허용 범위 ── 손가락 하나 틀린 경우 ${n}개`);
  for (const s of bad) console.log('  ✕ ' + s);
  if (bad.length) process.exit(1);
  console.log('느슨한 주먹은 통과하고, 손가락 하나 틀린 것은 모두 걸렸다');
}

/* 얼굴 가로 자리. '좋아요'(코 앞 주먹)와 '자다'(뺨 옆 주먹)는 이것만 다르다 */
{
  const F = { y: 0.2, h: 0.16, x: 0.5, w: 0.14 };
  const fist = dx => ({ extension: { index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1 }, thumbExtension: 0.5, pinch: 1,
    centroid: { x: F.x + dx * F.w, y: F.y + ZONE_AT.face * F.h }, scale: 0.1 });
  const good = WORD_BANK.find(w => w.word === '좋아요').check[0];
  const sleep = WORD_BANK.find(w => w.word === '자다').check[0];
  const rows = [
    ['좋아요 코 앞', good, 0.1, true], ['좋아요 뺨 옆', good, 0.8, false],
    ['자다 뺨 옆', sleep, 0.8, true], ['자다 왼뺨 옆', sleep, -0.8, true], ['자다 코 앞', sleep, 0.1, false],
    ['얼굴 없으면 자리를 보지 않는다', good, 0.8, true, null]
  ];
  const bad = rows.filter(([, c, dx, want, face = F]) => scoreCheck([fist(dx)], c, face).ok !== want).map(r => r[0]);
  console.log('── 얼굴 가로 자리 ──');
  for (const s of bad) console.log('  ✕ ' + s);
  if (bad.length) process.exit(1);
  console.log('코 앞과 뺨 옆을 가른다');
}
