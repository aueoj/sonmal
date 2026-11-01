import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { WORD_SIGNS, lookupWord, planUtterance } from '../js/words.js';
const words = s => planUtterance(s).map(x => x.sign?.word ?? `spell:${x.text}`);
assert.equal(WORD_SIGNS.length, 33);
assert.deepEqual(words('나는 너를 사랑해!'), ['나', '너', '사랑']);
assert.deepEqual(words('배가   고파요. 화나요 슬퍼요'), ['배고파', '화나', '슬퍼']);
assert.deepEqual(words('화장실은 어디예요?'), ['화장실', '어디']);
assert.deepEqual(words('이것 좋아요'), ['여기', '좋아']);
assert.deepEqual(words('한 번 더 천천히'), ['다시', '천천히']);
assert.deepEqual(words('나무 물리학'), ['spell:나무', 'spell:물리학']);
assert.deepEqual(words('저것'), ['spell:저것']);
assert.deepEqual(words(''), []);
assert.equal(lookupWord('싫어요').word, '싫어');
for (const w of WORD_SIGNS) {
 assert.equal(w.recognizable, false);
 assert.match(w.entryNo, /^\d+$/);
 assert.ok(w.sourceEntries.length && w.steps.length);
 assert.ok(existsSync(new URL(`../assets/word/sheet-${w.art.sheet}.png`, import.meta.url)));
 for (const a of [w.word, ...w.aliases]) assert.equal(lookupWord(a), w);
}
console.log('33개 낱말·활용형·문장 분할·출처·이미지 연결 검사 통과');
