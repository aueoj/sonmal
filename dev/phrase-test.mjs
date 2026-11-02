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
  assert.equal(WORD_FRAMES[part.sign.word].length,part.sign.steps.length);
  for(const file of WORD_FRAMES[part.sign.word]) assert.ok(existsSync(new URL('../assets/word-steps/'+file,import.meta.url)));
 }
}
console.log(`문장 ${seen.size}개: 모든 구성 낱말의 출처·단계별 이미지 연결 통과`);
