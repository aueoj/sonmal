/* 자유 모드: 고르지 않고 한 수어를 읽어 바로 소리로 들려주는가.
   - 들어가자마자 아무 말도 하지 않는다(둘러보기의 합성 손이 연습 자세를 들고 있지 않다)
   - 한 낱말을 마치고 손을 내리면 그 낱말을 읽는다
   - '좋아요'(코 앞 주먹)와 '자다'(뺨 옆 주먹)를 가른다
   - 판정이 같은 낱말('내일'과 '어제')은 후보만 보이고 소리는 내지 않는다
   - 지문자로 바꾸면 자모를 받아 적어 글자로 읽는다
   - 말 고르기에서 고르면 연습 모드로 돌아가 그 말을 연습한다 */
import { launch } from './browser.mjs';
import { WORD_BANK } from '../js/wordBank.js';

const checks = w => WORD_BANK.find(x => x.word === w).check;
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => {
  window.__spoken = [];
  const o = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = u => { window.__spoken.push(u.text); try { o(u); } catch {} };
});
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForSelector('.camera.live', { timeout: 20000 });
await p.click('#mode-free');
await p.waitForTimeout(1500);
const spoken = () => p.evaluate(() => window.__spoken.slice());
const clearSpoken = () => p.evaluate(() => { window.__spoken.length = 0; });
const idle = { spoken: await spoken(), name: await p.textContent('#guide-name') };

async function sign(word) {
  await clearSpoken();
  const cs = checks(word);
  for (let i = 0; i < cs.length; i++) {
    await p.evaluate(([c, moving]) => window.__sonmalMockCheck(c, moving), [cs[i], i > 0]);
    await p.waitForTimeout(950);
  }
  await p.evaluate(() => window.__sonmalMockCheck(null));
  await p.waitForTimeout(1300);
  return { spoken: await spoken(), name: await p.textContent('#guide-name'),
    log: await p.$$eval('#free-log li', ls => ls.map(l => (l.dataset.unsure ? '?' : '') + l.textContent)) };
}

const rows = [];
const expect = (label, ok, got) => rows.push({ label, ok, got });
expect('들어가자마자 말하지 않는다', idle.spoken.length === 0 && idle.name === '수어를 해 보세요', JSON.stringify(idle));
for (const w of ['괜찮아요', '좋아요', '자다']) {
  const r = await sign(w);
  expect(`${w} 를 읽고 들려준다`, r.spoken.includes(w) && r.name === w, JSON.stringify(r));
}
{
  const r = await sign('내일');
  expect('내일/어제 는 후보만 보이고 말하지 않는다', r.spoken.length === 0 && /내일/.test(r.name) && /어제/.test(r.name), JSON.stringify(r));
}
// 지문자: ㅁ ㅜ ㄹ → 물
await p.click('#read-jamo');
await p.evaluate(() => window.__sonmalMock(null)); await clearSpoken();
for (const j of ['ㅁ', 'ㅜ', 'ㄹ']) {
  await p.evaluate(j => window.__sonmalMock(j), j); await p.waitForTimeout(1100);
  await p.evaluate(() => window.__sonmalMock(null)); await p.waitForTimeout(300);
}
await p.waitForTimeout(2800);
expect('지문자 ㅁㅜㄹ 을 물로 읽는다', (await spoken()).includes('물'), JSON.stringify(await spoken()));
// 말 고르기에서 고르면 연습 모드로
await p.click('#ref-toggle'); await p.click('#ref-words [data-say="보다"]'); await p.waitForTimeout(400);
const back = await p.evaluate(() => ({ mode: document.body.dataset.mode, name: document.getElementById('guide-name').textContent }));
expect('고르면 연습 모드로 그 말을 연습한다', back.mode === 'practice' && back.name.startsWith('보다'), JSON.stringify(back));

for (const r of rows) console.log(`${r.ok ? '✓' : '✕'} ${r.label}${r.ok ? '' : '\n    ' + r.got}`);
if (errs.length) console.log('오류', errs);
await b.close();
process.exit(rows.every(r => r.ok) && !errs.length ? 0 : 1);
