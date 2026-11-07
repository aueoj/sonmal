/* 단어 수어가 출처와 그림을 제대로 갖췄는지 본다.
 *
 * 새 단어는 국립국어원 한국수어사전의 표제어 번호와 주소가 없으면 들어올 수 없다.
 * 누가 넣든(코덱스든 사람이든) 출처 없는 수어가 화면에 실리는 것을 여기서 막는다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { WORD_SIGNS } from '../js/words.js';
import { WORD_POSE_FILES } from '../js/illustrations.js';
import { WORD_BANK } from '../js/wordBank.js';
import { SITUATIONS } from '../js/lessons.js';

const ROOT = new URL('..', import.meta.url).pathname;
const SLDICT = /^https:\/\/sldict\.korean\.go\.kr\/front\/sign\/signContentsView\.do\?origin_no=(\d+)/;

const manifest = JSON.parse(readFileSync(ROOT + 'assets/word-steps/manifest.json', 'utf8'));
const inManifest = new Set(manifest.frames.map(f => `${f.slug}.png`));

const bad = [], warn = [];
const owner = new Map();
for (const w of WORD_SIGNS) {
  const tag = `「${w.word}」`;
  // 같은 말이 두 수어를 가리키면 무엇을 띄울지 정해지지 않는다
  for (const k of [w.word, ...(w.aliases ?? [])]) {
    if (owner.has(k) && owner.get(k) !== w.word) bad.push(`${tag} '${k}'가 「${owner.get(k)}」에도 있다`);
    owner.set(k, w.word);
  }
  const frames = WORD_POSE_FILES[w.word] ?? [];
  if (!frames.length) bad.push(`${tag} 그림이 없다`);
  // 한 단계에 여러 장을 번갈아 보이는 낱말(stepFrames)은 그 장 수와 맞춘다
  const wantFrames = w.stepFrames ? Math.max(...w.stepFrames.flat()) + 1 : w.steps?.length;
  if (w.stepFrames && w.stepFrames.length !== w.steps.length) bad.push(`${tag} stepFrames 와 단계 수가 다르다`);
  if (w.steps && frames.length && wantFrames !== frames.length)
    bad.push(`${tag} 동작 설명 ${w.steps.length}개, 그림 ${frames.length}장 — 수가 다르다`);
  for (const f of frames) {
    if (!existsSync(ROOT + 'assets/word-steps/' + f)) bad.push(`${tag} ${f} 파일이 없다`);
    else if (!inManifest.has(f)) warn.push(`${tag} ${f} 가 manifest 에 없다`);
  }
  const m = SLDICT.exec(w.sourceUrl ?? '');
  if (!w.entryNo || !m) bad.push(`${tag} 국립국어원 한국수어사전 표제어 번호와 주소가 없다`);
  else if (m[1] !== String(w.entryNo)) bad.push(`${tag} 표제어 번호 ${w.entryNo} 와 주소의 ${m[1]} 이 다르다`);
  for (const k of ['수형', '수향', '수위', '수동'])
    if (!w[k]) bad.push(`${tag} ${k}이 비었다`);
}

/* 사전 단어 창고도 스스로 맞아야 한다. 그림이 붙기 전부터 본다. */
const seenNo = new Map(), bankOwner = new Map();
for (const w of WORD_BANK) {
  const tag = `창고「${w.word}」`;
  const m = SLDICT.exec(w.sourceUrl ?? '');
  if (!m || m[1] !== w.entryNo) bad.push(`${tag} 항목 번호와 주소가 맞지 않는다`);
  if (seenNo.has(w.entryNo)) bad.push(`${tag} 항목 ${w.entryNo} 가 「${seenNo.get(w.entryNo)}」와 겹친다`);
  seenNo.set(w.entryNo, w.word);
  if (!w.원문) bad.push(`${tag} 사전 원문이 없다`);
  if (!w.steps?.length || w.steps.length !== w.check?.length) bad.push(`${tag} 단계와 판정 힌트 수가 다르다`);
  for (const k of [w.word, ...(w.aliases ?? [])]) {
    if (bankOwner.has(k) && bankOwner.get(k) !== w.word) bad.push(`${tag} '${k}'가 창고「${bankOwner.get(k)}」에도 있다`);
    bankOwner.set(k, w.word);
  }
}

/* 상황 묶음: 화면에 나오는 낱말은 한 묶음에만 속한다 */
const inSit = new Map();
for (const s of SITUATIONS) for (const w of s.words) {
  if (inSit.has(w)) bad.push(`'${w}'가 「${inSit.get(w)}」와 「${s.name}」 두 묶음에 있다`);
  inSit.set(w, s.name);
  if (!WORD_BANK.some(b => b.word === w)) bad.push(`묶음 「${s.name}」의 '${w}'는 사전 창고에 없다`);
}
for (const w of WORD_SIGNS) if (!inSit.has(w.word)) warn.push(`「${w.word}」가 어느 상황 묶음에도 없다 ('그 밖'으로 간다)`);

/* 임시 그림은 실패가 아니지만, 잊히지 않게 매번 알린다 */
for (const w of WORD_BANK) if (w.임시그림) warn.push(`「${w.word}」 임시 그림: ${w.임시그림}`);

console.log(`단어 ${WORD_SIGNS.length}개 · 사전 대조 끝 ${WORD_SIGNS.filter(w => w.entryNo).length}개 · 사전 창고 ${WORD_BANK.length}개`);
for (const s of warn) console.log('  · ' + s);
for (const s of bad) console.log('  ✕ ' + s);
process.exit(bad.length ? 1 : 0);
