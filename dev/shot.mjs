import { launch } from './browser.mjs';
const [page_url, out, w, h] = process.argv.slice(2);
const b = await launch();
const p = await b.newPage({ viewport: { width: +(w||1280), height: +(h||900) }, deviceScaleFactor: 2 });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
await p.goto(page_url, { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.screenshot({ path: out, fullPage: true });
await b.close();
if (errs.length) { console.error('CONSOLE ERRORS:\n' + errs.join('\n')); process.exit(1); }
console.log('shot ->', out);
