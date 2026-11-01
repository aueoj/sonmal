/* 점검 스크립트들이 쓰는 브라우저 하나.
 *
 * 개발 컨테이너에는 Playwright 가 미리 깔려 있고, 깃허브 러너에서는
 * 그때그때 설치한다. 어느 쪽이든 같은 코드가 돌도록 여기서 찾아 준다. */
const CANDIDATES = ['playwright', '/opt/node-tools/node_modules/playwright/index.js'];

let chromium = null;
for (const where of CANDIDATES) {
  try {
    const mod = await import(where);
    chromium = mod.chromium ?? mod.default?.chromium;
    if (chromium) break;
  } catch { /* 다음 자리를 본다 */ }
}
if (!chromium) {
  console.error('Playwright 를 찾지 못했습니다. npm i -D playwright 로 설치하세요.');
  process.exit(1);
}

/** --no-sandbox 는 컨테이너와 CI 양쪽에서 필요하다. */
export const launch = (opts = {}) => chromium.launch({ args: ['--no-sandbox'], ...opts });
export { chromium };
