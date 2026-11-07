/* words.js — 단어 단위 수어.
 *
 * 왜 사전을 두는가
 *   실제 한국수어에서 지문자는 '수어 단어로 표현하기 어려운 고유명사 등'을 적을 때 쓴다.
 *   즉 단어 수어가 먼저고 지문자가 그 보충이다. 이 앱도 같은 순서를 따른다.
 *   말한 낱말이 사전에 있으면 단어 수어로, 없으면 지문자로 떨어뜨린다.
 *
 * 지금 들어 있는 것은 검수 전이다
 *   사용자가 제공한 도표에서 읽어 적었고, 그 도표 자체가 '서비스 적용 전
 *   국립국어원 한국수어사전 기준 최종 검수 권장'이라고 밝히고 있다.
 *   그래서 recognizable 은 전부 false 이고, 화면에도 검수 전임을 표시한다.
 *   공신력 있는 출처에서 받아 교정해야 한다. 받는 곳은 세 군데다.
 *     · 국립국어원 한국수어사전 — 수어 동영상과 수형 사진·수형 설명을 함께 제공한다.
 *       표제어와 용례는 공공데이터포털에서 파일로 받을 수 있다.
 *     · AI Hub 수어 영상 데이터셋 — 53.6만 클립, 형태소와 비수지 요소 가공값(JSON),
 *       30fps 프레임별 키포인트. 승인 후 API로 내려받는다.
 *
 * 인식까지 하려면 어휘를 닫아야 한다
 *   단어 단위 한국수어 인식은 어휘 크기에 민감하다. 20단어 규모 자체 데이터셋에서 98.3%,
 *   KSL-77(77단어)에서 89.0%, 공개 벤치마크 기준선은 79.8% 수준이다.
 *   그래서 recognizable은 기본값이 false다. 키포인트로 직접 학습한 단어에만 true를 준다.
 */

/**
 * @typedef {object} WordSign
 * @property {string} word      한국어 대응 표현
 * @property {string} [entryNo] 국립국어원 한국수어사전 표제어 번호
 * @property {string} 수형       손 모양
 * @property {string} 수향       손바닥 방향
 * @property {string} 수위       손 위치
 * @property {string} 수동       손 움직임
 * @property {string} [비수지]    얼굴 표정·머리 움직임 등 손이 아닌 요소
 * @property {string} [videoUrl] 출처 영상
 * @property {string} source     어디서 가져왔는지
 * @property {string[]} [aliases] 같은 수어를 가리키는 다른 한국어 표현
 * @property {string[]} [steps] 동작을 순서대로 나눈 것
 * @property {1|2} [hands] 한 손인지 두 손인지
 * @property {boolean} recognizable 따라한 것을 인식까지 할 수 있는 단어인지
 */

import { WORD_BANK } from './wordBank.js?v=202611071546';
import { WORD_BASIS } from './wordArt.js?v=202611071546';

/* 처음 받은 도표로 만든 12개. 사전과 다른 것이 많다(docs/WORD-AUDIT.md).
   사전 기준 그림이 들어온 단어는 아래에서 wordBank 의 기록으로 갈아 끼운다. */
