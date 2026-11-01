// 원본 PNG를 수정하지 않고 각 그림의 표시 영역만 지정한다.
const ROOT = new URL('../assets/sheets/', import.meta.url).href;
const JAMO = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
  'ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ',
  'ㅘ','ㅚ','ㅙ','ㅝ','ㅞ','ㅟ','ㅢ']; // 첫 번째 중복 ㅙ는 ㅚ로 표기
const ROWS = [[20,160],[235,155],[433,150],[625,155],[820,140]];
const DOUBLE = { 'ㄲ':[30,30,330,250], 'ㄸ':[390,70,390,180], 'ㅃ':[810,20,300,245],
  'ㅆ':[1160,20,365,245], 'ㅉ':[20,395,400,155] };
const WORDS = ['안녕하세요','감사합니다','미안합니다','괜찮아요','네','아니요',
  '도와주세요','다시','천천히','이해했어요','물','화장실'];
function artwork(sheet, box, label) {
  return `<svg class="sheet-art" viewBox="${box.join(' ')}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet"><image href="${ROOT}sheet-${sheet}.png" width="${sheet === 1 ? 1199 : 1536}" height="${sheet === 1 ? 1312 : 1024}" /></svg>`;
}
export function jamoArt(jamo) {
  if (DOUBLE[jamo]) return artwork(3, DOUBLE[jamo], `${jamo} 지문자 손모양`);
  const i = JAMO.indexOf(jamo);
  if (i < 0) return '';
  const col = i % 7, [y,h] = ROWS[Math.floor(i/7)];
  return artwork(2, [Math.max(0,col*1536/7-5), y, Math.min(1536/7+10,1536-col*1536/7), h], `${jamo} 지문자 손모양`);
}
export function wordArt(word) {
  const i = WORDS.indexOf(word);
  if (i < 0) return '';
  // 라벨은 HTML로 표시한다. 머리·손·이동 화살표는 모두 포함한다.
  const row = Math.floor(i/3), col = i%3;
  return artwork(1, [col*399.66, [10,350,680,1000][row],399.66,[280,260,250,245][row]], `${word} 수어 동작`);
}
