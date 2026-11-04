/* app.js — 말하거나 손으로 하면 손말이 읽어 준다.
 *
 * 연습하는 동안 눌러야 하는 것은 없다. 위의 단어 칩을 한 번 고르거나
 * 말하기를 누르는 것이 전부고, 그다음부터는 손이 입력이다.
 *   · 지문자는 손모양을 알아보고 저절로 다음 자모로 넘어간다
 *   · 음절이 완성될 때마다 그 음절을 소리로 읽어 준다
 *   · 단어 수어는 동작이 여러 개라 0.5초마다 다음 자세로 흐르고,
 *     손이 보이는 동안 따라한 것으로 보아 단어를 읽어 준다
 */

import { toFingerspell, composeFromJamo } from './hangul.js?v=202611041448';
import { getPose } from './jamoData.js?v=202611041448';
import { jamoArt, wordArt, wordFilm, WORD_POSE_FILES } from './illustrations.js?v=202611041448';
import { describe } from './poseFeatures.js?v=202611041448';
import { scorePose, scoreCheck, detectLateralShift, MOTION_WINDOW_MS } from './matcher.js?v=202611041448';
import { Tracker } from './tracker.js?v=202611041448';
import { createListener, speak, support, hasKoreanVoice } from './speech.js?v=202611041448';
import { planUtterance, SOURCES, WORD_SIGNS } from './words.js?v=202611041448';
import { PHRASE_GROUPS, phrasePlan } from './phrases.js?v=202611041448';
import { groupByIdea } from './lessons.js?v=202611041448';
import { loadProgress, markLearned, stageOf } from './progress.js?v=202611041448';
import { createReader } from './reader.js?v=202611041448';
import { SITUATIONS } from './lessons.js?v=202611041448';
import { diagnose } from './diagnose.js?v=202611041448';

const $ = id => document.getElementById(id);
const el = {
  camera: $('camera'), video: $('cam'), overlay: $('overlay'),
  camEmpty: $('cam-empty'), camPrompt: document.querySelector('.cam-prompt'),
  btnCam: $('btn-cam'), btnDemo: $('btn-demo'), chart: $('chart'),
  diag: $('diag'), diagVerdict: $('diag-verdict'), diagList: $('diag-list'),
  diagAdvice: $('diag-advice'), diagRetry: $('diag-retry'), diagDemo: $('diag-demo'), diagNewTab: $('diag-newtab'),
  chips: $('chips'), handRight: $('hand-right'), handLeft: $('hand-left'),
  spoken: $('spoken'),
  sayForm: $('say-form'), btnListen: $('btn-listen'), typed: $('typed'),
  guide: $('guide'), art: $('guide-art'), name: $('guide-name'), step: $('guide-step'),
  track: $('track'), fill: $('fill'), seq: $('seq'), read: $('read'), seen: $('seen'),
  sources: $('sources'), sourcesBody: $('sources-body'), btnSources: $('btn-sources'),
  ref: $('ref'), refToggle: $('ref-toggle'), refWords: $('ref-words'), camTitle: $('cam-title'),
  meta: $('guide-meta'), seqNote: $('seq-note'),
  modePractice: $('mode-practice'), modeTalk: $('mode-talk'), talk: $('talk'), talkSaid: $('talk-said'),
  talkLog: $('talk-log'), readToggle: $('read-toggle'), readLive: $('read-live'), readClear: $('read-clear'),
  talkQuick: $('talk-quick')
};

let MOCK = new URLSearchParams(location.search).has('mock');

/* 문턱은 재서 정했다. dev/calibrate.mjs 가 맞는 자세와 틀린 자세의 점수를
   전부 재어 가르는 자리를 찾는다. 0.88 에서 맞는 자세는 전부 통과하고
   틀린 자세는 2.7%만 통과한다. 0.74 에서는 틀린 자세의 20%가 통과했다. */
