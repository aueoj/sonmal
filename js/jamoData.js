/* jamoData.js — 한국 지문자 손 자세 데이터
 *
 * 출처: 사용자가 제공한 한국 지문자 도표(자음 14 + 모음 14 + 복합모음 7).
 * 도표의 체계는 단순하다. 펴는 손가락 개수와 가리키는 방향, 그리고 수향으로 자모가 갈린다.
 *
 *   fingers 펴는 손가락 목록. 빈 배열이면 주먹.
 *   dir     펴진 손가락이 가리키는 방향. 'up' | 'right' | 'down'
 *   view    수향. 'palm' 손바닥이 보임 · 'back' 손등이 보임 · 'side' 손날이 보임
 *   thumb   'in' 접음 · 'out' 옆으로 폄 · 'up' 세움
 *   special 'circle' 엄지와 검지로 고리(ㅇ) · 'thumbup' 엄지만 세움(ㅎ)
 *
 * 복합모음 ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ 는 도표에서도 두 자모를 잇달아 표현하므로
 * 단독 손모양을 두지 않고 hangul.js가 두 자모로 풀어 넘긴다.
 *
 * confidence
 *   'clear'  도표에서 분명하게 읽은 자모
 *   'check'  도표 해상도로는 이웃 자모와 구별이 모호해 확인이 필요한 자모.
 *            docs/HANDSHAPES.md에 무엇이 모호한지 적어 두었다.
 */

const I = 'index', M = 'middle', R = 'ring', P = 'pinky';

const mk = (jamo, kind, fingers, dir, view, opts = {}) => ({
  jamo, kind, fingers, dir, view,
  thumb: opts.thumb ?? 'in',
  bent: opts.bent ?? false,
  spreadWide: opts.spreadWide ?? false,
  special: opts.special ?? null,
  motion: opts.motion ?? null,
  base: opts.base ?? null,
  note: opts.note,
  mnemonic: opts.mnemonic,
  confidence: opts.confidence ?? 'clear'
});

export const CONSONANTS = [
  mk('ㄱ', 'consonant', [I], 'down', 'side', {
    thumb: 'out',
    note: '검지를 곧게 펴 아래로 내리고 엄지를 옆으로 뻗는다. 손날이 보인다.',
    mnemonic: '내린 검지와 뻗은 엄지가 ㄱ의 두 획이다.' }),
  mk('ㄴ', 'consonant', [I], 'right', 'side', {
    thumb: 'out',
    note: '검지를 옆으로 뻗고 엄지를 세운다. 손날이 보인다.',
    mnemonic: '옆으로 뻗은 검지가 ㄴ의 밑획이다.' }),
  mk('ㄷ', 'consonant', [I, M], 'right', 'side', {
    note: '검지와 중지를 붙여 펴고 옆으로 뻗는다.',
    mnemonic: '나란한 두 획이 ㄷ의 위아래 가로획이다.' }),
  mk('ㄹ', 'consonant', [I, M, R], 'right', 'side', {
    note: '검지·중지·약지를 펴고 옆으로 뻗는다.',
    mnemonic: '세 획이 ㄹ의 가로획 셋이다.' }),
  mk('ㅁ', 'consonant', [], 'up', 'back', {
    note: '손가락을 모두 접어 주먹을 쥔다. 손등이 보인다.',
    mnemonic: '꽉 닫은 주먹이 ㅁ의 네모다.' }),
  mk('ㅂ', 'consonant', [I, M, R, P], 'up', 'palm', {
    note: '네 손가락을 모아 펴 세우고 엄지만 접는다. 손바닥이 보인다.',
    mnemonic: '나란히 선 네 손가락이 ㅂ의 기둥이다.' }),
  mk('ㅅ', 'consonant', [I, M], 'down', 'palm', {
    spreadWide: true, thumb: 'out',
    note: '검지와 중지를 벌려 아래로 내린다. 손바닥이 보인다.',
    mnemonic: '아래로 벌어진 두 획이 ㅅ의 빗침이다.' }),
  mk('ㅇ', 'consonant', [M, R, P], 'up', 'palm', {
    special: 'circle', thumb: 'circle',
    note: '엄지와 검지 끝을 맞붙여 고리를 만들고 나머지 세 손가락은 편다.',
    mnemonic: '엄지와 검지가 만든 고리가 그대로 ㅇ이다.' }),
  mk('ㅈ', 'consonant', [I, M], 'down', 'back', {
    spreadWide: true, thumb: 'out',
    note: '검지와 중지를 벌려 아래로 내린다. 손등이 보인다.',
    mnemonic: 'ㅅ과 같은 수형을 수향만 바꾸어 쓴다.', confidence: 'check' }),
  mk('ㅊ', 'consonant', [I, M, R], 'down', 'palm', {
    spreadWide: true, thumb: 'out',
    note: '검지·중지·약지를 벌려 아래로 내린다. 손바닥이 보인다.',
    mnemonic: 'ㅅ에 획이 하나 더해져 ㅊ이 된다.' }),
  mk('ㅋ', 'consonant', [I, M, R], 'down', 'back', {
    thumb: 'out',
    note: '검지·중지·약지를 모아 아래로 내린다. 손등이 보인다.',
    mnemonic: 'ㅊ과 같은 수형을 수향과 벌림으로 가른다.', confidence: 'check' }),
  mk('ㅌ', 'consonant', [I, M, R], 'up', 'back', {
    note: '검지·중지·약지를 모아 세운다. 손등이 보인다.',
    mnemonic: '세운 세 손가락이 ㅌ의 가로획 셋이다.' }),
  mk('ㅍ', 'consonant', [I, M, R, P], 'right', 'side', {
    note: '네 손가락을 모아 펴고 옆으로 뻗는다. 손날이 보인다.',
    mnemonic: '옆으로 누운 네 획이 ㅍ의 기둥들이다.' }),
  mk('ㅎ', 'consonant', [], 'up', 'side', {
    special: 'thumbup', thumb: 'up',
    note: '주먹을 쥐고 엄지만 위로 세운다.',
    mnemonic: '세운 엄지가 ㅎ의 머리획이다.' })
];

