/* reader.js — 상대가 하는 지문자를 읽는다.
 *
 * 연습 화면은 '지금 보여 준 자모 하나'와만 견준다. 읽기는 다르다. 무엇을 할지
 * 모르는 상대의 손을 40개 자모 전체와 견줘 가장 가까운 것을 고른다.
 *   - 한 손 자모는 가장 잘 맞는 손으로 본다. 두 손 자모(ㅘ ㅙ ㅝ ㅞ)는 두 손이 다 맞아야 하고,
 *     두 손이 다 맞으면 한 손 자모보다 앞세운다
 *   - 쌍자음은 기본 자음 손모양을 옆으로 민 것이다. 연습 화면과 같은 잣대로 이동을 보고, 받아 적은 뒤라도
 *     손을 풀기 전에 밀면 쌍자음으로 고친다
 *   - 점수가 ACCEPT 를 넘고 2등과 MARGIN 이상 벌어진 채 HOLD 동안 버티면 받아 적는다
 *   - 같은 자모를 두 번 쓰려면 손을 풀었다가(점수가 RELEASE 아래로) 다시 지어야 한다
 *   - 손이 PAUSE 동안 쉬면 그때까지 받아 적은 자모를 글자로 합쳐 한 마디로 넘긴다
 * 도표에서 손모양이 같은 자모(ㄱ과 ㅋ, ㅏ와 ㅗ, ㄴ과 ㅟ 등)는 점수로는 가를 수 없다.
 * 그때는 한국어 글자 짜임으로 고른다. 자음 다음에는 모음이, 모음 다음에는 자음이 오기
 * 쉽고, 같은 갈래끼리면 더 자주 쓰이는 쪽을 고른다. 그래도 틀릴 수 있어 화면에 후보를 같이 보인다.
 */
import { ALL_POSES, MOTION_LETTERS } from './jamoData.js?v=202611071559';
import { scoreHands, detectLateralShift, SHIFT_MIN } from './matcher.js?v=202611071559';
import { composeFromJamo } from './hangul.js?v=202611071559';

const ACCEPT = 0.88, TIE = 0.02, HOLD_MS = 550, RELEASE = 0.7, PAUSE_MS = 2200;
const FREQ = 'ㅇㄱㄴㄹㅏㅣㅅㄷㅓㅡㅈㅗㅁㅜㅎㅂㅕㅐㅔㅊㅌㅛㅠㅋㅍㅑㅘㅚㅝㅟㅢㅒㅖㅙㅞㄲㄸㅃㅆㅉ';
const VOWELS = new Set([...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ']);
// 쌍자음은 손모양으로는 기본 자음과 같다. 그 손모양을 옆으로 밀었는지로 가른다
const DOUBLE = new Map(MOTION_LETTERS.map(p => [p.base, p.jamo]));

export function createReader({ onChange, onSentence } = {}) {
  let jamos = [], cand = null, since = 0, last = null, released = true, lastAt = 0, live = null, trail = [];

  const emit = () => onChange?.({ jamos: [...jamos], text: composeFromJamo(jamos), live });

  function feed(feats, now = performance.now(), { mirrored = true } = {}) {
    if (!feats.length) {
      released = true; cand = null; live = null;
    } else {
      // 손 수로 후보를 거르지 않는다. 한 손 자모는 다른 손이 보여도 잘 맞는 손으로 읽는다
      const scored = ALL_POSES.filter(p => !p.motion).map(p => {
        const r = scoreHands(feats, p, { mirrored });
        return { p, s: r?.score ?? 0, f: r?.feat };
      }).sort((a, b) => b.s - a.s);
      // 두 손이 다 맞는 두 손 자모가 있으면 그것을 지은 것이다. 한 손 자모는 그중 한 손만 본 것이다
      const two = scored.filter(c => c.p.hands === 2 && c.s >= ACCEPT);
      const ranked = two.length ? two : scored;
      // 점수가 거의 같은 후보들 중에서 글자 짜임과 빈도로 고른다
      const ties = ranked.filter(c => ranked[0].s - c.s < TIE);
      const wantVowel = jamos.length > 0 && !VOWELS.has(jamos[jamos.length - 1]);
      const rank = c => (VOWELS.has(c.p.jamo) === wantVowel ? 0 : 100) + (FREQ.indexOf(c.p.jamo) + 1 || 99);
      const best = ties.sort((a, b) => rank(a) - rank(b))[0];
      live = { jamo: best.p.jamo, score: best.s, also: ties.filter(c => c !== best).map(c => c.p.jamo) };
      if (best.s < RELEASE) released = true;
      const clear = best.s >= ACCEPT;
      if (!clear) cand = null;
      else {
        if (cand !== best.p.jamo) { cand = best.p.jamo; since = now; trail = []; }
        trail.push({ x: best.f.centroid.x, t: now });
        const slid = DOUBLE.has(cand) && detectLateralShift(trail, best.f.scale, now) >= SHIFT_MIN;
        if (now - since >= HOLD_MS && (released || cand !== last)) {
          jamos.push(slid ? DOUBLE.get(cand) : cand); last = cand; released = false; lastAt = now;
        } else if (slid && cand === last && !released) {
          // 지어 두고 버티다 미는 것이 자연스러운 순서다. 손을 풀기 전에 밀면 방금 적은 자음을 쌍자음으로 고친다
          jamos[jamos.length - 1] = DOUBLE.get(cand); lastAt = now;
        }
      }
    }
    if (jamos.length && now - lastAt > PAUSE_MS) {
      const text = composeFromJamo(jamos);
      jamos = []; last = null;
      onSentence?.(text);
    }
    emit();
  }

  return {
    feed,
    clear() { jamos = []; cand = null; last = null; live = null; emit(); },
    get text() { return composeFromJamo(jamos); }
  };
}
