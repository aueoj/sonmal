/* app.js — 말하거나 손으로 하면 손말이 읽어 준다.
 *
 * 연습 모드: 말을 고르거나 말하면 그 말의 그림을 보여 주고, 따라 한 것을 판정한다.
 * 자유 모드: 고르지 않는다. 내가 하는 수어를 읽어서 바로 소리로 들려준다(signReader.js).
 * 연습하는 동안 눌러야 하는 것은 없다. 그다음부터는 손이 입력이다.
 *   · 지문자는 손모양을 알아보고 저절로 다음 자모로 넘어간다
 *   · 음절이 완성될 때마다 그 음절을 소리로 읽어 준다
 *   · 단어 수어는 동작이 여러 개라 0.5초마다 다음 자세로 흐르고,
 *     손이 보이는 동안 따라한 것으로 보아 단어를 읽어 준다
 */

import { toFingerspell, composeFromJamo } from './hangul.js?v=202611100954';
import { getPose } from './jamoData.js?v=202611100954';
import { jamoArt, wordArt, wordFilm, wordFrameCount, WORD_POSE_FILES } from './illustrations.js?v=202611100954';
import { describe } from './poseFeatures.js?v=202611100954';
import { scoreHands, detectLateralShift, MOTION_WINDOW_MS, SHIFT_MIN } from './matcher.js?v=202611100954';
import { Tracker } from './tracker.js?v=202611100954';
import { createListener, speak, support, hasKoreanVoice } from './speech.js?v=202611100954';
import { planUtterance, SOURCES, WORD_SIGNS } from './words.js?v=202611100954';
import { PHRASE_GROUPS, phrasePlan } from './phrases.js?v=202611100954';
import { groupByIdea } from './lessons.js?v=202611100954';
import { loadProgress, markLearned, stageOf } from './progress.js?v=202611100954';
import { createReader } from './reader.js?v=202611100954';
import { createSignReader, readableSigns, stepWord, checksOf, HOLD_MS as WORD_HOLD_MS } from './signReader.js?v=202611100954';
import { diagnose } from './diagnose.js?v=202611100954';
import { animate, stagger } from './vendor/anime.js?v=202611100954';

const $ = id => document.getElementById(id);
/* 움직임을 줄여 달라고 한 사용자에게는 anime.js 효과를 전부 건너뛴다 */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = (targets, params) => (REDUCED ? null : animate(targets, params));
/* 진행 막대는 폭 대신 transform 으로 늘린다. 매 프레임 바뀌어도 레이아웃을 다시 계산하지 않는다 */
const setFill = v => { el.fill.style.transform = `scaleX(${Math.max(0, Math.min(1, v))})`; };
/* 칸을 해낸 순간 살짝 튀어 오른다. 둘레가 번지는 CSS lockin 과 같이 돈다 */
const popUnit = node => motion(node, { scale: [1, 1.24, 1], duration: 440, ease: 'outBack(2)' });
const el = {
  camera: $('camera'), video: $('cam'), overlay: $('overlay'),
  camEmpty: $('cam-empty'), camPrompt: document.querySelector('.cam-prompt'),
  btnCam: $('btn-cam'), btnDemo: $('btn-demo'), chart: $('chart'),
  diag: $('diag'), diagVerdict: $('diag-verdict'), diagList: $('diag-list'),
  diagAdvice: $('diag-advice'), diagRetry: $('diag-retry'), diagDemo: $('diag-demo'), diagNewTab: $('diag-newtab'),
  handRight: $('hand-right'), handLeft: $('hand-left'),
  spoken: $('spoken'),
  sayForm: $('say-form'), btnListen: $('btn-listen'), typed: $('typed'),
  guide: $('guide'), art: $('guide-art'), name: $('guide-name'), step: $('guide-step'),
  track: $('track'), fill: $('fill'), seq: $('seq'), read: $('read'), seen: $('seen'),
  sources: $('sources'), sourcesBody: $('sources-body'), btnSources: $('btn-sources'),
  ref: $('ref'), refToggle: $('ref-toggle'), refWords: $('ref-words'), camTitle: $('cam-title'),
  meta: $('guide-meta'), seqNote: $('seq-note'),
  modePractice: $('mode-practice'), modeFree: $('mode-free'),
  freeLog: $('free-log'), readWords: $('read-words'), readJamo: $('read-jamo'), freeClear: $('free-clear')
};

let MOCK = new URLSearchParams(location.search).has('mock');

/* 문턱은 재서 정했다. dev/calibrate.mjs 가 맞는 자세와 틀린 자세의 점수를
   전부 재어 가르는 자리를 찾는다. 0.88 에서 맞는 자세는 전부 통과하고
   틀린 자세는 2.7%만 통과한다. 0.74 에서는 틀린 자세의 20%가 통과했다. */
const ACCEPT = 0.88;        // 이 점수를 넘고
const HOLD_MS = 500;        // 이만큼 버티면 맞은 것으로 본다
const NEAR = 0.70;
const SMOOTH_N = 7;
const REPEAT_MS = 1400;     // 다 하고 나서 처음으로 돌아가기까지

const state = {
  seq: [], at: -1, got: [],
  tracker: null, listener: null, live: false,
  hand: 'right',
  holdSince: 0, trail: [], scores: [], motionSeen: false, lastStep: '',
  wordTimer: null, wordStep: 0, wordProg: { k: 0, hold: 0, motion: null }, wordLost: 0,
  lostSince: 0, repeatTimer: null, spokenPart: -1,
  mode: 'practice', readKind: 'words', reader: null, signReader: null, recall: false, active: null,
  settling: false   // 한 칸을 끝내고 다음으로 넘어가는 사이. 이때 들어오는 프레임은 흘린다.
};

const median = xs => {
  const a = [...xs].sort((p, q) => p - q);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};

/* ── 읽어 주기 ──────────────────────────────── */

