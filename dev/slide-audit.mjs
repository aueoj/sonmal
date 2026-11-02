import assert from 'node:assert/strict';
import {launch} from './browser.mjs';
const b=await launch();
try {
 const p=await b.newPage({viewport:{width:1280,height:860}});
 await p.goto('http://localhost:8777/index.html?mock=1');
 await p.waitForFunction(()=>typeof window.__sonmalMock==='function');
 for(const [double,base] of Object.entries({'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'})) {
  await p.evaluate(base=>window.__sonmalMock(base),base);
  await p.fill('#typed',double); await p.press('#typed','Enter');
  await p.waitForTimeout(1300);
  assert.equal(await p.locator('#guide-name').textContent(),double);
  assert.equal(await p.locator('#seq [data-state="done"]').count(),0,`${double}: 정지한 기본 자음이 통과하면 안 됨`);
  await p.evaluate(j=>window.__sonmalMock(j),double);
  await p.waitForFunction(()=>document.querySelector('#seq [data-state="done"]'),null,{timeout:5000});
 }
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.fill('#typed','ㄲ');await p.press('#typed','Enter');
 assert.equal(await p.locator('#guide-art .jamo-slide-hand').evaluate(el=>getComputedStyle(el).animationName),'none');
 console.log('쌍자음 5개: 정지 손은 대기, 옆으로 밀면 통과 · 모션 감소 설정 통과');
} finally {await b.close();}
