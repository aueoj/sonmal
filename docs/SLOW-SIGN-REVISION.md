# 천천히 교정과 회화 단어 추가

2026-11-02. `origin/main`의 `46b1138`에서 `feat/slow-sign-correction`을 만들었다. 이전 가지를 합치지 않았다.

## 천천히 (9928)

[국립국어원 한국수어사전](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9928)의 원문은 “손등이 위로 향하게 편 왼 손등에 오른손을 모로 세워 천천히 밖으로 내민다.”이다. 원문과 참고 수형을 다시 확인했다.

- 왼손은 손등이 위, 손바닥이 아래이며 손끝이 인물의 오른쪽을 향한다.
- 오른손은 네 손가락을 편 채 모로 세운다. 엄지가 위, 새끼손가락 쪽 옆면이 아래다. 주먹이나 손바닥을 아래로 눕힌 손으로 그리지 않는다.
- [1장](../assets/incoming/sl9928-01.png)은 왼 손등 위 손목 가까이에 오른손 옆면을 얹는다.
- [2장](../assets/incoming/sl9928-02.png)은 왼손을 유지하고 오른손을 같은 수형으로 앞으로 내민 끝 자세다.

## 추가 단어

| 단어 | 공식 출처와 원문 | 단계 |
|---|---|---|
| 친구 | [7028](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7028): 두 손을 두 번 맞잡는다. | [벌린 손](../assets/incoming/sl7028-01.png), [맞잡은 손](../assets/incoming/sl7028-02.png) |
| 만나다 | [12165](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=12165): 두 주먹의 1지를 펴서 마주 세웠다가 중앙으로 모아 마주 댄다. | [양옆](../assets/incoming/sl12165-01.png), [중앙 접촉](../assets/incoming/sl12165-02.png) |

두 항목은 단어 창고와 생성 지시문에 추가했다. 사전에 확인되지 않은 문장을 임의로 합성하지 않았다.

## 전달 범위

승인된 그림체, 검은 배경과 흰 외곽 빛, 화살표·문자 없는 가로형 PNG 6장이다. `assets/incoming/`에 저장하며 이번 가지에서는 앱 화면이나 현재 그림 연결을 바꾸지 않는다. 사전 사진은 제작 참고용 임시 파일로만 사용했다.

`node dev/art/ingest.mjs`로 장수·파일명·PNG 형식을 검사하고, `node dev/words-check.mjs` 및 `node dev/art/ingest.mjs --check`로 출처와 기존 연결도 검사한다. 형식 검사 자체가 수형을 판정하는 것은 아니다.
