#!/usr/bin/env node
/* 파일마다 판 번호를 붙인다.
 *
 * GitHub Pages 는 js·css 를 10분간 캐시한다. 고쳐서 올려도 브라우저가
 * 옛 파일을 계속 쓰면, 고친 사람도 쓰는 사람도 무엇을 보고 있는지 알 수 없다.
 * 주소 끝에 판 번호를 붙이면 바뀐 파일은 반드시 새로 받는다.
 *
 *   node dev/stamp.mjs          판 번호를 지금 시각으로 새로 붙인다
 *   node dev/stamp.mjs --check  붙어 있는지, 서로 같은지만 본다 (CI 용)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');
const now = new Date();
const VERSION = CHECK ? null :
  `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}` +
  `${String(now.getUTCDate()).padStart(2, '0')}${String(now.getUTCHours()).padStart(2, '0')}` +
  `${String(now.getUTCMinutes()).padStart(2, '0')}`;

const files = [
  'index.html',
  ...readdirSync(join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => join('js', f))
];

// from './x.js'  ·  href="css/x.css"  ·  src="js/x.js"  — 뒤에 ?v= 를 붙이거나 갈아끼운다
const PATTERNS = [
  /(from\s+['"])(\.{1,2}\/[\w./-]+\.js)(\?v=\d+)?(['"])/g,
  /(import\(\s*['"])(\.{1,2}\/[\w./-]+\.js)(\?v=\d+)?(['"])/g,
  /((?:href|src)=")((?:css|js)\/[\w./-]+\.(?:css|js))(\?v=\d+)?(")/g
];

const found = [];
for (const rel of files) {
  const p = join(ROOT, rel);
  let text = readFileSync(p, 'utf8');
  let out = text;
  for (const re of PATTERNS) {
    out = out.replace(re, (_, a, path, ver, z) => {
      found.push(ver ? ver.slice(3) : null);
      return `${a}${path}?v=${VERSION ?? (ver ? ver.slice(3) : 'MISSING')}${z}`;
    });
  }
  if (!CHECK && out !== text) writeFileSync(p, out);
}

if (CHECK) {
  const missing = found.filter(v => v === null).length;
  const versions = [...new Set(found.filter(Boolean))];
  if (missing) {
    console.error(`판 번호가 없는 주소 ${missing}개. node dev/stamp.mjs 를 돌리세요.`);
    process.exit(1);
  }
  if (versions.length > 1) {
    console.error('판 번호가 서로 다릅니다:', versions.join(', '));
    process.exit(1);
  }
  console.log(`판 번호 ${versions[0]} · 주소 ${found.length}곳 모두 같음`);
} else {
  console.log(`판 번호 ${VERSION} · 주소 ${found.length}곳에 붙임`);
}
