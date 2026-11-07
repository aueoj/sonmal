/* hangul.js — 한글 음절을 지문자 자모 시퀀스로 분해하고 다시 합성한다.
 *
 * 한국 지문자는 자모 단위 체계이므로(윤백원, 1946), 음절 단위 한글을
 * 자모로 풀어야 손모양 시퀀스가 된다. 지문자 집합에 없는 겹받침은
 * 두 자모로 나누어 차례로 표현한다. 겹모음 ㅘ ㅙ ㅝ ㅞ 는 두 손으로 함께 보인다.
 */

const SBASE = 0xac00;
const LCOUNT = 19, VCOUNT = 21, TCOUNT = 28;
const NCOUNT = VCOUNT * TCOUNT;          // 588
const SCOUNT = LCOUNT * NCOUNT;          // 11172

const L_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const V_LIST = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const T_LIST = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

/* 단독 손모양이 없는 자모 → 구성 자모 둘로 분해.
   겹받침만 해당한다. 복합모음과 쌍자음은 도표에 제 손모양이 있다. */
const SPLIT = {
  // 복합모음 ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ 는 도표에 단독 손모양이 있으므로 쪼개지 않는다.
  // 겹받침
  'ㄳ': ['ㄱ','ㅅ'], 'ㄵ': ['ㄴ','ㅈ'], 'ㄶ': ['ㄴ','ㅎ'],
  'ㄺ': ['ㄹ','ㄱ'], 'ㄻ': ['ㄹ','ㅁ'], 'ㄼ': ['ㄹ','ㅂ'],
  'ㄽ': ['ㄹ','ㅅ'], 'ㄾ': ['ㄹ','ㅌ'], 'ㄿ': ['ㄹ','ㅍ'], 'ㅀ': ['ㄹ','ㅎ'],
  'ㅄ': ['ㅂ','ㅅ']
};

export function isSyllable(ch) {
  const c = ch.codePointAt(0);
  return c >= SBASE && c < SBASE + SCOUNT;
}

/** 한 음절 → [초성, 중성, (종성)] (복합 자모 미분해) */
export function splitSyllable(ch) {
  const i = ch.codePointAt(0) - SBASE;
  const out = [L_LIST[Math.floor(i / NCOUNT)], V_LIST[Math.floor((i % NCOUNT) / TCOUNT)]];
  const t = T_LIST[i % TCOUNT];
  if (t) out.push(t);
  return out;
}

/** 자모 하나를 지문자로 표현 가능한 단위들로 분해 */
export function toSpellable(jamo) {
  return SPLIT[jamo] ? SPLIT[jamo].slice() : [jamo];
}

/**
 * 텍스트 → 지문자 시퀀스
 * @returns {Array<{jamo:string, role:'lead'|'vowel'|'tail'|'space'|'other',
 *                  syllable:string, syllableIndex:number, fromCluster:?string}>}
 */
export function toFingerspell(text) {
  const seq = [];
  const chars = Array.from(text ?? '');
  let sIdx = -1;

  for (const ch of chars) {
    if (/\s/.test(ch)) {
      if (seq.length && seq[seq.length - 1].role !== 'space') {
        seq.push({ jamo: ' ', role: 'space', syllable: ' ', syllableIndex: sIdx, fromCluster: null });
      }
      continue;
    }
    if (isSyllable(ch)) {
      sIdx += 1;
      const parts = splitSyllable(ch);
      const roles = parts.length === 3 ? ['lead','vowel','tail'] : ['lead','vowel'];
      parts.forEach((p, k) => {
        const units = toSpellable(p);
        units.forEach(u => seq.push({
          jamo: u, role: roles[k], syllable: ch, syllableIndex: sIdx,
          fromCluster: units.length > 1 ? p : null
        }));
      });
      continue;
    }
    // 이미 자모로 들어온 경우
    if (/[ㄱ-ㅣ]/.test(ch)) {
      sIdx += 1;
      toSpellable(ch).forEach(u => seq.push({
        jamo: u, role: /[ㅏ-ㅣ]/.test(ch) ? 'vowel' : 'lead',
        syllable: ch, syllableIndex: sIdx, fromCluster: null
      }));
      continue;
    }
    // 숫자·라틴·문장부호는 지문자 범위 밖 — 건너뛰되 기록은 남긴다
    sIdx += 1;
    seq.push({ jamo: ch, role: 'other', syllable: ch, syllableIndex: sIdx, fromCluster: null });
  }
  return seq;
}

/** 지문자 자모 배열 → 한글 텍스트. 사용자가 따라한 손모양을 다시 말로 읽어줄 때 쓴다. */
export function composeFromJamo(jamos) {
  const MERGE_V = {};   // 복합모음은 쪼개지 않으므로 다시 합칠 일도 없다
  const MERGE_T = { 'ㄱㅅ':'ㄳ','ㄴㅈ':'ㄵ','ㄴㅎ':'ㄶ','ㄹㄱ':'ㄺ','ㄹㅁ':'ㄻ',
                    'ㄹㅂ':'ㄼ','ㄹㅅ':'ㄽ','ㄹㅌ':'ㄾ','ㄹㅍ':'ㄿ','ㄹㅎ':'ㅀ','ㅂㅅ':'ㅄ' };

  const isV = j => V_LIST.includes(j);
  const out = [];
  let i = 0;
  const items = jamos.filter(j => j !== undefined && j !== null);

  while (i < items.length) {
    const ch = items[i];
    if (ch === ' ') { out.push(' '); i++; continue; }
    if (!L_LIST.includes(ch) && !isV(ch)) { out.push(ch); i++; continue; }

    // 모음만 홀로 오면 그대로 노출
    if (isV(ch)) { out.push(ch); i++; continue; }

    let lead = ch, j = i + 1;
    if (j >= items.length || !isV(items[j])) { out.push(lead); i++; continue; }

    let vowel = items[j]; j++;
    if (j < items.length && MERGE_V[vowel + items[j]]) { vowel = MERGE_V[vowel + items[j]]; j++; }

    // 종성 후보: 다음 자음, 단 그 뒤에 모음이 오면 다음 음절의 초성이다
    let tail = '';
    if (j < items.length && L_LIST.includes(items[j])) {
      const c1 = items[j];
      const nextIsVowel = j + 1 < items.length && isV(items[j + 1]);
      const pair = j + 1 < items.length ? MERGE_T[c1 + items[j + 1]] : null;
      const pairThenVowel = j + 2 < items.length && isV(items[j + 2]);

      if (pair && !pairThenVowel && T_LIST.includes(pair)) { tail = pair; j += 2; }
      else if (!nextIsVowel && T_LIST.includes(c1)) { tail = c1; j += 1; }
    }

    const li = L_LIST.indexOf(lead), vi = V_LIST.indexOf(vowel), ti = T_LIST.indexOf(tail);
    if (li < 0 || vi < 0 || ti < 0) { out.push(lead, vowel, tail); i = j; continue; }
    out.push(String.fromCodePoint(SBASE + (li * VCOUNT + vi) * TCOUNT + ti));
    i = j;
  }
  return out.join('');
}

export const JAMO_LISTS = { L_LIST, V_LIST, T_LIST, SPLIT };
