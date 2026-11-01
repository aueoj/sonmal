import pw from '/opt/node-tools/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,3).join('\n')));
p.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: ' + m.text()); });
p.on('requestfailed', r => errs.push('REQFAIL: ' + r.url() + ' — ' + r.failure()?.errorText));
await p.goto('http://localhost:8777/index.html', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => ({
  chartCards: document.querySelectorAll('.chart figure').length,
  cardHand: document.getElementById('hand').innerHTML.length,
  strip: document.getElementById('strip').textContent.trim().slice(0,30),
  diagHidden: document.getElementById('diag')?.hidden,
  missing: ['diag','diag-verdict','diag-list','diag-advice','diag-retry','diag-newtab','btn-cam','btn-demo']
            .filter(id => !document.getElementById(id)),
  promptEl: !!document.querySelector('.cam-prompt')
}));
console.log('차트 카드', r.chartCards, '| 카드 손 그림 길이', r.cardHand, '| 시퀀스', JSON.stringify(r.strip));
console.log('없는 요소:', r.missing.length ? r.missing : '없음', '| .cam-prompt', r.promptEl, '| diag hidden', r.diagHidden);
console.log('오류:\n' + (errs.length ? errs.join('\n') : '  없음'));
await b.close();
