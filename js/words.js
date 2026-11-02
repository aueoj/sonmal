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

import { WORD_BANK } from './wordBank.js?v=202611021222';
import { WORD_BASIS } from './wordArt.js?v=202611021222';

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

/**
 * 문장을 단어 수어 구간과 지문자 구간으로 나눈다.
 * 사전이 비어 있으면 전부 지문자 구간이 된다.
 * @returns {Array<{kind:'word'|'spell', text:string, sign?:WordSign}>}
 */
export function planUtterance(text) {
  const out = [];
  for (const token of String(text ?? '').split(/(\s+)/)) {
    if (!token.trim()) continue;
    const bare = token.replace(/[.,!?·…"'()]/g, '');
    const sign = lookupWord(bare);
    if (sign) out.push({ kind: 'word', text: bare, sign });
    else if (bare) out.push({ kind: 'spell', text: bare });
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
