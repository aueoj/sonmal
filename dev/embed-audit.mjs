/* 끼워진 프레임에서 카메라와 모델이 막혔을 때, 안내가 쓸모 있는지 확인한다.
   Claude 아티팩트처럼 카메라를 허용하지 않는 자리에 놓였을 때의 모습이다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
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
await fr.locator('#diag .diag-list li').first().waitFor({ timeout: 25000 });
await p.waitForTimeout(1500);

const verdict = (await fr.locator('#diag-verdict').textContent() || '').trim();
const advice = (await fr.locator('#diag-advice').textContent() || '').trim();
console.log('판정:', verdict);
console.log('안내:', advice);

const escape = await fr.locator('#diag-demo').isVisible();
console.log('둘러보기 길:', escape ? '있음' : '없음  ← 막다른 길이다');

// 진단 목록이 프레임 밖으로 밀려나 잘리지 않는지
const fit = await p.evaluate(() => {
  const f = document.querySelector('iframe');
  const d = f.contentDocument.getElementById('diag');
  if (!d) return '진단 없음';
  const box = d.getBoundingClientRect();
  const frame = f.contentWindow.innerHeight;
  return box.bottom <= frame + 1 ? '안 잘림' : `잘림 (${Math.round(box.bottom - frame)}px 넘침)`;
});
console.log('진단 상자:', fit);

await p.screenshot({ path: '/tmp/claude-0/-home-user-sonmal/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/embed.png' });
await b.close();
process.exit(verdict && advice && escape && fit === '안 잘림' ? 0 : 1);
