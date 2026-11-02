/* tracker.js — 카메라에서 손 랜드마크를 뽑는다.
 *
 * MediaPipe Hand Landmarker를 브라우저 안에서 돌린다. 영상도 랜드마크도
 * 기기 밖으로 나가지 않는다. 모델은 처음 한 번만 내려받아 캐시된다.
 *
 * ?mock=1 이면 카메라 대신 합성 랜드마크를 먹인다. 카메라 없이 화면과
 * 판정 로직을 그대로 확인하기 위한 개발용 경로다.
 */

import { landmarksFor } from './mockHand.js?v=202611021424';

const TASKS_VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export class Tracker {
  constructor({ video, onFrame, mock = false }) {
    this.video = video;
    this.onFrame = onFrame;
    this.mock = mock;
    this.running = false;
    this.landmarker = null;
    this.mockPose = null;
    this.mockNoise = 0.02;
  }

  async start() {
    if (this.mock) { this.running = true; this._mockLoop(); return { mode: 'mock' }; }

    // 권한과 장치를 먼저 확인한다. 모델 실패를 카메라 권한 실패와 구분한다.
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('카메라는 HTTPS 또는 localhost에서 사용할 수 있습니다.');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      this.video.srcObject = stream;
      await this.video.play();
      const { HandLandmarker, FilesetResolver } = await import(
        /* @vite-ignore */ `${TASKS_VISION}/vision_bundle.mjs`
      );
      const fileset = await FilesetResolver.forVisionTasks(`${TASKS_VISION}/wasm`);
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
    return { mode: 'camera' };
  }

  stop() {
    this.running = false;
    const s = this.video?.srcObject;
    if (s) { s.getTracks().forEach(t => t.stop()); this.video.srcObject = null; }
    this.landmarker?.close();
    this.landmarker = null;
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
      this.onFrame(hands);
    }
    requestAnimationFrame(() => this._loop());
  }

  _mockLoop() {
    if (!this.running) return;
    const lm = this.mockPose ? landmarksFor(this.mockPose, this.mockNoise) : null;
    // 낱말 판정은 손 높이도 본다. 모의 손을 그 높이로 옮긴다.
    if (lm && this.mockShiftY) for (const p of lm) p.y += this.mockShiftY;
    // 쌍자음은 손 전체가 옆으로 움직여야 한다. 모의 입력도 그 움직임을 만들어야
    // 움직임 검출 경로가 실제로 시험된다.
    if (lm && (this.mockPose?.motion || this.mockMotion)) {
      // 사람이 쌍자음을 지을 때 손을 옮기는 폭은 손 길이의 절반 남짓이다.
      // 정규화 좌표에서 손 길이가 약 0.44이므로 진폭 0.22를 쓴다.
      const phase = (performance.now() % 1200) / 1200;
      const dx = (phase < 0.5 ? phase * 2 : 2 - phase * 2) * 0.22;
      for (const p of lm) p.x += dx;
    }
    const hands = lm ? [{ lm, handedness: 'Right' }] : [];
    // 양손이 필요한 자모는 모의 입력도 손을 둘 띄운다
    if (lm && this.mockTwoHands) {
      // 두 번째 손: 따로 정한 손모양이 있으면 그것으로, 없으면 같은 손모양으로
      const lm2 = this.mockPose2 ? landmarksFor(this.mockPose2, this.mockNoise) : lm;
      const dy = this.mockPose2 ? (this.mockShiftY || 0) : 0;
      hands.push({ lm: lm2.map(p => ({ ...p, x: p.x + 0.18, y: p.y + dy })), handedness: 'Left' });
    }
    this.onFrame(hands);
    setTimeout(() => this._mockLoop(), 60);
  }
}
