/* 말 맞추기 골든 마스터 — 지금 matchToken 과 planUtterance 가 내는 답을 그대로 박아 둔다.
 *
 * morph-test 는 '찾아야 할 낱말'만 본다. 못 찾았을 때 지문자로 풀 앞부분(stem)과
 * 여러 겹 떼기·활용 되돌리기의 순서는 보지 않는다. words.js 를 다듬을 때 이 답이
 * 하나라도 바뀌면 동작이 바뀐 것이다.
 *
 *   node dev/match-golden-test.mjs           박아 둔 답과 견준다
 *   node dev/match-golden-test.mjs --write   지금 답으로 다시 박는다(동작을 일부러 바꿨을 때만)
 *
 * 말 묶음: 화면 낱말과 그 다른 표현마다 조사·어미를 하나 또는 둘 붙인 꼴, 연습 문장의
 * 어절, 사전에 없는 말. 답이 많아 낱말별 해시로 남기고, 틀리면 그 낱말의 지금 답을 보인다.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { matchToken, planUtterance, WORD_SIGNS } from '../js/words.js';
import { PHRASE_GROUPS } from '../js/phrases.js';

const FILE = new URL('./match-golden.json', import.meta.url);
const WRITE = process.argv.includes('--write');

// 붙여 볼 꼬리. words.js 의 목록과 같을 필요는 없다(말 묶음을 넓히는 데만 쓴다)
const TAILS = [
  '', '은', '는', '이', '가', '을', '를', '에', '도', '만', '의', '와', '과', '로', '랑', '에서', '에게', '한테', '으로', '이랑', '부터', '까지', '처럼', '보다',
  '요', '다', '서', '고', '며', '면', '해', '죠', '예요', '에요', '네요', '어요', '아요', '해요', '세요', '이야', '이다', '하다', '군요', '지요', '지만', '해서', '어서', '아서',
  '이었어요', '였어요', '했어요', '었어요', '았어요', '이에요', '입니다', '습니다', '합니다',
  '었습니다', '았습니다', '였습니다', '었는데', '았는데', '거예요', '거에요', '건가요', '었어', '았어', '였어', '었다', '았다', '였다', '었지', '았지',
  '었네', '었고', '니까요', '니까', '으면', '는데', '은데', '거야', '건데', '거지', '거죠', '건가', '니다', '어줘', '아줘', '주세요', '게요', '래요', '려고', '나요',
  '을게', '을래', '는다', '거', '것', '게', '네', '래', '자', '지', '니', '냐', '나', '줘', '어', '아', '여',
  '했', '해서요', '하고', '한', '할', '함', '했어', '했다', '합니까'
];
const SECOND = ['', '요', '는', '도', '다', '이에요', '었어요'];
const EXTRA = ['', '글', '금', '날', '그래', '그림', '하나', '여자', '나무', '마음', '만세', '비밀', '비싸요', '노래', '파도', '검사',
  'abc', '123', '가', '나', '다', '하', '해', '사과하다', '노래해요', '서울', '김치', '컴퓨터', '말해', '쓰다', '써요', '돕다', '도와요', '빨개요'];

/* 낱말마다 그 낱말에서 나온 말들. 같은 말이 두 묶음에 들어가도 상관없다(답이 같다) */
function buckets() {
  const out = new Map();
  for (const w of WORD_SIGNS) {
    const tokens = new Set();
    for (const base of [w.word, ...(w.aliases ?? [])]) {
      const bases = [base];
      if (base.length > 1) bases.push(base.slice(0, -1));               // 끝 글자를 뗀 앞부분('만들다' → '만들')
      for (const b of bases) for (const t of TAILS) for (const s of SECOND) tokens.add(b + t + s);
    }
    out.set(`word:${w.word}`, [...tokens]);
  }
  const phraseTokens = new Set();
  for (const g of PHRASE_GROUPS) for (const text of g.texts) for (const t of text.split(/\s+/)) phraseTokens.add(t);
  out.set('phrase-tokens', [...phraseTokens]);
  out.set('extra', EXTRA.flatMap(x => TAILS.slice(0, 30).map(t => x + t)));
  return out;
}

const answerToken = t => { const m = matchToken(t); return `${t}\t${m.sign?.word ?? '-'}\t${m.stem}`; };
const answerText = text => `${text}\t` + planUtterance(text).map(p => `${p.kind}:${p.text}:${p.sign?.word ?? '-'}:${p.stem ?? '-'}`).join('|');
const hash = lines => createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);

const now = {};
const lines = {};
for (const [key, tokens] of buckets()) { lines[key] = tokens.map(answerToken); now[key] = hash(lines[key]); }
const texts = PHRASE_GROUPS.flatMap(g => g.texts);
texts.push('나는 너를 사랑해!', '화장실은 어디야?', '한 번 더 천천히', '배가 고팠어', '안녕히 가세요', '뒤 왼쪽', 'hello 123', '  ', '사과하다 사과');
lines['plan:texts'] = texts.map(answerText);
now['plan:texts'] = hash(lines['plan:texts']);
const count = Object.values(lines).reduce((s, l) => s + l.length, 0);

if (WRITE) {
  writeFileSync(FILE, JSON.stringify({ count, buckets: now }, null, 1) + '\n');
  console.log(`골든 답 ${count}개를 ${Object.keys(now).length}묶음으로 박았습니다`);
  process.exit(0);
}
if (!existsSync(FILE)) { console.log('dev/match-golden.json 이 없습니다. --write 로 먼저 박으세요'); process.exit(1); }
const want = JSON.parse(readFileSync(FILE, 'utf8'));
const bad = Object.keys({ ...want.buckets, ...now }).filter(k => want.buckets[k] !== now[k]);
if (want.count !== count) bad.unshift(`(답 수 ${want.count} → ${count})`);
if (!bad.length) { console.log(`말 맞추기 답 ${count}개가 박아 둔 것과 같습니다`); process.exit(0); }
console.log(`말 맞추기 답이 바뀐 묶음 ${bad.length}개`);
for (const k of bad.slice(0, 5)) {
  console.log(`  ✕ ${k}`);
  for (const l of (lines[k] ?? []).slice(0, 12)) console.log('      ' + l.replace(/\t/g, ' → '));
}
process.exit(1);