export const VOWELS = [
  mk('ㅏ', 'vowel', [I], 'up', 'back', {
    note: '주먹에서 검지만 곧게 세운다. 손등이 보인다.',
    mnemonic: '세운 검지가 ㅏ의 세로획이다.' }),
  mk('ㅐ', 'vowel', [I, P], 'up', 'back', {
    note: '검지와 새끼손가락을 함께 세운다.',
    mnemonic: 'ㅏ에 ㅣ가 더해져 획이 둘이 된다.' }),
  mk('ㅑ', 'vowel', [I, M], 'up', 'back', {
    note: '검지와 중지를 함께 세운다.',
    mnemonic: 'ㅏ의 짧은 획이 둘로 늘어 ㅑ가 된다.' }),
  mk('ㅒ', 'vowel', [I, M, P], 'up', 'back', {
    note: '검지·중지·새끼손가락을 함께 세운다.',
    mnemonic: 'ㅑ에 ㅣ가 더해진 것이 ㅒ다.', confidence: 'check' }),
  mk('ㅓ', 'vowel', [I], 'right', 'back', {
    note: '검지를 곧게 펴 옆으로 뻗는다. 손등이 보인다.',
    mnemonic: 'ㅏ를 눕히면 ㅓ의 방향이 된다.' }),
  mk('ㅔ', 'vowel', [I, P], 'right', 'back', {
    note: '검지와 새끼손가락을 펴 옆으로 뻗는다.',
    mnemonic: 'ㅓ에 ㅣ가 더해진 것이 ㅔ다.' }),
  mk('ㅕ', 'vowel', [I, M], 'right', 'back', {
    note: '검지와 중지를 펴 옆으로 뻗는다.',
    mnemonic: 'ㅑ를 눕힌 방향이 ㅕ다.' }),
  mk('ㅖ', 'vowel', [I, M, P], 'right', 'back', {
    note: '검지·중지·새끼손가락을 펴 옆으로 뻗는다.',
    mnemonic: 'ㅕ에 ㅣ가 더해진 것이 ㅖ다.', confidence: 'check' }),
  mk('ㅗ', 'vowel', [I], 'up', 'palm', {
    note: 'ㅏ와 같은 수형에서 손바닥이 보이도록 돌린다.',
    mnemonic: '수향을 바꾸어 ㅏ를 ㅗ로 옮긴다.', confidence: 'check' }),
  mk('ㅛ', 'vowel', [I, M], 'up', 'palm', {
    note: 'ㅑ와 같은 수형에서 손바닥이 보이도록 돌린다.',
    mnemonic: '수향을 바꾸어 ㅑ를 ㅛ로 옮긴다.', confidence: 'check' }),
  mk('ㅜ', 'vowel', [I], 'down', 'back', {
    note: '검지를 곧게 펴 아래로 내린다. 손등이 보인다.',
    mnemonic: 'ㅗ를 뒤집은 방향이 ㅜ다. 손날이 보이는 ㅋ과는 수향으로 갈린다.',
    confidence: 'check' }),
  mk('ㅠ', 'vowel', [I, M], 'down', 'back', {
    note: '검지와 중지를 펴 아래로 내린다. 손등이 보인다.',
    mnemonic: 'ㅛ를 뒤집은 방향이 ㅠ다.', confidence: 'check' }),
  mk('ㅡ', 'vowel', [I], 'right', 'palm', {
    note: 'ㅓ와 같은 수형에서 손바닥이 아래를 보도록 돌린다.',
    mnemonic: '옆으로 누운 한 획이 ㅡ다.', confidence: 'check' }),
  mk('ㅣ', 'vowel', [I], 'up', 'side', {
    note: '검지를 곧게 세운다. 손날이 보인다.',
    mnemonic: '곧게 선 한 획이 ㅣ다.', confidence: 'check' }),

  /* 복합모음 — 도표에 단독 손모양이 있다. 다만 도표가 기본 모음과 같은 수형을
     다시 쓰는 곳이 있어, 손모양만으로는 기본 모음과 갈리지 않는 자모가 있다.
     연습은 '지금 만들 자모'와 견주어 판정하므로 진행에는 지장이 없다. */
  mk('ㅘ', 'vowel', [I], 'up', 'back', { thumb: 'out',
    note: 'ㅗ와 ㅏ를 한 손에 담아 검지를 세우고 엄지를 옆으로 뻗는다.',
    mnemonic: 'ㅗ 다음에 ㅏ가 오는 것이 ㅘ다.', confidence: 'check' }),
  mk('ㅚ', 'vowel', [I], 'up', 'side', { thumb: 'out',
    note: 'ㅗ와 ㅣ를 한 손에 담아 검지를 세운다. 손날이 보인다.',
    mnemonic: 'ㅗ 다음에 ㅣ가 오는 것이 ㅚ다.', confidence: 'check' }),
  mk('ㅙ', 'vowel', [I, M], 'up', 'back', { thumb: 'out',
    note: '검지와 중지를 세우고 엄지를 옆으로 뻗는다.',
    mnemonic: 'ㅗ 다음에 ㅐ가 오는 것이 ㅙ다.', confidence: 'check' }),
  mk('ㅝ', 'vowel', [I], 'down', 'back', { thumb: 'out',
    note: 'ㅜ와 ㅓ를 한 손에 담아 검지를 아래로 내린다.',
    mnemonic: 'ㅜ 다음에 ㅓ가 오는 것이 ㅝ다.', confidence: 'check' }),
  mk('ㅞ', 'vowel', [I, M], 'down', 'back', { thumb: 'out',
    note: '검지와 중지를 아래로 내린다. 손등이 보인다.',
    mnemonic: 'ㅜ 다음에 ㅔ가 오는 것이 ㅞ다.', confidence: 'check' }),
  mk('ㅟ', 'vowel', [I], 'right', 'side', { thumb: 'up',
    note: 'ㅜ와 ㅣ를 한 손에 담아 검지를 옆으로 뻗고 엄지를 세운다.',
    mnemonic: 'ㅜ 다음에 ㅣ가 오는 것이 ㅟ다.', confidence: 'check' }),
  mk('ㅢ', 'vowel', [I], 'up', 'back', { thumb: 'up',
    note: 'ㅡ와 ㅣ를 한 손에 담아 검지를 세우고 엄지를 세운다.',
    mnemonic: 'ㅡ 다음에 ㅣ가 오는 것이 ㅢ다.', confidence: 'check' })
];

