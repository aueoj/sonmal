// 각 파일에는 글자 없는 동작 한 장만 담는다. 도표 전체를 표시하지 않는다.
import { WORD_FRAMES } from './wordArt.js?v=202611021254';
const STEP_BASE = new URL('../assets/word-steps/', import.meta.url).href;
const POSES = WORD_FRAMES;
const SHEET_BASE = new URL('../assets/sheets/', import.meta.url).href;
const JAMO_BOXES = {"ㄱ": [91, 31, 122, 144], "ㄴ": [285, 42, 146, 123], "ㄷ": [489, 51, 149, 110], "ㄹ": [699, 54, 152, 107], "ㅁ": [939, 43, 92, 133], "ㅂ": [1147, 26, 90, 151], "ㅅ": [1338, 31, 109, 140], "ㅇ": [91, 243, 107, 143], "ㅈ": [300, 247, 123, 132], "ㅊ": [506, 246, 124, 136], "ㅋ": [712, 246, 121, 134], "ㅌ": [904, 267, 151, 104], "ㅍ": [1134, 252, 97, 131], "ㅎ": [1332, 251, 120, 127], "ㅏ": [95, 444, 84, 131], "ㅐ": [312, 443, 84, 132], "ㅑ": [520, 444, 82, 131], "ㅒ": [723, 441, 84, 134], "ㅓ": [900, 469, 148, 86], "ㅔ": [1112, 469, 144, 86], "ㅕ": [1320, 469, 155, 86], "ㅖ": [64, 665, 154, 84], "ㅗ": [307, 637, 97, 130], "ㅛ": [515, 633, 94, 135], "ㅜ": [718, 636, 94, 126], "ㅠ": [930, 636, 91, 131], "ㅡ": [1114, 658, 137, 92], "ㅣ": [1352, 645, 86, 122], "ㅘ": [49, 831, 166, 125], "ㅚ": [301, 834, 91, 121], "ㅙ": [474, 833, 163, 123], "ㅝ": [680, 832, 195, 117], "ㅞ": [1086, 828, 208, 128], "ㅟ": [922, 828, 112, 128], "ㅢ": [1335, 850, 130, 89], "ㄲ": [52, 64, 282, 209], "ㄸ": [394, 107, 368, 125], "ㅃ": [824, 49, 274, 210], "ㅆ": [1179, 51, 326, 208], "ㅉ": [33, 417, 373, 128]};
const DOUBLE = new Set(["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"]);
let clipSequence = 0;
export function jamoArt(jamo) {
  const box = JAMO_BOXES[jamo];
  if (!box) return '';
  const pair = DOUBLE.has(jamo);
  // SVG의 종횡비 여백으로 도표의 이웃 글자가 새어 나오지 않게 원본 좌표에서 자른다.
  const clipId = `jamo-art-${++clipSequence}`;
  return `<svg class="sheet-art" viewBox="${box.join(' ')}" role="img" aria-label="${jamo} 지문자 손모양" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" /></clipPath></defs><image href="${SHEET_BASE}sheet-${pair?3:2}.png" width="1536" height="1024" clip-path="url(#${clipId})" /></svg>`;
}
export function wordArt(word, step = 0) {
  const frames = POSES[word];
  if (!frames) return '';
  const index = Math.max(0, Math.min(step, frames.length - 1));
  return `<img class="word-pose" src="${STEP_BASE}${frames[index]}" alt="${word} 동작 ${index + 1}" decoding="async" data-frame="${index + 1}">`;
}

/* 동작을 한 장씩 새로 만들면 넘어갈 때마다 불러오느라 화면이 잠깐 빈다.
   전부 한 번에 만들어 겹쳐 두고 보여 줄 것만 바꾸면 끊기지 않는다. */
export function wordFilm(word) {
  const frames = POSES[word];
  if (!frames) return '';
  return frames.map((f, i) =>
    `<img class="word-pose" src="${STEP_BASE}${f}" alt="${word} 동작 ${i + 1}"
      data-frame="${i}" ${i === 0 ? 'data-on="1"' : ''} decoding="async">`).join('');
}

export function wordFrameCount(word) { return POSES[word]?.length ?? 0; }
export const WORD_POSE_FILES = POSES;
