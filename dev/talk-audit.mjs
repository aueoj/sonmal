/* 대화 모드: 내가 한 말이 크게 보이고 오간 말에 적히는가,
   상대가 지문자를 하면 받아 적어 글자로 합치고 소리로 읽어 주는가. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => {
  window.__spoken = [];
  const o = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = u => { window.__spoken.push(u.text); try { o(u); } catch {} };
});
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForSelector('.camera.live', { timeout: 20000 });
await p.click('#mode-talk');
await p.fill('#typed', '천천히 해 주세요'); await p.press('#typed', 'Enter');
await p.waitForTimeout(400);
const mine = await p.evaluate(() => document.getElementById('talk-said').textContent);

await p.click('#read-toggle');
await p.evaluate(() => window.__sonmalMock(null));
await p.waitForTimeout(400);
for (const j of ['ㅁ', 'ㅜ', 'ㄹ']) {
  await p.evaluate(j => window.__sonmalMock(j), j); await p.waitForTimeout(1100);
  await p.evaluate(() => window.__sonmalMock(null)); await p.waitForTimeout(300);
}
await p.waitForTimeout(2800);
const r = await p.evaluate(() => ({
  log: [...document.querySelectorAll('#talk-log li')].map(l => l.dataset.who + ':' + l.textContent.slice(l.dataset.who.length)),
  spoken: window.__spoken
}));
console.log(`내가 한 말 크게: "${mine}"`);
console.log('오간 말', JSON.stringify(r.log));
console.log('읽어 준 소리', JSON.stringify(r.spoken.slice(-2)));
console.log('오류', errs.length ? errs : '없음');
await b.close();
const ok = mine === '천천히 해 주세요' && r.log.includes('상대:물') && r.spoken.includes('물') && !errs.length;
process.exit(ok ? 0 : 1);
