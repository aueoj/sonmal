/* 클릭 없이 흘러가는지 확인한다. 단어 칩 한 번 누르는 것 외에는
   아무 조작 없이 읽어 주고 다음으로 넘어가야 한다. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
p.on('requestfailed', r => errs.push('404 ' + r.url().split('/').pop()));
await p.addInitScript(() => {
  window.__spoken = [];
  const U = window.SpeechSynthesisUtterance;
  window.SpeechSynthesisUtterance = function (t) { const u = new U(t); u.__t = t; return u; };
  const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = u => { window.__spoken.push(u.__t ?? u.text); try { orig(u); } catch {} };
});
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);

console.log('칩 개수       ', await p.locator('.chip').count());
console.log('다음 버튼 없음 ', await p.locator('#btn-next').count() === 0);
console.log('검수 전 칩 없음', (await p.content()).includes('검수 전') === false);

// 영역 비율
const m = await p.evaluate(() => {
  const c = document.getElementById('camera').getBoundingClientRect().height;
  const g = document.getElementById('guide').getBoundingClientRect().height;
  const say = document.querySelector('.say').getBoundingClientRect();
  return { cam: Math.round(c), guide: Math.round(g), ratio: +(g / c).toFixed(2),
           sayTop: Math.round(say.top), sayH: Math.round(say.height), win: window.innerHeight };
});
console.log(`카메라 ${m.cam} · 가이드 ${m.guide} → 카메라의 ${(m.ratio*100).toFixed(0)}% ${m.ratio <= 0.34 ? '(1/3 이하)' : '← 1/3 초과'}`);
console.log(`말하기 위치 ${m.sayTop}px (창 ${m.win}) → 세로 ${Math.round(100*m.sayTop/m.win)}% 지점, 높이 ${m.sayH}px`);

// 카메라 켜고 아무것도 안 누르고 기다린다
await p.click('#btn-cam');
await p.waitForTimeout(600);
const before = await p.evaluate(() => document.querySelector('#guide-name').textContent);
await p.waitForTimeout(4200);
const r = await p.evaluate(() => ({
  spoken: window.__spoken,
  name: document.querySelector('#guide-name').textContent,
  read: document.querySelector('#read').textContent
}));
console.log('시작 단어     ', before);
console.log('조작 없이 읽음 ', JSON.stringify(r.spoken));
console.log('콘솔 오류     ', errs.length ? errs.slice(0,3) : '없음');
await p.screenshot({ path: '/tmp/claude-0/-home-user-sonmal/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/flow.png' });
await b.close();
