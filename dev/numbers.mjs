#!/usr/bin/env node
/* 소개 페이지와 README 에 적힌 숫자를 실제 데이터에서 센다.
 *
 * 낱말, 문장, 지문자, 자유 모드가 읽는 낱말 수는 데이터가 늘 때마다 바뀐다. 손으로 고치면 낡는다
 * (11/10 점검: README 의 '문장 48개', '지문자 28자'). 앱 화면(자유 모드 안내, 자료 대화상자)은
 * 데이터에서 바로 세어 보이고, 정적 문서는 이 스크립트가 같은 수로 고친다.
 *
 *   node dev/numbers.mjs           소개 페이지와 README 의 숫자를 지금 데이터로 고쳐 쓴다
 *   node dev/numbers.mjs --check   맞는지만 본다(교차검증)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { WORD_SIGNS } from '../js/words.js';
import { PHRASE_GROUPS, phrasePlan } from '../js/phrases.js';
import { readableSigns } from '../js/signReader.js';
import { CONSONANTS, VOWELS, MOTION_LETTERS, ALL_POSES } from '../js/jamoData.js';

const CHECK = process.argv.includes('--check');
const ROOT = new URL('..', import.meta.url);

const { ok, skipped } = readableSigns(WORD_SIGNS);
const compound = VOWELS.filter(v => 'ㅘㅙㅚㅝㅞㅟㅢ'.includes(v.jamo)).length;
const N = {
  words: WORD_SIGNS.length,
  // 앱의 '문장으로 이어 연습하기'는 그림이 모두 이어진 문장만 보인다
  phrases: PHRASE_GROUPS.flatMap(g => g.texts).filter(t => phrasePlan(t).ready).length,
  jamo: ALL_POSES.length,
  consonants: CONSONANTS.length,
  vowels: VOWELS.length - compound,
  compound,
  doubles: MOTION_LETTERS.length,
  free: ok.length,
  freeSkipped: skipped.length,
  still: ALL_POSES.filter(p => !p.motion && !p.parts).length   // selftest 가 보는 한 손 정지 자모
};

/* [파일, 찾을 글(숫자 자리는 (\d+)), 그 자리에 들어갈 수 이름들] */
const RULES = [
  ['landing.html', /<dt>낱말<\/dt><dd>(\d+)<small>/, ['words']],
  ['landing.html', /<dt>상황별 문장<\/dt><dd>(\d+)<small>/, ['phrases']],
  ['landing.html', /<dt>지문자<\/dt><dd>(\d+)<small>/, ['jamo']],
  ['landing.html', /<dt>자유 모드로 읽는 낱말<\/dt><dd>(\d+)<small>/, ['free']],
  ['landing.html', /id="chart-title" data-reveal>지문자 (\d+)자</, ['jamo']],
  ['landing.html', /aria-label="지문자 (\d+)자"/, ['jamo']],
  ['landing.html', /자음 (\d+)자와 모음 (\d+)자에 복합모음 (\d+)자와 쌍자음 (\d+)자를/, ['consonants', 'vowels', 'compound', 'doubles']],
  ['landing.html', /자유 모드는 낱말 (\d+)개 가운데 (\d+)개만/, ['words', 'free']],
  ['README.md', /국립국어원 한국수어사전 표제어 낱말 (\d+)개/, ['words']],
  ['README.md', /상황별 한국어 표현 (\d+)개/, ['phrases']],
  ['README.md', /한글 지문자 (\d+)자\(자음 (\d+) \+ 모음 (\d+) \+ 복합모음 (\d+) \+ 쌍자음 (\d+)\)/, ['jamo', 'consonants', 'vowels', 'compound', 'doubles']],
  ['README.md', /낱말 (\d+)개 중 (\d+)개를 읽고, (\d+)개 모두/, ['words', 'free', 'free']],
  ['README.md', /손가락 조건이 없는 동작이 있는 (\d+)개는/, ['freeSkipped']],
  ['README.md', /자모 (\d+)개를 받아 적어/, ['jamo']],
  ['README.md', /jamoData\.js +지문자 (\d+)자/, ['jamo']],
  ['README.md', /한 손으로 멈춰 짓는 (\d+)자/, ['still']]
];

const files = new Map();
const read = f => files.get(f) ?? files.set(f, readFileSync(new URL(f, ROOT), 'utf8')).get(f);
const wrong = [];
for (const [f, re, keys] of RULES) {
  const text = read(f);
  const m = text.match(re);
  if (!m) { wrong.push(`${f}: '${re.source}' 자리를 찾지 못했습니다(문장을 고쳤으면 이 목록도 고치세요)`); continue; }
  const want = keys.map(k => N[k]);
  const have = m.slice(1).map(Number);
  if (want.every((v, i) => v === have[i])) continue;
  wrong.push(`${f}: ${m[0].slice(0, 60)} → ${want.join(', ')}`);
  let i = 0;
  files.set(f, text.replace(re, all => all.replace(/\d+/g, d => (i < want.length ? String(want[i++]) : d))));
}

console.log(`데이터: 낱말 ${N.words}, 문장 ${N.phrases}, 지문자 ${N.jamo}(자음 ${N.consonants} 모음 ${N.vowels} 복합모음 ${N.compound} 쌍자음 ${N.doubles}), 자유 모드 ${N.free}(안 읽음 ${N.freeSkipped})`);
const missing = wrong.filter(w => w.includes('찾지 못했습니다'));
if (CHECK || missing.length) {
  for (const w of wrong) console.log('  ✕ ' + w);
  if (wrong.length) { console.log(CHECK ? 'node dev/numbers.mjs 로 고쳐 쓰세요' : ''); process.exit(1); }
  console.log('소개 페이지와 README 의 숫자가 데이터와 같습니다');
} else {
  for (const [f, text] of files) if (text !== readFileSync(new URL(f, ROOT), 'utf8')) writeFileSync(new URL(f, ROOT), text);
  for (const w of wrong) console.log('  고침 ' + w);
  if (!wrong.length) console.log('고칠 숫자가 없습니다');
}
