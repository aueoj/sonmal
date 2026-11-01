/* 아티팩트 서비스가 페이지를 자기 스켈레톤 안에 중첩해 넣는다.
   그 중첩이 스타일·모듈·레이아웃을 깨지 않는지 그대로 재현해 확인한다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('requestfailed', r => errs.push('요청 실패: ' + r.url().split('/').pop()));
await p.goto('http://localhost:8777/wrapped-preview.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
const r = await p.evaluate(() => {
  const cs = n => getComputedStyle(n);
  return {
    title: document.title,
    lang: document.documentElement.lang,
    sheets: document.styleSheets.length,
    bodyDisplay: cs(document.body).display,
    bodyBg: cs(document.body).backgroundColor,
    railBorder: cs(document.querySelector('.rail')).borderLeftWidth,
    chartCards: document.querySelectorAll('.chart figure').length,
    handSvgs: document.querySelectorAll('.chart svg').length,
    glyphSize: cs(document.getElementById('glyph')).fontSize,
    krFont: cs(document.querySelector('.mark')).fontFamily.split(',')[0],
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    nestedDoctype: document.body.innerHTML.includes('<!doctype') || false
  };
});
console.log(JSON.stringify(r, null, 1));
console.log('오류:', errs.length ? errs.slice(0, 4).join(' | ') : '없음');
await p.screenshot({ path: '/tmp/claude-0/-home-user/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/wrapped.png' });
await b.close();
