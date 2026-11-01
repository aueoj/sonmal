/* 글자 단위로 읽어 주는지, 단어는 움직여야 읽는지 확인한다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => {
  window.__spoken = [];
  const U = window.SpeechSynthesisUtterance;
  window.SpeechSynthesisUtterance = function (t) { const u = new U(t); u.__t = t; return u; };
  const o = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = u => { window.__spoken.push(u.__t ?? u.text); try { o(u); } catch {} };
});
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });

// 지문자: 글자마다 한 번씩 읽어야 한다
await p.fill('#typed', '과자나라'); await p.press('#typed', 'Enter');
await p.click('#btn-cam');
await p.waitForFunction(() => window.__spoken.length >= 4, null, { timeout: 40000 }).catch(() => {});
const spell = await p.evaluate(() => window.__spoken.slice());
console.log('지문자 과자나라 →', JSON.stringify(spell));
console.log('  글자 단위인가:', JSON.stringify(spell.slice(0,4)) === JSON.stringify(['과','자','나','라']) ? '예' : '← 아님');

// 단어: 움직이지 않으면 읽지 않아야 한다
await p.evaluate(() => { window.__spoken.length = 0; });
await p.click('.chip[data-word="물"]');
await p.evaluate(() => { if (window.__t) {} });
await p.waitForTimeout(2800);
const stillMoving = await p.evaluate(() => window.__spoken.slice());
console.log('단어 "물" 움직이며 →', JSON.stringify(stillMoving), stillMoving.includes('물') ? '읽음' : '← 안 읽음');

// 다 하고 나서 다시 처음으로 돌아가는가
await p.evaluate(() => { window.__spoken.length = 0; });
await p.waitForTimeout(4500);
console.log('이어서 반복 →', JSON.stringify(await p.evaluate(() => window.__spoken.slice())));
console.log('오류:', errs.length ? errs.slice(0,2) : '없음');
await b.close();
