/* app.js — 말하기 → 손모양 보기 → 따라하기 → 다시 말하기, 네 단계를 잇는다. */

import { toFingerspell, composeFromJamo } from './hangul.js';
import { getPose, ALL_POSES } from './jamoData.js';
import { renderHand } from './handRenderer.js';
import { describe } from './poseFeatures.js';
import { scorePose, detectLateralShift, MOTION_WINDOW_MS } from './matcher.js';
import { Tracker } from './tracker.js';
import { createListener, speak, support } from './speech.js';
import { planUtterance, SOURCES, WORD_SIGNS } from './words.js';

const $ = id => document.getElementById(id);
const el = {
  camera: document.querySelector('.camera'),
  video: $('cam'), overlay: $('overlay'), camEmpty: $('cam-empty'),
  camStatus: $('cam-status'), btnCam: $('btn-cam'),
  heard: $('heard'), heardText: $('heard-text'),
  glyph: $('glyph'), hand: $('hand'), flag: $('flag'),
  note: $('note'), mnemo: $('mnemo'),
  meter: document.querySelector('.meter'), meterLabel: $('meter-label'),
  meterPct: $('meter-pct'), meterFill: $('meter-fill'), hint: $('hint'),
  pShape: $('p-shape'), pView: $('p-view'), pDir: $('p-dir'),
  strip: $('strip'), count: $('count'),
  btnListen: $('btn-listen'), btnReplay: $('btn-replay'),
  typedForm: $('typed-form'), typed: $('typed'),
  result: $('result'), sources: $('sources'), sourcesBody: $('sources-body'),
  btnSources: $('btn-sources'), chart: $('chart')
};

const MOCK = new URLSearchParams(location.search).has('mock');
const ACCEPT = 0.74;        // 이 점수를 넘고
const HOLD_MS = 450;        // 이만큼 버티면 맞은 것으로 본다
const NEAR = 0.58;
const SHIFT_THRESHOLD = 0.35;

const state = {
  seq: [], at: -1, got: [],
  tracker: null, listener: null, live: false,
  holdSince: 0, trail: [], scores: [], lastHint: '',
  doneAt: 0
};

/* 랜드마크는 프레임마다 떨린다. 점수를 그대로 쓰면 문턱 근처에서 오르내리다
   버티기 시간이 매 프레임 초기화되어, 맞는 자세를 들고 있어도 확정되지 않는다.
   최근 몇 프레임의 가운데값을 쓴다. 평균과 달리 튀는 한 프레임에 끌려가지 않는다. */
const SMOOTH_N = 7;
function median(xs) {
  const a = [...xs].sort((p, q) => p - q);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}

const VIEW_KO = { palm: '손바닥', back: '손등', side: '손날' };
const DIR_KO = { up: '위', right: '옆', down: '아래' };

/* ── 시퀀스 ─────────────────────────────────── */

function setUtterance(text, { spoken = false } = {}) {
  const plan = planUtterance(text);
  const spellText = plan.map(p => p.text).join(' ');
  state.seq = toFingerspell(spellText);
  state.at = -1;
  state.got = [];
  state.doneAt = 0;
  el.result.textContent = '';
  el.btnReplay.disabled = true;

  el.heard.hidden = false;
  el.heard.dataset.interim = 'false';
  el.heardText.textContent = text;

  buildStrip();
  advance();
  if (spoken) el.typed.value = '';
}

/* 시퀀스는 문장이 바뀔 때 한 번만 만든다. */
function buildStrip() {
  if (!state.seq.length) {
    el.strip.innerHTML = '<p class="strip-empty">아직 말한 문장이 없습니다.</p>';
    el.count.textContent = '';
    return;
  }
  el.strip.innerHTML = state.seq.map((u, i) =>
    u.role === 'space'
      ? '<span class="unit gap"></span>'
      : `<span class="unit" data-state="todo" data-i="${i}">${u.jamo}</span>`
  ).join('');
  paintStrip();
}

