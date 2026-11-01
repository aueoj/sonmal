/* 끼워진 프레임에서 카메라와 모델이 막혔을 때, 안내가 쓸모 있는지 확인한다. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
// 프레임 안에 넣고, 카메라와 모델을 둘 다 막는다
await p.addInitScript(() => {
  if (window.self !== window.top) {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
    const f = window.fetch;
    window.fetch = (u, o) => String(u).includes('storage.googleapis.com')
      ? Promise.reject(new TypeError('Failed to fetch')) : f(u, o);
  }
});
// localhost 로 띄워야 보안 컨텍스트가 되고, 같은 출처라 프레임 안을 들여다볼 수 있다
await p.goto('http://localhost:8777/dev/embed.html', { waitUntil: 'networkidle' });
const fr = p.frameLocator('iframe');
await p.waitForTimeout(1200);
await fr.locator('#btn-cam').click();
await fr.locator('#diag .diag-list li').first().waitFor({ timeout: 20000 });
await p.waitForTimeout(3000);
console.log('판정:', await fr.locator('#diag-verdict').textContent());
console.log('안내:', await fr.locator('#diag-advice').textContent());
// 표가 '들은 말' 칩에 가려지지 않는지
const clash = await p.evaluate(() => {
  const f = document.querySelector('iframe').contentDocument;
  const heard = f.getElementById('heard').getBoundingClientRect();
  const last = [...f.querySelectorAll('.chart figure')].pop()?.getBoundingClientRect();
  if (!last || heard.height === 0) return 'heard 숨김';
  const overlap = !(last.right < heard.left || last.left > heard.right ||
                    last.bottom < heard.top || last.top > heard.bottom);
  return overlap ? '겹침' : '안 겹침';
});
console.log('표와 들은 말 칩:', clash);
await p.screenshot({ path: '/tmp/claude-0/-home-user/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/embed.png' });
await b.close();
