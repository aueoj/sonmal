/* hidden 속성이 붙은 요소가 정말 안 보이는지 확인한다.
   클래스에 display를 주면 브라우저 기본 [hidden]{display:none} 를 이겨 버린다. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
// JS를 끄고 — file:// 로 열어 모듈이 안 돌 때와 같은 상태
await p.route('**/js/*.js', r => r.abort());
await p.goto('http://localhost:8777/index.html', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(400);
const r = await p.evaluate(() => {
  const probe = id => {
    const n = document.getElementById(id);
    return { hidden: n.hidden, display: getComputedStyle(n).display,
             visible: n.getBoundingClientRect().height > 0 };
  };
  return { diag: probe('diag'), heard: probe('heard'), flag: probe('flag') };
});
console.log('스크립트가 안 돌 때 hidden 요소들');
for (const [k, v] of Object.entries(r))
  console.log(`  #${k}  hidden=${v.hidden}  display=${v.display}  실제로 보임=${v.visible}` +
    (v.visible ? '  ← hidden 인데 보인다' : ''));
await p.screenshot({ path: '/tmp/claude-0/-home-user/1666e45b-ba5d-5fdf-99c9-cdf6defa90e5/scratchpad/nojs.png' });
await b.close();
