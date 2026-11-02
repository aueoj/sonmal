/* 단어에서 자모로 넘어간 뒤에도 단어 그림이 남아 있지 않은지 본다.
   단어 동작을 1초마다 다시 그리는 타이머가 안 멈추면 자모 그림을 덮어쓴다. */
import { launch } from './browser.mjs';
const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });

// 기본 문장은 단어로 시작한다. 그 상태에서 카메라를 켜면 타이머가 두 번 걸릴 수 있다.
await p.waitForSelector('.camera.live', { timeout: 20000 });  // 카메라는 스스로 켜진다
await p.waitForTimeout(900);
await p.fill('#typed', '과자');
await p.press('#typed', 'Enter');

let worst = null;
for (let i = 0; i < 14; i++) {          // 3.5초 동안 매 250ms 확인
  await p.waitForTimeout(250);
  const r = await p.evaluate(() => ({
    name: document.getElementById('guide-name').textContent,
    art: document.getElementById('guide-art').innerHTML
  }));
  const isWordArt = r.art.includes('word-pose');
  const isJamo = r.name.length === 1;
  if (isJamo && isWordArt) { worst = r.name; break; }
}
console.log(worst
  ? `← 자모 "${worst}" 인데 그림은 단어 동작이 남아 있다`
  : '자모로 넘어간 뒤 단어 그림이 남지 않는다');
console.log('오류:', errs.length ? errs.slice(0, 2) : '없음');
await b.close();
process.exit(worst || errs.length ? 1 : 0);
