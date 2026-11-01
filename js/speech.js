/* speech.js — 음성을 글자로, 글자를 음성으로.
 *
 * 둘 다 브라우저 표준 기능만 쓴다. 서버로 나가는 음성이 없다.
 * SpeechRecognition은 크롬·엣지 계열에만 있으므로, 없으면 직접 입력으로 떨어진다.
 */

const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null;

export const support = {
  listen: Boolean(SR),
  speak: typeof globalThis.speechSynthesis !== 'undefined'
};

export function createListener({ lang = 'ko-KR', onInterim, onResult, onEnd, onError } = {}) {
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  rec.onresult = e => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t; else interim += t;
    }
    if (interim && onInterim) onInterim(interim);
    if (final && onResult) onResult(final.trim());
  };
  rec.onerror = e => onError?.(e.error);
  rec.onend = () => onEnd?.();

  return {
    start() { try { rec.start(); } catch { /* 이미 듣는 중 */ } },
    stop() { try { rec.stop(); } catch { /* 이미 멈춤 */ } }
  };
}

let voice = null;
function pickVoice() {
  if (!support.speak) return null;
  const all = speechSynthesis.getVoices();
  return all.find(v => v.lang === 'ko-KR') || all.find(v => v.lang?.startsWith('ko')) || null;
}
if (support.speak) {
  speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
  voice = pickVoice();
}

/** 한국어 목소리가 깔려 있는가. 없으면 읽기는 하되 소리가 안 나거나 어색하다. */
export function hasKoreanVoice() {
  return support.speak && Boolean(voice ?? pickVoice());
}

export function speak(text, { rate = 0.95 } = {}) {
  if (!support.speak || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = rate;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