/** @type {WordSign[]} */
const LEGACY_SIGNS = [
  { word: '안녕하세요', aliases: ['안녕','안녕하십니까','반갑습니다'],
    수형: '손가락을 모아 편 손', 수향: '손바닥이 앞', 수위: '얼굴 옆',
    수동: '좌우로 가볍게 흔든다', 비수지: '눈을 맞추고 가볍게 웃는다',
    steps: ['편 손을 얼굴 옆으로 올린다','좌우로 두어 번 흔든다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false },

  { word: '감사합니다', aliases: ['고맙습니다','감사','고마워요'],
    수형: '한 손은 편 채로 아래, 다른 손은 턱 아래에서 편다', 수향: '아래 손은 손바닥이 위',
    수위: '턱 아래에서 가슴 앞', 수동: '위의 손을 아래 손바닥 쪽으로 내린다',
    비수지: '고개를 가볍게 숙인다',
    steps: ['한 손을 턱 아래에 댄다','아래에 편 손을 받친다','위의 손을 손바닥으로 내린다'],
    hands: 2, source: '사용자 제공 도표', recognizable: false },

  { word: '미안합니다', aliases: ['미안','죄송합니다','죄송해요'],
    수형: '주먹', 수향: '손바닥이 몸쪽', 수위: '가슴',
    수동: '가슴에 대고 둥글게 문지른다', 비수지: '미안한 표정을 짓는다',
    steps: ['주먹을 가슴에 댄다','둥글게 두어 번 문지른다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false },

  { word: '괜찮아요', aliases: ['괜찮다','괜찮습니다'],
    수형: '엄지와 검지로 고리를 만들고 나머지는 편다', 수향: '손바닥이 앞',
    수위: '어깨 높이', 수동: '제자리에서 보인다',
    steps: ['엄지와 검지 끝을 맞붙인다','나머지 세 손가락을 편다','어깨 높이에서 보인다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false },

  { word: '네', aliases: ['예','응','맞아요'],
    수형: '주먹', 수향: '손바닥이 옆', 수위: '어깨 높이',
    수동: '위아래로 끄덕인다', 비수지: '고개를 함께 끄덕인다',
    steps: ['주먹을 어깨 높이로 든다','위아래로 한두 번 끄덕인다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false },

  { word: '아니요', aliases: ['아니','아닙니다','싫어요'],
    수형: '손가락을 모아 편 손', 수향: '손바닥이 앞', 수위: '얼굴 옆',
    수동: '좌우로 젓는다', 비수지: '고개를 함께 젓는다',
    steps: ['편 손을 얼굴 옆에 든다','좌우로 두세 번 젓는다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false },

  { word: '도와주세요', aliases: ['도와줘','도움','도와주실래요'],
    수형: '한 손은 펴 아래에 두고 다른 손을 그 위에 편다', 수향: '아래 손은 손바닥이 위',
    수위: '가슴 앞', 수동: '위의 손을 아래 손바닥으로 내린다',
    비수지: '눈썹을 올려 부탁하는 표정을 짓는다',
    steps: ['편 손을 손바닥이 위로 오게 둔다','다른 손을 그 위에 편다','위의 손을 내려 손바닥에 댄다'],
    hands: 2, source: '사용자 제공 도표', recognizable: false },

  { word: '다시', aliases: ['한번더','다시요','반복'],
    수형: '두 손 모두 검지를 편다', 수향: '손바닥이 아래', 수위: '가슴 앞',
    수동: '두 검지를 서로 돌린다',
    steps: ['두 손의 검지를 편다','서로 마주 보게 둔다','둥글게 돌린다'],
    hands: 2, source: '사용자 제공 도표', recognizable: false },

  { word: '천천히', aliases: ['천천','느리게','조금만천천히'],
    수형: '두 손을 펴 손바닥이 아래를 보게 한다', 수향: '손바닥이 아래',
    수위: '가슴 앞에서 배 앞으로', 수동: '두 손을 천천히 내린다',
    steps: ['두 손을 펴 가슴 앞에 든다','손바닥을 아래로 돌린다','천천히 내린다'],
    hands: 2, source: '사용자 제공 도표', recognizable: false },

  { word: '이해했어요', aliases: ['이해','알겠어요','알았어요'],
    수형: '검지를 편 손에서 엄지를 세운 주먹으로 바꾼다', 수향: '손바닥이 옆',
    수위: '관자놀이에서 어깨 앞으로', 수동: '관자놀이를 짚었다가 엄지를 세운다',
    비수지: '고개를 끄덕인다',
    steps: ['검지로 관자놀이를 짚는다','손을 앞으로 내린다','엄지를 세운다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false },

  { word: '물', aliases: ['물좀','식수'],
    수형: '손가락 끝을 모은 손', 수향: '손바닥이 몸쪽', 수위: '입가',
    수동: '입가로 가져간다',
    steps: ['손가락 끝을 모은다','입가로 가져간다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false },

  { word: '화장실', aliases: ['화장실어디','변소','세면실'],
    수형: '검지를 편 손', 수향: '손바닥이 옆', 수위: '얼굴 옆',
    수동: '검지로 가리킨다', 비수지: '눈썹을 올려 묻는 표정을 짓는다',
    steps: ['검지를 세운다','가리키려는 쪽으로 향한다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false }
];

/* 화면에 올리는 단어
   1. 사전 기준 그림이 검수되어 들어온 단어(basis 'sldict') → wordBank 의 사전 기록
   2. 아직 옛 그림뿐인 단어(basis 'legacy') → 옛 기록
   3. 그림이 없는 단어 → 올리지 않는다. 그림 없이 동작을 글로만 보여 주지 않는다. */
const legacyBy = new Map(LEGACY_SIGNS.map(w => [w.word, w]));
const bankBy = new Map(WORD_BANK.map(w => [w.word, w]));
const order = [...WORD_BANK.map(w => w.word), ...LEGACY_SIGNS.map(w => w.word)];

/** @type {WordSign[]} */
export const WORD_SIGNS = [...new Set(order)].flatMap(word => {
  const basis = WORD_BASIS[word];
  if (basis === 'sldict' && bankBy.has(word)) return [{ ...bankBy.get(word), recognizable: false }];
  if (basis === 'legacy' && legacyBy.has(word)) return [legacyBy.get(word)];
  return [];
});

const byWord = new Map();
for (const w of WORD_SIGNS) {
  byWord.set(w.word, w);
  for (const a of w.aliases ?? []) byWord.set(a, w);
}

export function lookupWord(word) {
  return byWord.get(word) ?? null;
}

/* ── 말을 수어 낱말로 맞추기 ──────────────────────
 * 한국어는 낱말 뒤에 조사와 어미가 붙는다('이름이', '뭐예요', '친구가').
 * 수어에는 대개 그런 것이 없어서 그대로 찾으면 못 찾고, 못 찾으면 지문자로
 * 한 자씩 풀게 된다. '이름이 뭐예요'가 지문자 13동작이 되던 까닭이다.
 * 그래서 뒤에 붙은 것을 떼어 가며 사전 낱말을 찾고, 끝내 없으면 뗀 앞부분만
 * 지문자로 푼다. 조사와 어미는 손으로 하지 않는다.
 */
const ENDINGS = [   // 길이가 긴 것부터 시도한다
  '이었어요', '였어요', '했어요', '었어요', '았어요', '이에요', '입니다', '습니다', '합니다',
  '예요', '에요', '네요', '어요', '아요', '해요', '세요', '이야', '이다', '하다', '군요', '지요', '지만',
  '해서', '어서', '아서', '죠', '요', '다', '서', '고', '며', '면', '해'
];
const PARTICLES = [
  '에서', '에게', '한테', '으로', '이랑', '부터', '까지', '처럼', '보다',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '의', '와', '과', '로', '랑'
];
const syllables = t => [...t].filter(c => /[가-힣]/.test(c)).length;

/** 뒤에 붙은 조사나 어미를 한 번 떼어 본 후보들 */
function strip(t, list) {
  return list.filter(x => t.endsWith(x) && t.length > x.length).map(x => t.slice(0, -x.length));
}

/* ── 용언 활용을 기본형으로 ─────────────────────
 * '만들었어', '만든거야', '만드는', '만듭니다'는 모두 '만들다'다. 정해 둔 변형(aliases)만
 * 찾으면 이런 말은 하나도 못 찾는다. 그래서 어미를 떼고, 줄어든 마지막 글자를 되돌린다.
 *   받침이 붙은 것   만든, 만듭, 먹은, 먹을 → 받침을 떼거나 ㄹ로 (ㄹ 탈락 용언)
 *   ㄹ 이 빠진 것     만드(는, 니까)         → ㄹ 을 붙인다
 *   과거 ㅆ 이 붙은 것 만났, 갔, 했, 됐, 왔   → ㅆ 을 떼고 줄어든 모음을 되돌린다
 *   ㅡ 가 빠진 것     슬퍼, 아파, 기뻐       → ㅡ 로 (슬프, 아프, 기쁘)
 *   ㅂ 불규칙        무서워, 무서운, 도와   → 앞 글자에 ㅂ (무섭, 돕)
 *   ㅎ 불규칙        빨간, 노란, 하얀       → 받침 ㅎ (빨갛, 노랗, 하얗)
 * 되돌린 말은 용언(기본형이 '다'나 '요'로 끝나는 낱말)으로 찾을 때만 받아들인다.
 * '글', '날'이 받침을 떼여 '그', '나'가 되는 일을 막으려는 것이다. */
const VERB_ENDINGS = [   // 길이가 긴 것부터 시도한다
  '었습니다', '았습니다', '였습니다', '었는데', '았는데', '거예요', '거에요', '건가요',
  '었어요', '았어요', '였어요', '었어', '았어', '였어', '었다', '았다', '였다', '었지', '았지',
  '었네', '었고', '니까요', '니까', '으면', '는데', '은데', '거야', '건데', '거지', '거죠', '건가',
  '습니다', '니다', '네요', '어요', '아요', '어줘', '아줘', '주세요', '게요', '래요', '려고', '나요', '을게', '을래',
  '는다', '거', '것', '게', '네', '다', '래', '자', '지', '니', '냐', '나', '고', '면', '줘', '는', '은', '을', '어', '아', '여'
];
const H0 = 0xac00;
const split = ch => {
  const n = ch.charCodeAt(0) - H0;
  return n >= 0 && n < 11172 ? { L: Math.floor(n / 588), V: Math.floor((n % 588) / 28), T: n % 28 } : null;
};
const join = ({ L, V, T }) => String.fromCharCode(H0 + L * 588 + V * 28 + T);
const T_N = 4, T_L = 8, T_M = 16, T_B = 17, T_SS = 20, T_H = 27;
const V_A = 0, V_AE = 1, V_EO = 4, V_YEO = 6, V_O = 8, V_WA = 9, V_WAE = 10, V_OE = 11, V_U = 13, V_WEO = 14, V_EU = 18, V_I = 20;
const L_H = 18, L_IEUNG = 11;

/** 마지막 글자를 되돌려 본 앞부분 후보들 */
function unconjugate(t) {
  const out = new Set();
  const head = t.slice(0, -1), last = split(t.slice(-1));
  if (!last) return [];
  const add = x => { if (x && x !== t) out.add(x); };
  const vowelBack = (j, base) => {          // 줄어든 모음을 되돌린다
    const back = { [V_WA]: V_O, [V_WEO]: V_U, [V_YEO]: V_I, [V_WAE]: V_OE }[j.V];
    if (back !== undefined) add(base + join({ ...j, V: back, T: 0 }));
    if (j.V === V_AE && j.L === L_H) add(base + join({ ...j, V: V_A, T: 0 }));        // 해 → 하
    if ((j.V === V_EO || j.V === V_A) && j.T === 0) add(base + join({ ...j, V: V_EU })); // 슬퍼 → 슬프
    // ㅂ 불규칙: 무서워 → 무섭, 도와 → 돕
    if ((j.V === V_WEO || j.V === V_WA || j.V === V_U) && j.L === L_IEUNG && base) {   // 무서운 → 무서우 → 무섭
      const prev = split(base.slice(-1));
      if (prev && prev.T === 0) add(base.slice(0, -1) + join({ ...prev, T: T_B }));
    }
  };
  if ([T_N, T_L, T_M, T_B].includes(last.T)) {
    add(head + join({ ...last, T: 0 }));
    if (last.T !== T_L) add(head + join({ ...last, T: T_L }));
    // ㅎ 불규칙: 빨간, 노란, 하얀 → 빨갛, 노랗, 하얗. '노래'(노랗+아)는 노래와 헷갈려 받지 않는다
    if (last.T === T_N) add(head + join({ ...last, T: T_H }));
  }
  if (last.T === 0) { add(head + join({ ...last, T: T_L })); vowelBack(last, head); }
  if (last.T === T_SS) {
    const bare = { ...last, T: 0 };
    add(head + join(bare));
    vowelBack(bare, head);
  }
  return [...out];
}

const isPredicate = w => /[다요]$/.test(w.word);
/** 용언으로 찾는다. 기본형('-다'), '-요' 꼴, 또는 그 말 자체가 용언인 낱말 */
function lookupPredicate(c) {
  // 그 말 자체로 찾는 것은 c 가 '-다', '-요'로 끝날 때만이다. '자다'에서 되돌린 '잘'이
  // '잘하다'의 대응표현 '잘'(부사)로 잡히지 않게 한다
  // '-다', '-요'를 붙여 찾은 말은 대응표현 자체가 용언이다('빨갛다'의 표제어는 '빨강'이어도 된다)
  const viaEnding = lookupWord(c + '다') ?? lookupWord(c + '요');
  if (viaEnding) return viaEnding;
  const hit = /[다요]$/.test(c) ? lookupWord(c) : null;
  return hit && isPredicate(hit) ? hit : null;
}

/**
 * 한 어절을 사전 낱말에 맞춘다.
 * @returns {{sign?:object, stem:string}} sign 이 있으면 그 수어, 없으면 지문자로 풀 앞부분
 */
export function matchToken(token) {
  const direct = lookupWord(token);
  if (direct) return { sign: direct, stem: token };
  const seen = new Set([token]);
  let frontier = [token];
  for (let depth = 0; depth < 2; depth++) {           // 조사 하나, 어미 하나까지만 뗀다
    const next = [];
    for (const t of frontier) for (const c of [...strip(t, ENDINGS), ...strip(t, PARTICLES)]) {
      if (seen.has(c) || !c) continue;
      seen.add(c); next.push(c);
      const hit = lookupWord(c) ?? lookupWord(c + '다') ?? lookupWord(c + '요');
      // 과일 '사과'를 '사과하다/사과해요'의 어간으로 잘못 연결하지 않는다.
      const excluded = hit?.excludePredicateForms && /^(하|해|했|합)/.test(token.slice(c.length));
      if (hit && !excluded) return { sign: hit, stem: c };
    }
    frontier = next;
  }
  // 용언 활용: 어미를 떼고(떼지 않은 것도), 줄어든 마지막 글자를 되돌린다
  const bases = [token, ...strip(token, VERB_ENDINGS)];
  for (const b of [...bases]) for (const c of strip(b, VERB_ENDINGS)) bases.push(c);   // '었' + '거야' 처럼 둘까지
  for (const b of bases) {
    if (!b) continue;
    const hit = lookupPredicate(b);
    if (hit) return { sign: hit, stem: b };
    for (const v of unconjugate(b)) {
      const h = lookupPredicate(v);
      if (h) return { sign: h, stem: b };
      for (const v2 of unconjugate(v)) {      // 만났 → 만나, 슬펐 → 슬퍼 → 슬프
        const h2 = lookupPredicate(v2);
        if (h2) return { sign: h2, stem: b };
      }
    }
  }
  /* 사전에 없을 때 지문자로 풀 부분. 한 글자짜리 조사는 세 음절 이상일 때만 뗀다.
     '아이'의 '이', '사과'의 '과'처럼 낱말의 일부를 떼어 버리지 않으려는 것이다. */
  let stem = token;
  for (const e of ENDINGS) if (e.length >= 2 && stem.endsWith(e) && syllables(stem) > syllables(e)) { stem = stem.slice(0, -e.length); break; }
  for (const p of PARTICLES) {
    if (!stem.endsWith(p) || syllables(stem) <= syllables(p)) continue;
    if (p.length === 1 && syllables(stem) < 3) continue;
    stem = stem.slice(0, -p.length); break;
  }
  return { stem };
}

/**
 * 문장을 단어 수어 구간과 지문자 구간으로 나눈다.
 * 순서는 한국어 순서 그대로다. 수어 문장 번역이 아니라 낱말을 이어 본 연습이다.
 * @returns {Array<{kind:'word'|'spell', text:string, sign?:WordSign, stem?:string}>}
 *   text 는 사용자가 한 말 그대로(칸에 보이고 읽어 주는 말), stem 은 손으로 하는 부분
 */
export function planUtterance(text) {
  const out = [];
  const tokens = String(text ?? '').split(/\s+/).map(t => t.replace(/[.,!?·…"'()~]/g, '')).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    /* '배가 고파요', '한 번 더'처럼 띄어 쓴 표현은 어절 셋, 둘을 붙여 먼저 찾는다.
       띄어쓰기가 든 말은 띄어쓰기가 든 대응표현과만 맞으므로 '나 물'이 엉뚱하게 묶이지 않는다 */
    let n = Math.min(3, tokens.length - i), m;
    for (; n > 1; n--) if ((m = matchToken(tokens.slice(i, i + n).join(' '))).sign) break;
    if (n === 1) m = matchToken(tokens[i]);
    const bare = tokens.slice(i, i + n).join(' ');
    i += n - 1;
    if (m.sign) out.push({ kind: 'word', text: bare, sign: m.sign });
    else out.push({ kind: 'spell', text: bare, stem: m.stem });
  }
  return out;
}

export const SOURCES = [
  { name: '서울시 수어사전', url: 'https://wis.seoul.go.kr/wfs/dhs/udr/signDictionary.do', note: '공식 동작 확인용 참고 링크 · 현재 연습 그림은 사용자 제공 자료 기반' },
  { name: '국립국어원 한국수어사전', url: 'https://sldict.korean.go.kr/',
    note: '수어 동영상, 수형 사진, 수형 설명, 용례' },
  { name: '공공데이터포털 — 한국수어사전 표제어 및 용례', url: 'https://www.data.go.kr/data/15122687/fileData.do',
    note: '표제어 번호와 한국어 대응표현, 연 1회 갱신' },
  { name: 'AI Hub 수어 영상 데이터셋', url: 'https://www.aihub.or.kr/aihubdata/data/view.do?dataSetSn=103',
    note: '53.6만 클립, 형태소·비수지 요소 JSON, 30fps 키포인트' }
];
