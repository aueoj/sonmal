/* app.js — 말하거나 손으로 하면 손말이 읽어 준다.
 *
 * 연습하는 동안 눌러야 하는 것은 없다. 위의 단어 칩을 한 번 고르거나
 * 말하기를 누르는 것이 전부고, 그다음부터는 손이 입력이다.
 *   · 지문자는 손모양을 알아보고 저절로 다음 자모로 넘어간다
 *   · 음절이 완성될 때마다 그 음절을 소리로 읽어 준다
 *   · 단어 수어는 동작이 여러 개라 0.5초마다 다음 자세로 흐르고,
 *     손이 보이는 동안 따라한 것으로 보아 단어를 읽어 준다
 */

import { toFingerspell, composeFromJamo } from './hangul.js';
import { getPose } from './jamoData.js';
import { jamoArt, wordArt, WORD_POSE_FILES } from './illustrations.js';
import { describe } from './poseFeatures.js';
import { scorePose, detectLateralShift, MOTION_WINDOW_MS } from './matcher.js';
import { Tracker } from './tracker.js';
import { createListener, speak, support, hasKoreanVoice } from './speech.js';
import { planUtterance, SOURCES, WORD_SIGNS } from './words.js';
import { diagnose } from './diagnose.js';

const $ = id => document.getElementById(id);
const el = {
  camera: $('camera'), video: $('cam'), overlay: $('overlay'),
  camEmpty: $('cam-empty'), camPrompt: document.querySelector('.cam-prompt'),
  btnCam: $('btn-cam'), btnDemo: $('btn-demo'), chart: $('chart'),
  diag: $('diag'), diagVerdict: $('diag-verdict'), diagList: $('diag-list'),
  diagAdvice: $('diag-advice'), diagRetry: $('diag-retry'), diagNewTab: $('diag-newtab'),
  chips: $('chips'), handRight: $('hand-right'), handLeft: $('hand-left'),
  spoken: $('spoken'),
  sayForm: $('say-form'), btnListen: $('btn-listen'), typed: $('typed'),
  guide: $('guide'), art: $('guide-art'), name: $('guide-name'), step: $('guide-step'),
  track: $('track'), fill: $('fill'), seq: $('seq'), read: $('read'),
  sources: $('sources'), sourcesBody: $('sources-body'), btnSources: $('btn-sources')
};

let MOCK = new URLSearchParams(location.search).has('mock');

/* 문턱은 재서 정했다. dev/calibrate.mjs 가 맞는 자세와 틀린 자세의 점수를
   전부 재어 가르는 자리를 찾는다. 0.88 에서 맞는 자세는 전부 통과하고
   틀린 자세는 2.7%만 통과한다. 0.74 에서는 틀린 자세의 20%가 통과했다. */
const ACCEPT = 0.88;        // 이 점수를 넘고
const HOLD_MS = 500;        // 이만큼 버티면 맞은 것으로 본다
const NEAR = 0.70;
const SHIFT_THRESHOLD = 0.35;
const SMOOTH_N = 7;
const STEP_MS = 1000;       // 동작이 여러 개인 단어는 이 간격으로 흐른다
const WORD_MOVE = 0.34;     // 손이 이만큼 움직여야 '따라했다'로 본다 (손 길이 대비)
const REPEAT_MS = 1400;     // 다 하고 나서 처음으로 돌아가기까지

const state = {
  seq: [], at: -1, got: [],
  tracker: null, listener: null, live: false,
  hand: 'right',
  holdSince: 0, trail: [], scores: [], lastStep: '',
  wordTimer: null, wordStep: 0, wordSince: 0, spokenSyllable: -1,
  lostSince: 0, repeatTimer: null,
  settling: false   // 한 칸을 끝내고 다음으로 넘어가는 사이. 이때 들어오는 프레임은 흘린다.
};

/** 자취가 가로세로로 얼마나 퍼졌는지 */
function spread2d(trail) {
  if (trail.length < 4) return 0;
  const xs = trail.map(p => p.x), ys = trail.map(p => p.y);
  return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}

const median = xs => {
  const a = [...xs].sort((p, q) => p - q);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};

/* ── 읽어 주기 ──────────────────────────────── */

function say(text) {
  if (!text) return;
  speak(text);
  el.spoken.hidden = false;
  el.spoken.textContent = text;
  el.read.textContent = text;
  clearTimeout(say._t);
  say._t = setTimeout(() => { el.spoken.hidden = true; }, 2600);
}

/* ── 연습할 말 정하기 ───────────────────────── */

