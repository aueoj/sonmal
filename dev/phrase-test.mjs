import assert from 'node:assert/strict';
import {PHRASE_GROUPS, phrasePlan} from '../js/phrases.js';
import {WORD_FRAMES} from '../js/wordArt.js';
import {existsSync} from 'node:fs';
const seen=new Set();
for(const group of PHRASE_GROUPS) for(const text of group.texts) {
 assert.ok(!seen.has(text));seen.add(text);
 const p=phrasePlan(text);assert.ok(p.ready,text);
 for(const part of p.parts) {
  assert.ok(part.sign.sourceUrl.includes('sldict.korean.go.kr'));
  const want=part.sign.stepFrames?Math.max(...part.sign.stepFrames.flat())+1:part.sign.steps.length;
  assert.equal(WORD_FRAMES[part.sign.word].length,want);
  for(const file of WORD_FRAMES[part.sign.word]) assert.ok(existsSync(new URL('../assets/word-steps/'+file,import.meta.url)));
 }
}
console.log(`문장 ${seen.size}개: 모든 구성 낱말의 출처·단계별 이미지 연결 통과`);

/* 차례: 처음 배우는 사람이 위에서부터 고른다. 낱말 묶음과 문장 묶음 모두 인사가 맨 앞이고,
   앱이 처음 띄우는 낱말(WORD_SIGNS[0])이 첫 낱말 묶음의 첫 낱말이다 */
const { groupByIdea } = await import('../js/lessons.js');
const { WORD_SIGNS } = await import('../js/words.js');
const groups = groupByIdea(WORD_SIGNS);
assert.equal(groups[0].id, 'meet', `첫 낱말 묶음이 '${groups[0].name}'`);
assert.equal(groups[0].signs[0].word, WORD_SIGNS[0].word, '앱이 처음 띄우는 낱말이 첫 묶음의 첫 낱말이 아니다');
assert.equal(PHRASE_GROUPS[0].name, '만나서 인사하기', `첫 문장 묶음이 '${PHRASE_GROUPS[0].name}'`);
console.log(`차례: 첫 낱말 묶음 '${groups[0].name}'(${groups[0].signs[0].word}부터), 첫 문장 묶음 '${PHRASE_GROUPS[0].name}'`);
