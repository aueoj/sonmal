/* tracker.js — 카메라에서 손 랜드마크를 뽑는다.
 *
 * MediaPipe Hand Landmarker를 브라우저 안에서 돌린다. 영상도 랜드마크도
 * 기기 밖으로 나가지 않는다. 모델은 처음 한 번만 내려받아 캐시된다.
 *
 * ?mock=1 이면 카메라 대신 합성 랜드마크를 먹인다. 카메라 없이 화면과
 * 판정 로직을 그대로 확인하기 위한 개발용 경로다.
 */

import { landmarksFor } from './mockHand.js?v=202611101012';
import { ZONE_AT } from './matcher.js?v=202611101012';

const TASKS_VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
// 손 높이를 몸에 대어 재려고 얼굴 자리만 찾는다. 2m 안쪽 얼굴용의 작은 모델이다.
// 얼굴이 누구인지는 알아내지 않고, 상자와 코끝 위치만 쓴다. 기기 밖으로 나가지 않는다.
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const FACE_EVERY = 3;        // 얼굴은 천천히 움직인다. 세 프레임에 한 번만 찾는다
const FACE_KEEP_MS = 2000;   // 손이 얼굴을 가리는 동안에는 마지막 자리를 쓴다
// 모의 입력의 얼굴 자리(화면 비율). dev/word-judge-test.mjs 와 같다
const MOCK_FACE = { y: 0.2, h: 0.16, x: 0.5, w: 0.14 };
const MOCK_HAND = 0.4;                       // 합성 손 크기 배율
const MOCK_HAND_SCALE = 0.44 * MOCK_HAND;     // 손목에서 중지 뿌리까지(화면 비율)
const MAX_FAILS = 30;        // 손 인식이 이만큼(60fps 로 0.5초) 잇달아 실패하면 멈추고 알린다

export class Tracker {
  constructor({ video, onFrame, onLost, mock = false }) {
    this.video = video;
    this.onFrame = onFrame;
    this.onLost = onLost;      // 켠 뒤에 카메라나 손 인식이 끊기면 오류를 받는다
    this.fails = 0;
    this.mock = mock;
    this.running = false;
    this.landmarker = null;
    this.mockPose = null;
    this.mockNoise = 0.02;
    this.faceDetector = null;
    this.face = null;          // { y: 코끝 높이, h: 얼굴 상자 높이, at: 본 시각 }
    this.frameNo = 0;
  }

