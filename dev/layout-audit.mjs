/* 가이드가 영상을 잡아먹지 않는지 잰다.
   약속: 아래 가이드는 카메라 영역의 1/3을 넘지 않는다.
   그리고 '말하기' 칸은 영상 위, 화면 가운데 아래쯤에 있어야 눈에 띈다. */
import { launch } from './browser.mjs';
const b = await launch();
let bad = [];
for (const [w, h] of [[1440, 900], [1440, 760], [1280, 720], [820, 1180], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
  await p.fill('#typed', '과자');
  await p.press('#typed', 'Enter');
  await p.waitForSelector('.camera.live', { timeout: 20000 });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const box = sel => {
      const n = document.querySelector(sel);
      if (!n) return null;
      const b = n.getBoundingClientRect();
      return { h: Math.round(b.height), top: Math.round(b.top), bottom: Math.round(b.bottom) };
    };
    return { bar: box('.bar'), cam: box('.camera'), guide: box('.guide'), say: box('.say'),
             win: window.innerHeight, scrollX: document.documentElement.scrollWidth > window.innerWidth };
  });
  const share = r.guide && r.cam ? r.guide.h / r.cam.h : 0;
  const sayMid = r.say && r.cam
    ? (r.say.top - r.cam.top) / r.cam.h : 0;   // 카메라 안에서 말하기 칸이 앉은 높이
  console.log(`${String(w).padStart(4)}x${h} → 가이드 ${r.guide?.h}px / 카메라 ${r.cam?.h}px = ${(share*100).toFixed(0)}%`
    + `  말하기 칸 ${(sayMid*100).toFixed(0)}% 지점`
    + (r.scrollX ? '  ← 가로 스크롤 생김' : ''));
  if (share > 0.34) bad.push(`${w}x${h}: 가이드가 카메라의 ${(share*100).toFixed(0)}% — 1/3을 넘었다`);
  if (r.scrollX) bad.push(`${w}x${h}: 가로 스크롤이 생겼다`);
  if (r.say && (sayMid < 0.45 || sayMid > 0.95)) bad.push(`${w}x${h}: 말하기 칸이 ${(sayMid*100).toFixed(0)}% 지점 — 중하단이 아니다`);
  // 좁은 화면: 말 고르기를 열면 아래 안내판과 겹치지 않는다(안내판 위에서 끝난다)
  if (w <= 760) {
    await p.click('#ref-toggle');
    await p.waitForTimeout(200);
    const o = await p.evaluate(() => ({
      refBottom: Math.round(document.getElementById('ref').getBoundingClientRect().bottom),
      guideTop: Math.round(document.querySelector('.guide').getBoundingClientRect().top)
    }));
    console.log(`     말 고르기 아래 끝 ${o.refBottom}px, 안내판 위 끝 ${o.guideTop}px`);
    if (o.refBottom > o.guideTop + 1) bad.push(`${w}x${h}: 말 고르기가 아래 안내판과 ${o.refBottom - o.guideTop}px 겹친다`);
    await p.click('#ref-toggle');
  }
  // 폰 폭: 문장 칸 줄(이름, 칸, '한국어 순서', 표정·사전 영상)이 두 줄을 넘지 않는다
  if (w <= 480) {
    for (const text of ['무엇을 봐요', '감동했어요 감사합니다']) {
      await p.fill('#typed', text); await p.press('#typed', 'Enter');
      await p.waitForTimeout(300);
      const head = await p.evaluate(() => Math.round(document.querySelector('.guide-head').getBoundingClientRect().height));
      console.log(`     '${text}' 문장 칸 줄 ${head}px`);
      if (head > 60) bad.push(`${w}x${h}: '${text}' 문장 칸 줄이 ${head}px — 두 줄(57px)을 넘었다`);
    }
  }
  if (w === 1440 && h === 900) await p.screenshot({ path: '/tmp/claude-0/-home-user-sonmal/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/inuse.png' });
  await p.close();
}
await b.close();
if (bad.length) { console.log('\n' + bad.join('\n')); process.exit(1); }
console.log('\n약속을 지켰다');
