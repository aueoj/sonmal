import { launch } from './browser.mjs';
const b = await launch();
const OUT = '/tmp/claude-0/-home-user/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad';

for (const scheme of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
  await p.fill('#typed', '서울특별시');
  await p.click('.typed button[type=submit]');
  await p.waitForSelector('.camera.live', { timeout: 20000 });  // 카메라는 스스로 켜진다
  // 몇 글자 진행된 코칭 중간 상태를 잡는다
  // waitForFunction 은 CI 의 Playwright 에서 CSP 에 막힌다. 직접 되묻는다.
  for (let i = 0; i < 75 && (await p.locator('#strip .unit[data-state="done"]').count()) < 4; i++) await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/coach-${scheme}.png` });

  const probe = await p.evaluate(() => {
    const cs = n => getComputedStyle(n);
    return {
      bodyBg: cs(document.body).backgroundColor,
      bodyFg: cs(document.body).color,
      inputBg: cs(document.getElementById('typed')).backgroundColor,
      inputFg: cs(document.getElementById('typed')).color,
      cardBg: cs(document.querySelector('.card')).backgroundColor,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  console.log(`[${scheme}]`, JSON.stringify(probe));
  await p.close();
}

// 모션 감소 설정에서 확정 애니메이션이 꺼지는가
const p2 = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p2.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
const anim = await p2.evaluate(() => {
  const u = document.querySelector('#strip .unit');
  u.dataset.lock = '1';
  return getComputedStyle(u).animationDuration;
});
console.log('[reduced-motion] 확정 애니메이션 길이', anim, parseFloat(anim) < 0.01 ? '→ 꺼짐' : '→ 켜짐 ← 존중 안 함');
await b.close();
