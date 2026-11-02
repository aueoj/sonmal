/* 여러 동작 낱말: 그림은 내가 동작을 해내야 다음으로 넘어가는가.
   같은 자세로 가만히 있으면 다음 동작으로 치지 않는가. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForSelector('.camera.live', { timeout: 20000 });
const frame = () => p.evaluate(() => document.querySelector('.guide-art .word-pose[data-on]')?.dataset.frame);
const seen = () => p.evaluate(() => document.getElementById('seen').textContent);

// 1) 손이 없으면 그림이 저절로 넘어가지 않는다
await p.evaluate(() => window.__sonmalMock(null));
await p.fill('#typed', '아니요'); await p.press('#typed', 'Enter');
await p.evaluate(() => window.__sonmalMock(null));
await p.waitForTimeout(3500);
const stillFirst = await frame();

// 2) 첫 동작을 하면 둘째 그림으로 넘어간다
await p.evaluate(() => window.__sonmalMock('ㅂ'));
await p.waitForFunction(() => document.querySelector('.guide-art .word-pose[data-on]')?.dataset.frame === '1', null, { timeout: 8000 }).catch(() => {});
const second = await frame();

// 3) 같은 자세로 가만히 있으면 둘째 동작으로 치지 않는다
await p.evaluate(() => window.__sonmalMock('ㅂ'));
await p.waitForTimeout(3000);
const frozen = await p.evaluate(() => document.querySelectorAll('#seq .unit[data-state="done"]').length);
const why = await seen();

console.log(`손 없이 3.5초 뒤 그림  ${stillFirst} (0이어야 함)`);
console.log(`첫 동작 뒤 그림       ${second} (1이어야 함)`);
console.log(`가만히 3초 뒤 끝난 칸  ${frozen} (0이어야 함)  안내 "${why}"`);
console.log('오류', errs.length ? errs : '없음');
await b.close();
process.exit(stillFirst === '0' && second === '1' && frozen === 0 && !errs.length ? 0 : 1);
