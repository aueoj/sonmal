/* speech.js — 음성을 글자로, 글자를 음성으로.
 *
 * 둘 다 브라우저 표준 기능만 쓴다. 읽어 주기(SpeechSynthesis)는 기기 안에서 끝나지만,
 * 듣기(SpeechRecognition)는 브라우저가 마이크 소리를 음성 인식 서버로 보낸다
 * (크롬은 구글, 사파리는 애플). 화면에도 그렇게 적어 두었다.
 * SpeechRecognition 이 없는 브라우저는 직접 입력으로 떨어진다.
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
 *
 * 말하기를 누르고 첫 마디를 꺼내기까지는 시간이 걸린다. 그 사이를 침묵으로 보고
 * 끊으면 아무 말도 못 하고 끝난다. 그래서 첫 마디 전에는 startMs(5초)를 기다리고,
 * 말이 시작된 뒤부터 silenceMs 동안 말이 없으면 끝낸다.
 *
 * 침묵은 소리가 아니라 인식 결과가 마지막으로 온 때부터 잰다. 아직 확정되지 않은 말(interim)이
 * 남아 있으면 사용자가 말하는 중이거나 서버 응답이 늦는 것이다. 이때 짧게 끊으면 문장 중간에서
 * 잘리므로 pendingMs 까지 기다린다. 다 확정된 뒤에는 silenceMs 로 끝낸다.
 */
export function createListener({ lang = 'ko-KR', silenceMs = 2200, pendingMs = 4500, startMs = 5000,
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
  let failed = false;      // 오류로 끝났다. 뒤따르는 onend 가 오류 안내를 지우지 않게 한다

  const armIdle = (ms = silenceMs) => {
    clearTimeout(idle);
    idle = setTimeout(() => { wanted = false; try { rec.stop(); } catch {} }, ms);
  };

  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) settled += t;
      else interim += t;
    }
    onInterim?.((settled + interim).trim());
    armIdle(interim.trim() ? pendingMs : silenceMs);
  };

  rec.onerror = e => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;   // 흔하고 치명적이지 않다
    wanted = false;
    failed = true;
    onError?.(e.error);
  };

  rec.onend = () => {
    if (wanted) { try { rec.start(); return; } catch { /* 못 이으면 마무리한다 */ } }
    clearTimeout(idle);
    const text = settled.trim();
    settled = '';
    if (text) onResult?.(text);
    // 브라우저는 onerror 다음에 onend 를 부른다. 오류는 onError 가 이미 알렸으니
    // 여기서 onEnd 를 또 부르면 '마이크가 막혀 있습니다' 같은 안내가 곧바로 지워진다
    if (failed) { failed = false; return; }
    onEnd?.();
  };

  return {
    start() {
      settled = ''; wanted = true; failed = false;
      try { rec.start(); armIdle(startMs); } catch { /* 이미 듣는 중 */ }
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

export function speak(text, { rate = 0.95, queue = false, onstart = null } = {}) {
  if (!support.speak || !text) return;
  // 보통은 앞 말을 끊고 읽는다. queue 면 앞 말이 끝난 뒤에 이어 읽는다
  if (!queue) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = rate;
  if (onstart) u.onstart = onstart;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
