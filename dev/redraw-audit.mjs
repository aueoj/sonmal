/* 손을 같은 모양으로 들고 있는 동안 안내 글자를 프레임마다 다시 쓰지 않는가.
   초당 30~60번 같은 HTML 을 다시 해석하면 저사양 휴대폰에서 손 인식과 시간을 다툰다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
for (let i = 0; i < 100 && !(await p.evaluate(() => typeof window.__sonmalMock === 'function')); i++) await p.waitForTimeout(200);
await p.fill('#typed', 'ㄱ');
await p.press('#typed', 'Enter');
await p.waitForSelector('.camera.live', { timeout: 20000 });
// 맞지 않는 손을 들고 있으면 안내 줄이 계속 같은 내용으로 남는다
await p.evaluate(() => window.__sonmalMock('ㅂ'));
await p.waitForTimeout(800);
const writes = await p.evaluate(() => new Promise(done => {
  let n = 0;
  const seen = document.getElementById('seen');
  const mo = new MutationObserver(list => { n += list.length; });
  mo.observe(seen, { childList: true, characterData: true, subtree: true });
  setTimeout(() => { mo.disconnect(); done(n); }, 1500);
}));
await b.close();
console.log(`같은 손을 1.5초 들고 있는 동안 안내 줄을 다시 쓴 횟수 ${writes}`);
// 손 떨림으로 내용이 바뀌는 몇 번은 괜찮다. 프레임마다(45번 넘게) 쓰면 실패
process.exit(writes > 15 ? 1 : 0);
