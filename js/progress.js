/* progress.js — 배운 것을 이 기기에 남긴다.
 *
 * 서버로 보내지 않는다. 이 브라우저에만 남고, 지우면 사라진다.
 * 저장이 막힌 브라우저(사생활 보호 창 등)에서는 기록 없이 그대로 동작한다.
 *   seen    그림을 보고 해낸 횟수
 *   recalled 그림 없이 떠올려 해낸 횟수
 */
const KEY = 'sonmal.learned.v1';

export function loadProgress() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; }
}

export function markLearned(word, { recalled = false } = {}) {
  const all = loadProgress();
  const r = all[word] ?? { seen: 0, recalled: 0 };
  if (recalled) r.recalled += 1; else r.seen += 1;
  r.last = Date.now();
  all[word] = r;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* 남기지 못해도 연습은 이어진다 */ }
  return r;
}

/** 0 처음, 1 그림 보고 해 봄, 2 그림 없이 해 볼 차례, 3 그림 없이 해냄 */
export function stageOf(word, all = loadProgress()) {
  const r = all[word];
  if (!r) return 0;
  if (r.recalled > 0) return 3;
  return r.seen >= 2 ? 2 : 1;
}
