/* app.js — 말하기 → 손모양 보기 → 따라하기 → 다시 말하기, 네 단계를 잇는다. */

import { toFingerspell, composeFromJamo } from './hangul.js';
import { getPose, ALL_POSES } from './jamoData.js';
import { renderHand, renderWordSign } from './handRenderer.js?v=poses-3';
import { describe } from './poseFeatures.js';
import { scorePose, detectLateralShift, MOTION_WINDOW_MS } from './matcher.js';
import { Tracker } from './tracker.js?v=poses-3';
import { createListener, speak, support, hasKoreanVoice } from './speech.js';
import { planUtterance, SOURCES, WORD_SIGNS } from './words.js?v=poses-3';
import { diagnose } from './diagnose.js?v=poses-3';

const $ = id => document.getElementById(id);
const el = {
  camera: document.querySelector('.camera'),
  video: $('cam'), overlay: $('overlay'), camEmpty: $('cam-empty'),
  camStatus: $('cam-status'), btnCam: $('btn-cam'), btnDemo: $('btn-demo'),
  card: $('card'), btnNext: $('btn-next'),
  diag: $('diag'), diagVerdict: $('diag-verdict'), diagList: $('diag-list'),
  diagAdvice: $('diag-advice'), diagRetry: $('diag-retry'), diagNewTab: $('diag-newtab'),
  camPrompt: document.querySelector('.cam-prompt'),
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
  btnSources: $('btn-sources'), chart: $('chart'),
  guide: $('motion-guide'), guideSequence: $('guide-sequence'),
  guideProgress: $('guide-progress'), guideWord: $('guide-word-detail'),
  guideHand: $('guide-hand'), guideMirrorNote: $('guide-mirror-note'),
  guidePrev: $('guide-prev'), guideNext: $('guide-next'), guideStepCount: $('guide-step-count')
};

let MOCK = new URLSearchParams(location.search).has('mock');
const ACCEPT = 0.74;        // 이 점수를 넘고
const HOLD_MS = 450;        // 이만큼 버티면 맞은 것으로 본다
const NEAR = 0.58;
const SHIFT_THRESHOLD = 0.35;

const state = {
  seq: [], at: -1, got: [],
  tracker: null, listener: null, live: false,
  holdSince: 0, trail: [], scores: [], lastHint: '',
  guideStep: 0, guideAt: -1,
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
  // 사전에 있으면 단어 수어로, 없으면 지문자로. 실제 한국수어가 쓰는 순서다.
  state.seq = [];
  for (const part of planUtterance(text)) {
    if (state.seq.length) state.seq.push({ jamo: ' ', role: 'space', syllable: ' ' });
    if (part.kind === 'word') state.seq.push({ role: 'word', sign: part.sign, jamo: part.text });
    else state.seq.push(...toFingerspell(part.text));
  }
  state.at = -1;
  state.got = [];
  state.doneAt = 0;
  el.result.textContent = '';
  el.btnReplay.disabled = true;

  el.heard.hidden = false;
  el.heard.dataset.interim = 'false';
  el.heardText.textContent = text;

  buildStrip();
  buildGuide();
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
    u.role === 'space' ? '<span class="unit gap"></span>'
    : u.role === 'word' ? `<span class="unit word" data-state="todo" data-i="${i}">${u.jamo}</span>`
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
  paintGuide();
}

// 그림은 문장이 바뀔 때만 만들고, 진행 중에는 현재 차례만 갱신한다.
function buildGuide() {
  let number = 0;
  el.guideSequence.innerHTML = state.seq.map((unit, index) => {
    if (unit.role === 'space') return '';
    const pose = getPose(unit.jamo);
    const art = unit.role === 'word' ? renderWordSign(unit.sign)
      : pose ? renderHand(pose, { size: 76 }) : '';
    return `<li class="guide-step" data-kind="${unit.role}" data-i="${index}" data-state="todo">
      <span class="guide-number">${++number}</span>${art}<strong>${unit.jamo}</strong>
      ${pose?.motion ? '<small>옆으로 이동 →</small>' : ''}</li>`;
  }).join('');
}

