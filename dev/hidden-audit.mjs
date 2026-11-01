/* hidden 속성이 붙은 요소가 정말 안 보이는지 확인한다.
   클래스에 display 를 주면 브라우저 기본 [hidden]{display:none} 를 이겨 버린다.
   스크립트가 안 도는 상태에서 보는 이유는, 그때가 가장 발가벗은 상태이기 때문이다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
await p.route('**/js/*.js*', r => r.abort());
await p.goto('http://localhost:8777/index.html', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(400);

const r = await p.evaluate(() => {
  const out = {};
  for (const n of document.querySelectorAll('[hidden]')) {
    const box = n.getBoundingClientRect();
    out[n.id || n.className || n.tagName.toLowerCase()] = {
      display: getComputedStyle(n).display,
      visible: box.height > 0 && box.width > 0
    };
  }
  return out;
});

console.log('스크립트가 안 돌 때, hidden 이 붙은 것들');
let bad = 0;
for (const [k, v] of Object.entries(r)) {
  const wrong = v.visible || v.display !== 'none';
  if (wrong) bad++;
  console.log(`  ${k.padEnd(14)} display=${v.display.padEnd(6)} 보임=${v.visible}${wrong ? '  ← hidden 인데 보인다' : ''}`);
}
if (!Object.keys(r).length) console.log('  (hidden 이 붙은 것이 없다)');
await p.screenshot({ path: '/tmp/claude-0/-home-user-sonmal/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/nojs.png' });
await b.close();
process.exit(bad ? 1 : 0);
