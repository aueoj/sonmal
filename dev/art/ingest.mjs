/* 새 단어 그림을 받아 앱에 붙인다.
 *
 *   assets/incoming/sl<표제어번호>-<장>.png   예) sl2372-01.png, sl2372-02.png
 *
 *   node dev/art/ingest.mjs            들어온 것을 검사만 한다
 *   node dev/art/ingest.mjs --apply    검사를 통과한 단어를 옮기고 wordArt.js·manifest 를 새로 쓴다
 *   node dev/art/ingest.mjs --check    지금 연결된 그림 파일이 다 있는지, 남는 파일은 없는지 본다
 *
 * 받는 조건
 *   - 표제어 번호가 js/wordBank.js 에 있고 status 가 'ok' 다
 *   - 그 단어의 장 수가 steps 수와 같다 (한 장이라도 빠지면 그 단어는 통째로 보류)
 *   - PNG 이고 가로가 세로보다 길다 (지금 그림과 같은 3:2 가로형)
 * 손 모양이 사전과 맞는지는 기계가 판단하지 못한다. 옮기기 전에 사람이 본다(docs/WORD-AUDIT.md).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { WORD_BANK } from '../../js/wordBank.js';
import { WORD_FRAMES, WORD_BASIS } from '../../js/wordArt.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const IN = ROOT + 'assets/incoming/';
const OUT = ROOT + 'assets/word-steps/';
const APPLY = process.argv.includes('--apply');
const CHECK = process.argv.includes('--check');

const pngSize = buf => buf.readUInt32BE(0) === 0x89504e47
  ? { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) } : null;

function writeArt(frames, basis) {
  const head = readFileSync(ROOT + 'js/wordArt.js', 'utf8').split('\nexport const WORD_FRAMES')[0];
  writeFileSync(ROOT + 'js/wordArt.js',
    `${head}\nexport const WORD_FRAMES = ${JSON.stringify(frames)};\nexport const WORD_BASIS = ${JSON.stringify(basis)};\n`);
  const old = JSON.parse(readFileSync(OUT + 'manifest.json', 'utf8'));
  const oldStep = new Map(old.frames.map(f => [`${f.slug}.png`, f.step]));
  const bank = new Map(WORD_BANK.map(w => [w.word, w]));
  const list = [];
  for (const [word, files] of Object.entries(frames)) files.forEach((f, i) => list.push({
    word, slug: f.replace(/\.png$/, ''), frame: i + 1, total: files.length, basis: basis[word],
    step: basis[word] === 'sldict' ? bank.get(word).steps[i] : (oldStep.get(f) ?? ''),
    ...(basis[word] === 'sldict' ? { entryNo: bank.get(word).entryNo } : {})
  }));
  writeFileSync(OUT + 'manifest.json', JSON.stringify({
    source: 'sldict: 국립국어원 한국수어사전 기준으로 그려 검수함 · legacy: 처음 받은 도표 기반(사전 대조 전)',
    frames: list }, null, 2) + '\n');
}

if (CHECK) {
  const used = new Set(Object.values(WORD_FRAMES).flat());
  const bad = [...used].filter(f => !existsSync(OUT + f));
  const orphan = readdirSync(OUT).filter(f => f.endsWith('.png') && !used.has(f));
  for (const f of bad) console.log('  ✕ 연결됐는데 파일이 없다:', f);
  for (const f of orphan) console.log('  · 아무 데도 안 쓰는 파일:', f);
  const n = Object.values(WORD_BASIS).filter(b => b === 'sldict').length;
  console.log(`그림 연결 ${Object.keys(WORD_FRAMES).length}단어 · 사전 기준 ${n} · 옛 그림 ${Object.keys(WORD_FRAMES).length - n}`);
  process.exit(bad.length ? 1 : 0);
}

if (!existsSync(IN)) mkdirSync(IN, { recursive: true });
const files = readdirSync(IN).filter(f => !f.startsWith('.'));
const groups = new Map();
for (const f of files) {
  const m = /^sl(\d+)-(\d{2})\.png$/i.exec(f);
  if (!m) { console.log(`  ✕ ${f}: 이름이 sl<번호>-<장>.png 꼴이 아니다`); continue; }
  if (!groups.has(m[1])) groups.set(m[1], []);
  groups.get(m[1]).push({ f, i: Number(m[2]) });
}
if (!groups.size) { console.log('assets/incoming/ 에 받을 그림이 없다'); process.exit(0); }

const frames = structuredClone(WORD_FRAMES), basis = structuredClone(WORD_BASIS);
let ready = 0, held = 0;
for (const [no, got] of groups) {
  const w = WORD_BANK.find(x => x.entryNo === no);
  const why = [];
  if (!w) why.push(`표제어 ${no} 가 wordBank 에 없다`);
  else {
    if (w.status !== 'ok') why.push(`「${w.word}」는 확인이 끝나지 않았다 (${w.메모 ?? w.status})`);
    const want = w.steps.length, idx = got.map(g => g.i).sort((a, b) => a - b);
    if (idx.join() !== Array.from({ length: want }, (_, k) => k + 1).join())
      why.push(`「${w.word}」는 ${want}장이어야 하는데 ${idx.join(', ')} 장이 왔다`);
    for (const g of got) {
      const sz = pngSize(readFileSync(IN + g.f));
      if (!sz) why.push(`${g.f} 가 PNG 가 아니다`);
      else if (sz.w <= sz.h) why.push(`${g.f} 가 세로형이다 (${sz.w}x${sz.h})`);
    }
  }
  if (why.length) { held++; for (const s of why) console.log('  · 보류 ' + s); continue; }
  ready++;
  const names = got.sort((a, b) => a.i - b.i).map(g => g.f.toLowerCase());
  console.log(`  ✓ 「${w.word}」 ${names.length}장`);
  if (APPLY) {
    // 옛 그림은 지운다. 같은 단어에 옛 그림과 새 그림이 섞여 보이지 않게 한다.
    for (const f of frames[w.word] ?? []) if (WORD_BASIS[w.word] === 'legacy' && existsSync(OUT + f)) unlinkSync(OUT + f);
    for (const g of got) renameSync(IN + g.f, OUT + g.f.toLowerCase());
    frames[w.word] = names; basis[w.word] = 'sldict';
  }
}
if (APPLY && ready) {
  // wordBank 순서대로 정렬해 칩 순서가 흔들리지 않게 한다
  const order = [...WORD_BANK.map(w => w.word), ...Object.keys(frames)];
  const sorted = {}, sortedBasis = {};
  for (const word of order) if (frames[word] && !sorted[word]) { sorted[word] = frames[word]; sortedBasis[word] = basis[word]; }
  writeArt(sorted, sortedBasis);
  console.log(`\n${ready}단어를 붙였다. node dev/stamp.mjs 로 판 번호를 올린다.`);
} else console.log(`\n받을 수 있음 ${ready} · 보류 ${held}${ready && !APPLY ? ' · --apply 로 붙인다' : ''}`);