function setUtterance(text) {
  stopWordTimer();
  clearTimeout(state.repeatTimer);
  state.seq = [];
  /* 음절 번호는 어절마다 0부터 다시 매겨진다. 그대로 두면 '뒤 왼쪽'의
     뒤(0)와 왼(0)이 한 글자로 묶여 "뒤왼"으로 읽힌다. 이어서 매긴다. */
  let syllable = 0;
  for (const part of planUtterance(text)) {
    if (state.seq.length) state.seq.push({ role: 'space', jamo: ' ' });
    // 별칭으로 말했어도 칸에는 그 수어의 이름을 보여 준다 ('반갑습니다' → 안녕하세요)
    if (part.kind === 'word') {
      state.seq.push({ role: 'word', sign: part.sign, jamo: part.sign.word });
      syllable += 1;
      continue;
    }
    const units = toFingerspell(part.text);
    let max = -1;
    for (const u of units) {
      if (u.syllableIndex === undefined) continue;
      u.syllableIndex += syllable;
      if (u.syllableIndex > max) max = u.syllableIndex;
    }
    if (max >= 0) syllable = max + 1;
    state.seq.push(...units);
  }
  state.at = -1;
  state.got = [];
  state.spokenSyllable = -1;
  el.read.textContent = '';
  el.typed.value = '';
  paintChips(text);
  buildSeq();
  advance();
}

function paintChips(active) {
  for (const b of el.chips.querySelectorAll('.chip'))
    b.setAttribute('aria-current', String(b.dataset.word === active));
}

function buildSeq() {
  el.seq.innerHTML = state.seq.map((u, i) =>
    u.role === 'space' ? '<span class="unit gap"></span>'
    : `<span class="unit" data-state="todo" data-i="${i}">${u.jamo}</span>`).join('');
  paintSeq();
}

