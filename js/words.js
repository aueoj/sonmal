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

/** @type {WordSign[]} */
export const WORD_SIGNS = [
  {
    word: '안녕하세요', aliases: ['안녕', '안녕하십니까'],
    수형: '편 손을 얼굴 옆에서 가볍게 흔든다', 수향: '손바닥이 앞',
    수위: '얼굴 옆', 수동: '가볍게 흔든다',
    비수지: '가볍게 고개를 숙이고 눈을 맞춘다',
    steps: ['손가락을 모아 손바닥을 편다', '손바닥이 앞을 보게 얼굴 옆에 든다', '그림의 화살표를 따라 손을 가볍게 흔든다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false
  },
  {
    word: '감사합니다', aliases: ['고맙습니다', '감사', '고마워요'],
    수형: '한 손을 입 근처에 두고 다른 손바닥 쪽으로 내린다', 수향: '받치는 손바닥이 위',
    수위: '입 근처에서 가슴 앞', 수동: '아래 손바닥 쪽으로 내린다',
    비수지: '고개를 가볍게 숙인다',
    steps: ['한 손바닥을 위로 펴 가슴 앞에 둔다', '다른 손을 입 근처에 댄다', '위쪽 손을 아래 손바닥 쪽으로 내린다'],
    hands: 2, source: '사용자 제공 도표', recognizable: false
  },
  {
    word: '네', aliases: ['예', '응'],
    수형: '한 손으로 주먹을 쥔다', 수향: '손바닥이 옆',
    수위: '가슴 높이', 수동: '위아래로 가볍게 끄덕인다',
    steps: ['주먹을 쥐어 가슴 앞에 든다', '그림의 화살표를 따라 위아래로 움직인다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false
  },
  {
    word: '아니요', aliases: ['아니', '아닙니다', '싫어요'],
    수형: '손가락을 모아 편 손', 수향: '손바닥이 앞',
    수위: '얼굴 앞', 수동: '좌우로 흔든다',
    비수지: '고개를 함께 젓는다',
    steps: ['편 손을 얼굴 앞에 든다', '좌우로 두세 번 흔든다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false
  },
  {
    word: '화장실', aliases: ['화장실어디', '변소'],
    수형: '검지와 중지를 편 손', 수향: '손바닥이 앞',
    수위: '입 옆', 수동: '그림의 화살표 방향으로 옮긴다',
    steps: ['검지와 중지를 편다', '그림처럼 입 옆에 손을 둔다', '화살표가 가리키는 쪽으로 손을 옮긴다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false
  },
  {
    word: '병원', aliases: ['의원'],
    수형: '한 손은 펴고 다른 손은 검지를 세운다', 수향: '편 손은 손바닥이 아래',
    수위: '가슴 앞', 수동: '세운 검지를 편 손바닥에 대고 십자를 그린다',
    steps: ['편 손을 가슴 앞에 둔다', '세운 검지를 손바닥 아래에 댄다', '가로로 그어 십자를 만든다'],
    hands: 2, source: '사용자 제공 도표', recognizable: false
  },
  {
    word: '도와주세요', aliases: ['도와줘', '도움', '도와주실래요'],
    수형: '한 손바닥을 펴고 다른 손을 그 위에 둔다', 수향: '손바닥이 위',
    수위: '배 앞', 수동: '위쪽 손을 아래 손 쪽으로 내린다',
    비수지: '눈썹을 올리고 상대를 본다',
    steps: ['한 손바닥을 위로 펴 받친다', '다른 손을 받친 손 위쪽에 둔다', '그림의 아래쪽 화살표를 따라 손을 내린다'],
    hands: 2, source: '사용자 제공 도표', recognizable: false
  },
  {
    word: '어디', aliases: ['어디요', '어디에', '어디예요'],
    수형: '검지를 편 손', 수향: '손바닥이 옆',
    수위: '가슴 높이', 수동: '세운 검지를 좌우로 흔든다',
    비수지: '눈썹을 올려 묻는 표정을 짓는다',
    steps: ['검지를 세운다', '좌우로 두세 번 흔든다', '상대를 향해 멈춘다'],
    hands: 1, source: '사용자 제공 도표', recognizable: false
  },
  { word: '미안합니다', 수형: '주먹을 가슴 앞에 댄다', 수향: '제공 그림 참고', 수위: '제공 그림 참고', 수동: '그림의 둥근 화살표를 따라 움직인다', steps: ['주먹을 가슴 앞에 댄다', '그림의 둥근 화살표를 따라 움직인다'], hands: 1, source: '사용자 제공 도표', recognizable: false },
  { word: '괜찮아요', 수형: '엄지와 검지로 고리를 만든다', 수향: '제공 그림 참고', 수위: '제공 그림 참고', 수동: '나머지 손가락을 펴 그림의 손모양을 유지한다', steps: ['엄지와 검지로 고리를 만든다', '나머지 손가락을 펴 그림의 손모양을 유지한다'], hands: 1, source: '사용자 제공 도표', recognizable: false },
  { word: '다시', 수형: '두 검지를 서로 향하게 든다', 수향: '제공 그림 참고', 수위: '제공 그림 참고', 수동: '그림의 둥근 화살표를 따라 두 손을 움직인다', steps: ['두 검지를 서로 향하게 든다', '그림의 둥근 화살표를 따라 두 손을 움직인다'], hands: 2, source: '사용자 제공 도표', recognizable: false },
  { word: '천천히', 수형: '두 손을 가슴 앞에 나란히 둔다', 수향: '제공 그림 참고', 수위: '제공 그림 참고', 수동: '손바닥을 아래로 향하고 천천히 내린다', steps: ['두 손을 가슴 앞에 나란히 둔다', '손바닥을 아래로 향하고 천천히 내린다'], hands: 2, source: '사용자 제공 도표', recognizable: false },
  { word: '이해했어요', 수형: '한 손 검지를 이마 옆에 댄다', 수향: '제공 그림 참고', 수위: '제공 그림 참고', 수동: '그림의 화살표를 따라 옮겨 엄지를 세운다', steps: ['한 손 검지를 이마 옆에 댄다', '그림의 화살표를 따라 옮겨 엄지를 세운다'], hands: 1, source: '사용자 제공 도표', recognizable: false },
  { word: '물', 수형: '손을 둥글게 말아 입 근처에 댄다', 수향: '제공 그림 참고', 수위: '제공 그림 참고', 수동: '그림처럼 손모양과 위치를 유지한다', steps: ['손을 둥글게 말아 입 근처에 댄다', '그림처럼 손모양과 위치를 유지한다'], hands: 1, source: '사용자 제공 도표', recognizable: false }
];

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
  { name: '국립국어원 한국수어사전', url: 'https://sldict.korean.go.kr/',
    note: '수어 동영상, 수형 사진, 수형 설명, 용례' },
  { name: '공공데이터포털 — 한국수어사전 표제어 및 용례', url: 'https://www.data.go.kr/data/15122687/fileData.do',
    note: '표제어 번호와 한국어 대응표현, 연 1회 갱신' },
  { name: 'AI Hub 수어 영상 데이터셋', url: 'https://www.aihub.or.kr/aihubdata/data/view.do?dataSetSn=103',
    note: '53.6만 클립, 형태소·비수지 요소 JSON, 30fps 키포인트' }
];
