/* signReader.js — 자유 모드. 무엇을 할지 모르는 내 손을 낱말 전체와 견줘 읽는다.
 *
 * 연습 모드는 고른 낱말 하나와만 견준다. 여기서는 읽을 수 있는 낱말마다 진행을 따로 들고
 * 한 프레임에 모두 견준다. 판정 규칙은 연습과 같다.
 *   - 한 단계: 그 단계의 판정 힌트(손 수, 펴진 손가락, 고리, 엄지, 높이)를 HOLD_MS 동안 지킨다
 *   - 다음 단계: 앞 단계를 끝낸 자리에서 손이 TRAVEL(손 길이 대비)만큼 옮겨 간 뒤에야 친다
 *
 * 언제 말할지
 *   짧은 낱말이 긴 낱말의 앞부분과 같을 수 있다('나'는 '우리'의 첫 동작과 판정이 같다).
 *   그래서 낱말을 끝냈다고 바로 말하지 않는다. 손을 내리거나, 더 긴 낱말이 SETTLE_MS 동안
 *   이어지지 않으면 그때까지 끝낸 것 중 가장 긴 낱말을 고른다. 여럿이면 손이 그 낱말의 보통 자리에
 *   더 가까웠던 쪽, 그다음 판정 힌트가 더 좁은 쪽이다.
 *
 * 말하지 않는 경우
 *   판정 힌트가 똑같은 낱말이 있다. 움직이는 방향과 손끝 방향(motion.js, matcher.js)을 더해 대부분
 *   갈랐지만 남는 것이 있다. 그때는 후보를 보여 주고 소리는 내지 않는다. 틀린 말을 들려주는 것이
 *   말하지 않는 것보다 나쁘다.
 *   손가락 조건이 없는 단계가 있는 낱말은 거의 아무 손이나 맞으므로 읽을 대상에서 뺀다.
 */
import { motionStart, motionFeed, moveHint, travelled } from './motion.js?v=202611071622';
import { scoreCheck, ZONE_AT } from './matcher.js?v=202611071622';

const FIT_SLACK = 0.35;
const HOLD_MS = 400, GRACE_MS = 250, TRAVEL = 0.3, SETTLE_MS = 1000, MAX_WAIT_MS = 8000, LOST_MS = 500, STALE_MS = 3000;

const checksOf = w => w.check ?? (w.steps ?? ['']).map(() => ({ hands: w.hands ?? 1 }));
const shaped = c => c.fingers !== undefined || c.ring || c.thumb;

/** 판정 힌트가 얼마나 좁은가. 끝낸 낱말이 여럿이면 좁은 쪽을 고른다 */
const specificity = checks => checks.reduce((n, c) =>
  n + (c.fingers !== undefined ? 2 : 0) + (c.other ? 1 : 0) + (c.ring ? 1 : 0) + (c.thumb ? 1 : 0)
    + (c.zone && c.zone !== 'front' ? 1 : 0) + (c.spot ? 1 : 0) + ((c.hands ?? 1) === 2 ? 1 : 0)
    + (c.point ? 1 : 0) + (c.move ? 1 : 0) + (c.moving ? 1 : 0), 0);

/** 자유 모드가 읽을 수 있는 낱말과 읽지 못하는 낱말 */
export function readableSigns(signs) {
  const ok = [], skipped = [];
  for (const w of signs) (checksOf(w).every(shaped) ? ok : skipped).push(w);
  return { ok, skipped };
}

/**
 * @param {{signs:Array<object>, side?:Function, onWord?:Function, onAmbiguous?:Function, onTick?:Function}} opts
 *   side()                쓰는 손 쪽. 오른손잡이 1, 왼손잡이 -1 (움직임 방향을 볼 때 쓴다)
 *   onWord(word)          하나로 읽혔다
 *   onAmbiguous(words)    판정이 같은 낱말이 둘 이상이다
 *   onTick({hands, busy}) 프레임마다. busy 는 낱말 하나 이상을 끝내고 고르는 중
 */
