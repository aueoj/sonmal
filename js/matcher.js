/* matcher.js — 특징과 자세 데이터를 맞춰 보고, 어긋난 곳을 수어의 말로 돌려준다.
 *
 * 되돌려 주는 피드백은 '다시 해보세요'가 아니라 수형·수향·수위·수동 중
 * 무엇이 어긋났는지를 짚는다. 문화체육관광부 수어 안내가 설명하는 네 요소다.
 */

import { FINGERS, angleToDir } from './poseFeatures.js?v=202611031311';

const DIR_DEG = { up: 0, right: 90, down: 180, left: 270 };
const DIR_KO = { up: '위', right: '오른쪽', down: '아래', left: '왼쪽' };
const FINGER_KO = { index: '검지', middle: '중지', ring: '약지', pinky: '새끼손가락' };

/** 두 각도 사이의 원형 거리(0~180도) */
const angleGap = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

const FLIP_DIR = { right: 'left', left: 'right', up: 'up', down: 'down' };

/**
 * @param {object} feat poseFeatures.describe 결과 (화면 좌표 기준)
 * @param {object} pose jamoData 자세 레코드
 * @param {{mirrored?:boolean}} opts 그림을 좌우로 뒤집어 보여 주고 있으면 true.
 *   그때는 따라하는 방향도 뒤집히므로 기대 방향을 같이 뒤집는다.
 * @returns {{score:number, parts:object, hint:?string, hintKind:?string}}
 */
