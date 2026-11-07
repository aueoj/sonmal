/* 한 낱말을 해낸 직후(다음 칸으로 넘어가기 전 0.42초 사이)에 새 말을 골라도
   새 말의 첫 칸을 건너뛰지 않는가. 손으로 할 글자가 없는 말('2024')은 해냈다고 하지 않는가. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForSelector('.camera.live', { timeout: 20000 });

// 숫자와 라틴 글자는 손모양이 없다. 저절로 건너뛰어 '좋아요'가 뜨면 안 되고, 한글로 입력하라고 해야 한다
const blank = {};
for (const text of ['2024', 'hello']) {
  await p.fill('#typed', text); await p.press('#typed', 'Enter');
  let hitSeen = false;
  for (let i = 0; i < 50; i++) {   // 되풀이(1.4초)보다 길게 본다
    hitSeen ||= await p.evaluate(() => document.querySelector('.guide').dataset.state === 'hit'
      || document.getElementById('guide-step').textContent.includes('좋아요'));
    await p.waitForTimeout(50);
  }
  const step = await p.evaluate(() => document.getElementById('guide-step').textContent);
  blank[text] = !hitSeen && step.includes('한글로 입력해 주세요');
  console.log(`"${text}"  해냄 표시 ${hitSeen}  안내 "${step}"`);
}
// 섞인 말은 손으로 할 칸만 하고 숫자는 건너뛴다
await p.fill('#typed', '나 2024'); await p.press('#typed', 'Enter');
let mixed = false;
for (let i = 0; i < 300 && !mixed; i++) {
  mixed = await p.evaluate(() => document.getElementById('guide-step').textContent.includes('좋아요'));
  if (!mixed) await p.waitForTimeout(40);
}
console.log(`"나 2024"  끝까지 감 ${mixed}`);
let hit = false;
await p.fill('#typed', '나'); await p.press('#typed', 'Enter');
for (let i = 0; i < 200 && !hit; i++) {
  hit = await p.evaluate(() => document.querySelector('.guide').dataset.state === 'hit');
  if (!hit) await p.waitForTimeout(40);
}
// 해낸 바로 그 순간 새 말을 고른다
await p.fill('#typed', '물 나'); await p.press('#typed', 'Enter');
await p.evaluate(() => window.__sonmalMock(null));          // 새 말은 손을 내린 채 둔다
await p.waitForTimeout(900);
const r = await p.evaluate(() => ({
  name: document.getElementById('guide-name').textContent,
  done: document.querySelectorAll('#seq .unit[data-state="done"]').length
}));
console.log(`해낸 순간 잡음 ${hit}  새 말 첫 칸 "${r.name}"  끝난 칸 ${r.done}`);
console.log('오류', errs.length ? errs : '없음');
await b.close();
process.exit(hit && r.name.startsWith('물') && r.done === 0 && blank['2024'] && blank.hello && mixed && !errs.length ? 0 : 1);