/* 쌍자음 — 도표에 단독 항목이 없다. 기본 자음 손모양을 유지한 채 손 전체를
   옆으로 한 번 옮겨 표현하는 방식을 따른다. 지문자 인식 연구도 정적 수형 외에
   손 무게중심의 이동을 함께 보아 쌍자음을 가려낸다. */
const DOUBLES = [['ㄲ','ㄱ'], ['ㄸ','ㄷ'], ['ㅃ','ㅂ'], ['ㅆ','ㅅ'], ['ㅉ','ㅈ']];

const byJamo = new Map([...CONSONANTS, ...VOWELS].map(p => [p.jamo, p]));

export const MOTION_LETTERS = DOUBLES.map(([jamo, base]) => ({
  ...byJamo.get(base), jamo, base,
  motion: { axis: 'x', dir: 1, label: '옆으로 한 번 이동' },
  note: `${base}의 손모양을 그대로 둔 채 손 전체를 옆으로 한 번 옮긴다.`,
  mnemonic: `같은 손모양을 옆으로 밀어 ${jamo}을 만든다.`,
  confidence: 'check'
}));

export const ALL_POSES = [...CONSONANTS, ...VOWELS, ...MOTION_LETTERS];
export const POSE_BY_JAMO = new Map(ALL_POSES.map(p => [p.jamo, p]));
export const STATIC_COUNT = CONSONANTS.length + VOWELS.length;

export function getPose(jamo) { return POSE_BY_JAMO.get(jamo) ?? null; }
