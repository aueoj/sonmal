/* words.js — 단어 단위 수어.
 *
 * 왜 사전을 두는가
 *   실제 한국수어에서 지문자는 '수어 단어로 표현하기 어려운 고유명사 등'을 적을 때 쓴다.
 *   즉 단어 수어가 먼저고 지문자가 그 보충이다. 이 앱도 같은 순서를 따른다.
 *   말한 낱말이 사전에 있으면 단어 수어로, 없으면 지문자로 떨어뜨린다.
 *
 * 왜 비어 있는가
 *   단어 수어의 수형·수향·수위·수동을 지어내면 틀린 것을 가르치게 된다.
 *   공신력 있는 출처에서 받아 채우는 자리로 두었다. 받는 곳은 두 군데다.
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
 * @property {boolean} recognizable 따라한 것을 인식까지 할 수 있는 단어인지
 */

/** @type {WordSign[]} */
export const WORD_SIGNS = [];

const byWord = new Map(WORD_SIGNS.map(w => [w.word, w]));

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