function say(text, { queue = false } = {}) {
  if (!text) return;
  const show = () => {
    el.spoken.hidden = false;
    el.spoken.textContent = text;
    el.read.textContent = text;
    clearTimeout(say._t);
    say._t = setTimeout(() => { el.spoken.hidden = true; }, 2600);
  };
  // 이어 읽는 말은 실제로 읽기 시작할 때 자막을 바꾼다. 앞 어절 자막을 덮지 않게
  if (queue) speak(text, { queue, onstart: show });
  else { speak(text); show(); }
}

/* ── 연습할 말 정하기 ───────────────────────── */

function setUtterance(text) {
  text = (text ?? '').normalize('NFC');   // macOS 파일 이름에서 붙여 넣은 한글은 NFD 라 낱말을 못 찾는다
  stopWordTimer();
  clearTimeout(state.repeatTimer);
  state.seq = [];
  state.sentence = text.trim().replace(/\s+/g, ' ');
  /* 음절 번호는 어절마다 0부터 다시 매겨진다. 그대로 두면 '뒤 왼쪽'의
     뒤(0)와 왼(0)이 한 글자로 묶여 "뒤왼"으로 읽힌다. 이어서 매긴다. */
  let syllable = 0;
  let partIndex = 0;
  for (const part of planUtterance(text)) {
    if (state.seq.length) state.seq.push({ role: 'space', jamo: ' ' });
    // 칸에는 사용자가 한 말을 그대로 쓴다. '이거'라고 했으면 '이거'다.
    // 수어는 같은 표제어('여기')를 쓰고, 그 사실은 안내 카드에 작게 알린다.
    if (part.kind === 'word') {
      state.seq.push({ role: 'word', sign: part.sign, jamo: part.text, partIndex });
      syllable += 1; partIndex += 1;
      continue;
    }
    // 손으로는 조사와 어미를 뗀 앞부분만 푼다. 읽어 줄 때는 한 말 그대로 읽는다.
    const units = toFingerspell(part.stem ?? part.text);
    for (const u of units) u.said = part.text;
    let max = -1;
    for (const u of units) {
      if (u.syllableIndex === undefined) continue;
      u.syllableIndex += syllable;
      if (u.syllableIndex > max) max = u.syllableIndex;
    }
    if (max >= 0) syllable = max + 1;
    for (const u of units) u.partIndex = partIndex;
    state.seq.push(...units);
    /* 뗀 조사와 어미는 흐리게 보여 준다. 잘린 것이 아니라 일부러 손으로 하지 않는 것이다. */
    const stem = part.stem ?? part.text;
    if (stem !== part.text && part.text.startsWith(stem))
      state.seq.push({ role: 'omit', jamo: part.text.slice(stem.length), partIndex });
    partIndex += 1;
  }
  state.at = -1;
  state.got = [];
  state.spokenPart = -1;
  el.seqNote.hidden = partIndex < 2;     // 여러 어절이면 한국어 순서로 이은 연습이라고 밝힌다
  el.read.textContent = '';
  el.typed.value = '';
  paintPicker(text);
  buildSeq();
  // 숫자나 라틴 글자뿐이면 저절로 건너뛰어 '좋아요'가 된다. 할 것이 없다고 알리고 멈춘다
  if (!state.seq.some(u => u.role === 'word' || getPose(u.jamo))) {
    setRecall(false);
    el.art.replaceChildren(); el.meta.replaceChildren();
    el.name.textContent = state.sentence;
    el.step.textContent = '지문자나 수어로 할 수 있는 글자가 없습니다. 한글로 입력해 주세요';
    el.seen.textContent = ''; el.guide.dataset.state = ''; setFill(0);
    return;
  }
  advance();
}

function paintPicker(active = state.active) {
  state.active = active;
  for (const b of el.ref.querySelectorAll('[data-say]'))
    b.setAttribute('aria-current', String(b.dataset.say === active));
}

/* 말 고르기의 낱말. 상황 묶음마다 이름과 '익힌 수/전체'를 붙이고, 익힌 낱말에는 표시를 단다.
   1 그림 보고 해 봄, 2 그림 없이 해 볼 차례, 3 그림 없이 해냄 */
const STAGE_LABEL = ['', '그림 보고 해 봄', '다음엔 그림 없이', '그림 없이 해냄'];
function renderPicker() {
  const all = loadProgress();
  el.refWords.innerHTML = groupByIdea(WORD_SIGNS).map(g => {
    const done = g.signs.filter(w => stageOf(w.word, all) >= 1).length;
    return `<h3 class="ref-group">${g.name} <em>${done}/${g.signs.length}</em></h3>` + g.signs.map(w => {
      const st = stageOf(w.word, all);
      return `<button type="button" data-say="${w.word}" data-stage="${st}"${st ? ` title="${STAGE_LABEL[st]}"` : ''}>${wordArt(w.word, 0)}<span>${w.word}</span></button>`;
    }).join('');
  }).join('');
  paintPicker();
}