export function createSignReader({ signs, side = () => 1, onWord, onAmbiguous, onTick, debug } = {}) {
  const { ok } = readableSigns(signs);
  const items = ok.map(w => {
    const checks = checksOf(w);
    return { w, checks, n: checks.length, spec: specificity(checks), k: 0, hold: 0, motion: null, at: 0 };
  });
  let pending = [], firstDone = 0, lastDone = 0, lostSince = 0;
  /* 방금 읽은 낱말의 마지막 자세가 다른 낱말의 첫 자세와 같을 수 있다('맛없다'를 마치고 편 손이 '나').
     그래서 한 낱말을 읽고 나면 모든 낱말이 첫 자세를 한 번 벗어난 뒤에야 다시 시작한다(armed) */

  const resetAll = () => { for (const it of items) { it.k = 0; it.hold = 0; it.motion = null; it.live = 0; } };

  function decide() {
    if (!pending.length) return;
    const longest = Math.max(...pending.map(p => p.n));
    /* 여럿이 다 맞으면 먼저 손이 그 낱말의 보통 자리에 더 가까웠던 쪽을 남긴다. 턱 낱말('싫어요')은
       턱 높이가 얼굴과 가슴 범위에도 걸쳐 있어, 조건이 많은 얼굴, 가슴 낱말에 지곤 했다.
       자리가 비슷하면(얼굴 높이 0.35 안) 그다음 조건이 더 좁은 쪽, 그래도 같으면 후보로 둔다 */
    const top = pending.filter(p => p.n === longest);
    const bestFit = Math.min(...top.map(p => p.fit));
    const near = top.filter(p => p.fit <= bestFit + FIT_SLACK);
    const spec = Math.max(...near.map(p => p.spec));
    const words = [...new Set(near.filter(p => p.spec === spec).map(p => p.w.word))];
    pending = []; firstDone = 0;
    resetAll();
    if (words.length === 1) onWord?.(words[0]); else onAmbiguous?.(words);
    for (const it of items) it.armed = false;
  }

  function feed(feats, face = null, now = performance.now()) {
    if (!feats.length) {
      for (const it of items) if (now - (it.okAt ?? 0) > GRACE_MS) it.hold = 0;
      if (!lostSince) lostSince = now;
      if (now - lostSince > LOST_MS) { decide(); resetAll(); for (const it of items) it.armed = true; }
      onTick?.({ hands: 0, busy: pending.length > 0 });
      return;
    }
    lostSince = 0;
    const sd = side();
    for (const it of items) {
      if (it.k > 0 && now - it.at > STALE_MS) { it.k = 0; it.hold = 0; it.motion = null; }
      const c = it.checks[it.k];
      const r = scoreCheck(feats, c, face);
      if (it.k > 0) motionFeed(it.motion, feats, sd);
      if (it.k > 0 && r.ok) it.live = now;   // 다음 동작의 손모양을 하고 있다. 이 낱말이 아직 이어지는 중이다
      // 읽은 뒤에는 첫 자세를 한 번 벗어나야 이 낱말을 다시 시작한다
      if (it.k === 0 && it.armed === false) { if (!r.ok) it.armed = true; continue; }
      // 둘째 동작부터: 사전 원문에 방향이 있으면 그 방향으로, 없으면 옮겨 간 거리만 본다(motion.js)
      const moved = it.k === 0 || ((c.move || c.moving) ? !moveHint(c, it.motion, sd) : travelled(it.motion, TRAVEL));
      const pass = r.ok && moved;
      debug?.(it.w.word, it.k, r.ok, moved, it.k > 0 ? moveHint(c, it.motion, sd) : null, it.motion);
      if (!pass) { if (now - (it.okAt ?? 0) > GRACE_MS) it.hold = 0; continue; }
      it.okAt = now;
      if (!it.hold) it.hold = now;
      if (now - it.hold < HOLD_MS) continue;
      // 이 동작을 마친 높이가 그 자리의 보통 높이에서 얼마나 떨어졌나(얼굴이 보일 때만)
      it.miss = (it.k === 0 ? 0 : it.miss) + (r.u != null && c.zone && ZONE_AT[c.zone] !== undefined && c.zone !== 'front' ? Math.abs(r.u - ZONE_AT[c.zone]) : 0);
      it.k += 1; it.hold = 0; it.motion = motionStart(feats, sd); it.at = now;
      if (it.k < it.n) continue;
      it.k = 0; it.motion = null;
      it.armed = false;   // 같은 자세를 들고 있는 동안 이 낱말을 또 끝낸 것으로 세지 않는다
      pending.push({ w: it.w, n: it.n, spec: it.spec, fit: it.miss / it.n });
      if (!firstDone) firstDone = now;
      lastDone = now;
    }
    if (pending.length) {
      // 끝낸 낱말을 앞부분으로 품은 더 긴 낱말이 방금 이어졌거나, 지금 그 다음 동작의 손모양을 하고 있으면 기다린다.
      // 앞 동작에서 잠깐 머물다 움직이는 사람도 있어 '방금 이어졌는가'만 보면 짧은 낱말('나')로 끊긴다('아니요')
      const longest = Math.max(...pending.map(p => p.n));
      const growing = items.some(it => it.n > longest && it.k >= longest
        && (now - it.at < SETTLE_MS || now - (it.live ?? 0) < 200));
      // 더 긴 낱말이 이어지는 동안은 기다린다(네 동작 낱말은 몇 초 걸린다). 손을 내리면 곧바로 정한다.
      // MAX_WAIT_MS 는 손을 계속 든 채 머무는 경우를 위한 마지막 울타리다
      if ((!growing && now - lastDone >= SETTLE_MS) || now - firstDone >= MAX_WAIT_MS) decide();
    }
    onTick?.({ hands: feats.length, busy: pending.length > 0 });
  }

  return { feed, reset() { pending = []; firstDone = 0; resetAll(); for (const it of items) it.armed = true; } };
}
