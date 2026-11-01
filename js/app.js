/* app.js — 말하기 → 손모양 보기 → 따라하기 → 다시 말하기, 네 단계를 잇는다. */

import { toFingerspell, composeFromJamo } from './hangul.js';
import { getPose, ALL_POSES } from './jamoData.js';
import { renderHand } from './handRenderer.js';
import { describe } from './poseFeatures.js';
import { scorePose, detectLateralShift } from './matcher.js';
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
  holdSince: 0, trail: [], lastHint: '',
  doneAt: 0
};

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

  drawStrip();
  advance();
  if (spoken) el.typed.value = '';
}

function drawStrip() {
  if (!state.seq.length) {
    el.strip.innerHTML = '<p class="strip-empty">아직 말한 문장이 없습니다.</p>';
    el.count.textContent = '';
    return;
  }
  el.strip.innerHTML = state.seq.map((u, i) => {
    if (u.role === 'space') return '<span class="unit gap"></span>';
    const st = i < state.at ? 'done' : i === state.at ? 'now' : 'todo';
    return `<span class="unit" data-state="${st}" data-i="${i}">${u.jamo}</span>`;
  }).join('');
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

  if (i >= state.seq.length) return finish();

  const u = state.seq[i];
  const pose = getPose(u.jamo);
  drawStrip();

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
  drawStrip();
}

/* ── 카메라 판정 ─────────────────────────────── */

function onFrame(lms, handedness) {
  const ctx = el.overlay.getContext('2d');
  const w = el.overlay.width = el.camera.clientWidth;
  const h = el.overlay.height = el.camera.clientHeight;
  ctx.clearRect(0, 0, w, h);

  if (!lms) {
    el.meterLabel.textContent = '손이 보이지 않습니다';
    el.meterPct.textContent = '—';
    el.meterFill.style.width = '0%';
    el.meter.dataset.state = '';
    state.holdSince = 0;
    return;
  }

  drawLandmarks(ctx, lms, w, h);

  const current = state.seq[state.at];
  const pose = current ? getPose(current.jamo) : null;
  if (!pose) return;

  const feat = describe(lms, handedness, true);
  state.trail.push({ x: feat.centroid.x, y: feat.centroid.y });
  if (state.trail.length > 14) state.trail.shift();

  const base = pose.motion ? getPose(pose.base) : pose;
  const r = scorePose(feat, base);

  let score = r.score;
  let hint = r.hint;
  if (pose.motion) {
    const shift = detectLateralShift(state.trail, feat.scale);
    const moved = shift > SHIFT_THRESHOLD;
    if (!moved) { score = Math.min(score, 0.7); hint = hint ?? '같은 손모양으로 손 전체를 옆으로 한 번 옮기세요'; }
  }

  const pct = Math.round(score * 100);
  el.meterPct.textContent = `${pct}%`;
  el.meterFill.style.width = `${pct}%`;
  el.meter.dataset.state = score >= ACCEPT ? 'hit' : score >= NEAR ? 'near' : '';
  el.meterLabel.textContent = score >= ACCEPT ? '맞습니다' : '따라해 보세요';
  if (hint !== state.lastHint) { el.hint.textContent = hint ?? ''; state.lastHint = hint ?? ''; }

  // 떨림을 거르려고, 기준을 넘긴 상태가 일정 시간 이어져야 확정한다
  const now = performance.now();
  if (score >= ACCEPT) {
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

function drawLandmarks(ctx, lms, w, h) {
  // 영상이 좌우 반전되어 보이므로 좌표도 같이 뒤집는다
  const px = p => [(1 - p.x) * w, p.y * h];
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
  try {
    state.tracker = new Tracker({ video: el.video, onFrame, mock: MOCK });
    const { mode } = await state.tracker.start();
    state.live = true;
    el.camera.classList.add('live');
    el.camStatus.dataset.state = mode === 'mock' ? 'mock' : 'on';
    el.camStatus.querySelector('span').textContent = mode === 'mock' ? '모의 입력' : '카메라 켜짐';
    const cur = state.seq[state.at];
    if (cur && state.tracker.mock) state.tracker.setMockPose(getPose(cur.jamo));
  } catch (err) {
    el.btnCam.disabled = false;
    el.btnCam.textContent = '카메라 켜기';
    el.note.textContent = err?.name === 'NotAllowedError'
      ? '카메라 권한이 거부되었습니다. 브라우저 주소창의 카메라 아이콘에서 허용으로 바꾸고 다시 눌러 주세요.'
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

  el.btnSources.addEventListener('click', () => el.sources.showModal());
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