function buildSeq() {
  el.seq.innerHTML = state.seq.map((u, i) =>
    u.role === 'space' ? '<span class="unit gap"></span>'
    : u.role === 'omit' ? `<span class="unit omit" title="조사와 어미는 손으로 하지 않습니다">${u.jamo}</span>`
    : `<span class="unit" data-state="todo" data-i="${i}">${u.jamo}</span>`).join('');
  // 낱말 하나만 할 때는 칸이 제목을 되풀이할 뿐이다. 지문자는 한 자라도 칸을 남긴다
  el.seq.dataset.solo = state.seq.length === 1 && state.seq[0].role === 'word' ? '1' : '';
  paintSeq();
  // 말이 바뀌면 칸이 왼쪽부터 차례로 내려앉는다
  motion(el.seq.querySelectorAll('.unit'), { opacity: [0, 1], y: [8, 0], duration: 380, delay: stagger(24), ease: 'outCubic' });
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
  while (i < state.seq.length && (state.seq[i].role === 'space' || state.seq[i].role === 'omit')) {
    if (state.seq[i].role === 'space') state.got.push(' ');
    i++;
  }
  state.at = i;
  state.holdSince = 0; state.trail = []; state.scores = []; state.motionSeen = false;

  if (i >= state.seq.length) return finish();

  const u = state.seq[i];
  paintSeq();
  if (u.role === 'word') return showWord(u);

  const pose = getPose(u.jamo);
  if (!pose) { state.got.push(u.jamo); const seq = state.seq; return setTimeout(() => { if (state.seq === seq) advance(); }, 400); }
  if (state.tracker?.mock && !state.mockLocked) {
    state.tracker.mockMotion = false;
    state.tracker.mockTwoHands = pose.hands === 2;
    state.tracker.mockPose2 = pose.parts?.[1] ?? null;   // 두 손 모음의 다른 손은 뒤 모음 손모양이다
    state.tracker.mockZone = null;
  }

  setRecall(false);
  delete el.art.dataset.stepOk;
  el.art.innerHTML = jamoArt(u.jamo);
  // 그림 자체엔 손 방향 뒤집기(scaleX)가 걸려 있어 덮어쓰지 않게, 바깥 칸을 움직인다
  motion(el.art, { opacity: [0, 1], translateY: [8, 0], duration: 360, ease: 'outCubic' });
  el.name.textContent = u.jamo;
  el.step.textContent = pose.note;
  el.meta.replaceChildren();
  el.seen.textContent = '';
  el.guide.dataset.state = '';
  setFill(0);
  if (state.tracker?.mock && !state.mockLocked) state.tracker.setMockPose(pose);
}

/* 표정과 사전 영상. 그림은 멈춘 장면이라 움직임과 표정을 다 담지 못한다.
   표정은 문법이라(묻는 말은 묻는 표정이 있어야 질문이다) 글로 보여 주고,
   움직임은 국립국어원 사전의 영상으로 보낸다. 새 탭에서 열려 연습은 이어진다. */
function paintWordMeta(w) {
  el.meta.replaceChildren();
  if (w.비수지) {
    const face = document.createElement('span');
    face.className = 'face';
    face.append('표정 ');
    const b = document.createElement('b'); b.textContent = w.비수지; face.append(b);
    el.meta.append(face);
  }
  if (w.sourceUrl) {
    const a = document.createElement('a');
    a.href = w.sourceUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = '사전 영상 보기';
    el.meta.append(a);
  }
}

/* 모의 입력은 지금 맞춰야 할 단계의 손모양을 흉내 낸다. 판정 경로가 실제로 시험된다. */
function mockForCheck(check, moving = false) {
  if (!state.tracker?.mock || !check || state.mockLocked) return;
  applyMockCheck(check, moving);
}
function applyMockCheck(check, moving) {
  // 손끝 방향: 앞은 손가락을 화면에서 줄여 흉내 내고(tracker), 그 밖은 자세의 방향으로 둔다
  const dir = { down: 'down', side: 'right' }[check.point] ?? 'up';
  const shape = fingers => ({
    fingers: fingers ?? ['index', 'middle', 'ring', 'pinky'], dir, view: 'palm',
    thumb: check.thumb === 'up' ? 'up' : 'in', special: check.ring ? 'circle' : null, bent: false
  });
  state.tracker.setMockPose(shape(check.fingers));
  state.tracker.mockPose2 = check.other ? shape(check.other) : null;
  state.tracker.mockTwoHands = (check.hands ?? 1) === 2;
  state.tracker.mockMotion = moving;      // 둘째 동작부터는 손을 옮겨야 넘어간다
  state.tracker.mockZone = check.zone ?? null;
  state.tracker.mockSpot = check.spot ?? null;
  state.tracker.mockPointOut = check.point === 'out';
  // 사전 원문의 움직임(motion.js). 둘째 동작부터만 흉내 낸다
  state.tracker.mockMove = moving ? (check.move ?? null) : null;
  state.tracker.mockMoving = check.moving ?? null;
  state.tracker.mockMoveAt = performance.now();
  state.tracker.mockSide = handSide();
}

/* 단어 수어는 동작이 여럿이라 그림은 저절로 흐른다. 누를 것이 없다.
   판정은 그림과 따로, 사용자가 단계를 차례로 해내는지를 본다. */
function showWord(u) {
  stopWordTimer();            // 이미 돌던 타이머가 있으면 먼저 멈춘다.
  const w = u.sign;
  const frames = WORD_POSE_FILES[w.word]?.length ?? 1;
  state.wordStep = 0; state.wordLost = 0;
  state.wordProg = { k: 0, hold: 0, motion: null };
  delete el.art.dataset.stepOk;

  el.name.textContent = u.jamo;
  if (u.jamo !== w.word) {
    const as = document.createElement('span');
    as.className = 'as-sign';
    as.textContent = `수어 표제어 '${w.word}'`;
    el.name.append(as);
  }
  paintWordMeta(w);
  el.guide.dataset.state = '';
  setFill(0);
  el.art.innerHTML = wordFilm(w.word);   // 모든 동작을 한 번에 만들어 둔다
  motion(el.art, { opacity: [0, 1], duration: 320, ease: 'outCubic' });
  el.seen.textContent = '';
  state.wordShown = performance.now();
  setRecall(stageOf(w.word) === 2);
  paintWordStep(w);
  mockForCheck(checksOf(w)[0]);

  /* 그림은 저절로 넘어가지 않는다. 지금 그림의 동작을 해내면 다음 그림으로 간다.
     시간에 맞춰 넘기면 따라 하는 속도와 어긋나고, 무엇을 해냈는지도 알 수 없다. */
  if (!state.live) el.step.textContent = '카메라를 켜면 따라한 것을 알아봅니다';
}

