/* landing.js — 소개 페이지의 움직임. 첫 화면 데모와 스크롤 등장, 둘 다 anime.js로 한다.
   데모는 앱과 같은 지문자 그림(jamoArt)을 쓴다. 소리는 내지 않는다. */

import { animate, stagger } from './vendor/anime.js?v=202611071638';
import { jamoArt } from './illustrations.js?v=202611071638';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── 지문자 40자 표 ─────────────────────────────── */

const JAMO = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣㅘㅚㅙㅝㅞㅟㅢㄲㄸㅃㅆㅉ'];
$('chart').innerHTML = JAMO.map(j => `<figure role="listitem">${jamoArt(j)}<figcaption>${j}</figcaption></figure>`).join('');

/* ── 스크롤 등장 ───────────────────────────────── */

if (!REDUCED) {
  window.__revealed = true;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      if (e.target.id === 'chart') {
        animate(e.target.querySelectorAll('figure'), { opacity: [0, 1], y: [12, 0], duration: 600, delay: stagger(18), ease: 'outQuart' });
        continue;
      }
      // 나란히 놓인 형제끼리는 순서대로 조금씩 늦게 뜬다
      const sibs = [...e.target.parentElement.children].filter(n => n.hasAttribute('data-reveal'));
      animate(e.target, { opacity: [0, 1], y: [24, 0], duration: 700, delay: sibs.indexOf(e.target) * 80, ease: 'outQuart' });
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(n => io.observe(n));
  io.observe($('chart'));
}

/* ── 첫 화면 데모: '손말'을 한 글자씩 따라 한다 ─── */

const guide = document.querySelector('.demo-guide');
const art = $('demo-art');
const name = $('demo-name');
const step = $('demo-step');
const fill = $('demo-fill');
const spoken = $('demo-spoken');
const units = [...document.querySelectorAll('#demo-seq .unit[data-j]')];
// 어절 끝 칸. 여기까지 해내면 앱처럼 그 어절을 읽어 준 자막이 뜬다
const WORD_END = { 2: '손', 5: '말' };

function setMeter(v) {
  fill.style.transform = `scaleX(${v})`;
  guide.dataset.state = v >= 0.88 ? 'hit' : v >= 0.7 ? 'near' : '';
}

function showUnit(u) {
  art.innerHTML = jamoArt(u.dataset.j);
  name.textContent = u.dataset.j;
  step.textContent = '따라 해 보세요';
  units.forEach(n => { if (n.dataset.state !== 'done') n.dataset.state = n === u ? 'now' : 'todo'; });
  // 그림엔 손 방향 뒤집기(scaleX)가 걸려 있어 바깥 칸을 움직인다
  animate(art, { opacity: [0, 1], translateY: [8, 0], duration: 360, ease: 'outCubic' });
}

function caption(text) {
  spoken.textContent = text;
  animate(spoken, { opacity: [0, 1, 1, 0], y: [6, 0, 0, 0], duration: 1600, ease: 'outCubic' });
}

// 점수가 들쭉날쭉 오르다 문턱을 넘는 모습을 흉내 낸다
async function climb() {
  const v = { p: 0 };
  await animate(v, {
    p: [0, 0.48, 0.42, 0.74, 0.7, 0.92 + Math.random() * 0.06],
    duration: 1200, ease: 'inOutSine', onUpdate: () => setMeter(v.p)
  });
  step.textContent = '맞아요';
  await sleep(380);
}

async function loop() {
  for (;;) {
    units.forEach(n => { n.dataset.state = 'todo'; });
    for (const [i, u] of units.entries()) {
      showUnit(u);
      setMeter(0);
      await sleep(450);
      await climb();
      u.dataset.state = 'done';
      animate(u, { scale: [1, 1.24, 1], duration: 440, ease: 'outBack(2)' });
      if (WORD_END[i]) caption(WORD_END[i]);
      await sleep(260);
    }
    setMeter(1);
    step.textContent = '좋아요. 다시 해 볼까요';
    animate(units, { y: [0, -6, 0], duration: 520, delay: stagger(36), ease: 'inOutSine' });
    caption('손말');
    await sleep(2400);
  }
}

if (REDUCED) {
  // 움직임을 줄인 경우엔 다 해낸 마지막 장면만 보여 준다
  art.innerHTML = jamoArt('ㄹ');
  name.textContent = 'ㄹ';
  units.forEach(n => { n.dataset.state = 'done'; });
  setMeter(1);
  step.textContent = '좋아요. 다시 해 볼까요';
} else {
  loop();
}
