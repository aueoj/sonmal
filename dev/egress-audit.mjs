/* 페이지가 실제로 어디에 접속하는지 전부 기록한다.
 *
 * 세 갈래를 본다.
 *  1. 카메라를 켠 경로: 가짜 카메라 장치(--use-fake-device-for-media-stream)로 진짜 getUserMedia 를 타고,
 *     손 인식 코드(jsDelivr)와 손·얼굴 모델(구글 모델 저장소)을 받아 손 인식이 도는 데까지 간다.
 *     허용한 곳 말고는 접속하지 않고, 모두 내려받기(GET)뿐이어야 한다.
 *  2. 카메라를 거부한 경로: 카메라가 열린 적이 없으면 jsDelivr 와 모델 저장소에도 접속하지 않는다(privacy.html).
 *  3. 카메라 없이 둘러보기(합성 손): 마찬가지로 글꼴 말고는 접속하지 않는다.
 */
import { launch } from './browser.mjs';

/* 이 넷 말고 다른 곳에 접속하면 실패한다. 영상이나 소리가 새어 나가는 변경을
   사람이 알아채기 전에 여기서 막는다. */
const ALLOWED = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com',
                 'https://cdn.jsdelivr.net', 'https://storage.googleapis.com'];
const CAMERA_ONLY = ['https://cdn.jsdelivr.net', 'https://storage.googleapis.com'];

const bad = [];
const record = page => {
  const hits = new Map();
  page.on('request', r => {
    const u = new URL(r.url());
    if (!/^https?:$/.test(u.protocol) || u.hostname === 'localhost') return;
    const k = `${r.method()} ${u.origin}${u.pathname.split('/').slice(0, 3).join('/')}`;
    hits.set(k, (hits.get(k) ?? 0) + 1);
  });
  return hits;
};
const report = (title, hits, { allowed = ALLOWED } = {}) => {
  console.log(title);
  if (!hits.size) console.log('  없음');
  for (const [k, n] of [...hits].sort()) {
    const ok = allowed.some(a => k.includes(a));
    console.log(`  ${ok ? '○' : '✕'} ${k}  ×${n}`);
    if (!ok) bad.push(`${title}: 허용하지 않은 곳 ${k}`);
    if (!k.startsWith('GET ')) bad.push(`${title}: GET 이 아닌 요청 ${k}`);
  }
};
/* page.waitForFunction 은 페이지 CSP(unsafe-eval 금지)에 막힌다. evaluate 로 되묻는다 */
const until = async (p, fn, ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await p.evaluate(fn)) return true; await p.waitForTimeout(200); }
  return false;
};
const quiet = p => p.addInitScript(() => { speechSynthesis.speak = () => {}; });

/* 1. 카메라를 켠 경로 */
{
  const b = await launch({ args: ['--no-sandbox', '--mute-audio', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  await quiet(p);
  const hits = record(p);
  await p.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
  // 카메라는 스스로 켜진다. 손 인식 코드와 모델을 받는 데 시간이 걸린다
  const live = await until(p, () => document.getElementById('camera').classList.contains('live')
    && !!document.getElementById('cam').srcObject, 60000);
  await p.waitForTimeout(3000);   // 얼굴 모델은 손 인식이 돈 뒤에 뒤에서 받는다
  await p.fill('#typed', '과자'); await p.press('#typed', 'Enter');
  await p.waitForTimeout(2500);
  const diag = await p.evaluate(() => document.getElementById('diag').hidden ? '' : document.getElementById('diag-verdict').textContent);
  report('카메라를 켠 경로 (가짜 카메라, localhost 제외)', hits);
  if (!live) bad.push(`카메라를 켠 경로: 카메라가 켜지지 않았다${diag ? ` (진단: ${diag})` : ''}`);
  for (const a of CAMERA_ONLY)
    if (![...hits.keys()].some(k => k.includes(a))) bad.push(`카메라를 켠 경로: ${a} 에 접속하지 않았다. 손 인식 경로를 타지 않은 것이다`);
  await b.close();
}

/* 2. 카메라를 거부한 경로 */
{
  const b = await launch({ args: ['--no-sandbox', '--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  await quiet(p);
  await p.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
  });
  const hits = record(p);
  await p.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
  await p.locator('#diag .diag-list li').first().waitFor({ timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(1500);
  report('카메라를 거부한 경로', hits, { allowed: ALLOWED.filter(a => !CAMERA_ONLY.includes(a)) });
  await b.close();
}

/* 3. 카메라 없이 둘러보기 */
{
  const b = await launch({ args: ['--no-sandbox', '--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  await quiet(p);
  const hits = record(p);
  await p.goto('http://localhost:8777/index.html?mock=1', { waitUntil: 'networkidle' });
  await p.waitForSelector('.camera.live', { timeout: 20000 });
  await p.fill('#typed', '과자'); await p.press('#typed', 'Enter');
  await p.waitForTimeout(2500);
  report('카메라 없이 둘러보기', hits, { allowed: ALLOWED.filter(a => !CAMERA_ONLY.includes(a)) });
  await b.close();
}

if (bad.length) { console.error('\n' + bad.join('\n')); process.exit(1); }
console.log('\n→ 허용한 곳에만, 내려받기만 했습니다. 카메라를 켜지 않으면 손 인식 코드와 모델도 받지 않습니다');
