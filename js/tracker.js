/* tracker.js — 카메라에서 손 랜드마크를 뽑는다.
 *
 * MediaPipe Hand Landmarker를 브라우저 안에서 돌린다. 영상도 랜드마크도
 * 기기 밖으로 나가지 않는다. 모델은 처음 한 번만 내려받아 캐시된다.
 *
 * ?mock=1 이면 카메라 대신 합성 랜드마크를 먹인다. 카메라 없이 화면과
 * 판정 로직을 그대로 확인하기 위한 개발용 경로다.
 */

import { landmarksFor } from './mockHand.js';

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

    const { HandLandmarker, FilesetResolver } = await import(
      /* @vite-ignore */ `${TASKS_VISION}/vision_bundle.mjs`
    );
    const fileset = await FilesetResolver.forVisionTasks(`${TASKS_VISION}/wasm`);
    this.landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false
    });
    this.video.srcObject = stream;
    await this.video.play();
    this.running = true;
    this._loop();
    return { mode: 'camera' };
  }

  stop() {
    this.running = false;
    const s = this.video?.srcObject;
    if (s) { s.getTracks().forEach(t => t.stop()); this.video.srcObject = null; }
  }

  setMockPose(pose) { this.mockPose = pose; }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    if (this.video.readyState >= 2) {
      const res = this.landmarker.detectForVideo(this.video, now);
      const lm = res.landmarks?.[0] ?? null;
      const hand = res.handednesses?.[0]?.[0]?.categoryName ?? 'Right';
      this.onFrame(lm, hand);
    }
    requestAnimationFrame(() => this._loop());
  }

  _mockLoop() {
    if (!this.running) return;
    const lm = this.mockPose ? landmarksFor(this.mockPose, this.mockNoise) : null;
    // 쌍자음은 손 전체가 옆으로 움직여야 한다. 모의 입력도 그 움직임을 만들어야
    // 움직임 검출 경로가 실제로 시험된다.
    if (lm && this.mockPose?.motion) {
      // 사람이 쌍자음을 지을 때 손을 옮기는 폭은 손 길이의 절반 남짓이다.
      // 정규화 좌표에서 손 길이가 약 0.44이므로 진폭 0.22를 쓴다.
      const phase = (performance.now() % 1200) / 1200;
      const dx = (phase < 0.5 ? phase * 2 : 2 - phase * 2) * 0.22;
      for (const p of lm) p.x += dx;
    }
    this.onFrame(lm, 'Right');
    setTimeout(() => this._mockLoop(), 60);
  }
}