  async start() {
    if (this.mock) { this.running = true; this._mockLoop(); return { mode: 'mock' }; }

    // 권한과 장치를 먼저 확인한다. 모델 실패를 카메라 권한 실패와 구분한다.
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('카메라는 HTTPS 또는 localhost에서 사용할 수 있습니다.');
    }
    let FaceDetector, fileset;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      this.video.srcObject = stream;
      // 카메라를 뽑거나, 다른 프로그램이 가져가거나, 권한을 거두면 영상이 끝난다
      stream.getVideoTracks()[0]?.addEventListener('ended', () =>
        this._lose('CameraEndedError', '카메라 영상이 끊어졌습니다'));
      await this.video.play();
      const vision = await import(
        /* @vite-ignore */ `${TASKS_VISION}/vision_bundle.mjs`
      );
      const { HandLandmarker, FilesetResolver } = vision;
      FaceDetector = vision.FaceDetector;
      fileset = await FilesetResolver.forVisionTasks(`${TASKS_VISION}/wasm`);
      const opts = delegate => ({
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
      });
      // GPU 위임을 못 쓰는 기기가 있다. 그때는 CPU로 한 번 더 시도한다.
      try {
        this.landmarker = await HandLandmarker.createFromOptions(fileset, opts('GPU'));
      } catch {
        this.landmarker = await HandLandmarker.createFromOptions(fileset, opts('CPU'));
      }
    } catch (error) {
      this.stop();
      throw error;
    }
    this.running = true;
    this._loop();
    // 얼굴 모델은 손 인식을 막지 않게 뒤에서 받는다. 실패하면 화면 비율로 어림한다
    this._loadFace(FaceDetector, fileset);
    return { mode: 'camera' };
  }

  stop() {
    this.running = false;
    const s = this.video?.srcObject;
    if (s) { s.getTracks().forEach(t => t.stop()); this.video.srcObject = null; }
    this.landmarker?.close();
    this.landmarker = null;
    this.faceDetector?.close();
    this.faceDetector = null;
    this.face = null;
  }

  _lose(name, message) {
    if (!this.running) return;
    this.stop();
    this.onLost?.(Object.assign(new Error(message), { name }));
  }

  async _loadFace(FaceDetector, fileset) {
    if (!FaceDetector) return;
    const opts = delegate => ({
      baseOptions: { modelAssetPath: FACE_MODEL, delegate },
      runningMode: 'VIDEO', minDetectionConfidence: 0.5
    });
    try {
      try { this.faceDetector = await FaceDetector.createFromOptions(fileset, opts('GPU')); }
      catch { this.faceDetector = await FaceDetector.createFromOptions(fileset, opts('CPU')); }
      if (!this.running) { this.faceDetector.close(); this.faceDetector = null; }
    } catch { this.faceDetector = null; }
  }

  /* 화면에서 가장 큰 얼굴(카메라 앞 사람)의 코끝 높이와 얼굴 높이. 흔들림은 눅인다 */
  _findFace(now) {
    const vh = this.video.videoHeight;
    const dets = this.faceDetector.detectForVideo(this.video, now).detections ?? [];
    const best = dets.reduce((a, d) => (!a || d.boundingBox.height > a.boundingBox.height ? d : a), null);
    if (!best || !vh) return;
    const nose = best.keypoints?.[2];
    const box = best.boundingBox;
    const vw = this.video.videoWidth || 1;
    const y = nose ? nose.y : (box.originY + box.height / 2) / vh;
    const h = box.height / vh;
    // 가로 자리는 손 특징과 같이 거울처럼 뒤집어 둔다(describe 가 손 좌표를 뒤집는다)
    const x = 1 - (nose ? nose.x : (box.originX + box.width / 2) / vw);
    const w = box.width / vw;
    const k = this.face && now - this.face.at < FACE_KEEP_MS ? 0.3 : 1;
    const ease = (a, b) => a + (b - a) * k;
    this.face = this.face && k < 1
      ? { y: ease(this.face.y, y), h: ease(this.face.h, h), x: ease(this.face.x, x), w: ease(this.face.w, w), at: now }
      : { y, h, x, w, at: now };
  }

  /* 판정에 넘길 얼굴. 오래 못 봤으면 없다고 한다 */
  currentFace(now = performance.now()) {
    if (this.mock) return this.mockFace === false ? null : MOCK_FACE;
    if (!this.face || now - this.face.at > FACE_KEEP_MS) return null;
    return { y: this.face.y, h: this.face.h, x: this.face.x, w: this.face.w };
  }

  setMockPose(pose) { this.mockPose = pose; }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    let res = null;
    if (this.video.readyState >= 2) {
      // 한 프레임 실패로 멈추지 않는다. 잇달아 실패하면 조용히 돌지 않고 알린다
      try { res = this.landmarker.detectForVideo(this.video, now); this.fails = 0; }
      catch (e) {
        if (++this.fails >= MAX_FAILS) return this._lose('DetectError', `손 인식이 잇달아 실패했습니다: ${e?.message ?? e}`);
      }
    }
    if (res) {
      // 쌍자음과 일부 복합모음은 손이 둘이다. 보이는 대로 전부 넘긴다.
      const hands = (res.landmarks ?? []).map((lm, i) => ({
        lm, handedness: res.handednesses?.[i]?.[0]?.categoryName ?? 'Right'
      }));
      if (this.faceDetector && this.frameNo++ % FACE_EVERY === 0) {
        try { this._findFace(now); } catch { /* 한 프레임 놓쳐도 마지막 자리를 쓴다 */ }
      }
      this.onFrame(hands, this.currentFace(now));
    }
    requestAnimationFrame(() => this._loop());
  }

  _mockLoop() {
    if (!this.running) return;
    /* 합성 손은 원래 얼굴 높이의 2.7 배쯤으로 컸다. 그러면 뺨, 머리 옆처럼 좁은 높이 안에서
       손 길이만큼 움직일 수가 없다. 실제 몸 비례에 가깝게(손이 얼굴 높이 남짓) 줄인다 */
    const shrink = pts => {
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      for (const p of pts) { p.x = cx + (p.x - cx) * MOCK_HAND; p.y = cy + (p.y - cy) * MOCK_HAND; p.z = (p.z ?? 0) * MOCK_HAND; }
      return pts;
    };
    const lm = this.mockPose ? shrink(landmarksFor(this.mockPose, this.mockNoise)) : null;
    // 낱말 판정은 손 높이를 얼굴에 대어 본다. 모의 손을 그 높이의 보통 자리로 옮긴다.
    const toZone = pts => {
      if (!this.mockZone) return pts;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const want = MOCK_FACE.y + (ZONE_AT[this.mockZone] ?? ZONE_AT.front) * MOCK_FACE.h;
      for (const p of pts) p.y += want - cy;
      // 얼굴 가로 자리를 보는 낱말(코 앞, 뺨 옆)은 손을 그 자리로 옮긴다. 손 좌표는 뒤집혀 읽힌다
      if (this.mockSpot) {
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const off = this.mockSpot === 'side' ? 0.8 * MOCK_FACE.w : 0;
        const wantX = 1 - (MOCK_FACE.x + off);
        for (const p of pts) p.x += wantX - cx;
      }
      return pts;
    };
    if (lm) toZone(lm);
    // 움직이기 전 쓰는 손 자리. 반대 손은 '두 손 함께'가 아니면 여기에 남는다
    const anchor = lm ? { x: lm.reduce((t, p) => t + p.x, 0) / lm.length, y: lm.reduce((t, p) => t + p.y, 0) / lm.length } : null;
    // 손끝이 카메라를 향하는 낱말('너'): 펴진 손가락을 화면에서 짧게 줄인다. 3차원 폄 정도는 그대로다
    const foreshorten = pts => {
      if (!this.mockPointOut) return pts;
      for (const [mcp, ...rest] of [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]) {
        if (!(this.mockPose?.fingers ?? []).includes(['index', 'middle', 'ring', 'pinky'][(mcp - 5) / 4])) continue;
        for (const i of rest) { pts[i].x = pts[mcp].x + (pts[i].x - pts[mcp].x) * 0.3; pts[i].y = pts[mcp].y + (pts[i].y - pts[mcp].y) * 0.3; }
      }
      return pts;
    };
    if (lm) foreshorten(lm);
    // 쌍자음은 손 전체가 옆으로 움직여야 한다. 모의 입력도 그 움직임을 만들어야
    // 움직임 검출 경로가 실제로 시험된다.
    // 움직이지 않는 동작에서는 옆으로 옮겨 간 자리가 없다
    if (lm && !this.mockMove && !(this.mockPose?.motion || this.mockMotion)) this.mockLastDx = 0;
    if (lm && this.mockMove) {
      // 사전 원문의 움직임을 흉내 낸다(motion.js). 다음 동작을 정한 때부터 0.5초 동안 옮겨 가고 그 자리에 머문다.
      // 앞 동작 자리에서 반대쪽으로 조금(0.25) 물러났다가 원래 방향으로 크게(0.75) 가서 가장 멀리 간 방향이 그 방향이 된다
      const t = Math.min(1, (performance.now() - (this.mockMoveAt ?? 0)) / 500);
      const A = 0.6 * MOCK_HAND_SCALE, k = -0.25 + t;   // 손 길이의 0.6 배를 -0.25 → 0.75 로
      const sd = this.mockSide ?? 1;             // 화면은 거울이라 쓰는 손 쪽은 원래 좌표에서 -x
      // 앞 동작에서 옆으로 옮겨 가 있던 자리에서 이어서 움직인다. 순간이동하면 그 점프가 방향을 덮는다
      if (this.mockCarryAt !== this.mockMoveAt) { this.mockCarry = this.mockLastDx ?? 0; this.mockCarryAt = this.mockMoveAt; }
      for (const p of lm) p.x += this.mockCarry;
      const mv = { up: [0, -1], down: [0, 1], side: [-sd, 0], cross: [sd, 0] }[this.mockMove];
      if (mv) for (const p of lm) { p.x += mv[0] * A * k; p.y += mv[1] * A * k; }
      if (this.mockMove === 'sway') { const dx = Math.sin(performance.now() / 600 * Math.PI * 2) * 0.5 * MOCK_HAND_SCALE; for (const p of lm) p.x += dx; }
      if (this.mockMove === 'bob') { const dy = Math.sin(performance.now() / 600 * Math.PI * 2) * 0.5 * MOCK_HAND_SCALE; for (const p of lm) p.y += dy; }
      const grow = { out: 1 + 0.3 * t, back: 1 - 0.22 * t }[this.mockMove];
      const turn = this.mockMove === 'turn' ? 60 * t * Math.PI / 180 : 0;
      if (grow || turn) {
        const cx = lm.reduce((s, p) => s + p.x, 0) / lm.length, cy = lm.reduce((s, p) => s + p.y, 0) / lm.length;
        for (const p of lm) {
          let x = p.x - cx, y = p.y - cy;
          if (turn) [x, y] = [x * Math.cos(turn) - y * Math.sin(turn), x * Math.sin(turn) + y * Math.cos(turn)];
          p.x = cx + x * (grow ?? 1); p.y = cy + y * (grow ?? 1); p.z = (p.z ?? 0) * (grow ?? 1);
        }
      }
    } else if (lm && (this.mockPose?.motion || this.mockMotion)) {
      // 사람이 쌍자음을 지을 때 손을 옮기는 폭은 손 길이의 절반 남짓이다(손 길이 대비 0.5).
      const phase = (performance.now() % 1200) / 1200;
      // 같은 손모양이 반복되는 낱말은 중간 위치에서 다음 단계가 시작해도
      // 양 끝 중 한 곳까지 WORD_TRAVEL을 넘게 이동할 수 있어야 한다.
      const amplitude = (this.mockMotion ? 0.82 : 0.5) * MOCK_HAND_SCALE;   // 손 크기를 줄여도 손 길이 대비 폭은 그대로
      // 얼굴 옆에 머물러야 하는 동작은 바깥쪽으로 흔든다. 안쪽으로 흔들면 얼굴 앞으로 들어와 자리를 벗어난다
      const outward = this.mockSpot === 'side' ? -(this.mockSide ?? 1) : 1;
      const dx = (phase < 0.5 ? phase * 2 : 2 - phase * 2) * amplitude * outward;
      for (const p of lm) p.x += dx;
      this.mockLastDx = dx;
    }
    const hands = lm ? [{ lm, handedness: 'Right' }] : [];
    // 양손이 필요한 자모는 모의 입력도 손을 둘 띄운다
    if (lm && this.mockTwoHands) {
      // 두 번째 손: 따로 정한 손모양이 있으면 그것으로, 없으면 같은 손모양으로
      const lm2 = foreshorten(shrink(this.mockPose2 ? landmarksFor(this.mockPose2, this.mockNoise) : landmarksFor(this.mockPose, this.mockNoise)));
      const t = Math.min(1, (performance.now() - (this.mockMoveAt ?? 0)) / 500);
      const sd = this.mockSide ?? 1;
      // 반대 손은 쓰는 손에서 반대쪽으로 떨어져 있다(원래 좌표에서 +x 가 화면의 반대 손 쪽)
      let gap = 1.4 * MOCK_HAND_SCALE * sd, dy2 = 0;
      if (this.mockMove === 'together') gap = (2.6 - 1.9 * t) * MOCK_HAND_SCALE * sd;
      if (this.mockMove === 'apart') gap = (1.0 + 1.6 * t) * MOCK_HAND_SCALE * sd;
      if (this.mockMove === 'swap') {
        // 쓰는 손은 위에서 아래로, 반대 손은 아래에서 위로 자리를 바꾼다
        const h = 0.9 * MOCK_HAND_SCALE * (1 - 2 * t);
        for (const p of lm) p.y -= h;
        dy2 = h;
      }
      const both = this.mockMoving === 'both' || (!this.mockMove && !this.mockPose2);
      const at = both ? { x: lm.reduce((u, p) => u + p.x, 0) / lm.length, y: lm.reduce((u, p) => u + p.y, 0) / lm.length } : anchor;
      const c2 = { x: lm2.reduce((u, p) => u + p.x, 0) / lm2.length, y: lm2.reduce((u, p) => u + p.y, 0) / lm2.length };
      hands.push({ lm: lm2.map(p => ({ ...p, x: p.x + at.x + gap - c2.x, y: p.y + at.y + dy2 - c2.y })), handedness: 'Left' });
    }
    this.onFrame(hands, this.currentFace());
    setTimeout(() => this._mockLoop(), 60);
  }
}
