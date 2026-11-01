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

/**
 * 문장이 끝날 때까지 듣는다.
 *
 * continuous 를 끄면 말하다 잠깐 쉬는 순간 브라우저가 거기서 끝낸다.
 * 문장형으로 말하면 첫 마디만 잡히므로 계속 듣게 두고, 말이 멎은 뒤
 * 잠깐 기다렸다가 마무리한다. 중간에 브라우저가 멋대로 끝내면 다시 잇는다.
 */
export function createListener({ lang = 'ko-KR', silenceMs = 1800,
                                 onInterim, onResult, onEnd, onError } = {}) {
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;

  let settled = '';        // 지금까지 확정된 말
  let wanted = false;      // 사용자가 아직 듣기를 원하는가
  let idle = null;

  const armIdle = () => {
    clearTimeout(idle);
    idle = setTimeout(() => { wanted = false; try { rec.stop(); } catch {} }, silenceMs);
  };

  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) settled += t;
      else interim += t;
    }
    onInterim?.((settled + interim).trim());
    armIdle();
  };

  rec.onerror = e => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;   // 흔하고 치명적이지 않다
    wanted = false;
    onError?.(e.error);
  };

  rec.onend = () => {
    if (wanted) { try { rec.start(); return; } catch { /* 못 이으면 마무리한다 */ } }
    clearTimeout(idle);
    const text = settled.trim();
    settled = '';
    if (text) onResult?.(text);
    onEnd?.();
  };

  return {
    start() {
      settled = ''; wanted = true;
      try { rec.start(); armIdle(); } catch { /* 이미 듣는 중 */ }
    },
    stop() { wanted = false; clearTimeout(idle); try { rec.stop(); } catch {} },
    get listening() { return wanted; }
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
