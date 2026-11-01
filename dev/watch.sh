#!/usr/bin/env bash
# 코덱스가 밀어 넣는 것을 지켜보다가, 새 커밋이 오면 당겨서 교차검증한다.
#
#   dev/watch.sh [기다릴_분]   기본 100분
#
# 나가는 코드
#   0  새 커밋을 받아 교차검증까지 통과
#   1  새 커밋을 받았는데 교차검증이 깨졌다
#   3  받을 것이 없었다 (기다린 시간이 끝났다)
#   4  당기는 데 실패했다 (충돌 등, 사람이 봐야 한다)
set -uo pipefail
cd "$(dirname "$0")/.."

WAIT_MIN=${1:-100}
DEADLINE=$(( $(date +%s) + WAIT_MIN * 60 ))
LOG=.verify-report.txt

while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  git fetch origin main --quiet 2>/dev/null
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/main)
  if [ "$LOCAL" != "$REMOTE" ]; then
    {
      echo "새 커밋"
      git --no-pager log --oneline "$LOCAL..$REMOTE" 2>/dev/null
      echo
      echo "바뀐 파일"
      git --no-pager diff --stat "$LOCAL..$REMOTE" 2>/dev/null
      echo
    } > "$LOG"
    if ! git pull --ff-only origin main >> "$LOG" 2>&1; then
      echo "당기지 못했다 — 갈라졌거나 충돌이다" >> "$LOG"
      exit 4
    fi
    node dev/verify.mjs --repeat 2 >> "$LOG" 2>&1
    exit $?
  fi
  sleep 30
done
echo "기다린 ${WAIT_MIN}분 동안 새 커밋이 없었다" > "$LOG"
exit 3
