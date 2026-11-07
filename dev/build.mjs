/* 배포용 묶음 만들기.
 *
 * js/ 의 읽기 쉬운 모듈 20여 개를 하나의 압축된 파일(app.min.js)로 묶는다.
 * 사이트는 이 한 파일만 내려보낸다. 소스를 파일별로 그대로 가져다 쓰기 어렵게 하려는 것이다.
 * 완전히 막지는 못한다(저장소가 공개라 깃허브에서 소스는 볼 수 있다). 라이브 사이트에서
 * 통째로 복사하는 것을 훨씬 번거롭게 만드는 장치다.
 *
 *   node dev/build.mjs            app.min.js 를 새로 쓴다
 *   node dev/build.mjs --check    지금 app.min.js 가 소스와 맞는지만 본다(쓰지 않는다)
 *
 * 테스트 훅(window.__sonmalMock 등)과 DOM id·data 속성은 전역/문자열이라 압축해도 그대로다.
 * 카메라 모델은 런타임 템플릿 import 라 묶이지 않고 그대로 CDN 에서 받는다.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + 'app.min.js';
const CHECK = process.argv.includes('--check');

// import 경로의 ?v=... 를 떼어 실제 파일로 잇는다. 소스는 건드리지 않는다.
const stripQuery = {
  name: 'strip-version-query',
  setup(b) {
    b.onResolve({ filter: /\.js\?v=/ }, args => {
      const clean = args.path.replace(/\?v=.*$/, '');
      const path = new URL(clean, 'file://' + args.importer).pathname;
      return { path };
    });
  }
};

const result = await build({
  entryPoints: [ROOT + 'js/app.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  legalComments: 'none',
  charset: 'utf8',
  plugins: [stripQuery],
  write: false,
  logLevel: 'warning'
});
const code = result.outputFiles[0].text;

if (CHECK) {
  const have = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (have !== code) {
    console.error('app.min.js 가 소스와 다릅니다. node dev/build.mjs 로 다시 묶으세요.');
    process.exit(1);
  }
  console.log('app.min.js 는 소스와 맞습니다 (' + code.length + '바이트)');
} else {
  writeFileSync(OUT, code);
  console.log('app.min.js 썼습니다 (' + code.length + '바이트, js/ ' + result.outputFiles.length + '개 묶음)');
}
