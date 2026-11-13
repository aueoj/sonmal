/* radio 묶음(모드, 쓰는 손, 읽을 것)이 표준 키보드 동작을 하는가.
   Tab 은 고른 칸 하나에만 서고, 화살표와 Home, End 로 옮기면 그 칸이 골라진다. 끝에서는 처음으로 돈다. */
import { launch } from './browser.mjs';
const b = await launch({ args: ['--no-sandbox', '--mute-audio'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { speechSynthesis.speak = () => {}; });
await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
await p.waitForSelector('.camera.live', { timeout: 20000 });

const bad = [];
const check = (ok, msg) => { console.log(`  ${ok ? '○' : '✕'} ${msg}`); if (!ok) bad.push(msg); };
const look = ids => p.evaluate(ids => ({
  focus: document.activeElement?.id,
  checked: ids.filter(id => document.getElementById(id).getAttribute('aria-checked') === 'true'),
  tab: ids.map(id => document.getElementById(id).tabIndex)
}), ids);
const press = async key => { await p.keyboard.press(key); await p.waitForTimeout(80); };

// 모드: 연습 → 자유 → (돈다) 연습
const MODE = ['mode-practice', 'mode-free'];
let s = await look(MODE);
check(s.tab.join() === '0,-1', `모드: Tab 자리 ${s.tab.join()} (고른 칸만 0)`);
await p.focus('#mode-practice');
await press('ArrowRight');
s = await look(MODE);
const freeOn = await p.evaluate(() => document.body.dataset.mode);
check(s.focus === 'mode-free' && s.checked.join() === 'mode-free' && freeOn === 'free' && s.tab.join() === '-1,0',
  `모드 → : 초점 ${s.focus}, 고름 ${s.checked}, 화면 ${freeOn}, Tab ${s.tab.join()}`);

// 자유 모드의 읽을 것: ← 로 돌아 지문자, Home 으로 낱말
const READ = ['read-words', 'read-jamo'];
await p.focus('#read-words');
await press('ArrowLeft');
s = await look(READ);
check(s.focus === 'read-jamo' && s.checked.join() === 'read-jamo', `읽을 것 ← (처음에서 돈다): 초점 ${s.focus}, 고름 ${s.checked}`);
await press('Home');
s = await look(READ);
check(s.focus === 'read-words' && s.checked.join() === 'read-words', `읽을 것 Home: 초점 ${s.focus}, 고름 ${s.checked}`);

await p.focus('#mode-free');
await press('ArrowDown');
s = await look(MODE);
check(s.focus === 'mode-practice' && s.checked.join() === 'mode-practice', `모드 ↓ (끝에서 돈다): 초점 ${s.focus}, 고름 ${s.checked}`);

// 쓰는 손: End 로 왼손, ↑ 로 오른손. 몸의 data-hand 도 따라간다
const HAND = ['hand-right', 'hand-left'];
await p.focus('#hand-right');
await press('End');
s = await look(HAND);
let hand = await p.evaluate(() => document.body.dataset.hand);
check(s.focus === 'hand-left' && s.checked.join() === 'hand-left' && hand === 'left', `쓰는 손 End: 초점 ${s.focus}, 고름 ${s.checked}, 손 ${hand}`);
await press('ArrowUp');
s = await look(HAND);
hand = await p.evaluate(() => document.body.dataset.hand);
check(s.focus === 'hand-right' && hand === 'right' && s.tab.join() === '0,-1', `쓰는 손 ↑: 초점 ${s.focus}, 손 ${hand}, Tab ${s.tab.join()}`);

// Tab 은 묶음마다 한 번만 선다
await p.focus('#mode-practice');
await press('Tab');
const afterTab = await p.evaluate(() => document.activeElement?.id);
check(afterTab !== 'mode-free', `모드에서 Tab 하면 묶음을 벗어난다 (${afterTab})`);

check(!errs.length, `페이지 오류 ${errs.length ? errs.join(' | ') : '없음'}`);
await b.close();
if (bad.length) { console.log('\n' + bad.join('\n')); process.exit(1); }
console.log('\nradio 묶음이 표준 키보드 동작을 한다');
