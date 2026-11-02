#!/usr/bin/env node
/* 교차검증 — 한 번에 전부 돌린다.
 *
 * 코덱스가 일러스트와 로직을 밀어 넣는 동안, 사람 눈으로는 알 수 없는
 * 것들을 기계가 반복해서 본다. 손모양이 서로 구별되는가, 조작 없이
 * 흐르는가, 그림이 늘어나지 않는가, 영상과 소리가 새지 않는가.
 *
 *   node dev/verify.mjs              한 바퀴
 *   node dev/verify.mjs --repeat 5   다섯 바퀴 (간헐 실패 잡기)
 *   node dev/verify.mjs --only flow,art
 *
 * 나가는 코드가 0 이 아니면 어딘가 깨졌다는 뜻이다.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = 8777;

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const REPEAT = Math.max(1, Number(arg('--repeat', 1)) || 1);
const ONLY = (arg('--only', '') || '').split(',').filter(Boolean);

/* 서버 없이 되는 것 — 매 바퀴 돌릴 필요가 없다 */
const STATIC = [
  ['쌍자음 수형', ['dev/slide-test.mjs'], '한 손 기본 수형과 밀기 신호를 쓰는가'],
  ['문장 그림', ['dev/phrase-test.mjs'], '문장의 모든 낱말이 출처와 이미지를 갖췄는가'],
  ['판 번호', ['dev/stamp.mjs', '--check'], '파일 주소에 판 번호가 붙어 있는가'],
  ['자모 구별', ['dev/selftest.mjs'], '40개 손모양이 서로 구별되는가'],
  ['단어 출처', ['dev/words-check.mjs'], '새 단어가 사전 번호와 그림을 갖췄는가'],
  ['그림 연결', ['dev/art/ingest.mjs', '--check'], '연결된 그림 파일이 다 있는가'],
  ['말 기다림', ['dev/listen-test.mjs'], '첫 마디 전 5초는 끊지 않는가'],
  ['활용형', ['dev/morph-test.mjs'], '만들었어, 만든거야 같은 말도 기본형 수어로 찾는가'],
  ['낱말 판정', ['dev/word-judge-test.mjs'], '틀린 손모양은 낱말을 통과하지 못하는가'],
  ['읽기', ['dev/reader-test.mjs'], '지은 지문자를 글자로 합쳐 읽는가']
];

/* 브라우저로 봐야 하는 것 */
const BROWSER = [
  ['쌍자음 밀기', ['dev/slide-audit.mjs'], '정지 손은 기다리고 옆으로 밀어야 통과하는가'],
  ['화면', ['dev/boot-audit.mjs'], '뜨는가, 빠진 파일이 없는가'],
  ['흐름', ['dev/flow-audit.mjs'], '조작 없이 넘어가고 읽어 주는가'],
  ['비율', ['dev/aspect-audit.mjs'], '그림이 늘어나거나 눌리지 않는가'],
  ['그림', ['dev/art-audit.mjs'], '단어 그림이 자모 자리에 남지 않는가'],
  ['유출', ['dev/egress-audit.mjs'], '허용한 곳 말고 접속하지 않는가'],
  ['손', ['dev/hand-audit.mjs'], '왼손·오른손 전환이 맞는가'],
  ['되풀이', ['dev/loop-audit.mjs'], '끝나고 다시 처음으로 도는가'],
  ['문장 읽기', ['dev/loop-audit.mjs', '나 물'], '어절마다 읽고 끝에 문장 전체를 읽는가'],
  ['말', ['dev/speech-audit.mjs'], '끊기지 않고 끝까지 듣는가'],
  ['배치', ['dev/layout-audit.mjs'], '가이드가 영상의 1/3을 넘지 않는가'],
  ['진단', ['dev/diag-audit.mjs'], '카메라가 막히면 이유를 말하는가'],
  ['카메라 없이', ['dev/nocam-audit.mjs'], '카메라 없이도 둘러볼 수 있는가'],
  ['숨김', ['dev/hidden-audit.mjs'], 'hidden 이 실제로 숨는가'],
  ['프레임', ['dev/embed-audit.mjs'], '프레임 안에서 무엇이 막히는가'],
  ['대화', ['dev/talk-audit.mjs'], '상대 지문자를 받아 적어 읽어 주는가'],
  ['동작 넘김', ['dev/step-audit.mjs'], '동작을 해내야 다음 그림으로 넘어가는가']
];

