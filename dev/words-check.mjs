/* 단어 수어가 출처와 그림을 제대로 갖췄는지 본다.
 *
 * 새 단어는 국립국어원 한국수어사전의 표제어 번호와 주소가 없으면 들어올 수 없다.
 * 누가 넣든(코덱스든 사람이든) 출처 없는 수어가 화면에 실리는 것을 여기서 막는다.
 * 처음 들어온 12개는 사용자 도표에서 읽은 것이라 아직 사전 대조 전이다. 경고만 한다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { WORD_SIGNS } from '../js/words.js';
import { WORD_POSE_FILES } from '../js/illustrations.js';

const ROOT = new URL('..', import.meta.url).pathname;
const LEGACY = new Set(['안녕하세요', '감사합니다', '미안합니다', '괜찮아요', '네', '아니요',
  '도와주세요', '다시', '천천히', '이해했어요', '물', '화장실']);
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
  if (w.steps && frames.length && w.steps.length !== frames.length)
    bad.push(`${tag} 동작 설명 ${w.steps.length}개, 그림 ${frames.length}장 — 수가 다르다`);
  for (const f of frames) {
    if (!existsSync(ROOT + 'assets/word-steps/' + f)) bad.push(`${tag} ${f} 파일이 없다`);
    else if (!inManifest.has(f)) warn.push(`${tag} ${f} 가 manifest 에 없다`);
  }
  if (LEGACY.has(w.word)) {
    if (!w.entryNo) warn.push(`${tag} 사전 대조 전 (사용자 도표 기준)`);
    continue;
  }
  const m = SLDICT.exec(w.sourceUrl ?? '');
  if (!w.entryNo || !m) bad.push(`${tag} 국립국어원 한국수어사전 표제어 번호와 주소가 없다`);
  else if (m[1] !== String(w.entryNo)) bad.push(`${tag} 표제어 번호 ${w.entryNo} 와 주소의 ${m[1]} 이 다르다`);
  for (const k of ['수형', '수향', '수위', '수동'])
    if (!w[k]) bad.push(`${tag} ${k}이 비었다`);
}

console.log(`단어 ${WORD_SIGNS.length}개 · 사전 대조 끝 ${WORD_SIGNS.filter(w => w.entryNo).length}개`);
for (const s of warn) console.log('  · ' + s);
for (const s of bad) console.log('  ✕ ' + s);
process.exit(bad.length ? 1 : 0);
