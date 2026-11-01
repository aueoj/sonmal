# 단어 그림 교차검증

지금 화면에 있는 단어 12개(그림 30장)를 **국립국어원 한국수어사전**의 수형 설명과 수형 사진에 한 장씩 대 보았다.
검증일 2026-11-01. 사전 원문과 항목 주소는 `js/wordBank.js` 에 있다.

사전의 손가락 번호: 1지 검지, 2지 중지, 3지 약지, 4지 새끼, 5지 엄지.

## 결과

| 단어 | 판정 | 지금 그림 | 사전 (항목 번호) |
|---|---|---|---|
| 안녕하세요 | ✕ 다름 | 편 손을 얼굴 옆에서 흔든다 | 오른 손바닥으로 왼팔을 쓸어내린 뒤 두 주먹을 가슴 앞에서 내린다 ([3331](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=3331)) |
| 감사합니다 | ✕ 다름 | 턱 아래 손을 아래 손바닥으로 내린다 | 모로 세운 오른손 새끼 쪽으로 왼 손등을 두 번 친다 ([2372](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=2372)) |
| 미안합니다 | ✕ 다름 | 주먹으로 가슴을 둥글게 문지른다 | 검지와 엄지 동그라미를 이마에 댔다가 펴며 왼 손등에 얹는다 ([9917](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9917)) |
| 괜찮아요 | ✕ 다름 | 검지와 엄지 동그라미(OK) | 새끼손가락 끝을 턱에 두 번 댄다 ([9466](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9466)) |
| 네 | ✕ 다름 | 주먹을 위아래로 끄덕인다 | 검지와 중지, 새끼를 펴서 검지와 중지 끝을 눈 옆에 댄다 ([9474](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9474)). 이 항목이 대답 '예'인지는 확인 필요 |
| 아니요 | ○ 맞음 | 손바닥이 앞을 보는 손을 좌우로 젓는다 | 같다. 사전 사진은 얼굴 옆보다 가슴 앞이다 ([24036](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=24036)) |
| 도와주세요 | ✕ 다름 | 손바닥 위에 다른 손을 겹친다 | 엄지를 세운 왼 주먹 등에 오른 손바닥을 두 번 댄다 ([5447](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5447)) |
| 다시 | ✕ 다름 | 두 검지를 마주 보게 해 돌린다 | 엄지로 누른 검지와 중지를 왼쪽 아래로 내리며 튕겨 편다 ([7422](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7422)) |
| 천천히 | ✕ 다름 | 두 손바닥을 아래로 천천히 내린다 | 왼 손등 위에서 모로 세운 오른손을 천천히 앞으로 민다 ([9928](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9928)) |
| 이해했어요 | ✕ 다름 | 검지로 관자놀이를 짚고 엄지를 세운다 | 벌린 왼 검지와 중지 사이로 오른 검지를 내밀었다 넣는다 ([5993](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5993)) |
| 물 | △ 일부 | 손끝을 모아 입가로 가져간다 | 위치는 같다. 손 모양은 검지와 엄지를 구부린 C, 컵을 기울이듯 올린다 ([10981](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10981)) |
| 화장실 | ✕ 다름 | 검지로 가리킨다 | 중지, 약지, 새끼를 벌려 펴고 검지와 엄지를 C로 구부린다(영어 지문자 W와 C) ([971](https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=971)) |

**맞음 1, 일부 1, 다름 10.** 다른 것 중 여럿(감사합니다, 미안합니다, 괜찮아요, 네, 도와주세요)은 미국수어(ASL)의 같은 뜻 수어와 닮았다.
처음 받은 도표가 한국수어가 아닌 자료를 섞어 쓴 것으로 보인다.

엇갈린 그림도 있다. 지금 '괜찮아요' 그림(OK 손)은 사전의 '화장실'과 가깝고, '이해했어요' 첫 장(검지로 관자놀이)은 사전의 '왜'와 같다.

## 어떻게 바로잡나

1. `docs/ILLUSTRATION-PROMPTS.md` 의 지시문으로 단어마다 그림을 만든다.
2. 만든 그림을 `assets/incoming/` 에 지시문 제목의 이름 그대로 넣는다.
3. `node dev/art/ingest.mjs` 로 장 수와 형식을 검사한다. 손 모양은 사람이 사전 사진과 대 본다.
4. `node dev/art/ingest.mjs --apply` 로 붙이면 그 단어는 옛 그림이 지워지고 사전 기록(`js/wordBank.js`)으로 바뀐다.

그림이 들어오기 전까지 화면은 옛 그림을 그대로 쓴다. 다만 위 표처럼 대부분 사전과 다르다.

## 사전에서 찾지 못한 것

- **저것, 저기, 거기, 그것** 은 따로 표제어가 없다. 사전은 '가리키는 동작'으로 설명한다.
- **그** (11234) 는 관형사 '그'다. '그것'으로 써도 되는지 확인이 필요해 보류했다.
- **네** (9474) 는 표제어가 '예' 하나뿐이라 대답 '예'인지 확인이 필요해 보류했다.
