/* tracker.js — 카메라에서 손 랜드마크를 뽑는다.
 *
 * MediaPipe Hand Landmarker를 브라우저 안에서 돌린다. 영상도 랜드마크도
 * 기기 밖으로 나가지 않는다. 모델은 처음 한 번만 내려받아 캐시된다.
 *
 * ?mock=1 이면 카메라 대신 합성 랜드마크를 먹인다. 카메라 없이 화면과
 * 판정 로직을 그대로 확인하기 위한 개발용 경로다.
 */

import { landmarksFor } from './mockHand.js?v=202611031227';
import { ZONE_AT } from './matcher.js?v=202611031227';

const TASKS_VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
// 손 높이를 몸에 대어 재려고 얼굴 자리만 찾는다. 2m 안쪽 얼굴용의 작은 모델이다.
// 얼굴이 누구인지는 알아내지 않고, 상자와 코끝 위치만 쓴다. 기기 밖으로 나가지 않는다.
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const FACE_EVERY = 3;        // 얼굴은 천천히 움직인다. 세 프레임에 한 번만 찾는다
const FACE_KEEP_MS = 2000;   // 손이 얼굴을 가리는 동안에는 마지막 자리를 쓴다
// 모의 입력의 얼굴 자리(화면 비율). dev/word-judge-test.mjs 와 같다
const MOCK_FACE = { y: 0.2, h: 0.16 };

export class Tracker {
  constructor({ video, onFrame, mock = false }) {
    this.video = video;
    this.onFrame = onFrame;
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
    const y = nose ? nose.y : (box.originY + box.height / 2) / vh;
    const h = box.height / vh;
    const k = this.face && now - this.face.at < FACE_KEEP_MS ? 0.3 : 1;
    this.face = this.face && k < 1
      ? { y: this.face.y + (y - this.face.y) * k, h: this.face.h + (h - this.face.h) * k, at: now }
      : { y, h, at: now };
  }

  /* 판정에 넘길 얼굴. 오래 못 봤으면 없다고 한다 */
  currentFace(now = performance.now()) {
    if (this.mock) return this.mockFace === false ? null : MOCK_FACE;
    if (!this.face || now - this.face.at > FACE_KEEP_MS) return null;
    return { y: this.face.y, h: this.face.h };
  }

  setMockPose(pose) { this.mockPose = pose; }

  /* 상대를 읽을 때는 뒤 카메라로 바꾼다(휴대폰). 카메라가 하나뿐이면 그대로 둔다.
     인식 모델은 그대로 두고 영상만 갈아 끼운다. */
  async switchFacing(facing) {
    if (this.mock || !navigator.mediaDevices?.enumerateDevices) return 'user';
    const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    if (cams.length < 2 && facing === 'environment') return 'user';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: facing } }, audio: false
    });
    this.video.srcObject?.getTracks().forEach(t => t.stop());
    this.video.srcObject = stream;
    await this.video.play();
    this.facing = facing; this.face = null;
    return facing;
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    if (this.video.readyState >= 2) {
      const res = this.landmarker.detectForVideo(this.video, now);
      // 쌍자음과 일부 복합모음은 손이 둘이다. 보이는 대로 전부 넘긴다.
      const hands = (res.landmarks ?? []).map((lm, i) => ({
        lm, handedness: res.handednesses?.[i]?.[0]?.categoryName ?? 'Right'
      }));
      // 앞 카메라일 때만 얼굴을 찾는다. 상대를 읽을 때(뒤 카메라)는 높이를 보지 않는다
      if (this.faceDetector && this.facing !== 'environment' && this.frameNo++ % FACE_EVERY === 0) {
        try { this._findFace(now); } catch { /* 한 프레임 놓쳐도 마지막 자리를 쓴다 */ }
      }
      this.onFrame(hands, this.currentFace(now));
    }
    requestAnimationFrame(() => this._loop());
  }

  _mockLoop() {
    if (!this.running) return;
    const lm = this.mockPose ? landmarksFor(this.mockPose, this.mockNoise) : null;
    // 낱말 판정은 손 높이를 얼굴에 대어 본다. 모의 손을 그 높이의 보통 자리로 옮긴다.
    const toZone = pts => {
      if (!this.mockZone) return pts;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const want = MOCK_FACE.y + (ZONE_AT[this.mockZone] ?? ZONE_AT.front) * MOCK_FACE.h;
      for (const p of pts) p.y += want - cy;
      return pts;
    };
    if (lm) toZone(lm);
    // 쌍자음은 손 전체가 옆으로 움직여야 한다. 모의 입력도 그 움직임을 만들어야
    // 움직임 검출 경로가 실제로 시험된다.
    if (lm && (this.mockPose?.motion || this.mockMotion)) {
      // 사람이 쌍자음을 지을 때 손을 옮기는 폭은 손 길이의 절반 남짓이다.
      // 정규화 좌표에서 손 길이가 약 0.44이므로 진폭 0.22를 쓴다.
      const phase = (performance.now() % 1200) / 1200;
      // 같은 손모양이 반복되는 낱말은 중간 위치에서 다음 단계가 시작해도
      // 양 끝 중 한 곳까지 WORD_TRAVEL을 넘게 이동할 수 있어야 한다.
      const amplitude = this.mockMotion ? 0.36 : 0.22;
      const dx = (phase < 0.5 ? phase * 2 : 2 - phase * 2) * amplitude;
      for (const p of lm) p.x += dx;
    }
    const hands = lm ? [{ lm, handedness: 'Right' }] : [];
    // 양손이 필요한 자모는 모의 입력도 손을 둘 띄운다
    if (lm && this.mockTwoHands) {
      // 두 번째 손: 따로 정한 손모양이 있으면 그것으로, 없으면 같은 손모양으로
      const lm2 = this.mockPose2 ? toZone(landmarksFor(this.mockPose2, this.mockNoise)) : lm;
      hands.push({ lm: lm2.map(p => ({ ...p, x: p.x + 0.18 })), handedness: 'Left' });
    }
    this.onFrame(hands, this.currentFace());
    setTimeout(() => this._mockLoop(), 60);
  }
}