function paintGuide() {
  el.guide.hidden = !state.live || !state.seq.length;
  if (el.guide.hidden) return;
  for (const item of el.guideSequence.children) {
    const index = Number(item.dataset.i);
    item.dataset.state = index < state.at ? 'done' : index === state.at ? 'now' : 'todo';
    if (index === state.at) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
  const current = el.guideSequence.querySelector('[aria-current="step"]');
  if (current) {
    // 가이드 내부만 가로로 이동한다. 모바일 페이지 전체를 끌어내리지 않는다.
    el.guideSequence.scrollLeft = Math.max(0,
      current.offsetLeft - el.guideSequence.offsetLeft - el.guideSequence.clientWidth / 2 + current.offsetWidth / 2);
  }
  el.guideProgress.textContent = state.at >= state.seq.length ? '모두 따라 했어요' : el.count.textContent;
  const unit = state.seq[state.at];
  if (state.guideAt !== state.at) { state.guideAt = state.at; state.guideStep = 0; }
  const pose = unit && getPose(unit.jamo);
  const steps = unit?.role === 'word' ? (unit.sign.steps ?? [])
    : pose ? [pose.note, ...(pose.motion ? ['손모양을 유지하고 옆으로 이동하세요.'] : ['같은 손모양을 잠시 유지해 주세요.'])] : [];
  state.guideStep = Math.min(state.guideStep, Math.max(0, steps.length - 1));
  const finished = state.at >= state.seq.length;
  el.guideWord.hidden = false;
  el.guideWord.textContent = finished ? '모든 동작을 따라 했어요.' : steps[state.guideStep] ?? '';
  el.guidePrev.disabled = finished || state.guideStep === 0;
  el.guideNext.disabled = finished || (unit?.role !== 'word' && state.guideStep >= steps.length - 1);
  el.guideNext.textContent = state.guideStep < steps.length - 1 ? '다음 단계' : unit?.role === 'word' ? '다음 동작' : '카메라로 확인 중';
  el.guideStepCount.textContent = finished ? '완료' : `${state.guideStep + 1} / ${steps.length} 단계`;
  el.guideNext.dataset.last = String(state.guideStep >= steps.length - 1);
  if (unit?.role === 'word') {
    const frame = renderWordSign(unit.sign, { step: state.guideStep });
    const card = el.guideSequence.querySelector('[aria-current="step"] .sm-word');
    if (card) card.outerHTML = frame;
    const side = el.hand.querySelector('.word-art');
    if (side) side.innerHTML = frame;
    const caption = $('word-pose-caption');
    if (caption) caption.textContent = steps[state.guideStep] ?? '';
  }
  el.guideHand.closest('label').hidden = unit?.role !== 'word';
  el.guideMirrorNote.hidden = unit?.role !== 'word';


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
  paintStrip();

  if (u.role === 'word') return showWord(u);

  el.card.classList.remove('word-card');
  const pose = getPose(u.jamo);

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
  el.flag.textContent = '확인 필요';
  el.btnNext.hidden = true;
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

/* 단어 수어는 아직 따라한 것을 인식하지 못한다. 할 수 있는 척하지 않고
   동작을 순서대로 보여 준 뒤 사용자가 넘기게 한다. */
function showWord(u) {
  const w = u.sign;
  el.card.classList.add('word-card');
  el.glyph.textContent = '';
  el.hand.innerHTML =
    `<div class="word-art">${renderWordSign(w)}</div>` +
    `<div class="word-steps"><p class="word-name">${w.word}</p><p id="word-pose-caption">${w.steps?.[0] ?? ''}</p><p class="word-hands">${w.hands === 2 ? '두 손' : '한 손'}` +
    (w.비수지 ? ` · ${w.비수지}` : '') + '</p></div>';
  el.flag.hidden = false;
  el.flag.textContent = '검수 전';
  el.note.textContent = w.수형;
  el.mnemo.textContent = `${w.수향} · ${w.수위}`;
  el.pShape.textContent = w.hands === 2 ? '두 손' : '한 손';
  el.pView.textContent = w.수향.replace('손바닥이 ', '');
  el.pDir.textContent = w.수동;
  el.meterLabel.textContent = '이 단어는 아직 인식하지 못합니다';
  el.meterPct.textContent = '';
  el.meterFill.style.width = '0%';
  el.meter.dataset.state = '';
  el.hint.textContent = '동작을 따라해 본 뒤 다음을 누르세요.';
  el.btnNext.hidden = false;
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
  el.btnNext.hidden = true;
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

  // 단어 수어 구간은 인식하지 않는다. 미터를 건드리면 카드의 안내가 덮인다.
  if (state.seq[state.at]?.role === 'word') return;

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
  if (!current) return;
  const pose = getPose(current.jamo);
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
  if (smooth >= ACCEPT && state.guideStep >= 1) {
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

async function startCamera({ demo = false } = {}) {
  if (demo) MOCK = true;
  el.btnCam.disabled = true;
  el.btnDemo.disabled = true;
  el.btnCam.textContent = '여는 중…';
  el.note.textContent = MOCK
    ? '모의 입력을 준비하고 있습니다.'
    : '카메라 권한을 허용해 주세요. 허용 후 손 인식 모델을 준비합니다.';
  try {
    state.tracker = new Tracker({ video: el.video, onFrame, mock: MOCK });
    const { mode } = await state.tracker.start();
    state.live = true;
    paintGuide();
    el.camera.classList.add('live');
    el.camStatus.dataset.state = mode === 'mock' ? 'mock' : 'on';
    el.camStatus.querySelector('span').textContent = mode === 'mock' ? '모의 입력' : '카메라 켜짐';
    const cur = state.seq[state.at];
    if (cur?.role === 'word') {
      showWord(cur);                       // 카메라 안내 문구가 덮어쓴 카드를 되돌린다
    } else if (cur) {
      const curPose = getPose(cur.jamo);
      if (curPose) {
        el.note.textContent = curPose.note;
        if (state.tracker.mock) state.tracker.setMockPose(curPose);
      }
    }
  } catch (err) {
    el.btnCam.disabled = false;
    el.btnDemo.disabled = false;
    el.btnCam.textContent = '카메라 켜기';
    await showDiagnosis();
  }
}

/* 막힌 자리를 한 줄로 뭉뚱그리지 않고 단계별로 보여 준다.
   그래야 다음에 무엇을 할지 고를 수 있다. */
async function showDiagnosis() {
  el.diagVerdict.textContent = '어디서 막혔는지 확인하는 중…';
  el.diagList.innerHTML = '';
  el.diagAdvice.textContent = '';
  el.camPrompt.hidden = true;
  el.diag.hidden = false;

  const { rows, verdict, advice, embedded } = await diagnose();
  const mark = { ok: '○', bad: '✕', unknown: '–' };
  el.diagVerdict.textContent = verdict;
  el.diagList.innerHTML = rows.map(r =>
    `<li data-state="${r.state}"><b>${mark[r.state]}</b><span>${r.label}</span>` +
    (r.detail ? `<em>— ${r.detail}</em>` : '') + '</li>').join('');
  el.diagAdvice.textContent = advice;
  el.diagNewTab.hidden = !embedded;
  el.note.textContent = verdict;
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
  const setGuideHand = () => {
    document.body.dataset.guideHand = el.guideHand.value;
    const hand = el.guideHand.value === 'right' ? '오른손' : '왼손';
    const side = el.guideHand.value === 'right' ? '오른쪽' : '왼쪽';
    el.guideMirrorNote.textContent = `거울 화면 기준 · ${hand}은 화면 ${side}. 그림과 같은 쪽으로 움직여 보세요.`;
  };
  el.guideHand.addEventListener('change', setGuideHand);
  setGuideHand();
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

  el.guidePrev.addEventListener('click', () => { state.guideStep = Math.max(0, state.guideStep - 1); paintGuide(); });
  el.guideNext.addEventListener('click', () => {
    if (el.guideNext.dataset.last !== 'true') { state.guideStep++; paintGuide(); }
    else if (state.seq[state.at]?.role === 'word') { state.got.push(state.seq[state.at].jamo); advance(); }
  });
  $('practice-words').innerHTML = WORD_SIGNS.map((w, i) => `<button type="button" data-word-index="${i}">${w.word}</button>`).join('');
  $('practice-words').addEventListener('click', e => { const b = e.target.closest('[data-word-index]'); if (b) setUtterance(WORD_SIGNS[Number(b.dataset.wordIndex)].word); });
  const phrases = ['안녕하세요 감사합니다', '미안합니다 괜찮아요', '다시 천천히', '천천히 도와주세요', '물 도와주세요', '화장실 도와주세요', '네 이해했어요', '아니요 다시', '괜찮아요 감사합니다', '이해했어요 감사합니다'];
  $('practice-phrases').innerHTML = phrases.map((phrase, i) => `<button type="button" data-phrase-index="${i}">${phrase}</button>`).join('');
  $('practice-phrases').addEventListener('click', e => { const b = e.target.closest('[data-phrase-index]'); if (b) setUtterance(phrases[Number(b.dataset.phraseIndex)]); });

  el.btnCam.addEventListener('click', () => startCamera());
  el.btnDemo.addEventListener('click', () => startCamera({ demo: true }));
  el.btnNext.addEventListener('click', () => {
    const u = state.seq[state.at];
    if (u?.role === 'word') state.got.push(u.jamo);
    advance();
  });
  el.diagRetry.addEventListener('click', () => { el.diag.hidden = true; el.camPrompt.hidden = false; startCamera(); });
  el.diagNewTab.addEventListener('click', () => window.open(location.href, '_blank', 'noopener'));
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

  // 목소리는 운영체제가 준다. 없으면 다 따라한 뒤에야 알게 되므로 미리 말한다.
  const sayVoice = () => {
    if (!support.speak) el.btnReplay.title = '이 브라우저는 음성 출력을 지원하지 않습니다';
    else if (!hasKoreanVoice()) el.btnReplay.title = '한국어 목소리가 없어 소리가 나지 않을 수 있습니다';
    else el.btnReplay.title = '따라한 대로 다시 읽어 줍니다';
  };
  sayVoice();
  if (support.speak) speechSynthesis.addEventListener?.('voiceschanged', sayVoice);

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
