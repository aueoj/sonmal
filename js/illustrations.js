// 각 파일에는 글자 없는 동작 한 장만 담는다. 도표 전체를 표시하지 않는다.
const STEP_BASE = new URL('../assets/word-steps/', import.meta.url).href;
const POSES = {"안녕하세요": ["01-01.png", "01-02.png"], "감사합니다": ["02-01.png", "02-02.png", "02-03.png"], "미안합니다": ["03-01.png", "03-02.png"], "괜찮아요": ["04-01.png", "04-02.png", "04-03.png"], "네": ["05-01.png", "05-02.png"], "아니요": ["06-01.png", "06-02.png"], "도와주세요": ["07-01.png", "07-02.png", "07-03.png"], "다시": ["08-01.png", "08-02.png", "08-03.png"], "천천히": ["09-01.png", "09-02.png", "09-03.png"], "이해했어요": ["10-01.png", "10-02.png", "10-03.png"], "물": ["11-01.png", "11-02.png"], "화장실": ["12-01.png", "12-02.png"]};
const SHEET_BASE = new URL('../assets/sheets/', import.meta.url).href;
const JAMO = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ','ㅘ','ㅚ','ㅙ','ㅝ','ㅞ','ㅟ','ㅢ'];
const ROWS = [[20,160],[235,155],[433,150],[625,155],[820,140]];
const DOUBLE = {'ㄲ':[30,30,330,250],'ㄸ':[390,70,390,180],'ㅃ':[810,20,300,245],'ㅆ':[1160,20,365,245],'ㅉ':[20,395,400,155]};
export function jamoArt(jamo) {
  const i = JAMO.indexOf(jamo), pair = DOUBLE[jamo];
  if (i < 0 && !pair) return '';
  const col = i % 7, row = ROWS[Math.floor(i/7)];
  const box = pair ?? [Math.max(0,col*1536/7-5),row[0],Math.min(1536/7+10,1536-col*1536/7),row[1]];
  return `<svg class="sheet-art" viewBox="${box.join(' ')}" role="img" aria-label="${jamo} 지문자 손모양" preserveAspectRatio="xMidYMid meet"><image href="${SHEET_BASE}sheet-${pair?3:2}.png" width="1536" height="1024" /></svg>`;
}
export function wordArt(word, step = 0) {
  const frames = POSES[word];
  if (!frames) return '';
  const index = Math.max(0, Math.min(step, frames.length - 1));
  return `<img class="word-pose" src="${STEP_BASE}${frames[index]}" alt="${word} 동작 ${index + 1}" decoding="async" data-frame="${index + 1}">`;
}
export const WORD_POSE_FILES = POSES;
