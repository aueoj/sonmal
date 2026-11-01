import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = process.argv[2] || 'http://localhost:8777/index.html?mock=1';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
const out = [];
const say = (k, v) => out.push(`${k.padEnd(42)} ${v}`);

// 캔버스와 영상의 반전이 어긋나는가 — 추론이 아니라 계산된 스타일로
const mirror = await p.evaluate(() => ({
  video: getComputedStyle(document.getElementById('cam')).transform,
  canvas: getComputedStyle(document.getElementById('overlay')).transform
}));
say('영상 transform', mirror.video);
say('캔버스 transform', mirror.canvas);
say('→ 둘 다 반전 + JS도 반전?', mirror.canvas.includes('-1') ? '이중 반전 — 랜드마크 어긋남' : '정상');

// strip-rail 자동 최소 크기
const strip = await p.evaluate(() => {
  const r = document.getElementById('seq');
  return { minWidth: getComputedStyle(r).minWidth, scrollW: r.scrollWidth, clientW: r.clientWidth };
});
say('strip-rail min-width', strip.minWidth + (strip.minWidth === 'auto' ? '  ← flex 최소 크기 함정' : ''));

// 직접 입력 폼이 실제로 동작하는가 (렌더 확인이 아니라 상호작용)
await p.fill('#typed', '반갑습니다!');
await p.press('#typed', 'Enter');
await p.waitForTimeout(250);
const afterForm = await p.evaluate(() => ({
  heard: document.getElementById('heard-text').textContent,
  units: [...document.querySelectorAll('#seq .unit:not(.gap)')].map(u => u.textContent),
  count: '',
  glyph: document.getElementById('guide-name').textContent
}));
say('폼 제출 → 들은 말', afterForm.heard);
say('폼 제출 → 자모', afterForm.units.join(''));
say('폼 제출 → 현재 글자', afterForm.glyph);
say('구두점이 시퀀스에 섞였는가', afterForm.units.includes('!') ? '섞임 — 700ms 낭비' : '없음');

// 모달 접근성
await p.click('#btn-sources');
await p.waitForTimeout(200);
const dlg = await p.evaluate(() => {
  const d = document.getElementById('sources');
  return { open: d.open, focusInside: d.contains(document.activeElement),
           active: document.activeElement?.tagName + '.' + document.activeElement?.className,
           labelled: d.getAttribute('aria-labelledby') };
});
say('모달 열림 / 포커스 안으로', `${dlg.open} / ${dlg.focusInside} (${dlg.active})`);
say('모달 aria-labelledby', dlg.labelled ?? '없음');
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
const afterEsc = await p.evaluate(() => ({ open: document.getElementById('sources').open,
  returned: document.activeElement?.id }));
say('ESC로 닫힘 / 포커스 복귀', `${afterEsc.open === false} / ${afterEsc.returned || '(복귀 안 함)'}`);

// 가로 넘침
for (const w of [360, 414, 768, 1024, 1440]) {
  await p.setViewportSize({ width: w, height: 860 });
  await p.waitForTimeout(200);
  const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  say(`가로 넘침 @${w}px`, o > 1 ? `${o}px 넘침` : '없음');
}
await p.setViewportSize({ width: 1440, height: 900 });

// 키보드 포커스 링
await p.keyboard.press('Tab');
const ring = await p.evaluate(() => {
  const s = getComputedStyle(document.activeElement);
  return { el: document.activeElement.className || document.activeElement.tagName, outline: s.outlineWidth + ' ' + s.outlineColor };
});
say('첫 Tab 대상 / 포커스 링', `${ring.el} / ${ring.outline}`);

say('콘솔 오류', errs.length ? errs.slice(0, 4).join(' | ') : '없음');
await b.close();
console.log(out.join('\n'));
