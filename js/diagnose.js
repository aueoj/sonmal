/* diagnose.js — 카메라가 안 켜질 때, 어느 단계에서 막혔는지 짚어 준다.
 *
 * 막히는 자리가 여럿이다. 보안 컨텍스트가 아니거나, 끼워진 프레임에 카메라가
 * 허용되지 않았거나, 사용자가 거부했거나, 손 인식 모듈이나 모델을 내려받지
 * 못했거나. '카메라를 열지 못했습니다' 한 줄로는 다음에 뭘 할지 알 수 없다.
 */

const TASKS_VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const ok = (label, detail = '') => ({ label, state: 'ok', detail });
const bad = (label, detail = '') => ({ label, state: 'bad', detail });
const unknown = (label, detail = '') => ({ label, state: 'unknown', detail });

/** @returns {Promise<{rows:Array, verdict:string, advice:string}>} */
export async function diagnose() {
  const rows = [];
  const embedded = window.self !== window.top;

  rows.push(window.isSecureContext
    ? ok('보안 연결', 'https 또는 localhost')
    : bad('보안 연결', '카메라는 https나 localhost에서만 열립니다'));

  rows.push(embedded
    ? unknown('페이지가 놓인 자리', '다른 페이지 안에 끼워져 있습니다')
    : ok('페이지가 놓인 자리', '독립된 탭'));

  let policy = null;
  try {
    const fp = document.featurePolicy ?? document.permissionsPolicy;
    policy = fp?.allowsFeature?.('camera') ?? null;
  } catch { policy = null; }
  rows.push(policy === null
    ? unknown('이 자리에 카메라 허용', '브라우저가 알려주지 않습니다')
    : policy ? ok('이 자리에 카메라 허용') : bad('이 자리에 카메라 허용', '끼워진 프레임이 카메라를 막고 있습니다'));

  const hasApi = Boolean(navigator.mediaDevices?.getUserMedia);
  rows.push(hasApi ? ok('카메라 API') : bad('카메라 API', 'navigator.mediaDevices가 없습니다'));

  let camErr = null;
  if (hasApi) {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach(t => t.stop());
      rows.push(ok('카메라 열기'));
    } catch (e) {
      camErr = e;
      const why = e?.name === 'NotAllowedError'
        ? (embedded ? '거부되었습니다. 권한을 준 적이 없다면 끼워진 프레임이 막은 것입니다' : '권한이 거부되었습니다')
        : e?.name === 'NotFoundError' ? '쓸 수 있는 카메라가 없습니다'
        : e?.name === 'NotReadableError' ? '다른 프로그램이 카메라를 쓰고 있습니다'
        : (e?.name ?? '알 수 없는 오류');
      rows.push(bad('카메라 열기', why));
    }
  } else {
    rows.push(bad('카메라 열기', '앞 단계에서 막혀 시도하지 못했습니다'));
  }

  let modErr = null, modelBlocked = false;
  try {
    await import(/* @vite-ignore */ `${TASKS_VISION}/vision_bundle.mjs`);
    rows.push(ok('손 인식 모듈 내려받기'));
  } catch (e) {
    modErr = e;
    rows.push(bad('손 인식 모듈 내려받기', e?.message?.slice(0, 90) ?? ''));
  }

  try {
    const r = await fetch(MODEL, { method: 'GET', headers: { Range: 'bytes=0-0' } });
    const good = r.ok || r.status === 206;
    modelBlocked = !good;
    rows.push(good ? ok('손 인식 모델 내려받기') : bad('손 인식 모델 내려받기', `서버가 ${r.status}로 답했습니다`));
  } catch (e) {
    modelBlocked = true;
    rows.push(bad('손 인식 모델 내려받기', e?.message?.slice(0, 90) ?? '막혔습니다'));
  }

  const blocked = rows.find(r => r.state === 'bad');
  let verdict = '카메라를 쓸 수 있습니다';
  let advice = '';

  if (!window.isSecureContext) {
    verdict = '보안 연결이 아니라 카메라가 열리지 않습니다';
    advice = 'https 주소나 localhost에서 열어 주세요.';
  } else if (policy === false) {
    verdict = '여기서는 카메라를 쓸 수 없습니다';
    advice = '이 화면을 제공하는 사이트가 카메라를 허용하지 않았습니다. Claude 아티팩트 밖의 독립된 HTTPS 사이트나 내 컴퓨터에서 실행해 주세요. 같은 아티팩트 주소를 새 탭에서 여는 것만으로는 해결되지 않을 수 있습니다.';
  } else if (camErr?.name === 'NotAllowedError') {
    verdict = '카메라 권한이 거부되었습니다';
    advice = '주소창의 카메라 아이콘에서 허용으로 바꾸고 다시 눌러 주세요.';
  } else if (camErr?.name === 'NotFoundError') {
    verdict = '쓸 수 있는 카메라가 없습니다';
    advice = '카메라 연결을 확인해 주세요.';
  } else if (camErr?.name === 'NotReadableError') {
    verdict = '다른 프로그램이 카메라를 쓰고 있습니다';
    advice = '화상회의나 다른 탭을 닫고 다시 눌러 주세요.';
  } else if (modelBlocked) {
    verdict = '손 인식 모델을 내려받지 못했습니다';
    advice = '카메라 권한과는 별개의 다운로드 오류입니다. 인터넷 연결과 모델 서버(storage.googleapis.com) 접근 허용을 확인해 주세요.';
  } else if (modErr) {
    verdict = '손 인식 모듈을 내려받지 못했습니다';
    advice = '이 페이지가 외부 스크립트를 막고 있거나 인터넷이 끊겼습니다.';
  } else if (blocked) {
    verdict = `${blocked.label}에서 막혔습니다`;
    advice = blocked.detail;
  }

  return { rows, verdict, advice, embedded };
}
