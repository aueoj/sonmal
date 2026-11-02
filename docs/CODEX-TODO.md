# 코덱스에게: 다시 그릴 그림

Claude 가 코덱스 사용량이 모자란 동안 임시로 만든 그림과, 고쳐야 할 그림 목록이다.
아래를 그대로 하면 된다. 작업은 항상 **최신 `main` 에서 새 가지를 만들어** 한다.

## 공통 규칙

- 지시문: `docs/ILLUSTRATION-PROMPTS.md` 의 해당 항목(공통 스타일 + 장면)을 그대로 쓴다.
  그림체 기준은 `docs/illustration-style-reference.png`, 검은 바탕에 흰 빛, 화살표와 글자 없이 단계마다 한 장.
- 파일: `assets/incoming/sl<항목번호>-<장>.png` (1536×1024 가로형 PNG).
- 검사: `node dev/art/ingest.mjs` 로 장 수와 형식을 확인한다. `--apply` 는 하지 않는다(Claude 가 사전과 대조한 뒤 붙인다).
- 손 모양은 국립국어원 한국수어사전 항목의 수형 사진과 대 본다. 사진은 저장소에 넣지 않는다.
- 앱 화면 코드(`js/app.js`, `css/`, `index.html`)는 건드리지 않는다.

## 할 일

| 순서 | 낱말 | 항목 | 장 | 왜 |
|---|---|---|---|---|
| 1 | 만들다 | [12326](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=12326) | 2 | 지금 그림은 Claude 가 '언제' 2장을 고쳐 만든 **임시 그림**이다. 1장은 위 주먹을 잘라 올린 것이라 선이 어색하다. `js/wordBank.js` 의 `임시그림` 표시가 붙어 있다. 새로 그리면 그 줄을 지운다 |
| 2 | 안녕하세요 | [3331](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=3331) | 3 | 1장에 왼팔을 쓸어내리는 동작이 안 보인다. 3장으로 나눈다(아래). `wordBank` 3331 의 `steps` 와 `check` 도 3개로 바꾼다 |
| 4 | 힘내다 | 없음 | ? | 사전에 '힘내다' 표제어가 없다. 가장 가까운 것은 '기운, 힘'([11238](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=11238): 오른 주먹을 쥐고 팔을 구부려 당긴다). '힘내세요'를 이 수어로 해도 되는지 사람이 정한 뒤에 그린다 |
| 3 | 네 | [9474](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9474) | 1 | 그림이 없어 지금은 지문자로 나온다 |

### 안녕하세요 3장

1. 왼 주먹을 쥐고 팔뚝을 몸 앞에 가로로 둔 채, 오른 손바닥을 왼 팔꿈치 쪽 팔뚝 위에 댄다
2. 오른 손바닥이 왼팔을 따라 손목 쪽까지 쓸어내려 온 끝 모습 (왼 주먹은 1장과 같은 자리)
3. 두 주먹을 쥐고 바닥이 아래로 향하게 가슴 앞에서 아래로 내린다

`check` 예:
```js
check: [
  { hands: 2, fingers: ['index','middle','ring','pinky'], other: [], zone: 'front' },
  { hands: 2, fingers: ['index','middle','ring','pinky'], other: [], zone: 'front' },
  { hands: 2, fingers: [], zone: 'chest' }
]
```

## 다 했으면

`assets/incoming/` 에 넣고 push 한 뒤 사용자에게 알린다. Claude 가 사전과 대조해 붙이고 이 표에서 지운다.
