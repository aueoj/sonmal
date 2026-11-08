/* 말하기를 누른 뒤 첫 마디 전에는 5초를 기다리고, 말이 시작되면 1.8초 침묵에 끝내는가.
   브라우저의 음성 인식을 가짜로 바꿔 끼워 시간만 잰다.
   진짜 시계로 재면 바쁜 기계에서 타이머가 늦게 돌아 2.5초로 재어 깨졌다. 가짜 시계로 잰다. */
let now = 0, nextId = 0;
const timers = new Map();
globalThis.setTimeout = (fn, ms = 0) => { timers.set(++nextId, { fn, at: now + ms }); return nextId; };
globalThis.clearTimeout = id => { timers.delete(id); };
/** 시계를 ms 만큼 돌리며 그 사이에 때가 된 타이머를 차례로 부른다 */
const wait = ms => {
  const end = now + ms;
  for (;;) {
    const due = [...timers].filter(([, t]) => t.at <= end).sort((p, q) => p[1].at - q[1].at)[0];
    if (!due) break;
    timers.delete(due[0]); now = due[1].at; due[1].fn();
  }
  now = end;
};

class FakeSR {
  constructor() { FakeSR.last = this; this.stops = []; }
  start() { this.t0 = now; }
  stop() { this.stops.push(now - this.t0); setTimeout(() => this.onend?.(), 0); }
}
globalThis.webkitSpeechRecognition = FakeSR;
const { createListener } = await import('../js/speech.js');

const bad = [];

// 1. 아무 말도 안 하면 5초에 끝난다 (그 전에 끊으면 안 된다)
const a = createListener({ onEnd: () => {} });
a.start();
wait(4999);
if (FakeSR.last.stops.length) bad.push(`첫 마디 전인데 ${FakeSR.last.stops[0]}ms 에 끊었다`);
wait(1);
if (!FakeSR.last.stops.length) bad.push('5초가 지나도 끝내지 않았다');
console.log(`말 없이 기다린 시간  ${FakeSR.last.stops[0] ?? '-'}ms`);

// 2. 말이 시작되면 1.8초 침묵에 끝내고, 들은 말을 넘긴다
let got = '';
const b = createListener({ onResult: t => { got = t; } });
b.start();
wait(1000);
const sr = FakeSR.last;
sr.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: '안녕하세요' }], { isFinal: true })] });
const said = now;
wait(2300);
const after = sr.stops.length ? sr.stops[0] - (said - sr.t0) : null;
if (after === null) bad.push('말이 멎은 뒤에도 끝내지 않았다');
else if (after !== 1800) bad.push(`말이 멎고 ${after}ms 만에 끝냈다 (1800ms 여야 한다)`);
if (got !== '안녕하세요') bad.push(`들은 말을 넘기지 못했다: "${got}"`);
console.log(`말이 멎고 끝내기까지  ${after ?? '-'}ms, 넘긴 말 "${got}"`);

for (const s of bad) console.log('  ✕ ' + s);
process.exit(bad.length ? 1 : 0);
