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

// 2) 첫 동작을 하면 둘째 그림으로 넘어간다 ('아니요'는 가슴 앞에서 편 손)
await p.evaluate(() => window.__sonmalMock('ㅂ', 'chest'));
// waitForFunction 은 CI 의 Playwright 에서 페이지 CSP(unsafe-eval 금지)에 막힌다. 직접 되묻는다.
for (let i = 0; i < 40 && (await frame()) !== '1'; i++) await p.waitForTimeout(200);
const second = await frame();

// 3) 같은 자세로 가만히 있으면 둘째 동작으로 치지 않는다
await p.evaluate(() => window.__sonmalMock('ㅂ', 'chest'));
await p.waitForTimeout(3000);
const frozen = await p.evaluate(() => document.querySelectorAll('#seq .unit[data-state="done"]').length);
const why = await seen();

// 4) 얼굴 기준 높이: 같은 손모양이라도 얼굴 앞에 들면 가슴 동작으로 치지 않는다
await p.fill('#typed', '아니요'); await p.press('#typed', 'Enter');
await p.evaluate(() => window.__sonmalMock('ㅂ', 'face'));
await p.waitForTimeout(2500);
const highFrame = await frame();
const highWhy = await seen();

// 5) '안녕하세요'는 두 단계다. 1단계 동안 1, 2장(팔꿈치 → 손목)을 번갈아 보이고, 손이 없으면 3장으로 가지 않는다
await p.evaluate(() => window.__sonmalMock(null));
await p.fill('#typed', '안녕하세요'); await p.press('#typed', 'Enter');
const shown = new Set();
for (let i = 0; i < 12; i++) { shown.add(await frame()); await p.waitForTimeout(250); }
const helloStep = await p.evaluate(() => document.getElementById('seen').textContent);
const helloOk = shown.has('0') && shown.has('1') && !shown.has('2');

console.log(`손 없이 3.5초 뒤 그림  ${stillFirst} (0이어야 함)`);
console.log(`안녕하세요 1단계 그림  ${[...shown].sort().join(', ')} (0, 1 번갈아야 함)  ${helloStep}`);
console.log(`첫 동작 뒤 그림       ${second} (1이어야 함)`);
console.log(`가만히 3초 뒤 끝난 칸  ${frozen} (0이어야 함)  안내 "${why}"`);
console.log(`얼굴 앞에서 2.5초 뒤 그림 ${highFrame} (0이어야 함)  안내 "${highWhy}"`);
console.log('오류', errs.length ? errs : '없음');
await b.close();
const highOk = highFrame === '0' && highWhy.includes('가슴');
process.exit(stillFirst === '0' && second === '1' && frozen === 0 && highOk && helloOk && !errs.length ? 0 : 1);