const pick = list => list.filter(([name, cmd]) =>
  existsSync(ROOT + cmd[0]) && (!ONLY.length || ONLY.some(o => cmd[0].includes(o) || name === o)));

const run = (cmd) => {
  const t = Date.now();
  const r = spawnSync('node', cmd, { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  return { ok: r.status === 0, ms: Date.now() - t,
           out: ((r.stdout || '') + (r.stderr || '')).trim() };
};

const PAD = 12;
const line = (name, ok, ms, note) =>
  `  ${ok ? '✓' : '✗'} ${name.padEnd(PAD)} ${String(ms).padStart(5)}ms  ${note}`;

let failed = [];
const tally = new Map();   // 이름 -> [통과 횟수, 전체 횟수]
const mark = (name, ok) => {
  const t = tally.get(name) || [0, 0];
  tally.set(name, [t[0] + (ok ? 1 : 0), t[1] + 1]);
};

console.log(`교차검증 · ${new Date().toISOString().slice(0, 19).replace('T', ' ')} · ${REPEAT}바퀴\n`);

/* 1. 서버 없이 */
for (const [name, cmd, note] of pick(STATIC)) {
  const r = run(cmd);
  mark(name, r.ok);
  console.log(line(name, r.ok, r.ms, note));
  if (!r.ok) failed.push([name, r.out]);
}

/* 2. 서버 띄우고 브라우저로 */
const chosen = pick(BROWSER);
let srv = null;
const alive = async () => {
  try { return (await fetch(`http://localhost:${PORT}/index.html`)).ok; } catch { return false; }
};
if (chosen.length) {
  // 이미 누가 띄워 놨으면 그걸 쓴다. 포트를 다투다 서로 죽이는 일을 막는다.
  const already = await alive();
  if (already) console.log(`  (${PORT}번에 이미 서버가 있다 — 그걸 쓴다)`);
  else srv = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', ROOT],
                   { stdio: 'ignore' });
  let up = already;
  for (let i = 0; i < 40 && !up; i++) { await sleep(250); up = await alive(); }
  if (!up) { console.error('\n서버가 뜨지 않았다'); srv?.kill(); process.exit(2); }

  for (let lap = 1; lap <= REPEAT; lap++) {
    if (REPEAT > 1) console.log(`\n${lap}바퀴`);
    for (const [name, cmd, note] of chosen) {
      const r = run(cmd);
      mark(name, r.ok);
      console.log(line(name, r.ok, r.ms, note));
      if (!r.ok) failed.push([`${name} (${lap}바퀴)`, r.out]);
    }
  }
  srv?.kill();
}

/* 3. 결과 */
const flaky = [...tally].filter(([, [p, n]]) => p > 0 && p < n);
console.log('');
if (!failed.length) {
  console.log(`전부 통과 · ${tally.size}가지 × ${REPEAT}바퀴`);
} else {
  console.log(`실패 ${failed.length}건\n`);
  for (const [name, out] of failed) {
    console.log(`── ${name} ──`);
    console.log(out.split('\n').slice(-25).join('\n'));
    console.log('');
  }
  if (flaky.length) {
    console.log('간헐 실패 — 바퀴마다 결과가 달랐다. 실제 버그이거나 점검이 성급하다:');
    for (const [name, [p, n]] of flaky) console.log(`  ${name}: ${p}/${n} 통과`);
  }
}
process.exit(failed.length ? 1 : 0);
