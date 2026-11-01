/* 왼손 전환이 그림과 판정 양쪽에 걸리는지, 지문자가 조작 없이 흐르는지 */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => {
  window.__spoken = [];
  const U = window.SpeechSynthesisUtterance;
  window.SpeechSynthesisUtterance = function (t) { const u = new U(t); u.__t = t; return u; };
  const o = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = u => { window.__spoken.push(u.__t ?? u.text); try { o(u); } catch {} };
});
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });

// 왼손 전환
await p.click('#hand-left');
const left = await p.evaluate(() => ({
  body: document.body.dataset.hand,
  checked: document.getElementById('hand-left').getAttribute('aria-checked'),
  art: getComputedStyle(document.querySelector('.guide-art img, .guide-art .sheet-art') || document.body).transform
}));
console.log('왼손 전환 → body', left.body, '| 그림 transform', left.art);
await p.click('#hand-right');

// 지문자: 조작 없이 끝까지 흐르는가
await p.fill('#typed', '과자');
await p.press('#typed', 'Enter');
await p.click('#btn-cam');
await p.waitForFunction(() => document.querySelectorAll('#seq .unit[data-state="done"]').length >= 4,
  null, { timeout: 25000 }).catch(() => {});
await p.waitForTimeout(600);
const r = await p.evaluate(() => ({
  done: document.querySelectorAll('#seq .unit[data-state="done"]').length,
  total: document.querySelectorAll('#seq .unit[data-i]').length,
  spoken: window.__spoken, step: document.querySelector('#guide-step').textContent
}));
console.log(`지문자 '과자' → ${r.done}/${r.total} 조작 없이 진행`);
console.log('읽어 준 말   ', JSON.stringify(r.spoken));
console.log('오류         ', errs.length ? errs.slice(0,2) : '없음');
await p.screenshot({ path: '/tmp/claude-0/-home-user-sonmal/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/spell.png' });
await b.close();
