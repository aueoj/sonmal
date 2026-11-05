/* 점검 스크립트가 CI 에서만 깨지는 방법을 쓰지 않는가.
   page.waitForFunction 은 함수를 문자열로 넘겨 평가한다. 페이지 CSP 가 unsafe-eval 을 막아서
   깃허브 러너의 Playwright 에서만 실패한다(로컬에서는 통과해 놓치기 쉽다). 주석은 센다지 않는다. */
import fs from 'node:fs';
const bad = [];
for (const f of fs.readdirSync('dev').filter(f => f.endsWith('.mjs') && f !== 'audit-lint.mjs')) {
  fs.readFileSync(`dev/${f}`, 'utf8').split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    if (/\.waitForFunction\s*\(/.test(code)) bad.push(`dev/${f}:${i + 1}`);
  });
}
if (bad.length) { console.log('waitForFunction 대신 evaluate 로 되묻거나 locator.waitFor 를 쓰세요'); for (const b of bad) console.log('  ✕ ' + b); process.exit(1); }
console.log('CI 에서 막히는 waitForFunction 없음');
