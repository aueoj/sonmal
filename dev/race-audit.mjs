/* 한 낱말을 해낸 직후(다음 칸으로 넘어가기 전 0.42초 사이)에 새 말을 골라도
   새 말의 첫 칸을 건너뛰지 않는가. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForSelector('.camera.live', { timeout: 20000 });
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
process.exit(hit && r.name.startsWith('물') && r.done === 0 && !errs.length ? 0 : 1);