/* 그림은 showWord 에서 한 번만 만든다. 여기서는 보여 줄 것만 바꾼다. */
function paintWordStep(w) {
  // 지금 칸이 이 단어가 아니면 건드리지 않는다. 남은 타이머가 자모 그림을 덮지 않게.
  const cur = state.seq[state.at];
  if (!cur || cur.role !== 'word' || cur.sign !== w) return stopWordTimer();
  /* 한 단계에 그림이 여러 장이면(stepFrames) 번갈아 보여 움직임을 보인다.
     움직임 줄이기를 켠 사람에게는 첫 장만 보인다. */
  stopWordTimer();
  const list = w.stepFrames?.[state.wordStep] ?? [state.wordStep];
  let k = 0;
  const show = () => {
    for (const img of el.art.querySelectorAll('.word-pose')) {
      if (Number(img.dataset.frame) === list[k % list.length]) img.dataset.on = '1';
      else delete img.dataset.on;
    }
  };
  show();
  if (list.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    state.wordTimer = setInterval(() => {
      if (state.seq[state.at]?.sign !== w) return stopWordTimer();
      k += 1; show();
    }, 900);
  }
  el.step.textContent = state.recall ? '그림 없이 떠올려 해 보세요' : (w.steps?.[state.wordStep] ?? w.수형);
}

/* 떠올리기: 그림을 보고 두 번 해낸 낱말은 다음부터 그림을 가린다.
   막히면 '그림 보기'를 누르거나, 8초 동안 첫 단계를 못 하면 저절로 보인다. */
function setRecall(on) {
  state.recall = on;
  if (on) el.art.dataset.recall = '1'; else delete el.art.dataset.recall;
  el.art.querySelector('.recall-peek')?.remove();
  if (on) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'recall-peek'; b.textContent = '그림 보기';
    b.addEventListener('click', () => setRecall(false));
    el.art.append(b);
  }
}

function stopWordTimer() {
  if (state.wordTimer) { clearInterval(state.wordTimer); state.wordTimer = null; }
}

function completeWord(u) {
  if (state.settling) return;
  state.settling = true;
  stopWordTimer();
  state.got.push(u.jamo);
  if (u.sign) {
    markLearned(u.sign.word, { recalled: state.recall });
    if (state.recall) el.step.textContent = '그림 없이 해냈어요';
    renderPicker();
  }
  el.guide.dataset.state = 'hit';
  setFill(1);
  const node = el.seq.querySelector(`[data-i="${state.at}"]`);
  if (node) { node.dataset.lock = '1'; popUnit(node); }
  /* 넘어가기 전 잠깐 '해냈다'를 보인다. 그 사이 새 말을 골랐으면 새 말의 첫 칸을
     건너뛰지 않게 아무것도 하지 않는다(그때 seq 는 새 배열이다). */
  const seq = state.seq;
  setTimeout(() => { if (state.seq !== seq) return; advance(); speakFinishedPart(); }, 420);
}

/* 한 어절을 다 하면 그 어절을 읽어 준다.
   자모 하나하나를 읽으면 '안녕하세요'가 '안','녕','하','세','요'로 들려 말이 되지 않는다. */
function speakFinishedPart() {
  const done = state.seq.slice(0, state.at).filter(u => u.role !== 'space');
  const last = done[done.length - 1];
  if (!last || last.partIndex === undefined) return;

  const next = state.seq[state.at];
  if (next && next.partIndex === last.partIndex) return;   // 아직 같은 어절 안이다
  if (last.partIndex === state.spokenPart) return;
  state.spokenPart = last.partIndex;

  const part = done.filter(u => u.partIndex === last.partIndex);
  const text = part[0]?.role === 'word'
    ? part[0].jamo
    : (part[0]?.said ?? composeFromJamo(part.map(u => u.jamo)));
  say(text);
}

/* 끝나도 멈추지 않는다. 잠깐 쉬었다가 처음으로 돌아가, 다시 하면 다시 읽어 준다. */
function finish() {
  stopWordTimer();
  /* 어절이 둘 이상이면 끝에 문장 전체를 한 번 더 이어 읽는다. 어절마다 끊어 들은 말을
     한 문장으로 다시 들려주어야 '내가 이 문장을 말했다'가 된다. 마지막 어절을 읽은
     뒤에 오도록 이 틱이 끝난 다음 줄을 세운다. 한 어절이면 방금 읽었으니 되풀이하지 않는다. */
  const parts = new Set(state.seq.filter(u => u.partIndex !== undefined).map(u => u.partIndex));
  if (parts.size > 1 && state.sentence) setTimeout(() => say(state.sentence, { queue: true }), 0);
  el.guide.dataset.state = 'hit';
  setFill(1);
  el.step.textContent = '좋아요. 다시 해 볼까요';
  paintSeq();
  // 끝까지 해내면 칸 줄에 물결이 한 번 지나간다
  motion(el.seq.querySelectorAll('.unit[data-i]'), { y: [0, -6, 0], duration: 520, delay: stagger(36), ease: 'inOutSine' });
  clearTimeout(state.repeatTimer);
  state.repeatTimer = setTimeout(() => {
    state.at = -1; state.got = []; state.spokenPart = -1;
    for (const n of el.seq.querySelectorAll('.unit[data-i]')) delete n.dataset.lock;
    advance();
  }, REPEAT_MS);
}

/* ── 카메라가 보는 것 ───────────────────────── */

/* 손을 읽는 동안 초당 30~60번 불린다. 글자가 같으면 다시 쓰지 않는다. 지금 화면의 내용과 견주므로
   다른 곳에서 바꾼 뒤에도 틀리지 않는다 */
const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
const setHTML = (node, html) => { if (node.innerHTML !== html) node.innerHTML = html; };