const ACCEPT = 0.88;        // 이 점수를 넘고
const HOLD_MS = 500;        // 이만큼 버티면 맞은 것으로 본다
const NEAR = 0.70;
const SMOOTH_N = 7;
const WORD_HOLD_MS = 400;  // 낱말의 한 단계를 맞춘 채 이만큼 버티면 그 단계를 해낸 것으로 본다
const WORD_TRAVEL = 0.3;   // 다음 동작으로 가려면 손이 이만큼은 옮겨 가야 한다 (손 길이 대비)
const REPEAT_MS = 1400;     // 다 하고 나서 처음으로 돌아가기까지

const state = {
  seq: [], at: -1, got: [],
  tracker: null, listener: null, live: false,
  hand: 'right',
  holdSince: 0, trail: [], scores: [], motionSeen: false, lastStep: '',
  wordTimer: null, wordStep: 0, wordGot: 0, wordHold: 0, wordLost: 0,
  lostSince: 0, repeatTimer: null, spokenPart: -1,
  mode: 'practice', reading: false, reader: null, facing: 'user', recall: false, active: null,
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
  stopWordTimer();
  clearTimeout(state.repeatTimer);
  state.seq = [];
  state.sentence = (text ?? '').trim().replace(/\s+/g, ' ');
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
  paintChips(text);
  buildSeq();
  advance();
}

function paintChips(active = state.active) {
  state.active = active;
  for (const b of el.chips.querySelectorAll('.chip'))
    b.setAttribute('aria-current', String(b.dataset.word === active));
}

/* 칩 줄. 상황 묶음마다 이름과 '익힌 수/전체'를 붙이고, 익힌 낱말에는 표시를 단다.
   1 그림 보고 해 봄, 2 그림 없이 해 볼 차례, 3 그림 없이 해냄 */
const STAGE_LABEL = ['', '그림 보고 해 봄', '다음엔 그림 없이', '그림 없이 해냄'];
function renderChips() {
  const all = loadProgress();
  el.chips.innerHTML = '<button class="chip" type="button" data-open-phrases="1">문장 연습</button>' + groupByIdea(WORD_SIGNS).map(g => {
    const done = g.signs.filter(w => stageOf(w.word, all) >= 1).length;
    return `<span class="chip-group" role="group" aria-label="${g.name}"><span class="chip-cat" aria-hidden="true">${g.name} <em>${done}/${g.signs.length}</em></span>`
      + g.signs.map(w => {
        const st = stageOf(w.word, all);
        return `<button class="chip" type="button" data-word="${w.word}" data-stage="${st}"${st ? ` title="${STAGE_LABEL[st]}"` : ''}>${w.word}</button>`;
      }).join('') + '</span>';
  }).join('') + '<button class="chip spell" type="button" data-word="손말">손말 지문자</button>';
  paintChips();
}