function paintSeq() {
  for (const n of el.seq.querySelectorAll('.unit[data-i]')) {
    const i = Number(n.dataset.i);
    n.dataset.state = i < state.at ? 'done' : i === state.at ? 'now' : 'todo';
  }
  el.seq.querySelector('[data-state="now"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* ── 한 칸씩 ───────────────────────────────── */

function advance() {
  stopWordTimer();
  state.settling = false;
  let i = state.at + 1;
  while (i < state.seq.length && state.seq[i].role === 'space') { state.got.push(' '); i++; }
  state.at = i;
  state.holdSince = 0; state.trail = []; state.scores = [];

  if (i >= state.seq.length) return finish();

  const u = state.seq[i];
  paintSeq();
  if (u.role === 'word') return showWord(u);

  const pose = getPose(u.jamo);
  if (!pose) { state.got.push(u.jamo); return setTimeout(advance, 400); }
  if (state.tracker?.mock) state.tracker.mockMotion = false;

  el.art.innerHTML = jamoArt(u.jamo);
  el.name.textContent = u.jamo;
  el.step.textContent = pose.note;
  el.guide.dataset.state = '';
  el.fill.style.width = '0%';
  if (state.tracker?.mock) state.tracker.setMockPose(pose);
}

/* 단어 수어는 동작이 여럿이라 저절로 흐른다. 누를 것이 없다. */
function showWord(u) {
  stopWordTimer();            // 이미 돌던 타이머가 있으면 먼저 멈춘다.
  const w = u.sign;
  const frames = WORD_POSE_FILES[w.word]?.length ?? 1;
  state.wordStep = 0; state.wordSeen = 0; state.wordSince = 0;

  el.name.textContent = w.word;
  el.guide.dataset.state = '';
  el.fill.style.width = '0%';
  paintWordStep(w, frames);
  // 단어는 손모양을 가리지 않고 손이 보이는지만 본다. 모의 입력에도 손을 하나 띄운다.
  if (state.tracker?.mock) {
    state.tracker.setMockPose(getPose('ㅂ'));
    state.tracker.mockMotion = true;   // 모의 입력도 움직여야 통과한다
  }

  // 동작은 멈추지 않고 돈다. 따라할 때까지 계속 보여 준다.
  state.wordTimer = setInterval(() => {
    state.wordStep = (state.wordStep + 1) % frames;
    paintWordStep(w, frames);
  }, STEP_MS);
  el.step.textContent = state.live
    ? (w.steps?.[0] ?? w.수형)
    : '카메라를 켜면 따라한 것을 알아봅니다';
}

function paintWordStep(w, frames) {
  // 지금 칸이 이 단어가 아니면 그리지 않는다. 남은 타이머가 자모 그림을 덮지 않게.
  const cur = state.seq[state.at];
  if (!cur || cur.role !== 'word' || cur.sign !== w) return stopWordTimer();
  el.art.innerHTML = wordArt(w.word, state.wordStep);
  el.step.textContent = w.steps?.[state.wordStep] ?? w.수형;
  if (frames > 1) el.fill.style.width = `${Math.round(((state.wordStep + 1) / frames) * 100)}%`;
}

function stopWordTimer() {
  if (state.wordTimer) { clearInterval(state.wordTimer); state.wordTimer = null; }
}

function completeWord(u) {
  if (state.settling) return;
  state.settling = true;
  stopWordTimer();
  state.got.push(u.jamo);
  el.guide.dataset.state = 'hit';
  el.fill.style.width = '100%';
  const node = el.seq.querySelector(`[data-i="${state.at}"]`);
  if (node) node.dataset.lock = '1';
  say(u.jamo);
  setTimeout(advance, 420);
}

/* 음절이 완성될 때마다 그 음절을 읽어 준다 */
function speakFinishedSyllable() {
  const done = state.seq.slice(0, state.at).filter(u => u.role !== 'word' && u.role !== 'space');
  const last = done[done.length - 1];
  if (!last || last.syllableIndex === undefined) return;
  const next = state.seq[state.at];
  const sameSyllable = next && next.syllableIndex === last.syllableIndex;
  if (sameSyllable || last.syllableIndex === state.spokenSyllable) return;
  state.spokenSyllable = last.syllableIndex;
  const jamos = done.filter(u => u.syllableIndex === last.syllableIndex).map(u => u.jamo);
  say(composeFromJamo(jamos));
}

/* 끝나도 멈추지 않는다. 잠깐 쉬었다가 처음으로 돌아가, 다시 하면 다시 읽어 준다. */
function finish() {
  stopWordTimer();
  el.guide.dataset.state = 'hit';
  el.fill.style.width = '100%';
  el.step.textContent = '좋아요. 다시 해 볼까요';
  paintSeq();
  clearTimeout(state.repeatTimer);
  state.repeatTimer = setTimeout(() => {
    state.at = -1; state.got = []; state.spokenSyllable = -1;
    for (const n of el.seq.querySelectorAll('.unit[data-i]')) delete n.dataset.lock;
    advance();
  }, REPEAT_MS);
}

/* ── 카메라가 보는 것 ───────────────────────── */

function onFrame(lms, handedness) {
  const ctx = el.overlay.getContext('2d');
  const w = el.camera.clientWidth, h = el.camera.clientHeight;
  if (el.overlay.width !== w) el.overlay.width = w;
  if (el.overlay.height !== h) el.overlay.height = h;
  ctx.clearRect(0, 0, w, h);

  const current = state.seq[state.at];
  if (!current || state.settling) return;

  /* 단어는 손모양을 가릴 수 없다. 대신 '한 바퀴 동안 손이 보였고 그 사이에
     실제로 움직였는가'를 본다. 가만히 들고만 있으면 통과하지 않는다. */
  if (current.role === 'word') {
    const now = performance.now();
    if (!lms) { state.wordSince = 0; state.trail = []; return; }
    drawLandmarks(ctx, lms, w, h);

    const f = describe(lms, handedness, true);
    state.trail.push({ x: f.centroid.x, y: f.centroid.y, t: now });
    while (state.trail.length && now - state.trail[0].t > 2600) state.trail.shift();

    if (!state.wordSince) state.wordSince = now;
    const need = (WORD_POSE_FILES[current.sign.word]?.length ?? 1) * STEP_MS;
    const held = now - state.wordSince;
    const moved = spread2d(state.trail) / (f.scale || 1);

    const ready = held >= need && moved >= WORD_MOVE;
    el.guide.dataset.state = ready ? 'hit' : (held > need * 0.5 ? 'near' : '');
    el.fill.style.width = `${Math.round(Math.min(1, Math.max(held / need, moved / WORD_MOVE)) * 100)}%`;
    if (!ready && held > need * 0.6 && moved < WORD_MOVE)
      el.step.textContent = '그림처럼 손을 움직여 보세요';
    if (ready) completeWord(current);
    return;
  }

  if (!lms) {
    // 추적은 끊기기 마련이다. 잠깐 끊겼다고 쌓은 것을 버리지 않는다.
    if (!state.lostSince) state.lostSince = performance.now();
    if (performance.now() - state.lostSince > 700) {
      el.step.textContent = '손이 보이지 않습니다';
      el.fill.style.width = '0%';
      el.guide.dataset.state = '';
      state.holdSince = 0; state.scores = [];
    }
    return;
  }
  state.lostSince = 0;
  drawLandmarks(ctx, lms, w, h);

  const pose = getPose(current.jamo);
  if (!pose) return;

  // 좌표는 늘 화면 기준으로 본다. 영상 위에 겹쳐 그리는 뼈대와 같은 기준이어야 한다.
  const feat = describe(lms, handedness, true);
  const t = performance.now();
  state.trail.push({ x: feat.centroid.x, t });
  while (state.trail.length && t - state.trail[0].t > MOTION_WINDOW_MS * 1.5) state.trail.shift();

  const base = pose.motion ? getPose(pose.base) ?? pose : pose;
  // 오른손을 고르면 그림을 뒤집어 보여 주므로, 따라하는 방향도 같이 뒤집힌다
  const r = scorePose(feat, base, { mirrored: state.hand === 'right' });
  let score = r.score;
  let hint = r.hint;
  if (pose.motion && detectLateralShift(state.trail, feat.scale, t) <= SHIFT_THRESHOLD) {
    score = Math.min(score, 0.7);
    hint = hint ?? '같은 손모양으로 손을 옆으로 한 번 옮기세요';
  }

  state.scores.push(score);
  if (state.scores.length > SMOOTH_N) state.scores.shift();
  const smooth = median(state.scores);

  el.fill.style.width = `${Math.round(smooth * 100)}%`;
  el.guide.dataset.state = smooth >= ACCEPT ? 'hit' : smooth >= NEAR ? 'near' : '';
  const line = smooth >= ACCEPT ? pose.note : (hint ?? pose.note);
  if (line !== state.lastStep) { el.step.textContent = line; state.lastStep = line; }

  if (smooth >= ACCEPT) {
    if (!state.holdSince) state.holdSince = t;
    if (t - state.holdSince >= HOLD_MS) {
      const node = el.seq.querySelector(`[data-i="${state.at}"]`);
      if (node) node.dataset.lock = '1';
      state.got.push(current.jamo);
      advance();
      speakFinishedSyllable();
    }
  } else {
    state.holdSince = 0;
  }
}

const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
               [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

function coverBox(video, w, h) {
  const vw = video?.videoWidth || 4, vh = video?.videoHeight || 3;
  const s = Math.max(w / vw, h / vh);
  const dw = vw * s, dh = vh * s;
  return { dw, dh, ox: (w - dw) / 2, oy: (h - dh) / 2 };
}

function drawLandmarks(ctx, lms, w, h) {
  const { dw, dh, ox, oy } = coverBox(el.video, w, h);
  const px = p => [ox + (1 - p.x) * dw, oy + p.y * dh];
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(94,106,210,.6)';
  ctx.beginPath();
  for (const [a, b] of BONES) {
    const [x1, y1] = px(lms[a]), [x2, y2] = px(lms[b]);
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.fillStyle = '#5e6ad2';
  for (const p of lms) { const [x, y] = px(p); ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
}

/* ── 켜고 끄기 ─────────────────────────────── */

async function startCamera({ demo = false } = {}) {
  if (demo) MOCK = true;
  el.btnCam.disabled = true; el.btnDemo.disabled = true;
  el.btnCam.textContent = '여는 중…';
  try {
    state.tracker = new Tracker({ video: el.video, onFrame, mock: MOCK });
    await state.tracker.start();
    state.live = true;
    el.camera.classList.add('live');
    const cur = state.seq[state.at];
    if (cur?.role === 'word') showWord(cur);
    else if (cur && state.tracker.mock) state.tracker.setMockPose(getPose(cur.jamo));
  } catch {
    el.btnCam.disabled = false; el.btnDemo.disabled = false;
    el.btnCam.textContent = '카메라 켜기';
    await showDiagnosis();
  }
}

async function showDiagnosis() {
  el.diagVerdict.textContent = '어디서 막혔는지 확인하는 중…';
  el.diagList.innerHTML = ''; el.diagAdvice.textContent = '';
  el.camPrompt.hidden = true; el.diag.hidden = false;
  const { rows, verdict, advice, embedded } = await diagnose();
  const mark = { ok: '○', bad: '✕', unknown: '–' };
  el.diagVerdict.textContent = verdict;
  el.diagList.innerHTML = rows.map(r =>
    `<li data-state="${r.state}"><b>${mark[r.state]}</b><span>${r.label}</span>`
    + (r.detail ? `<em>— ${r.detail}</em>` : '') + '</li>').join('');
  el.diagAdvice.textContent = advice;
  el.diagNewTab.hidden = !embedded;
}

function startListening() {
  if (!state.listener) { el.typed.focus(); return; }
  document.body.classList.add('listening');
  el.typed.value = '';
  el.typed.placeholder = '듣고 있습니다…';
  state.listener.start();
}
function stopListening() {
  document.body.classList.remove('listening');
  el.typed.placeholder = '또는 문장을 입력하고 엔터';
}

function setHand(hand) {
  state.hand = hand;
  document.body.dataset.hand = hand;
  el.handRight.setAttribute('aria-checked', String(hand === 'right'));
  el.handLeft.setAttribute('aria-checked', String(hand === 'left'));
}

/* ── 시작 ──────────────────────────────────── */

function init() {
  setHand('right');

  el.chips.innerHTML = WORD_SIGNS
    .map(w => `<button class="chip" type="button" data-word="${w.word}">${w.word}</button>`).join('')
    + '<button class="chip spell" type="button" data-word="손말">손말 지문자</button>';
  el.chips.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (b) setUtterance(b.dataset.word);
  });

  el.handRight.addEventListener('click', () => setHand('right'));
  el.handLeft.addEventListener('click', () => setHand('left'));

  if (support.listen) {
    state.listener = createListener({
      onInterim: t => { el.typed.value = t; },      // 들은 말은 입력칸에 그대로 보여 준다
      onResult: t => setUtterance(t),
      onEnd: stopListening,
      onError: () => { stopListening(); el.typed.value = ''; el.typed.placeholder = '못 알아들었습니다. 다시 말하거나 입력해 주세요'; }
    });
  } else {
    el.btnListen.disabled = true;
    el.btnListen.title = '이 브라우저는 음성 인식을 지원하지 않습니다';
  }
  el.btnListen.title = support.listen
    ? '누르면 브라우저가 마이크 소리를 음성 인식 서버로 보냅니다. 보내고 싶지 않으면 옆 칸에 입력하세요.'
    : '이 브라우저는 음성 인식을 지원하지 않습니다';
  if (support.speak && !hasKoreanVoice())
    el.btnListen.title += ' 한국어 목소리가 없어 읽어 주는 소리는 나지 않을 수 있습니다.';

  el.btnCam.addEventListener('click', () => startCamera());
  el.btnDemo.addEventListener('click', () => startCamera({ demo: true }));
  el.diagRetry.addEventListener('click', () => { el.diag.hidden = true; el.camPrompt.hidden = false; startCamera(); });
  el.diagNewTab.addEventListener('click', () => window.open(location.href, '_blank', 'noopener'));
  el.btnListen.addEventListener('click', startListening);
  el.sayForm.addEventListener('submit', e => {
    e.preventDefault();
    const v = el.typed.value.trim();
    if (v) setUtterance(v);
  });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); startListening(); }
  });

  el.btnSources.addEventListener('click', () => {
    el.sources.showModal();
    el.sources.querySelector('button[type="submit"]')?.focus();
  });
  el.sourcesBody.innerHTML = `
    <p><b>영상은 기기 밖으로 나가지 않습니다.</b> 카메라 영상과 손 좌표는 이 브라우저 안에서만
       처리되고, 녹화하거나 저장하거나 전송하지 않습니다. 손을 알아보는 일도 기기 안에서 합니다.</p>
    <p><b>음성은 다릅니다.</b> 말하기를 누르면 브라우저가 마이크 소리를 제조사의 음성 인식
       서버로 보냅니다(크롬은 구글, 사파리는 애플). 손말이 보내는 것이 아니라 브라우저가 보내는
       것이고, 저희가 막거나 들여다볼 수 없습니다. 소리를 보내고 싶지 않으면 문장을 입력해 주세요.
       읽어 주는 소리는 기기 안에서 만들어집니다.</p>
    <p>이 페이지가 접속하는 곳은 글꼴(fonts.googleapis.com), 손 인식 코드(cdn.jsdelivr.net),
       손 인식 모델 파일(storage.googleapis.com) 셋뿐이고, 모두 내려받기만 합니다.
       그 밖의 주소로는 접속하지 못하도록 페이지에 못을 박아 두었습니다.</p>
    <p>손모양과 단어 ${WORD_SIGNS.length}개는 제공받은 도표를 읽어 만든 것으로,
       국립국어원 한국수어사전과 대조해 확인해야 합니다.</p>
    <ul>${SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a> — ${s.note}</li>`).join('')}</ul>`;

  el.chart.innerHTML = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣㅘㅚㅙㅝㅞㅟㅢㄲㄸㅃㅆㅉ']
    .map(j => `<figure>${jamoArt(j)}<figcaption>${j}</figcaption></figure>`).join('');

  setUtterance(WORD_SIGNS[0]?.word ?? '안녕하세요');
}

init();