function onFrame(hands, face = null) {
  const ctx = el.overlay.getContext('2d');
  const w = el.camera.clientWidth, h = el.camera.clientHeight;
  if (el.overlay.width !== w) el.overlay.width = w;
  if (el.overlay.height !== h) el.overlay.height = h;
  ctx.clearRect(0, 0, w, h);

  if (state.mode === 'free') {
    for (const hand of hands) drawLandmarks(ctx, hand.lm, w, h);
    const feats = hands.map(hd => describe(hd.lm, hd.handedness, true));
    if (state.readKind === 'jamo') state.reader.feed(feats, performance.now(), { mirrored: state.hand === 'right' });
    else state.signReader.feed(feats, face);
    return;
  }

  const current = state.seq[state.at];
  if (!current || state.settling) return;
  for (const hand of hands) drawLandmarks(ctx, hand.lm, w, h);

  /* 단어는 손모양을 가릴 수 없다. 대신 '한 바퀴 동안 손이 보였고 그 사이에
     실제로 움직였는가'를 본다. 가만히 들고만 있으면 통과하지 않는다. */
  if (current.role === 'word') {
    /* 낱말 판정: 아무 동작이나 흔든다고 통과하지 않는다.
       그림의 단계마다 손 수, 펴진 손가락, 고리, 엄지, 손 높이를 차례로 맞춰야 한다. */
    const now = performance.now();
    if (state.recall && state.wordProg.k === 0 && now - state.wordShown > 8000) setRecall(false);
    const checks = checksOf(current.sign);
    const n = checks.length;
    const p = state.wordProg;
    const feats = hands.map(hd => describe(hd.lm, hd.handedness, true));
    // 얼굴 앞에 든 손(코에 댄 주먹)은 잠깐씩 놓친다. 그 사이에 버티던 것을 버리지 않는다(stepWord)
    const res = stepWord(p, checks, feats, face, handSide(), now);
    if (!res) {
      if (!state.wordLost) state.wordLost = now;
      if (now - state.wordLost > 700) el.seen.textContent = `${p.k + 1}/${n}단계  손이 보이지 않습니다`;
      return;
    }
    state.wordLost = 0;
    const { r, why } = res;
    if (r.ok && why) { r.ok = false; r.hint = why; }
    if (res.stepped) {
      if (p.k >= n) { el.seen.textContent = ''; return completeWord(current); }
      // 해낸 동작의 다음 그림을 보여 준다
      state.wordStep = p.k;
      paintWordStep(current.sign);
      el.art.dataset.stepOk = p.k % 2 ? 'a' : 'b';   // 넘어가는 순간을 짧게 알린다
      mockForCheck(checks[p.k], true);
    }

    const part = p.hold ? Math.min(1, (now - p.hold) / WORD_HOLD_MS) : 0;
    setFill((p.k + part) / n);
    el.guide.dataset.state = r.ok ? 'near' : '';
    el.seen.textContent = n > 1
      ? `${p.k + 1}/${n}번째 동작  ${r.ok ? '좋아요, 그대로' : r.hint}`
      : (r.ok ? '좋아요, 그대로' : r.hint);
    return;
  }

  const pose = getPose(current.jamo);
  if (!pose) return;
  const needTwo = pose.hands === 2;

  if (!hands.length || (needTwo && hands.length < 2)) {
    // 추적은 끊기기 마련이다. 잠깐 끊겼다고 쌓은 것을 버리지 않는다.
    if (!state.lostSince) state.lostSince = performance.now();
    if (performance.now() - state.lostSince > 700) {
      el.step.textContent = needTwo && hands.length === 1
        ? '두 손이 다 보이게 해 주세요'
        : '손이 보이지 않습니다';
      el.seen.textContent = needTwo ? `지금 ${hands.length}손 / 필요 2손` : '';
      setFill(0);
      el.guide.dataset.state = '';
      state.holdSince = 0; state.scores = []; state.trail = []; state.motionSeen = false;
    }
    return;
  }
  state.lostSince = 0;

  // 좌표는 늘 화면 기준으로 본다. 영상 위에 겹쳐 그리는 뼈대와 같은 기준이어야 한다.
  const t = performance.now();
  // 한 손 자모는 가장 잘 맞는 손으로, 두 손 자모는 두 손을 앞뒤 모음에 나눠 본다
  const feats = hands.map(hd => describe(hd.lm, hd.handedness, true));
  const mirrored = state.hand === 'right';
  const base0 = pose.motion ? getPose(pose.base) ?? pose : pose;
  const r = scoreHands(feats, base0, { mirrored }), feat = r.feat;
  if (r.score < ACCEPT) { state.trail = []; state.motionSeen = false; }
  else state.trail.push({ x: feat.centroid.x, t });
  while (state.trail.length && t - state.trail[0].t > MOTION_WINDOW_MS * 1.5) state.trail.shift();

  const score = r.score;
  const hint = r.hint;

  state.scores.push(score);
  if (state.scores.length > SMOOTH_N) state.scores.shift();
  const smooth = median(state.scores);

  setFill(smooth);
  el.guide.dataset.state = smooth >= ACCEPT ? 'hit' : smooth >= NEAR ? 'near' : '';
  if (pose.motion && detectLateralShift(state.trail, feat.scale, t) >= SHIFT_MIN) state.motionSeen = true;
  const motionReady = !pose.motion || state.motionSeen;
  const line = smooth >= ACCEPT && !motionReady
    ? '손모양은 맞아요. 그대로 손 전체를 옆으로 한 번 미세요.'
    : smooth >= ACCEPT ? pose.note : (hint ?? pose.note);
  if (line !== state.lastStep) { el.step.textContent = line; state.lastStep = line; }

  // 무엇이 보이고 무엇이 필요한지 나란히 둔다
  const cmp = (a, bv) => a === bv ? `<b>${a}</b>` : `<span class="off">${a}</span>`;
  const sp = r.seen.spread !== null
    ? ` · 벌림 ${cmp(r.seen.spread + '도', r.want.spread + '도')} / ${r.want.spread}도` : '';
  setHTML(el.seen, `지금 ${cmp(r.seen.fingers, r.want.fingers)} ${cmp(r.seen.dir, r.want.dir)}`
    + ` / 필요 ${r.want.fingers} ${r.want.dir}${sp}`);

  if (smooth >= ACCEPT) {
    if (!state.holdSince) state.holdSince = t;
    if (t - state.holdSince >= HOLD_MS && motionReady) {
      const node = el.seq.querySelector(`[data-i="${state.at}"]`);
      if (node) { node.dataset.lock = '1'; popUnit(node); }
      state.got.push(current.jamo);
      advance();
      speakFinishedPart();
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
  // 앞 카메라는 거울처럼 뒤집어 보여 주므로 점도 뒤집는다.
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
  el.btnCam.textContent = '여는 중';
  try {
    state.tracker = new Tracker({ video: el.video, onFrame, mock: MOCK, onLost: cameraFailed });
    // 모의 입력일 때만: 점검 스크립트가 '상대의 손'을 흉내 낼 수 있게 한다
    // other 를 주면 다른 손을 그 자모 손모양으로 띄운다(두 손 판정 점검용)
    if (MOCK) window.__sonmalMock = (jamo, zone = null, other = null) => {
      state.mockLocked = true;          // 점검이 손을 쥐는 동안 앱이 모의 손을 바꾸지 않는다
      state.tracker.mockZone = zone;    // 손을 둘 높이(얼굴, 가슴 들). 없으면 그 자리 그대로
      state.tracker.mockMotion = false; state.tracker.mockPose2 = null; state.tracker.mockSpot = null;
      state.tracker.mockMove = null; state.tracker.mockPointOut = false;
      const p = jamo ? getPose(jamo) : null;
      state.tracker.mockTwoHands = p?.hands === 2 || !!other;
      state.tracker.mockPose2 = other ? getPose(other) : p?.parts?.[1] ?? null;
      state.tracker.setMockPose(p);
    };
    // 자유 모드 점검용: 낱말의 한 단계를 흉내 낸다. moving 이면 손을 옮기며 한다
    if (MOCK) window.__sonmalMockCheck = (check, moving = false) => {
      state.mockLocked = true;
      if (!check) { state.tracker.setMockPose(null); state.tracker.mockTwoHands = false; state.tracker.mockPose2 = null; return; }
      applyMockCheck(check, moving);
    };
    await state.tracker.start();
    state.live = true;
    el.camera.classList.add('live');
    const cur = state.seq[state.at];
    if (cur?.role === 'word') showWord(cur);
    else if (cur && state.tracker.mock) {
      const cp = getPose(cur.jamo);
      state.tracker.setMockPose(cp);
      state.tracker.mockTwoHands = cp?.hands === 2;   // 카메라를 켜기 전에 정해진 칸도 맞춘다
      state.tracker.mockPose2 = cp?.parts?.[1] ?? null;
    }
  } catch (err) {
    await cameraFailed(err);
  }
}

/* 켜다 막혔을 때도, 쓰는 중에 끊겼을 때도(tracker 의 onLost) 같은 진단을 보인다 */
async function cameraFailed(err) {
  state.live = false;
  el.camera.classList.remove('live');
  el.overlay.getContext('2d').clearRect(0, 0, el.overlay.width, el.overlay.height);
  el.btnCam.disabled = false; el.btnDemo.disabled = false;
  el.btnCam.textContent = '카메라 켜기';
  el.camTitle.textContent = '카메라를 켜면 손을 읽어 드립니다';
  await showDiagnosis(err);   // 진단이 처음부터 다시 재면 진짜 실패를 놓친다
}

async function showDiagnosis(err) {
  el.diagVerdict.textContent = '어디서 막혔는지 확인하는 중입니다';
  el.diagList.innerHTML = ''; el.diagAdvice.textContent = '';
  el.camPrompt.hidden = true; el.diag.hidden = false;
  el.btnCam.disabled = false; el.btnDemo.disabled = false;
  const { rows, verdict, advice, embedded } = await diagnose(err);
  const mark = { ok: '○', bad: '✕', unknown: '–' };
  el.diagVerdict.textContent = verdict;
  el.diagList.innerHTML = rows.map(r =>
    `<li data-state="${r.state}"><b>${mark[r.state]}</b><span>${r.label}</span>`
    + (r.detail ? `<em>(${r.detail})</em>` : '') + '</li>').join('');
  el.diagAdvice.textContent = advice;
  el.diagNewTab.hidden = !embedded;
  el.diagRetry.focus();   // 키보드와 화면 낭독기 사용자가 바로 다음 행동으로 간다
}

function startListening() {
  if (!state.listener) { el.typed.focus(); return; }
  if (state.listener.listening) return state.listener.stop();   // 한 번 더 누르면 끝낸다
  document.body.classList.add('listening');
  el.btnListen.querySelector('span')?.remove();
  el.typed.value = '';
  el.typed.placeholder = '듣고 있습니다';
  state.listener.start();
}
function stopListening() {
  document.body.classList.remove('listening');
  el.typed.placeholder = '또는 문장 입력';
}

/** 쓰는 손 쪽. 화면 좌표(거울)에서 오른손잡이는 +x, 왼손잡이는 -x */
const handSide = () => (state.hand === 'left' ? -1 : 1);

const HAND_KEY = 'sonmal.hand';
function setHand(hand) {
  state.hand = hand;
  try { localStorage.setItem(HAND_KEY, hand); } catch { /* 저장이 막힌 브라우저는 이번만 */ }
  document.body.dataset.hand = hand;
  el.handRight.setAttribute('aria-checked', String(hand === 'right'));
  el.handLeft.setAttribute('aria-checked', String(hand === 'left'));
}

/** 말하기, 입력, 말 고르기가 모두 이리로 온다. 자유 모드에서 고르면 연습 모드로 넘어가 그 말을 연습한다. */
function sayAndPractice(text) {
  if (state.mode !== 'practice') setMode('practice', { restart: false });
  setUtterance(text);
}

function setRef(on) {
  el.ref.hidden = !on;
  el.refToggle.setAttribute('aria-expanded', String(on));
}

/* ── 자유 모드 ──────────────────────────────
   무엇을 할지 고르지 않는다. 내 손을 읽을 수 있는 낱말 전체(또는 지문자 40개)와 견줘
   읽히는 대로 카드에 적고 소리로 들려준다. 판정이 같은 낱말은 후보만 보이고 소리는 내지 않는다. */
const FREE_READABLE = readableSigns(WORD_SIGNS).ok.length;
const FREE_IDLE = {
  words: `낱말을 하나 마치고 손을 내리면 소리로 들려줍니다 (낱말 ${FREE_READABLE}개)`,
  jamo: '지문자를 하나씩 하고, 손을 쉬면 모은 글자를 소리로 들려줍니다'
};

function showFreeArt(word) {
  delete el.art.dataset.recall; delete el.art.dataset.stepOk;
  if (!word) { el.art.innerHTML = '<p class="free-art-empty">읽은 말의 그림이 여기에 나옵니다</p>'; return; }
  const last = Math.max(0, wordFrameCount(word) - 1);
  // 낱말 그림은 data-on 이 붙은 장만 보인다(연습의 겹친 장들과 같은 규칙)
  el.art.innerHTML = wordArt(word, last).replace('<img ', '<img data-on="1" ');
}

function addFree(text, { unsure = false } = {}) {
  const li = document.createElement('li');
  li.textContent = text;
  if (unsure) li.dataset.unsure = '1';
  el.freeLog.append(li);
  while (el.freeLog.children.length > 12) el.freeLog.firstElementChild.remove();
  el.freeLog.scrollLeft = el.freeLog.scrollWidth;
}

function paintFreeIdle() {
  el.name.textContent = '수어를 해 보세요';
  el.step.textContent = FREE_IDLE[state.readKind];
  el.seen.textContent = '';
  showFreeArt(null);
}

function setReadKind(kind) {
  state.readKind = kind;
  el.readWords.setAttribute('aria-checked', String(kind === 'words'));
  el.readJamo.setAttribute('aria-checked', String(kind === 'jamo'));
  state.reader.clear(); state.signReader.reset();
  paintFreeIdle();
}

function setMode(mode, { restart = true } = {}) {
  if (mode === state.mode && document.body.dataset.mode) return;
  state.mode = mode;
  document.body.dataset.mode = mode;
  el.modePractice.setAttribute('aria-checked', String(mode === 'practice'));
  el.modeFree.setAttribute('aria-checked', String(mode === 'free'));
  if (mode === 'free') {
    // 연습을 멈춘다. 돌던 그림과 되풀이를 끊는다
    stopWordTimer(); clearTimeout(state.repeatTimer);
    state.seq = []; state.at = -1; state.settling = false;
    el.seq.innerHTML = ''; setFill(0); el.guide.dataset.state = '';
    el.seqNote.hidden = true; el.meta.textContent = ''; el.read.textContent = '';
    el.spoken.hidden = true; clearTimeout(say._t);   // 연습에서 읽어 준 말이 남아 있지 않게
    try { speechSynthesis.cancel(); } catch { /* 소리 없는 브라우저 */ }   // 읽던 소리도 끊는다
    setRef(false);
    state.reader.clear(); state.signReader.reset();
    // 둘러보기의 합성 손은 연습하던 자세를 들고 있다. 자유 모드에서는 손을 내린 채 시작한다
    if (state.tracker?.mock && !state.mockLocked) state.tracker.setMockPose(null);
    paintFreeIdle();
  } else if (restart) {
    setUtterance(state.active ?? WORD_SIGNS[0]?.word ?? '안녕하세요');
  }
}

/* ── 시작 ──────────────────────────────────── */

function init() {
  let savedHand = null;
  try { savedHand = localStorage.getItem(HAND_KEY); } catch { /* 저장이 막힌 브라우저 */ }
  setHand(savedHand === 'left' ? 'left' : 'right');

  const phraseList = $('phrase-list');
  for (const group of PHRASE_GROUPS) {
    const section = document.createElement('section');
    const heading = document.createElement('h3'); heading.textContent = group.name; section.append(heading);
    for (const text of group.texts) {
      const plan = phrasePlan(text);
      if (!plan.ready) continue; // 그림이 모두 연결된 문장만 제공한다.
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'phrase-choice';
      const label = document.createElement('strong'); label.textContent = text;
      const sequence = document.createElement('span'); sequence.textContent = plan.parts.map(p => p.sign.word).join(' → ');
      button.append(label, sequence);
      button.addEventListener('click', () => { $('phrases').close(); sayAndPractice(text); });
      section.append(button);
    }
    phraseList.append(section);
  }
  state.reader = createReader({
    onChange: ({ jamos, text, live }) => {
      if (state.mode !== 'free' || state.readKind !== 'jamo') return;
      setText(el.name, text || '수어를 해 보세요');
      setText(el.step, live
        ? `지금 ${live.jamo}${live.also?.length ? ` (${live.also.join(', ')}와 손모양이 같습니다)` : ''}`
        : FREE_IDLE.jamo);
      setText(el.seen, jamos.length ? `받아 적음 ${jamos.join(' ')}` : '');
    },
    onSentence: text => { addFree(text); say(text); }
  });
  state.signReader = createSignReader({
    signs: WORD_SIGNS,
    side: handSide,
    onWord: word => {
      if (state.mode !== 'free') return;
      el.name.textContent = word;
      el.step.textContent = '읽었습니다. 다음 낱말을 해 보세요';
      showFreeArt(word);
      addFree(word);
      say(word);
    },
    onAmbiguous: words => {
      if (state.mode !== 'free') return;
      el.name.textContent = words.join(' 또는 ');
      el.step.textContent = '손모양과 높이가 같은 낱말이라 하나로 고르지 못해 소리는 내지 않았습니다';
      showFreeArt(null);
      addFree(words.join('/'), { unsure: true });
    },
    onTick: ({ hands, busy }) => {
      if (state.mode !== 'free') return;
      const t = !hands ? '손을 보여 주세요' : busy ? '읽는 중입니다. 손을 내리거나 잠깐 멈추면 들려줍니다' : '';
      if (el.seen.textContent !== t) el.seen.textContent = t;
    }
  });
  el.modePractice.addEventListener('click', () => setMode('practice'));
  el.modeFree.addEventListener('click', () => setMode('free'));
  el.readWords.addEventListener('click', () => setReadKind('words'));
  el.readJamo.addEventListener('click', () => setReadKind('jamo'));
  el.freeClear.addEventListener('click', () => { el.freeLog.replaceChildren(); setReadKind(state.readKind); });
  document.body.dataset.mode = 'practice';

  el.handRight.addEventListener('click', () => setHand('right'));
  el.handLeft.addEventListener('click', () => setHand('left'));

  if (support.listen) {
    state.listener = createListener({
      onInterim: t => { el.typed.value = t; },      // 들은 말은 입력칸에 그대로 보여 준다
      onResult: t => sayAndPractice(t),
      onEnd: stopListening,
      onError: () => { stopListening(); el.typed.value = ''; el.typed.placeholder = '다시 말해 주세요'; }
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
  el.diagDemo.addEventListener('click', () => {
    el.diag.hidden = true; el.camPrompt.hidden = false;
    startCamera({ demo: true });
  });
  el.diagNewTab.addEventListener('click', () => window.open(location.href, '_blank', 'noopener'));
  el.btnListen.addEventListener('click', startListening);
  el.sayForm.addEventListener('submit', e => {
    e.preventDefault();
    const v = el.typed.value.trim();
    if (v) sayAndPractice(v);
  });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); startListening(); }
  });

  el.btnSources.addEventListener('click', () => {
    el.sources.showModal();
    el.sources.querySelector('button[type="submit"]')?.focus();
  });
  el.sourcesBody.innerHTML = `
    <p><b>영상은 기기 밖으로 나가지 않습니다.</b> 카메라 영상과 손, 얼굴 위치는 이 브라우저 안에서만
       처리되고, 녹화하거나 저장하거나 전송하지 않습니다. 얼굴은 손이 얼굴 어디쯤 있는지 보는 데만 쓰고
       표정은 판정하지 않습니다.</p>
    <p><b>음성은 다릅니다.</b> 말하기를 누르면 브라우저가 마이크 소리를 제조사의 음성 인식
       서버로 보냅니다(크롬은 구글, 사파리는 애플). 손말이 보내는 것이 아니라 브라우저가 보내는
       것이고, 저희가 막거나 들여다볼 수 없습니다. 소리를 보내고 싶지 않으면 문장을 입력해 주세요.
       읽어 주는 소리는 브라우저의 음성 합성으로 만들며, 브라우저에 따라 읽을 글자를 제조사 서버로
       보내는 목소리도 있습니다.</p>
    <p>이 페이지가 접속하는 곳은 글꼴(fonts.googleapis.com, fonts.gstatic.com), 손 인식 코드(cdn.jsdelivr.net),
       손과 얼굴 모델 파일(storage.googleapis.com)이고 모두 내려받기만 합니다. 이때 접속 IP가 그 업체에
       전달될 수 있습니다. vercel.app 주소로 열었을 때는 방문 수를 세는 Vercel Web Analytics도 불러옵니다(쿠키 없음).
       그 밖의 주소로는 접속하지 못하도록 페이지에 못을 박아 두었습니다.
       자세한 내용은 <a href="privacy.html" target="_blank" rel="noopener">개인정보 안내</a>에 있습니다.</p>
    <p>문장을 말하면 낱말마다 사전 수어를 찾고, 없는 낱말은 조사와 어미를 뗀 뒤 지문자로 풉니다.
       순서는 한국어 순서 그대로라, 수어 문장으로 옮긴 것이 아니라 낱말을 이어 본 연습입니다.</p>
    <p>지문자 손모양은 제공받은 도표를 기준으로 합니다. 낱말 ${WORD_SIGNS.length}개 중
       ${WORD_SIGNS.filter(w => w.entryNo).length}개는 국립국어원 한국수어사전의 표제어와 수형 설명을 따라 그렸습니다.</p>
    <ul>${SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>: ${s.note}</li>`).join('')}</ul>
    <p style="color:var(--faint);font-size:var(--t-micro)">© 2026 손말(Sonmal) 제작자 · 개인 학습용으로만 쓸 수 있습니다. 복제·수정·재배포는 <a href="https://github.com/aueoj/sonmal/blob/main/LICENSE" target="_blank" rel="noopener">이용 약관</a>에 따라 금지합니다.</p>
    <p style="color:var(--faint);font-size:var(--t-micro)">판 ${
      document.querySelector('meta[name="build"]')?.content ?? '알 수 없음'
    } · 화면이 옛것 같으면 Cmd(Ctrl)+Shift+R 로 새로고침하세요.</p>`;

  /* 말 고르기: 눌렀을 때만 낱말과 지문자를 영상 위에 덮는다.
     하나를 고르면 닫고 바로 그 말을 연습한다. */
  el.chart.innerHTML = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣㅘㅚㅙㅝㅞㅟㅢㄲㄸㅃㅆㅉ']
    .map(j => `<button type="button" data-say="${j}" aria-label="${j} 연습">${jamoArt(j)}<span>${j}</span></button>`).join('');
  renderPicker();
  el.refToggle.addEventListener('click', () => setRef(el.ref.hidden));
  el.ref.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (!b) return;
    setRef(false);
    sayAndPractice(b.dataset.say);
  });
  $('open-phrases').addEventListener('click', () => { setRef(false); $('phrases').showModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !el.ref.hidden) { setRef(false); el.refToggle.focus(); } });

  setUtterance(WORD_SIGNS[0]?.word ?? '안녕하세요');

  // 첫 화면은 카메라가 켜진 상태다. 브라우저가 권한을 물으면 그 답을 따르고,
  // 막히면 왜 막혔는지와 카메라 없이 둘러보는 길을 보여 준다.
  startCamera();
}

init();