function buildSeq() {
  el.seq.innerHTML = state.seq.map((u, i) =>
    u.role === 'space' ? '<span class="unit gap"></span>'
    : u.role === 'omit' ? `<span class="unit omit" title="조사와 어미는 손으로 하지 않습니다">${u.jamo}</span>`
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
  if (!pose) { state.got.push(u.jamo); return setTimeout(advance, 400); }
  if (state.tracker?.mock && !state.mockLocked) {
    state.tracker.mockMotion = false;
    state.tracker.mockTwoHands = pose.hands === 2;
    state.tracker.mockZone = null;
  }

  setRecall(false);
  delete el.art.dataset.stepOk;
  el.art.innerHTML = jamoArt(u.jamo);
  el.name.textContent = u.jamo;
  el.step.textContent = pose.note;
  el.meta.replaceChildren();
  el.seen.textContent = '';
  el.guide.dataset.state = '';
  el.fill.style.width = '0%';
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

/* 낱말의 단계마다 판정 힌트. 사전 기록에 없으면 손 수만 본다. */
function wordChecks(w) {
  return w.check ?? (w.steps ?? ['']).map(() => ({ hands: w.hands ?? 1 }));
}

/* 모의 입력은 지금 맞춰야 할 단계의 손모양을 흉내 낸다. 판정 경로가 실제로 시험된다. */
function mockForCheck(check, moving = false) {
  if (!state.tracker?.mock || !check || state.mockLocked) return;
  const shape = fingers => ({
    fingers: fingers ?? ['index', 'middle', 'ring', 'pinky'], dir: 'up', view: 'palm',
    thumb: check.thumb === 'up' ? 'up' : 'in', special: check.ring ? 'circle' : null, bent: false
  });
  state.tracker.setMockPose(shape(check.fingers));
  state.tracker.mockPose2 = check.other ? shape(check.other) : null;
  state.tracker.mockTwoHands = (check.hands ?? 1) === 2;
  state.tracker.mockMotion = moving;      // 둘째 동작부터는 손을 옮겨야 넘어간다
  state.tracker.mockZone = check.zone ?? null;
}

/* 단어 수어는 동작이 여럿이라 그림은 저절로 흐른다. 누를 것이 없다.
   판정은 그림과 따로, 사용자가 단계를 차례로 해내는지를 본다. */
function showWord(u) {
  stopWordTimer();            // 이미 돌던 타이머가 있으면 먼저 멈춘다.
  const w = u.sign;
  const frames = WORD_POSE_FILES[w.word]?.length ?? 1;
  state.wordStep = 0; state.wordGot = 0; state.wordHold = 0; state.wordLost = 0;
  state.wordFrom = null; state.wordTravel = 0;
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
  el.fill.style.width = '0%';
  el.art.innerHTML = wordFilm(w.word);   // 모든 동작을 한 번에 만들어 둔다
  el.seen.textContent = '';
  state.wordShown = performance.now();
  setRecall(stageOf(w.word) === 2);
  paintWordStep(w);
  mockForCheck(wordChecks(w)[0]);

  /* 그림은 저절로 넘어가지 않는다. 지금 그림의 동작을 해내면 다음 그림으로 간다.
     시간에 맞춰 넘기면 따라 하는 속도와 어긋나고, 무엇을 해냈는지도 알 수 없다. */
  if (!state.live) el.step.textContent = '카메라를 켜면 따라한 것을 알아봅니다';
}

/* 그림은 showWord 에서 한 번만 만든다. 여기서는 보여 줄 것만 바꾼다. */
function paintWordStep(w) {
  // 지금 칸이 이 단어가 아니면 건드리지 않는다. 남은 타이머가 자모 그림을 덮지 않게.
  const cur = state.seq[state.at];
  if (!cur || cur.role !== 'word' || cur.sign !== w) return stopWordTimer();
  for (const img of el.art.querySelectorAll('.word-pose')) {
    if (Number(img.dataset.frame) === state.wordStep) img.dataset.on = '1';
    else delete img.dataset.on;
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
    renderChips();
  }
  el.guide.dataset.state = 'hit';
  el.fill.style.width = '100%';
  const node = el.seq.querySelector(`[data-i="${state.at}"]`);
  if (node) node.dataset.lock = '1';
  setTimeout(() => { advance(); speakFinishedPart(); }, 420);
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
  el.fill.style.width = '100%';
  el.step.textContent = '좋아요. 다시 해 볼까요';
  paintSeq();
  clearTimeout(state.repeatTimer);
  state.repeatTimer = setTimeout(() => {
    state.at = -1; state.got = []; state.spokenPart = -1;
    for (const n of el.seq.querySelectorAll('.unit[data-i]')) delete n.dataset.lock;
    advance();
  }, REPEAT_MS);
}

/* ── 카메라가 보는 것 ───────────────────────── */

function onFrame(hands, face = null) {
  const ctx = el.overlay.getContext('2d');
  const w = el.camera.clientWidth, h = el.camera.clientHeight;
  if (el.overlay.width !== w) el.overlay.width = w;
  if (el.overlay.height !== h) el.overlay.height = h;
  ctx.clearRect(0, 0, w, h);

  if (state.reading) {
    for (const hand of hands) drawLandmarks(ctx, hand.lm, w, h);
    state.reader.feed(hands.map(hd => describe(hd.lm, hd.handedness, true)), performance.now());
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
    if (state.recall && state.wordGot === 0 && now - state.wordShown > 8000) setRecall(false);
    const checks = wordChecks(current.sign);
    const n = checks.length;
    const k = Math.min(state.wordGot, n - 1);
    if (!hands.length) {
      state.wordHold = 0;
      if (!state.wordLost) state.wordLost = now;
      if (now - state.wordLost > 700) el.seen.textContent = `${k + 1}/${n}단계  손이 보이지 않습니다`;
      return;
    }
    state.wordLost = 0;
    const feats = hands.map(hd => describe(hd.lm, hd.handedness, true));
    const r = scoreCheck(feats, checks[k], face);
    /* 같은 자세 그대로 다음 단계까지 넘어가지 않게, 앞 동작을 끝낸 자리에서
       손이 실제로 옮겨 가야 다음 동작으로 친다. */
    if (state.wordGot > 0 && state.wordFrom && r.centroid) {
      const d = Math.hypot(r.centroid.x - state.wordFrom.x, r.centroid.y - state.wordFrom.y) / (r.scale || 1);
      state.wordTravel = Math.max(state.wordTravel ?? 0, d);
      if (r.ok && state.wordTravel < WORD_TRAVEL) { r.ok = false; r.hint = '그림처럼 다음 동작으로 손을 옮기세요'; }
    }
    if (r.ok) {
      if (!state.wordHold) state.wordHold = now;
      if (now - state.wordHold >= WORD_HOLD_MS) {
        state.wordGot += 1; state.wordHold = 0;
        if (state.wordGot >= n) { el.seen.textContent = ''; return completeWord(current); }
        // 해낸 동작의 다음 그림을 보여 준다
        state.wordStep = Math.min(state.wordGot, (WORD_POSE_FILES[current.sign.word]?.length ?? 1) - 1);
        paintWordStep(current.sign);
        el.art.dataset.stepOk = state.wordGot % 2 ? 'a' : 'b';   // 넘어가는 순간을 짧게 알린다
        state.wordFrom = r.centroid; state.wordTravel = 0;
        mockForCheck(checks[state.wordGot], true);
      }
    } else state.wordHold = 0;

    const part = state.wordHold ? Math.min(1, (now - state.wordHold) / WORD_HOLD_MS) : 0;
    el.fill.style.width = `${Math.round(((state.wordGot + part) / n) * 100)}%`;
    el.guide.dataset.state = r.ok ? 'near' : '';
    el.seen.textContent = n > 1
      ? `${state.wordGot + 1}/${n}번째 동작  ${r.ok ? '좋아요, 그대로' : r.hint}`
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
      el.fill.style.width = '0%';
      el.guide.dataset.state = '';
      state.holdSince = 0; state.scores = []; state.trail = []; state.motionSeen = false;
    }
    return;
  }
  state.lostSince = 0;

  // 좌표는 늘 화면 기준으로 본다. 영상 위에 겹쳐 그리는 뼈대와 같은 기준이어야 한다.
  const t = performance.now();
  // 양손 자모는 둘 중 더 잘 맞는 손으로 본다. 한 손 자모는 첫 손을 쓴다.
  const feats = hands.map(hd => describe(hd.lm, hd.handedness, true));
  const mirrored = state.hand === 'right';
  const base0 = pose.motion ? getPose(pose.base) ?? pose : pose;
  let feat = feats[0], r = scorePose(feat, base0, { mirrored });
  for (let i = 1; i < feats.length; i++) {
    const alt = scorePose(feats[i], base0, { mirrored });
    if (alt.score > r.score) { feat = feats[i]; r = alt; }
  }
  if (r.score < ACCEPT) { state.trail = []; state.motionSeen = false; }
  else state.trail.push({ x: feat.centroid.x, t });
  while (state.trail.length && t - state.trail[0].t > MOTION_WINDOW_MS * 1.5) state.trail.shift();

  const score = r.score;
  const hint = r.hint;

  state.scores.push(score);
  if (state.scores.length > SMOOTH_N) state.scores.shift();
  const smooth = median(state.scores);

  el.fill.style.width = `${Math.round(smooth * 100)}%`;
  el.guide.dataset.state = smooth >= ACCEPT ? 'hit' : smooth >= NEAR ? 'near' : '';
  if (pose.motion && detectLateralShift(state.trail, feat.scale, t) >= 0.35) state.motionSeen = true;
  const motionReady = !pose.motion || state.motionSeen;
  const line = smooth >= ACCEPT && !motionReady
    ? '손모양은 맞아요. 그대로 손 전체를 옆으로 한 번 미세요.'
    : smooth >= ACCEPT ? pose.note : (hint ?? pose.note);
  if (line !== state.lastStep) { el.step.textContent = line; state.lastStep = line; }

  // 무엇이 보이고 무엇이 필요한지 나란히 둔다
  const cmp = (a, bv) => a === bv ? `<b>${a}</b>` : `<span class="off">${a}</span>`;
  const sp = r.seen.spread !== null
    ? ` · 벌림 ${cmp(r.seen.spread + '도', r.want.spread + '도')} / ${r.want.spread}도` : '';
  el.seen.innerHTML = `지금 ${cmp(r.seen.fingers, r.want.fingers)} ${cmp(r.seen.dir, r.want.dir)}`
    + ` / 필요 ${r.want.fingers} ${r.want.dir}${sp}`;

  if (smooth >= ACCEPT) {
    if (!state.holdSince) state.holdSince = t;
    if (t - state.holdSince >= HOLD_MS && motionReady) {
      const node = el.seq.querySelector(`[data-i="${state.at}"]`);
      if (node) node.dataset.lock = '1';
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
  // 앞 카메라는 거울처럼 뒤집어 보여 주므로 점도 뒤집는다. 뒤 카메라는 그대로다.
  const px = p => [ox + (state.facing === 'environment' ? p.x : 1 - p.x) * dw, oy + p.y * dh];
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
    // 모의 입력일 때만: 점검 스크립트가 '상대의 손'을 흉내 낼 수 있게 한다
    if (MOCK) window.__sonmalMock = (jamo, zone = null) => {
      state.mockLocked = true;          // 점검이 손을 쥐는 동안 앱이 모의 손을 바꾸지 않는다
      state.tracker.mockZone = zone;    // 손을 둘 높이(얼굴, 가슴 들). 없으면 그 자리 그대로
      state.tracker.mockMotion = false; state.tracker.mockPose2 = null;
      const p = jamo ? getPose(jamo) : null;
      state.tracker.mockTwoHands = p?.hands === 2;
      state.tracker.setMockPose(p);
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
    }
  } catch {
    el.btnCam.disabled = false; el.btnDemo.disabled = false;
    el.btnCam.textContent = '카메라 켜기';
    el.camTitle.textContent = '카메라를 켜면 손을 읽어 드립니다';
    await showDiagnosis();
  }
}

async function showDiagnosis() {
  el.diagVerdict.textContent = '어디서 막혔는지 확인하는 중…';
  el.diagList.innerHTML = ''; el.diagAdvice.textContent = '';
  el.camPrompt.hidden = true; el.diag.hidden = false;
  el.btnCam.disabled = false; el.btnDemo.disabled = false;
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
  if (state.listener.listening) return state.listener.stop();   // 한 번 더 누르면 끝낸다
  document.body.classList.add('listening');
  el.btnListen.querySelector('span')?.remove();
  el.typed.value = '';
  el.typed.placeholder = '듣고 있습니다. 다 말하면 잠깐 기다리세요';
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

/* ── 대화 모드 ──────────────────────────────
   혼자 거울 앞에서 하는 연습이 아니라, 수어 사용인과 마주 앉아 쓰는 화면.
   내가 말하거나 입력하면 위에 큰 글자로 보여 주고(상대가 읽는다), 아래 카드에서
   그 말을 수어로 한다. 상대가 지문자로 답하면 읽어서 글자로 적고 소리로 읽어 준다. */
function addTurn(who, text) {
  const li = document.createElement('li');
  li.dataset.who = who;
  const b = document.createElement('b'); b.textContent = who;
  li.append(b, text);
  el.talkLog.append(li);
  while (el.talkLog.children.length > 12) el.talkLog.firstElementChild.remove();
  el.talkLog.scrollTop = el.talkLog.scrollHeight;
}

/** 말하기, 입력, 칩이 모두 이리로 온다. 대화 중이면 오간 말에 적고 크게 보인다. */
function sayAndPractice(text) {
  if (state.mode === 'talk' && text?.trim()) {
    el.talkSaid.textContent = text.trim();
    addTurn('나', text.trim());
  }
  setUtterance(text);
}

async function setReading(on) {
  state.reading = on;
  el.readToggle.setAttribute('aria-pressed', String(on));
  el.readClear.hidden = !on;
  state.reader.clear();
  el.readLive.textContent = on ? '상대가 지문자를 하면 여기에 받아 적습니다' : '';
  try {
    state.facing = await state.tracker?.switchFacing?.(on ? 'environment' : 'user') ?? 'user';
  } catch { state.facing = 'user'; }
  document.body.dataset.facing = state.facing;
}

function setMode(mode) {
  state.mode = mode;
  document.body.dataset.mode = mode;
  el.modePractice.setAttribute('aria-checked', String(mode === 'practice'));
  el.modeTalk.setAttribute('aria-checked', String(mode === 'talk'));
  el.talk.hidden = mode !== 'talk';
  if (mode !== 'talk' && state.reading) setReading(false);
}

/* ── 시작 ──────────────────────────────────── */

function init() {
  setHand('right');

  renderChips();
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
  el.chips.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (b?.dataset.openPhrases) $('phrases').showModal();
    else if (b?.dataset.word) sayAndPractice(b.dataset.word);
  });
  /* 칩이 넘치면 오른쪽 끝을 흐리게 해 더 있다는 것을 보인다. 끝까지 밀면 흐림을 걷는다. */
  const markMore = () => {
    const c = el.chips;
    c.dataset.more = c.scrollLeft + c.clientWidth < c.scrollWidth - 2 ? '1' : '';
  };
  el.chips.addEventListener('scroll', markMore, { passive: true });
  addEventListener('resize', markMore);
  markMore();

  state.reader = createReader({
    onChange: ({ jamos, text, live }) => {
      if (!state.reading) return;
      el.readLive.replaceChildren();
      if (live) {
        const b = document.createElement('b'); b.textContent = live.jamo;
        el.readLive.append('지금 ', b);
        if (live.also?.length) { const em = document.createElement('em'); em.textContent = `(${live.also.join(', ')}와 손모양이 같다)`; el.readLive.append(em); }
      }
      if (jamos.length) el.readLive.append(`  받아 적음 ${jamos.join(' ')} → ${text}`);
    },
    onSentence: text => { addTurn('상대', text); say(text); }
  });
  el.modePractice.addEventListener('click', () => setMode('practice'));
  el.modeTalk.addEventListener('click', () => setMode('talk'));
  el.readToggle.addEventListener('click', () => setReading(!state.reading));
  el.readClear.addEventListener('click', () => state.reader.clear());
  const stuck = SITUATIONS.find(x => x.id === 'stuck');
  el.talkQuick.innerHTML = `<span>${stuck.name}</span>` + stuck.words
    .filter(w => WORD_SIGNS.some(s => s.word === w))
    .map(w => `<button type="button" data-say="${w}">${w}</button>`).join('');
  el.talkQuick.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (b) sayAndPractice(b.dataset.say);
  });
  setMode('practice');

  el.handRight.addEventListener('click', () => setHand('right'));
  el.handLeft.addEventListener('click', () => setHand('left'));

  if (support.listen) {
    state.listener = createListener({
      onInterim: t => { el.typed.value = t; },      // 들은 말은 입력칸에 그대로 보여 준다
      onResult: t => sayAndPractice(t),
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
    <p><b>영상은 기기 밖으로 나가지 않습니다.</b> 카메라 영상과 손 좌표는 이 브라우저 안에서만
       처리되고, 녹화하거나 저장하거나 전송하지 않습니다. 손을 알아보는 일도 기기 안에서 합니다.</p>
    <p><b>음성은 다릅니다.</b> 말하기를 누르면 브라우저가 마이크 소리를 제조사의 음성 인식
       서버로 보냅니다(크롬은 구글, 사파리는 애플). 손말이 보내는 것이 아니라 브라우저가 보내는
       것이고, 저희가 막거나 들여다볼 수 없습니다. 소리를 보내고 싶지 않으면 문장을 입력해 주세요.
       읽어 주는 소리는 기기 안에서 만들어집니다.</p>
    <p>이 페이지가 접속하는 곳은 글꼴(fonts.googleapis.com), 손 인식 코드(cdn.jsdelivr.net),
       손 인식 모델 파일(storage.googleapis.com) 셋뿐이고, 모두 내려받기만 합니다.
       그 밖의 주소로는 접속하지 못하도록 페이지에 못을 박아 두었습니다.</p>
    <p>문장을 말하면 낱말마다 사전 수어를 찾고, 없는 낱말은 조사와 어미를 뗀 뒤 지문자로 풉니다.
       순서는 한국어 순서 그대로라, 수어 문장으로 옮긴 것이 아니라 낱말을 이어 본 연습입니다.</p>
    <p>지문자 손모양은 제공받은 도표를 기준으로 합니다. 낱말 ${WORD_SIGNS.length}개 중
       ${WORD_SIGNS.filter(w => w.entryNo).length}개는 국립국어원 한국수어사전의 표제어와 수형 설명을 따라 그렸습니다.</p>
    <ul>${SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a> — ${s.note}</li>`).join('')}</ul>
    <p style="color:var(--faint);font-size:var(--t-micro)">판 ${
      document.querySelector('meta[name="build"]')?.content ?? '알 수 없음'
    } · 화면이 옛것 같으면 Cmd(Ctrl)+Shift+R 로 새로고침하세요.</p>`;

  /* 표 보기: 스위치를 켰을 때만 지문자와 낱말 표를 영상 위에 덮는다.
     하나를 고르면 표를 닫고 바로 그 말을 연습한다. */
  el.chart.innerHTML = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣㅘㅚㅙㅝㅞㅟㅢㄲㄸㅃㅆㅉ']
    .map(j => `<button type="button" data-say="${j}" aria-label="${j} 연습">${jamoArt(j)}<span>${j}</span></button>`).join('');
  el.refWords.innerHTML = groupByIdea(WORD_SIGNS).map(g =>
    `<h3 class="ref-group">${g.name}</h3>` + g.signs
      .map(w => `<button type="button" data-say="${w.word}">${wordArt(w.word, 0)}<span>${w.word}</span></button>`).join('')).join('');
  const setRef = on => {
    el.ref.hidden = !on;
    el.refToggle.setAttribute('aria-checked', String(on));
  };
  el.refToggle.addEventListener('click', () => setRef(el.ref.hidden));
  el.ref.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (!b) return;
    setRef(false);
    setUtterance(b.dataset.say);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !el.ref.hidden) setRef(false); });

  setUtterance(WORD_SIGNS[0]?.word ?? '안녕하세요');

  // 첫 화면은 카메라가 켜진 상태다. 브라우저가 권한을 물으면 그 답을 따르고,
  // 막히면 왜 막혔는지와 카메라 없이 둘러보는 길을 보여 준다.
  startCamera();
}

init();
