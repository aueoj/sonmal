/* handRenderer.js — 자모의 손모양 그림을 내놓는다.
 *
 * 그림은 사용자가 제공한 지문자 도표를 자모별로 잘라 둔 것을 그대로 쓴다
 * (assets/jamo/*.png, dev/slice-assets.py 가 만든다).
 * 자세 데이터(jamoData.js)는 그림을 그리는 데 쓰지 않고 인식에만 쓴다.
 * 즉 보이는 것은 도표 원본이고, 판정은 데이터가 한다.
 */

/* 경로는 이 모듈 위치를 기준으로 잡는다. 그래야 앱(/)에서도
   개발용 컨택트 시트(/dev/)에서도 같은 주소로 풀린다. */
const BASE = new URL('../assets/jamo/', import.meta.url).href;
const WORD_BASE = new URL('../assets/word/', import.meta.url).href;

/* 40자 모두 제 그림이 있다. 쌍자음은 손 두 개로 그려져 있어 화살표가 필요 없다. */
const imageFor = pose => `${BASE}${encodeURIComponent(pose.jamo)}.png`;

/**
 * @param {object} pose jamoData의 자세 레코드
 * @param {{size?:number}} opts
 * @returns {string} HTML
 */
export function renderHand(pose, opts = {}) {
  const size = opts.size ?? 240;
  const alt = `${pose.jamo} 지문자 손모양. ${pose.note}`;
  const arrow = '';
  return `<span class="sm-hand" style="--sm-size:${size}px">
    <img src="${imageFor(pose)}" alt="${alt}" width="${size}" height="${size}" loading="lazy" decoding="async">
    ${arrow}
  </span>`;
}

/** 단어 수어 그림. 도표의 동작 연속 그림을 그대로 쓴다. */
export function renderWordSign(sign) {
  if (sign.art) {
    const { sheet, cell } = sign.art;
    return `<span class="word-sprite" role="img" aria-label="${sign.word} 수어 참고 일러스트. ${sign.수형}"
      style="background-image:url('${WORD_BASE}sheet-${sheet}.png');background-position:${(cell % 3) * 50}% ${Math.floor(cell / 3) * 100}%"></span>`;
  }
  return `<img class="sm-word" src="${WORD_BASE}${encodeURIComponent(sign.word)}.png"
    alt="${sign.word} 수어. ${sign.수형}" loading="lazy" decoding="async">`;
}

export const ASSET_BASE = BASE;