/* 진행 상태만 덧칠한다. innerHTML을 다시 쓰면 확정 순간의 애니메이션이 사라진다. */
function paintStrip() {
  if (!state.seq.length) return;
  for (const node of el.strip.querySelectorAll('.unit[data-i]')) {
    const i = Number(node.dataset.i);
    node.dataset.state = i < state.at ? 'done' : i === state.at ? 'now' : 'todo';
  }
  const total = state.seq.filter(u => u.role !== 'space').length;
  const done = state.seq.slice(0, Math.max(0, state.at)).filter(u => u.role !== 'space').length;
  el.count.textContent = `${done} / ${total}`;
  el.strip.querySelector('[data-state="now"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function advance() {
  let i = state.at + 1;
  while (i < state.seq.length && state.seq[i].role === 'space') {
    state.got.push(' ');
    i++;
  }
  state.at = i;
  state.holdSince = 0;
  state.trail = [];
  state.scores = [];

  if (i >= state.seq.length) return finish();

  const u = state.seq[i];
  const pose = getPose(u.jamo);
  paintStrip();

  if (!pose) {
    el.glyph.textContent = u.jamo;
    el.hand.innerHTML = '';
    el.note.textContent = '지문자에 없는 글자입니다. 건너뜁니다.';
    el.mnemo.textContent = '';
    setTimeout(() => { state.got.push(u.jamo); advance(); }, 700);
    return;
  }

  el.glyph.textContent = u.jamo;
  el.hand.innerHTML = renderHand(pose, { size: 240 });
  el.flag.hidden = pose.confidence !== 'check';
  el.note.textContent = pose.note;
  el.mnemo.textContent = pose.mnemonic;
  el.pShape.textContent = (pose.fingers?.length ? `${pose.fingers.length}손가락` : '주먹')
    + (pose.bent ? ' 꺾음' : '') + (pose.special === 'circle' ? ' 고리' : '');
  el.pView.textContent = VIEW_KO[pose.view] ?? '—';
  el.pDir.textContent = pose.motion ? '옆으로 이동' : (DIR_KO[pose.dir] ?? '—');

  el.meterLabel.textContent = state.live ? '따라해 보세요' : '카메라를 켜면 봐 드립니다';
  if (!state.live) { el.meterPct.textContent = '—'; el.meterFill.style.width = '0%'; }

  if (state.tracker?.mock) state.tracker.setMockPose(pose);
}

function finish() {
  const text = composeFromJamo(state.got).trim();
  el.meterLabel.textContent = '다 따라했습니다';
  el.meterPct.textContent = '';
  el.meterFill.style.width = '100%';
  el.meter.dataset.state = 'hit';
  el.hint.textContent = '';
  el.result.innerHTML = text ? `따라한 대로 읽으면 <b>${text}</b>` : '';
  el.btnReplay.disabled = !text;
  state.doneAt = Date.now();
  if (text) speak(text);
  paintStrip();
}

/* ── 카메라 판정 ─────────────────────────────── */

function onFrame(lms, handedness) {
  const ctx = el.overlay.getContext('2d');
  const w = el.camera.clientWidth, h = el.camera.clientHeight;
  if (el.overlay.width !== w) el.overlay.width = w;
  if (el.overlay.height !== h) el.overlay.height = h;
  ctx.clearRect(0, 0, w, h);

  if (!lms) {
    el.meterLabel.textContent = '손이 보이지 않습니다';
    el.meterPct.textContent = '—';
    el.meterFill.style.width = '0%';
    el.meter.dataset.state = '';
    state.holdSince = 0;
    state.scores = [];
    return;
  }

  drawLandmarks(ctx, lms, w, h);

  const current = state.seq[state.at];
  const pose = current ? getPose(current.jamo) : null;
  if (!pose) return;

  const feat = describe(lms, handedness, true);
  const t = performance.now();
  state.trail.push({ x: feat.centroid.x, t });
  while (state.trail.length && t - state.trail[0].t > MOTION_WINDOW_MS * 1.5) state.trail.shift();

  const base = pose.motion ? getPose(pose.base) : pose;
  const r = scorePose(feat, base);

  let score = r.score;
  let hint = r.hint;
  if (pose.motion) {
    const shift = detectLateralShift(state.trail, feat.scale, t);
    const moved = shift > SHIFT_THRESHOLD;
    if (!moved) { score = Math.min(score, 0.7); hint = hint ?? '같은 손모양으로 손 전체를 옆으로 한 번 옮기세요'; }
  }

  state.scores.push(score);
  if (state.scores.length > SMOOTH_N) state.scores.shift();
  const smooth = median(state.scores);

  const pct = Math.round(smooth * 100);
  el.meterPct.textContent = `${pct}%`;
  el.meterFill.style.width = `${pct}%`;
  el.meter.dataset.state = smooth >= ACCEPT ? 'hit' : smooth >= NEAR ? 'near' : '';
  el.meterLabel.textContent = smooth >= ACCEPT ? '맞습니다' : '따라해 보세요';

  // 맞다고 해 놓고 고치라는 말을 같이 띄우면 둘 다 못 믿게 된다
  const shown = smooth >= ACCEPT ? '' : (hint ?? '');
  if (shown !== state.lastHint) { el.hint.textContent = shown; state.lastHint = shown; }

  // 떨림을 거르려고, 기준을 넘긴 상태가 일정 시간 이어져야 확정한다
  const now = performance.now();
  if (smooth >= ACCEPT) {
    if (!state.holdSince) state.holdSince = now;
    if (now - state.holdSince >= HOLD_MS) {
      const node = el.strip.querySelector(`[data-i="${state.at}"]`);
      if (node) { node.dataset.lock = '1'; }
      state.got.push(current.jamo);
      advance();
    }
  } else {
    state.holdSince = 0;
  }
}

const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
               [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

/* 영상은 object-fit: cover 로 잘려 그려진다. 정규화 좌표를 요소 크기에
   그대로 곱하면 잘린 만큼 어긋나므로, 실제로 그려지는 상자를 되계산한다. */
function coverBox(video, w, h) {
  const vw = video?.videoWidth || 4, vh = video?.videoHeight || 3;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale, dh = vh * scale;
  return { dw, dh, ox: (w - dw) / 2, oy: (h - dh) / 2 };
}

function drawLandmarks(ctx, lms, w, h) {
  // 영상이 좌우 반전되어 보이므로 좌표도 같이 뒤집는다
  const { dw, dh, ox, oy } = coverBox(el.video, w, h);
  const px = p => [ox + (1 - p.x) * dw, oy + p.y * dh];
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(94,106,210,.65)';
  ctx.beginPath();
  for (const [a, b] of BONES) {
    const [x1, y1] = px(lms[a]), [x2, y2] = px(lms[b]);
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.fillStyle = '#5e6ad2';
  for (const p of lms) {
    const [x, y] = px(p);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
}

/* ── 켜고 끄기 ───────────────────────────────── */

async function startCamera() {
  el.btnCam.disabled = true;
  el.btnCam.textContent = '여는 중…';
  el.note.textContent = MOCK
    ? '모의 입력을 준비하고 있습니다.'
    : '손 인식 모델을 내려받고 있습니다. 처음 한 번만 걸립니다.';
  try {
    state.tracker = new Tracker({ video: el.video, onFrame, mock: MOCK });
    const { mode } = await state.tracker.start();
    state.live = true;
    el.camera.classList.add('live');
    el.camStatus.dataset.state = mode === 'mock' ? 'mock' : 'on';
    el.camStatus.querySelector('span').textContent = mode === 'mock' ? '모의 입력' : '카메라 켜짐';
    const cur = state.seq[state.at];
    const curPose = cur ? getPose(cur.jamo) : null;
    if (curPose) {
      el.note.textContent = curPose.note;
      if (state.tracker.mock) state.tracker.setMockPose(curPose);
    }
  } catch (err) {
    el.btnCam.disabled = false;
    el.btnCam.textContent = '카메라 켜기';
    el.note.textContent =
      err?.name === 'NotAllowedError' ? '카메라 권한이 거부되었습니다. 브라우저 주소창의 카메라 아이콘에서 허용으로 바꾸고 다시 눌러 주세요.'
      : err?.name === 'NotFoundError' ? '쓸 수 있는 카메라를 찾지 못했습니다. 연결을 확인하고 다시 눌러 주세요.'
      : /import|fetch|network|Failed to/i.test(err?.message ?? '') ? '손 인식 모델을 내려받지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.'
      : `카메라를 열지 못했습니다. ${err?.message ?? ''}`;
  }
}

function startListening() {
  if (!state.listener) {
    el.note.textContent = '이 브라우저는 음성 인식을 지원하지 않습니다. 아래 칸에 문장을 입력해 주세요.';
    el.typed.focus();
    return;
  }
  document.body.classList.add('listening');
  el.btnListen.innerHTML = '듣는 중… <kbd>Space</kbd>';
  el.heard.hidden = false;
  el.heard.dataset.interim = 'true';
  el.heardText.textContent = '말씀하세요';
  state.listener.start();
}

function stopListening() {
  document.body.classList.remove('listening');
  el.btnListen.innerHTML = '말하기 <kbd>Space</kbd>';
}

/* ── 시작 ───────────────────────────────────── */

function init() {
  if (support.listen) {
    state.listener = createListener({
      onInterim: t => { el.heard.dataset.interim = 'true'; el.heardText.textContent = t; },
      onResult: t => setUtterance(t, { spoken: true }),
      onEnd: stopListening,
      onError: e => {
        stopListening();
        el.note.textContent = e === 'not-allowed'
          ? '마이크 권한이 거부되었습니다. 허용으로 바꾸고 다시 눌러 주세요.'
          : '음성을 알아듣지 못했습니다. 다시 말하거나 직접 입력해 주세요.';
      }
    });
  } else {
    el.btnListen.disabled = true;
    el.btnListen.title = '이 브라우저는 음성 인식을 지원하지 않습니다';
  }

  el.btnCam.addEventListener('click', startCamera);
  el.btnListen.addEventListener('click', startListening);
  el.btnReplay.addEventListener('click', () => speak(composeFromJamo(state.got).trim()));
  el.typedForm.addEventListener('submit', e => {
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
    <p>말한 문장을 한글 지문자로 풀어 보여주고, 따라한 손모양을 다시 말로 읽어 줍니다.
       영상과 손 좌표는 이 브라우저 안에서만 처리되며 어디로도 전송되지 않습니다.</p>
    <p><strong>단어 단위 수어</strong>는 아직 사전이 비어 있어 모든 말을 지문자로 풉니다.
       실제 한국수어에서도 지문자는 수어 단어로 표현하기 어려운 말을 적을 때 쓰는 보충 수단입니다.
       현재 등록된 단어 ${WORD_SIGNS.length}개.</p>
    <p><strong>손모양은 확인이 필요합니다.</strong> 지문자 도표를 읽어 만든 것이라
       이웃 자모와 구별이 모호한 글자에는 화면에 '확인 필요'를 붙여 두었습니다.</p>
    <ul>${SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a> — ${s.note}</li>`).join('')}</ul>`;

  // 카메라를 켜기 전에 보이는 전체 지문자 표
  el.chart.innerHTML = ALL_POSES.filter(p => !p.motion).map(p =>
    `<figure data-check="${p.confidence === 'check' ? 1 : 0}" title="${p.note}">
       ${renderHand(p, { size: 96 })}<figcaption>${p.jamo}</figcaption></figure>`).join('');

  if (MOCK) {
    el.camStatus.dataset.state = 'mock';
    el.camStatus.querySelector('span').textContent = '모의 입력';
  }
  setUtterance('안녕하세요');
}

init();
