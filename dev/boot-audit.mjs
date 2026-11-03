/* 화면이 제대로 뜨는지, 빠진 파일이나 콘솔 오류가 없는지 본다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
p.on('requestfailed', r => errs.push('요청 실패 ' + r.url().split('/').slice(-2).join('/')));
await p.goto('http://localhost:8777/index.html', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);

const r = await p.evaluate(() => ({
  chart: document.querySelectorAll('.chart button').length,
  words: document.querySelectorAll('#ref-words [data-say]').length,
  art: document.getElementById('guide-art').innerHTML.length,
  name: document.getElementById('guide-name').textContent,
  seq: document.querySelectorAll('#seq .unit').length,
  missing: ['camera','guide','guide-art','guide-name','seq','say-form','btn-listen','typed',
            'ref-toggle','ref-words','hand-right','hand-left','diag','spoken','btn-cam','btn-demo']
           .filter(id => !document.getElementById(id))
}));
console.log(`차트 ${r.chart}장 · 낱말 ${r.words}개 · 시퀀스 ${r.seq}칸 · 가이드 "${r.name}"`);
console.log('없는 요소:', r.missing.length ? r.missing : '없음');
console.log('오류:', errs.length ? errs.slice(0, 5).join('\n  ') : '없음');

const bad = errs.length || r.missing.length || r.chart < 40 || r.words < 12 || !r.art;
await b.close();
process.exit(bad ? 1 : 0);
