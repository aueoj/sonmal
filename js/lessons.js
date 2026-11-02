/* lessons.js — 낱말을 상황으로 묶는다.
 *
 * 갈래(감정, 지시어)로 나누면 사전처럼 읽히고, 상황으로 나누면 대화처럼 읽힌다.
 * 사람은 "무엇을 배울까"보다 "언제 쓸까"로 고른다. 한 묶음은 5~7개로 둔다.
 * 화면에 그림이 있는 낱말만 나온다. 어느 묶음에도 없는 낱말은 '그 밖'으로 간다.
 */
export const SITUATIONS = [
  { id: 'daily', name: '가족과 하루', words: ['엄마', '아빠', '오늘', '자다'] },
  { id: 'meet',  name: '처음 만났을 때',   words: ['안녕하세요', '나', '너', '우리', '친구', '만나다', '학교', '만들다', '이름', '가족'] },
  { id: 'stuck', name: '대화가 막힐 때',   words: ['수어', '배우다', '다시', '천천히', '이해했어요', '괜찮아요', '아니요', '미안합니다'] },
  { id: 'help',  name: '도움이 필요할 때', words: ['병원', '가다', '오다', '있다', '없다', '도와주세요', '화장실', '어디', '여기', '물', '먹다', '배고파요'] },
  { id: 'ask',   name: '물어볼 때',       words: ['무엇', '누구', '언제', '왜', '어떻게', '네'] },
  { id: 'heart', name: '마음 전할 때',    words: ['사랑', '잘하다', '감사합니다', '좋아요', '싫어요', '기뻐요', '행복해요', '슬퍼요'] },
  { id: 'feel',  name: '몸과 기분',       words: ['화나요', '아파요', '피곤해요', '놀랐어요', '걱정돼요', '무서워요'] }
];

/** 화면에 있는 낱말만 남겨 묶음으로 돌려준다. */
export function groupByIdea(signs) {
  const have = new Map(signs.map(w => [w.word, w]));
  const used = new Set();
  const out = SITUATIONS.map(s => {
    const ws = s.words.filter(w => have.has(w)).map(w => { used.add(w); return have.get(w); });
    return { ...s, signs: ws };
  }).filter(s => s.signs.length);
  const rest = signs.filter(w => !used.has(w.word));
  if (rest.length) out.push({ id: 'rest', name: '그 밖', signs: rest });
  return out;
}
