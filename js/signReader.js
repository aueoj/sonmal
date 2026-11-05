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
 *   이어지지 않으면 그때까지 끝낸 것 중 가장 긴 낱말을 고른다.
 *
 * 말하지 않는 경우
 *   판정 힌트가 똑같은 낱말이 있다('내일'과 '어제'는 손모양과 높이가 같고 움직이는 방향만 다르다.
 *   방향은 아직 데이터에 없다). 그때는 후보를 보여 주고 소리는 내지 않는다. 틀린 말을 들려주는 것이
 *   말하지 않는 것보다 나쁘다.
 *   손가락 조건이 없는 단계가 있는 낱말은 거의 아무 손이나 맞으므로 읽을 대상에서 뺀다.
 */
import { scoreCheck } from './matcher.js?v=202611050534';

const HOLD_MS = 400, GRACE_MS = 250, TRAVEL = 0.3, SETTLE_MS = 1000, MAX_WAIT_MS = 2600, LOST_MS = 500, STALE_MS = 3000;

const checksOf = w => w.check ?? (w.steps ?? ['']).map(() => ({ hands: w.hands ?? 1 }));
const shaped = c => c.fingers !== undefined || c.ring || c.thumb;

/** 판정 힌트가 얼마나 좁은가. 끝낸 낱말이 여럿이면 좁은 쪽을 고른다 */
const specificity = checks => checks.reduce((n, c) =>
  n + (c.fingers !== undefined ? 2 : 0) + (c.other ? 1 : 0) + (c.ring ? 1 : 0) + (c.thumb ? 1 : 0)
    + (c.zone && c.zone !== 'front' ? 1 : 0) + (c.spot ? 1 : 0) + ((c.hands ?? 1) === 2 ? 1 : 0), 0);

/** 자유 모드가 읽을 수 있는 낱말과 읽지 못하는 낱말 */
export function readableSigns(signs) {
  const ok = [], skipped = [];
  for (const w of signs) (checksOf(w).every(shaped) ? ok : skipped).push(w);
  return { ok, skipped };
}

/**
 * @param {{signs:Array<object>, onWord?:Function, onAmbiguous?:Function, onTick?:Function}} opts
 *   onWord(word)          하나로 읽혔다
 *   onAmbiguous(words)    판정이 같은 낱말이 둘 이상이다
 *   onTick({hands, busy}) 프레임마다. busy 는 낱말 하나 이상을 끝내고 고르는 중
 */
export function createSignReader({ signs, onWord, onAmbiguous, onTick } = {}) {
  const { ok } = readableSigns(signs);
  const items = ok.map(w => {
    const checks = checksOf(w);
    return { w, checks, n: checks.length, spec: specificity(checks), k: 0, hold: 0, from: null, travel: 0, at: 0 };
  });
  let pending = [], firstDone = 0, lastDone = 0, lostSince = 0;
  let blocked = null;   // 방금 읽은 낱말. 손을 풀기 전에는 다시 읽지 않는다

  const resetAll = () => { for (const it of items) { it.k = 0; it.hold = 0; it.from = null; it.travel = 0; } };

  function decide() {
    if (!pending.length) return;
    const longest = Math.max(...pending.map(p => p.n));
    const top = pending.filter(p => p.n === longest);
    const spec = Math.max(...top.map(p => p.spec));
    const words = [...new Set(top.filter(p => p.spec === spec).map(p => p.w.word))];
    pending = []; firstDone = 0;
    resetAll();
    if (words.length === 1) onWord?.(words[0]); else onAmbiguous?.(words);
    blocked = words;
  }

  function feed(feats, face = null, now = performance.now()) {
    if (!feats.length) {
      for (const it of items) if (now - (it.okAt ?? 0) > GRACE_MS) it.hold = 0;
      if (!lostSince) lostSince = now;
      if (now - lostSince > LOST_MS) { decide(); resetAll(); blocked = null; }
      onTick?.({ hands: 0, busy: pending.length > 0 });
      return;
    }
    lostSince = 0;
    let stillBlocked = false;
    for (const it of items) {
      if (it.k > 0 && now - it.at > STALE_MS) { it.k = 0; it.hold = 0; it.from = null; it.travel = 0; }
      const r = scoreCheck(feats, it.checks[it.k], face);
      if (it.k > 0 && it.from && r.centroid) {
        const d = Math.hypot(r.centroid.x - it.from.x, r.centroid.y - it.from.y) / (r.scale || 1);
        it.travel = Math.max(it.travel, d);
      }
      // 방금 읽은 낱말의 마지막 자세를 그대로 들고 있으면 같은 말을 되풀이하지 않는다
      if (blocked?.includes(it.w.word) && it.k === 0 && r.ok) stillBlocked = true;
      const pass = r.ok && (it.k === 0 || it.travel >= TRAVEL);
      if (!pass) { if (now - (it.okAt ?? 0) > GRACE_MS) it.hold = 0; continue; }
      it.okAt = now;
      if (!it.hold) it.hold = now;
      if (now - it.hold < HOLD_MS) continue;
      it.k += 1; it.hold = 0; it.from = r.centroid; it.travel = 0; it.at = now;
      if (it.k < it.n) continue;
      it.k = 0; it.from = null;
      if (blocked?.includes(it.w.word)) continue;
      pending.push(it);
      if (!firstDone) firstDone = now;
      lastDone = now;
    }
    if (blocked && !stillBlocked) blocked = null;
    if (pending.length) {
      // 끝낸 낱말을 앞부분으로 품은 더 긴 낱말이 방금 이어졌으면 기다린다
      const longest = Math.max(...pending.map(p => p.n));
      const growing = items.some(it => it.n > longest && it.k >= longest && now - it.at < SETTLE_MS);
      if ((!growing && now - lastDone >= SETTLE_MS) || now - firstDone >= MAX_WAIT_MS) decide();
    }
    onTick?.({ hands: feats.length, busy: pending.length > 0 });
  }

  return { feed, reset() { pending = []; firstDone = 0; blocked = null; resetAll(); } };
}
