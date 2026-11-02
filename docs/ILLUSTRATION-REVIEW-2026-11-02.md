# 수어 일러스트 교정 및 추가 — 2026-11-02

기준: 최신 `main`의 `2c573f3`에서 새로 만든 `feat/sign-dictionary-corrections`. 이전 작업 가지는 합치지 않았다.

## 결과물

28개 표현 47장을 `assets/incoming/`에 저장했다. 앱 화면 코드와 현재 그림 연결은 변경하지 않았다. 새 그림은 이 디렉터리에서 검수한 뒤 ingest의 `--apply`로 연결하는 작업 흐름을 유지한다.

- 괜찮아요(9466): 짧고 가는 새끼손가락만 펴고, 검지·중지·약지를 접고 접힌 엄지가 보이도록 다시 그렸다. 1장은 턱과 간격을 두고, 2장은 턱에 닿는다.
- 기존 오류 10개 중 이해했어요는 기준 main에서 이미 교정돼 있다. 안녕하세요·감사합니다·미안합니다·괜찮아요·도와주세요·다시·천천히·화장실의 교체 그림을 만들었다. 네(9474)는 대답의 의미인지 미확인 상태라 그리지 않았다.
- 물의 C 수형과 아니요의 위치도 다시 그렸다. 감정·상태·지시·질문 표현 18개를 추가했다.
- 승인된 스타일 참조를 모든 생성에 사용했다. 검은 배경, 흰 외곽 빛, 화살표·문자·동작선 없이 단계마다 한 장이다.

## 사전 대조

국립국어원 한국수어사전의 아래 28개 항목에서 수형 원문과 그림을 확인했다. 원문은 모두 `js/wordBank.js`와 일치했다. 사전 사진은 제작 시에만 임시 경로에서 참고했고 저장소나 앱의 외부 이미지 로딩에 추가하지 않았다.

초안 대조 중 발견한 손 방향·접촉 위치·불필요한 손·동작선 오류를 재생성했다. 재발을 줄이도록 `dev/art/prompts.py` 및 생성 문서의 관련 지시문도 보완했다.

| 표현 | 사전 | 결과물 |
|---|---|---|
| 안녕하세요 | [3331](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=3331) | [1장](../assets/incoming/sl3331-01.png) · [2장](../assets/incoming/sl3331-02.png) |
| 감사합니다 | [2372](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=2372) | [1장](../assets/incoming/sl2372-01.png) · [2장](../assets/incoming/sl2372-02.png) |
| 미안합니다 | [9917](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9917) | [1장](../assets/incoming/sl9917-01.png) · [2장](../assets/incoming/sl9917-02.png) |
| 괜찮아요 | [9466](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9466) | [1장](../assets/incoming/sl9466-01.png) · [2장](../assets/incoming/sl9466-02.png) |
| 아니요 | [24036](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=24036) | [1장](../assets/incoming/sl24036-01.png) · [2장](../assets/incoming/sl24036-02.png) |
| 도와주세요 | [5447](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5447) | [1장](../assets/incoming/sl5447-01.png) · [2장](../assets/incoming/sl5447-02.png) |
| 다시 | [7422](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7422) | [1장](../assets/incoming/sl7422-01.png) · [2장](../assets/incoming/sl7422-02.png) |
| 천천히 | [9928](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9928) | [1장](../assets/incoming/sl9928-01.png) · [2장](../assets/incoming/sl9928-02.png) |
| 물 | [10981](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10981) | [1장](../assets/incoming/sl10981-01.png) · [2장](../assets/incoming/sl10981-02.png) |
| 화장실 | [971](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=971) | [1장](../assets/incoming/sl971-01.png) |
| 배고파요 | [9387](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9387) | [1장](../assets/incoming/sl9387-01.png) · [2장](../assets/incoming/sl9387-02.png) |
| 화나요 | [1086](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=1086) | [1장](../assets/incoming/sl1086-01.png) · [2장](../assets/incoming/sl1086-02.png) |
| 슬퍼요 | [7240](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7240) | [1장](../assets/incoming/sl7240-01.png) · [2장](../assets/incoming/sl7240-02.png) |
| 싫어요 | [23960](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=23960) | [1장](../assets/incoming/sl23960-01.png) |
| 무서워요 | [10967](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10967) | [1장](../assets/incoming/sl10967-01.png) |
| 피곤해요 | [12438](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=12438) | [1장](../assets/incoming/sl12438-01.png) · [2장](../assets/incoming/sl12438-02.png) |
| 아파요 | [5621](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5621) | [1장](../assets/incoming/sl5621-01.png) |
| 놀랐어요 | [2336](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=2336) | [1장](../assets/incoming/sl2336-01.png) · [2장](../assets/incoming/sl2336-02.png) |
| 행복해요 | [10223](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10223) | [1장](../assets/incoming/sl10223-01.png) · [2장](../assets/incoming/sl10223-02.png) |
| 걱정돼요 | [5127](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5127) | [1장](../assets/incoming/sl5127-01.png) |
| 나 | [11536](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=11536) | [1장](../assets/incoming/sl11536-01.png) |
| 너 | [6450](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=6450) | [1장](../assets/incoming/sl6450-01.png) |
| 우리 | [8265](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8265) | [1장](../assets/incoming/sl8265-01.png) · [2장](../assets/incoming/sl8265-02.png) |
| 여기 | [8472](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8472) | [1장](../assets/incoming/sl8472-01.png) |
| 무엇 | [7224](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7224) | [1장](../assets/incoming/sl7224-01.png) |
| 어디 | [8799](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8799) | [1장](../assets/incoming/sl8799-01.png) · [2장](../assets/incoming/sl8799-02.png) |
| 언제 | [8602](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8602) | [1장](../assets/incoming/sl8602-01.png) · [2장](../assets/incoming/sl8602-02.png) |
| 어떻게 | [7256](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7256) | [1장](../assets/incoming/sl7256-01.png) · [2장](../assets/incoming/sl7256-02.png) |

## 검사

- `node dev/art/ingest.mjs`: 28개 표현, 47장 형식·장수 통과.
- `node dev/art/ingest.mjs --check`: 기존 연결 파일 누락 없음.
- `node dev/words-check.mjs`: 기존 출처·연결 검사 통과.
- 형식 검사는 수형의 정확성을 자동 판정하지 않는다.