export function scorePose(feat, pose, { mirrored = false } = {}) {
  const wantDir = mirrored ? (FLIP_DIR[pose.dir] ?? pose.dir) : pose.dir;
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
  /* 고리를 만드는 자모(ㅇ·ㅎ)의 엄지는 편 것도 접은 것도 아니다.
     고리 거리로 이미 보고 있으므로 엄지는 따로 따지지 않는다. */
  /* 엄지를 펴는 것이 그 글자를 만드는 자모(ㅏ·ㅓ·ㅎ 처럼)에서만 엄지를 따진다.
     '접음'은 도표에서 읽은 것이 아니라 기본값에 가깝다. 아래를 가리킬 때
     엄지가 조금 뜨는 것은 자연스러운데, 그걸 틀렸다고 하면 그림대로 한
     사람이 고치라는 말을 듣는다. 아주 활짝 편 경우에만 깎는다. */
  const ringed = pose.special === 'circle';
  const thumbMatters = pose.thumb === 'out' || pose.thumb === 'up';
  const thumbScore = ringed ? 1
    : thumbMatters ? 1 - Math.min(1, Math.max(0, 0.95 - feat.thumbExtension) / 0.55)
    : 1 - Math.min(1, Math.max(0, feat.thumbExtension - 0.78) / 0.22);

  /* 수향은 거의 보지 않는다.
     손바닥·손등·손날 구분은 도표에서 읽어낸 것이 아니라 추측이라, 이것으로
     사람을 고치게 하면 그림대로 한 사람에게 틀렸다고 말하게 된다.
     손 모양과 가리키는 방향만으로 판정하고, 수향은 참고로만 남긴다. */
  const viewScore = feat.facing === pose.view ? 1 : 0.7;

  // 수동(방향) — 주먹처럼 펴진 손가락이 없으면 방향을 따지지 않는다
  // 꺾은 손가락은 끝 방향이 흔들리므로 방향을 느슨하게 본다
  const hasDir = (pose.fingers ?? []).length > 0 && !pose.bent;
  const dirGap = hasDir ? angleGap(feat.angle, DIR_DEG[wantDir] ?? 0) : 0;
  const dirScore = hasDir ? Math.max(0, 1 - dirGap / 75) : 1;

  // 벌림 — 검지와 중지를 둘 다 펴는 자모에서만 본다
  const bothUp = want.has('index') && want.has('middle');
  const spreadTarget = pose.spreadWide ? 26 : 4;      // 도
  const spreadScore = bothUp ? Math.max(0, 1 - Math.abs(feat.spread - spreadTarget) / 32) : 1;

  // 고리 — 엄지와 검지 끝이 붙었는가. ㅇ·ㅎ에서만 본다.
  const wantRing = ringed;
  const pinchScore = wantRing ? Math.max(0, 1 - Math.max(0, feat.pinch - 0.22) / 0.33) : 1;

  const score = 0.46 * shape + 0.11 * thumbScore + 0.04 * viewScore + 0.26 * dirScore + 0.08 * spreadScore + 0.05 * pinchScore;

  let hint = null, hintKind = null;
  if (wantRing && pinchScore < 0.6) {
    hint = '엄지와 검지 끝을 맞붙여 고리를 만드세요'; hintKind = '수형';
  } else if (hasDir && dirScore < 0.6) {
    hint = `손끝을 ${DIR_KO[wantDir]}으로 향하게 하세요`; hintKind = '수동';
  } else if (worst && worstGap > 0.35) {
    hint = (pose.bent && worst === 'index') ? '검지 둘째 마디를 직각으로 꺾으세요'
         : want.has(worst) ? `${FINGER_KO[worst]}를 끝까지 펴세요` : `${FINGER_KO[worst]}를 접으세요`;
    hintKind = '수형';
  } else if (bothUp && spreadScore < 0.55) {
    hint = pose.spreadWide ? '검지와 중지를 벌리세요' : '검지와 중지를 붙이세요'; hintKind = '수형';
  } else if (thumbMatters && thumbScore < 0.6) {
    hint = '엄지를 옆으로 펴세요'; hintKind = '수형';
  }

  return {
    score,
    parts: { shape, thumb: thumbScore, view: viewScore, dir: dirScore, spread: spreadScore, pinch: pinchScore },
    hint, hintKind,
    /* 지금 무엇이 보이는지. 안 될 때 사람이 직접 견줘 볼 수 있어야 한다. */
    seen: {
      fingers: FINGERS.filter(f => feat.extension[f] > 0.6)
        .map(f => ({ index: '검', middle: '중', ring: '약', pinky: '새' }[f])).join('') || '없음',
      dir: DIR_KO[angleToDir(feat.angle)] ?? '—',
      spread: bothUp ? Math.round(feat.spread) : null
    },
    want: {
      fingers: FINGERS.filter(f => want.has(f))
        .map(f => ({ index: '검', middle: '중', ring: '약', pinky: '새' }[f])).join('') || '주먹',
      dir: DIR_KO[wantDir] ?? '—',
      spread: bothUp ? spreadTarget : null
    }
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

/* ── 낱말 단계 판정 ─────────────────────────────
 * 낱말은 지문자처럼 자세 하나로 끝나지 않는다. 그림 한 장마다 사전 수형 설명에서
 * 읽어 둔 판정 힌트(wordBank 의 check)가 있다.
 *   hands   보여야 하는 손 수
 *   fingers 주로 쓰는 손에서 펴진 손가락 (없으면 손가락은 보지 않는다. 구부린 손, C 모양처럼 숫자로 못 박기 어려운 수형)
 *   other   두 손 낱말에서 다른 손의 펴진 손가락. 없으면 두 손이 같은 손모양이다(fingers 를 따른다)
 *   ring    엄지와 검지 끝을 맞대 고리를 만드는가
 *   thumb   'up' 이면 엄지를 세운다
 *   zone    손이 머무는 높이(얼굴, 턱, 가슴, 배, 몸 앞)
 *
 * 손 높이는 얼굴을 기준으로 잰다. 손 중심이 코끝에서 얼굴 높이 몇 개만큼 아래에
 * 있는지(u)로 본다. 카메라와 떨어진 거리, 카메라 각도가 달라도 몸에 대한 위치는
 * 그대로라서 화면 비율로 어림하던 것보다 덜 빗나간다.
 * 얼굴 상자(이마에서 턱까지, 얼굴 너비와 비슷한 15cm 남짓) 높이를 1로 두고 코끝에서 잴 때
 * 성인 몸의 대략적인 자리: 턱 0.5, 목 아래 오목한 곳 1.3, 가슴 한가운데 2.5, 배꼽 3.8
 * (그림 속 인물로 얼굴 상자가 이마에서 턱까지 잡히고 턱이 0.4 언저리에 오는 것을 확인했다)
 * 기준선은 이 자리들 사이에 너그럽게 두었다. 몸 치수와 앉은 자세가 사람마다 달라서,
 * 가슴은 '얼굴 앞이 아니고 배꼽보다 한참 아래가 아니면' 통과시킨다. 몸 앞은 보지 않는다.
 * 두 손 낱말은 두 손의 가운데를 잰다. 두 손이 만나는 자리가 수어의 위치이고,
 * 주먹을 위아래로 포개면('만들다') 위 주먹 하나만 재면 실제보다 높게 나온다.
 * 얼굴이 안 보이면(손이 얼굴을 가린 채 오래 있거나 얼굴이 화면 밖) 예전처럼 화면 속
 * 세로 위치로 어림하고, 가슴은 보지 않는다.
 */
const ZONE = {
  face:  { inFace: u => u < 0.9, onScreen: y => y < 0.58, hint: () => '손을 얼굴 앞으로 올리세요' },
  chin:  { inFace: u => u < 1.2, onScreen: y => y < 0.62, hint: () => '손을 턱 앞으로 올리세요' },
  chest: { inFace: u => u > 0.5 && u < 4.5, onScreen: null,
           hint: u => (u <= 0.5 ? '손을 가슴 앞으로 내리세요' : '손을 가슴 앞으로 올리세요') },
  belly: { inFace: u => u > 2.4, onScreen: y => y > 0.42, hint: () => '손을 배 앞으로 내리세요' }
};

/* 높이마다 손 중심이 보통 머무는 자리(u). 모의 입력과 시험이 손을 이 자리에 둔다. */
export const ZONE_AT = { face: 0, chin: 0.6, chest: 1.8, front: 1.6, belly: 3.0 };

/** 손 중심 높이가 그 자리에 맞는가. 맞으면 null, 아니면 짚어 줄 말 */
export function zoneHint(zoneName, y, face) {
  const z = ZONE[zoneName];
  if (!z) return null;
  if (face?.h > 0) {
    const u = (y - face.y) / face.h;
    return z.inFace(u) ? null : z.hint(u);
  }
  if (!z.onScreen) return null;
  return z.onScreen(y) ? null : z.hint();
}

function handShape(feat, check) {
  if (!check.fingers) return { score: 1, hint: null };
  const want = new Set(check.fingers);
  let score = 0, worst = null, worstGap = 0;
  for (const f of FINGERS) {
    const gap = Math.abs((want.has(f) ? 1 : 0) - feat.extension[f]);
    score += 1 - Math.min(1, gap / 0.75);
    if (gap > worstGap) { worstGap = gap; worst = f; }
  }
  score /= FINGERS.length;
  const hint = worstGap > 0.45
    ? (want.has(worst) ? `${FINGER_KO[worst]}을 펴세요` : `${FINGER_KO[worst]}을 접으세요`)
    : null;
  return { score, hint };
}

/**
 * @param {Array<object>} feats 보이는 손마다 describe 결과
 * @param {object} check wordBank 의 단계 힌트
 * @param {?{y:number,h:number}} face 코끝 높이와 얼굴 상자 높이(화면 비율). 없으면 화면으로 어림
 * @returns {{ok:boolean, score:number, hint:?string}}
 */
export function scoreCheck(feats, check = {}, face = null) {
  const need = check.hands ?? 1;
  if (feats.length < need)
    return { ok: false, score: 0, hint: need === 2 ? '두 손이 다 보이게 하세요' : '손이 보이게 하세요' };

  // 주로 쓰는 손: 수형이 가장 잘 맞는 손
  let best = null;
  feats.forEach((f, i) => {
    const s = handShape(f, check);
    if (!best || s.score > best.s.score) best = { f, s, i };
  });
  const { f, s } = best;
  let hint = s.score < 0.72 ? (s.hint ?? '그림의 손모양을 다시 보세요') : null;

  /* 두 손 낱말은 다른 손도 본다. 한 손만 맞고 다른 손은 아무렇게나 해도
     통과하던 것을 막는다('안녕하세요'의 두 주먹). */
  let partner = null;
  if (need === 2) {
    // 다른 손: 남은 손 가운데 그 손모양에 가장 가까운 손
    const otherFingers = check.other ?? check.fingers;
    partner = feats.filter((_, i) => i !== best.i)
      .map(x => ({ x, s: handShape(x, { fingers: otherFingers }) }))
      .sort((a, b) => b.s.score - a.s.score)[0] ?? null;
  }
  if (!hint && need === 2 && check.fingers) {
    const otherFingers = check.other ?? check.fingers;
    const o = partner?.s;
    if (!o || o.score < 0.72)
      hint = '다른 손도 그림처럼: ' + (o?.hint ?? (otherFingers.length ? '손가락을 펴세요' : '주먹을 쥐세요'));
  }

  if (!hint && check.ring && f.pinch > 0.35) hint = '엄지와 검지 끝을 맞대세요';
  if (!hint && check.thumb === 'up' && f.thumbExtension < 0.7) hint = '엄지를 세우세요';
  const zoneY = partner ? (f.centroid.y + partner.x.centroid.y) / 2 : f.centroid.y;
  if (!hint) hint = zoneHint(check.zone, zoneY, face);

  return { ok: !hint, score: s.score, hint, centroid: f.centroid, scale: f.scale };
}
