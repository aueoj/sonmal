# 단어 수어 그림 지시문

`js/wordBank.js` 의 단계마다 한 장이다. 이미지 모델에 **[공통 스타일] + 장면** 을 함께 넣는다.
오른손잡이 기준이고, 그림 속 인물의 오른손은 보는 사람의 왼쪽에 온다(지금 그림과 같다).

만든 그림은 각 장 제목의 파일 이름 그대로 `assets/incoming/` 에 넣는다.
`node dev/art/ingest.mjs` 가 장 수와 형식을 검사하고, 손 모양을 사람이 확인한 뒤 `--apply` 로 붙인다.

## 공통 스타일

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.
```

## 01 안녕하세요  ·  기본

사전 3331: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=3331
원문: 오른 손바닥으로 주먹을 쥔 왼 팔을 쓸어내린 다음, 두 주먹을 쥐고 바닥이 아래로 향하게하여 가슴 앞에서 아래로 내린다.

**sl3331-01.png** 왼 주먹을 쥐고 오른 손바닥으로 왼팔을 쓸어내린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her left hand (viewer's right) is a closed fist with the forearm held horizontally in front of her waist. Her right hand (viewer's left) is open and flat, palm down, stroking along the top of the left forearm from the elbow toward the wrist. Calm, polite smile.
```

**sl3331-02.png** 두 주먹을 가슴 앞에서 아래로 내린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands are closed fists held side by side in front of her lower chest, palms facing down, knuckles facing forward, as if pressing both fists slightly downward. Calm, polite smile.
```

## 02 감사합니다  ·  기본

사전 2372: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=2372
원문: 손끝이 밖으로 향하게 펴서 모로 세운 오른손의 4지 옆면을 손바닥이 아래로 향하게 편 왼 손등에 두 번 댄다.

**sl2372-01.png** 왼손을 손바닥이 아래로 펴고 오른손을 모로 세운다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her left hand (viewer's right) is flat with the palm facing down, fingers pointing to her right, held in front of her chest. Her right hand (viewer's left) is flat and held vertically on its edge (thumb on top, little-finger edge at the bottom), fingertips pointing forward away from her body, raised a few centimetres above the back of the left hand. Warm smile.
```

**sl2372-02.png** 오른손 새끼 쪽 옆면을 왼 손등에 두 번 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Same hands: the little-finger edge of her right hand (viewer's left) (held vertically, fingertips pointing forward) is touching the back of the flat palm-down left hand, like a gentle chop. Warm smile, head slightly bowed.
```

## 03 미안합니다  ·  기본

사전 9917: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9917
원문: 오른손의 1·5지 끝을 맞대어 동그라미를 만들어 이마에 댔다가 1·5지를 펴며, 손등이 위로 손끝이 오른쪽으로 향하게 편 왼 손등에 내려놓는다.

**sl9917-01.png** 검지와 엄지로 동그라미를 만들어 이마에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) makes a small circle by touching the tip of the index finger to the tip of the thumb, the other three fingers extended; the circle is placed against the middle of her forehead. Her left hand (viewer's right) is flat, palm down, fingertips pointing to her right, in front of her chest. Apologetic expression.
```

**sl9917-02.png** 손을 펴며 내려 왼 손등 위에 얹는다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is now fully open, fingers and thumb spread, its little-finger edge lowered onto the back of her left hand (viewer's right). The left hand is flat, palm down, fingertips pointing to her right (viewer left), wrist on viewer right. Follow the lower endpoint pose in the official dictionary illustration. Apologetic expression.
```

## 04 괜찮아요  ·  기본

사전 9466: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9466
원문: 오른 주먹의 4지를 펴서 끝 바닥을 턱에 가볍게 두 번 댄다.

**sl9466-01.png** 주먹에서 새끼손가락만 편다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist seen at a three-quarter angle with ONLY a SHORT, THIN little finger (pinky) extended, held 2 cm in front of her chin without touching. Index, middle and ring fingers are folded; the bent thumb lies visibly across those three curled fingers. The pinky is visibly slimmer and shorter than an index finger. Other hand relaxed down. Gentle smile.
```

**sl9466-02.png** 새끼손가락 끝을 턱에 가볍게 두 번 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist seen at a three-quarter angle with ONLY a SHORT, THIN little finger extended; the fingertip PAD touches the middle of her chin. Index, middle and ring fingers are folded; the folded thumb is clearly visible lying across them. Gentle smile.
```

## 05 네  ·  기본  (확인 필요: 그리지 말 것)

사전 9474: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9474
원문: 오른 주먹의 1·2·4지를 펴서 등이 밖으로 향하게 벌려 1·2지 끝을 오른쪽 눈 옆에 댄다.

**sl9474-01.png** 검지와 중지, 새끼를 펴서 검지와 중지 끝을 오른쪽 눈 옆에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) has the index, middle and little fingers extended and spread, ring finger and thumb folded, back of the hand facing outward; the tips of the index and middle fingers touch the side of her right eye. Friendly expression.
```

## 06 아니요  ·  기본

사전 24036: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=24036
원문: 손바닥이 밖으로 향하게 세운 오른손을 좌우로 흔든다.

**sl24036-01.png** 손바닥이 앞을 보게 편 손을 세운다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is open and flat, held upright in front of her chest with the palm facing the viewer, fingers together pointing up, slightly to her right. Neutral expression with a slight head shake.
```

**sl24036-02.png** 좌우로 흔든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is open and flat, upright in front of her chest, palm facing the viewer, now shifted slightly to her left (mid-wave). Neutral expression with a slight head shake.
```

## 07 도와주세요  ·  기본

사전 5447: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5447
원문: 왼 주먹의 5지를 펴서 바닥이 밖으로 향하게 세우고, 그 등에 오른 손바닥을 세워 두 번 댄다.

**sl5447-01.png** 왼손은 엄지를 세운 주먹, 오른손은 펴서 세운다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her left hand (viewer's right) is a fist with the thumb sticking straight up (thumbs-up), the pad of the thumb facing the viewer, held in front of her chest. Her right hand (viewer's left) is open, flat and upright, palm facing the back of that thumb, a short distance away from it. Earnest expression.
```

**sl5447-02.png** 오른 손바닥을 왼 엄지 등에 두 번 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Same hands: the palm of the upright flat her right hand (viewer's left) is pressed against the back of the raised left thumb. Earnest expression.
```

## 08 다시  ·  기본

사전 7422: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7422
원문: 오른 주먹의 5지 바닥을 1·2지의 손톱에 가볍게 대고 손등이 밖으로 향하게 하여 왼쪽 아래로 내리며 1·2지를 편다.

**sl7422-01.png** 엄지로 검지와 중지 손톱을 누르고 어깨 앞에 든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is raised in front of her right shoulder, back of the hand facing the viewer; the thumb presses on the fingernails of the curled index and middle fingers (as if ready to flick); ring and little fingers folded. Neutral expression.
```

**sl7422-02.png** 왼쪽 아래로 내리며 검지와 중지를 편다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right arm has crossed her torso toward her left shoulder (viewer right), with the index and middle fingers flicked open and extended; thumb, ring and little fingers folded. BACK of right hand faces viewer, fingertips point diagonally to viewer right. Left arm relaxed down. Neutral expression.
```

## 09 천천히  ·  기본

사전 9928: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9928
원문: 손등이 위로 향하게 편 왼 손등에 오른손을 모로 세워 천천히 밖으로 내민다.

**sl9928-01.png** 왼 손등 위에 오른손을 모로 세워 얹는다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: LEFT hand is flat PALM DOWN, BACK UP, fingers pointing to her RIGHT (viewer left), wrist at viewer right. RIGHT hand is an upright VERTICAL BLADE: four fingers fully extended straight together, thumb at TOP and little-finger EDGE at BOTTOM, palm vertical, not horizontal. Its little-finger edge rests on the left HAND BACK close to the left WRIST. Use a three-quarter view showing the two perpendicular hand planes. No closed thumbs-up fist.
```

**sl9928-02.png** 오른손을 천천히 앞으로 내민다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Keep the LEFT hand exactly palm DOWN, back UP, fingers to her RIGHT. Keep the RIGHT hand in exactly the same vertical blade shape, all four fingers straight, thumb TOP, little-finger edge BOTTOM. Slide that whole upright hand FORWARD beyond the LEFT FINGERTIPS; do not roll it palm-down or bend the fingers. Same camera, body, scale and left-hand position as frame one.
```

## 10 이해했어요  ·  기본

사전 5993: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5993
원문: 왼 주먹의 1·2지를 펴서 끝이 오른쪽으로 등이 밖으로 향하게 벌린 다음, 그 사이로 오른 주먹의 1지를 펴서 끝을 안에서 밖으로 내밀었다가 다시 밖에서 안으로 밀어 넣는다.

**sl5993-01.png** 왼손 검지와 중지를 옆으로 벌려 든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her left hand (viewer's right) has the index and middle fingers extended and spread in a V, pointing to her right (sideways), back of the hand facing the viewer, in front of her chest; other fingers folded. Her right hand (viewer's left) is a fist with only the index finger extended, its tip just behind the gap of the V. Thoughtful expression.
```

**sl5993-02.png** 그 사이로 오른 검지를 내밀었다가 다시 넣는다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Same hands: the extended right index finger is pushed forward through the gap between the left index and middle fingers. Understanding nod.
```

## 11 물  ·  기본

사전 10981: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10981
원문: 오른 주먹의 1·5지를 펴서 구부려 입으로 약간 기울여 올린다.

**sl10981-01.png** 검지와 엄지를 구부려 컵을 쥔 모양을 만든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) has the index finger and thumb extended and curved into a C shape as if holding a small cup, other fingers folded, held just in front of her chin. Neutral expression.
```

**sl10981-02.png** 입으로 기울여 올린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: The C-shaped her right hand (viewer's left) (index finger and thumb curved) is raised to her mouth and tilted toward her lips as if drinking from a cup.
```

## 12 화장실  ·  기본

사전 971: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=971
원문: 오른손을 펴서 손바닥이 밖으로 향하게 세워 2·3·4지를 벌리고 1·5지를 ‘C’자 모양으로 구부린다.

**sl971-01.png** 중지, 약지, 새끼를 벌려 펴고 검지와 엄지를 C자로 구부린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is held up in front of her chest with the palm facing the viewer: the middle, ring and little fingers are extended upward and spread apart, while the index finger and thumb curve into an open 'C' shape (not touching). Neutral expression.
```

## 13 배고파요  ·  감정

사전 9387: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9387
원문: 자연스럽게 편 두 손의 5지 등을 배에 대고 5지 바닥에 나머지 손가락을 모아대고 누르면서 몸을 약간 구부린다.

**sl9387-01.png** 두 손 엄지 등을 배에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands are relaxed and open in front of her stomach, the backs of both thumbs touching her belly, fingers loosely open. Hungry expression with slightly drooping eyebrows.
```

**sl9387-02.png** 네 손가락을 엄지로 모아 누르며 몸을 조금 숙인다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands at her stomach: the four fingers of each hand are brought together and pressed onto the pad of its thumb, pressing into the belly; her upper body leans forward slightly. Hungry, weak expression.
```

## 14 화나요  ·  감정

사전 1086: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=1086
원문: 오른 주먹의 5지를 펴서 세워 배에서 위로 약간 힘주어 올린다.

**sl1086-01.png** 엄지를 세운 주먹을 배 앞에 둔다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist with the thumb sticking straight up, held in front of her stomach. Angry expression with furrowed brows.
```

**sl1086-02.png** 힘주어 가슴 쪽으로 올린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left), still a thumbs-up fist, has been pushed forcefully upward to the front of her chest. Angry expression with furrowed brows.
```

## 15 슬퍼요  ·  감정

사전 7240: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7240
원문: 오른 주먹의 1·5지를 펴서 끝을 맞대어 오른쪽 눈 밑에 댔다가 내린 다음, 손가락을 펴서 구부려 가슴에 대고 왼쪽으로 돌린다.

**sl7240-01.png** 검지와 엄지 끝을 맞대어 오른쪽 눈 밑에 댔다가 내린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) has the tips of the index finger and thumb touching (other fingers folded), placed just under her right eye like a falling tear. Sad expression with downturned mouth.
```

**sl7240-02.png** 손가락을 펴서 구부려 가슴에 대고 돌린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is open with the fingers bent like a claw, fingertips placed on the centre of her chest, as if circling over the heart. Sad expression with downturned mouth.
```

## 16 기뻐요  ·  감정

사전 3874: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=3874
원문: 두 주먹의 1·5지를 펴고 손등이 밖으로 향하게 하여 1지 끝을 양쪽 가슴 앞에 대고 상하로 두 번 엇갈리게 움직인다.

**sl3874-01.png** 두 손 검지와 엄지를 펴서 검지 끝을 양쪽 가슴에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands have only the index finger and thumb extended (L shape), backs of the hands facing the viewer, index fingertips pointing at either side of her chest; her right hand is higher and her left hand is lower. Big happy smile.
```

**sl3874-02.png** 두 손을 위아래로 엇갈리게 움직인다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands have only the index finger and thumb extended (L shape), backs facing the viewer, index fingertips at either side of her chest; now her right hand is lower and her left hand is higher. Big happy smile.
```

## 17 좋아요  ·  감정

사전 9078: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=9078
원문: 오른 주먹을 코에 1·5지 옆면이 닿게 댄다.

**sl9078-01.png** 주먹의 엄지와 검지 쪽 옆면을 코에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a loose fist placed against her nose so that the side formed by the thumb and index finger touches the nose. Pleased smile.
```

## 18 싫어요  ·  감정

사전 23960: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=23960
원문: 오른 주먹의 1·5지를 펴서 약간 구부려 끝을 턱에 댄다.

**sl23960-01.png** 검지와 엄지를 약간 구부려 끝을 턱에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) has the index finger and thumb extended and slightly bent (other fingers folded), their tips touching her chin. Displeased expression, head turned slightly as if shaking it.
```

## 19 무서워요  ·  감정

사전 10967: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10967
원문: 두 손의 5지 끝을 몸 중앙의 위와 아래에 대고 손가락을 흔든다.

**sl10967-01.png** 두 손 엄지 끝을 몸 가운데 위아래에 대고 손가락을 떤다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands are open with fingers spread, palms toward her body, fingers pointing sideways; the right hand is placed high on the centre of her chest and the left hand lower near her stomach, both thumb tips touching the centre line of her body, fingers trembling. Frightened expression.
```

## 20 피곤해요  ·  감정

사전 12438: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=12438
원문: 두 손바닥을 양쪽 가슴에 댔다가 힘없이 밑으로 내린다.

**sl12438-01.png** 두 손바닥을 양쪽 가슴에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both open palms are placed flat on either side of her chest. Tired expression with half-closed eyes.
```

**sl12438-02.png** 힘없이 밑으로 내린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both open hands have dropped limply down to the level of her stomach, palms facing her body, fingers hanging down. Exhausted expression with drooping shoulders.
```

## 21 아파요  ·  감정

사전 5621: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5621
원문: 손바닥이 위로 향하게 약간 오므린 오른손을 좌우로 흔든다.

**sl5621-01.png** 손바닥이 위로 오게 약간 오므린 손을 좌우로 흔든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is slightly cupped with the palm facing up, held in front of her lower chest. Left arm relaxed down. One still moment of the side-to-side movement, without motion marks. Pained expression with furrowed brows.
```

## 22 놀랐어요  ·  감정

사전 2336: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=2336
원문: 1·5지 끝을 맞댄 오른손을 가슴에 대고 같은 모양의 왼손을 그 밑에 대면서 놀라는 표정을 지으며 두 손을 동시에 편다.

**sl2336-01.png** 검지와 엄지 끝을 맞댄 두 손을 가슴 앞에 위아래로 둔다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands have the index fingertip touching the thumb tip; the right hand is against her upper chest and the left hand is just below it. Palms face her torso, BACKS face viewer, fingertips point sideways across torso. Neutral face about to react.
```

**sl2336-02.png** 놀란 표정으로 두 손을 동시에 편다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands have sprung wide open with all fingers spread, still in front of her chest, right above left. Palms face her torso, BACKS face viewer. Surprised expression with wide eyes and open mouth.
```

## 23 행복해요  ·  감정

사전 10223: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10223
원문: 오른손의 1·2·3·4지 바닥을 왼쪽 볼에 5지 바닥을 오른쪽 볼에 댔다가 내리며 손가락을 모아 붙인다.

**sl10223-01.png** 엄지는 오른쪽 볼, 네 손가락은 왼쪽 볼에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) spans her lower face: the four fingers rest on her left cheek and the thumb rests on her right cheek, palm toward her face. Happy, glowing smile.
```

**sl10223-02.png** 내리며 손가락을 모아 붙인다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) has slid down below her chin and the fingertips and thumb are drawn together into a bunched point. Happy, glowing smile.
```

## 24 걱정돼요  ·  감정

사전 5127: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5127
원문: 약간 구부린 오른 손끝을 가슴에 대고 왼쪽으로 강하게 천천히 두 바퀴 돌린다.

**sl5127-01.png** 약간 구부린 손끝을 가슴에 대고 천천히 두 바퀴 돌린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is slightly bent with the fingertips placed on the centre of her chest, as if slowly circling over the heart. Worried expression with raised inner eyebrows.
```

## 25 나  ·  지시어

사전 11536: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=11536
원문: 오른 손바닥을 가슴 중앙에 댄다.

**sl11536-01.png** 오른 손바닥을 가슴 가운데에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is open and flat with the palm placed on the centre of her chest, thumb up. Neutral expression.
```

## 26 너  ·  지시어

사전 6450: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=6450
원문: 오른 주먹의 1지를 펴서 끝이 밖으로 향하게 하여 약간 내민다.

**sl6450-01.png** 검지로 상대를 가리키며 약간 내민다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist with only the index finger extended, pointing straight toward the viewer, held in front of her chest. Neutral expression.
```

## 27 우리  ·  지시어

사전 8265: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8265
원문: 오른 손바닥을 가슴에 댔다가 손등이 위로 향하게 하여 오른쪽으로 한 바퀴 크게 돌린다.

**sl8265-01.png** 오른 손바닥을 가슴에 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is open and flat with the palm placed on her chest. Neutral expression.
```

**sl8265-02.png** 손등이 위로 오게 몸 앞에서 크게 한 바퀴 돌린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is open and flat, back of the hand facing up, held in front of her stomach during a wide horizontal circle. Left arm relaxed down. One still pose, no arrows or motion marks. Neutral, inclusive expression.
```

## 28 여기  ·  지시어

사전 8472: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8472
원문: 오른 주먹의 1지를 펴서 끝이 약간 아래로 향하게 하여 약간 내린다.

**sl8472-01.png** 검지 끝이 약간 아래를 보게 하여 내린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist with only the index finger extended, pointing slightly downward in front of her body. Neutral expression.
```

## 29 그  ·  지시어  (확인 필요: 그리지 말 것)

사전 11234: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=11234
원문: 왼 주먹의 5지를 펴서 바닥이 밖으로 향하게 세우고, 그 등을 오른 주먹의 1지를 펴서 끝으로 가리킨다

**sl11234-01.png** 왼손 엄지를 세우고 오른 검지로 그 등을 가리킨다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her left hand (viewer's right) is a fist with the thumb raised, the pad of the thumb facing the viewer, in front of her chest. Her right hand (viewer's left) is a fist with only the index finger extended, its tip pointing at the back of the left thumb. Neutral expression.
```

## 30 무엇  ·  묻는 말

사전 7224: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7224
원문: 오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 좌우로 두 번 흔든다.

**sl7224-01.png** 검지를 세워 좌우로 두 번 흔든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist with only the index finger extended straight up, the pad of the finger facing the viewer, held in front of her chest, shaking side to side. Questioning expression with raised eyebrows.
```

## 31 어디  ·  묻는 말

사전 8799: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8799
원문: 오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 왼쪽으로 흔든 다음, 손바닥이 아래로 향하게 반쯤 구부린 오른손을 가슴 앞에서 약간 내리다가 멈춘다.

**sl8799-01.png** 검지를 세워 왼쪽으로 흔든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist with only the index finger extended straight up, pad facing the viewer, in front of her chest, moving to her left. Questioning expression with raised eyebrows.
```

**sl8799-02.png** 반쯤 구부린 손을 손바닥이 아래로 오게 내리다 멈춘다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is half-bent with the palm facing down, held in front of her chest as if setting something down and stopping. Questioning expression with raised eyebrows.
```

## 32 언제  ·  묻는 말

사전 8602: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=8602
원문: 가슴 앞에서 모로 세운 왼손 위에 모로 세운 오른손을 올려놓고 5·1·2·3·4지 순으로 손가락을 접는다.

**sl8602-01.png** 모로 세운 왼손 위에 오른손을 모로 세워 올린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands are open and held vertically on their edges in front of her chest, fingers pointing forward; the right hand rests on top of the left hand. Questioning expression with raised eyebrows.
```

**sl8602-02.png** 오른손을 엄지부터 차례로 접는다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: The left hand stays vertical on its edge BELOW the right hand; the right hand on top is now folded into a fist after folding thumb, index, middle, ring and little finger in order. The hands remain touching, stacked vertically as in the official endpoint illustration. Questioning expression with raised eyebrows.
```

## 33 누구  ·  묻는 말

사전 5394: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=5394
원문: 구부린 오른 손가락 등으로 오른뺨을 상하로 두 번 살짝 문지른다.

**sl5394-01.png** 구부린 손가락 등으로 오른뺨을 위아래로 두 번 문지른다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) has its fingers bent; the backs of the bent fingers lightly rub her right cheek. Questioning expression with raised eyebrows.
```

## 34 왜  ·  묻는 말

사전 7713: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7713
원문: 오른 주먹의 1지를 펴서 끝을 오른쪽 관자놀이에 댄 다음, 의문스러운 표정을 짓는다.

**sl7713-01.png** 검지 끝을 오른쪽 관자놀이에 대고 의문스러운 표정을 짓는다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist with only the index finger extended, the fingertip touching her right temple. Puzzled, questioning expression with one eyebrow raised.
```

## 35 어떻게  ·  묻는 말

사전 7256: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7256
원문: 오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 왼쪽으로 흔든 다음, 1·2지를 펴서 구부려 세운 두 주먹의 4지 옆면을 두 번 맞부딪친다.

**sl7256-01.png** 검지를 세워 왼쪽으로 흔든다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her right hand (viewer's left) is a fist with only the index finger extended straight up, pad facing the viewer, in front of her chest, moving to her left. Questioning expression.
```

**sl7256-02.png** 검지와 중지를 구부린 두 주먹의 새끼 쪽을 두 번 맞부딪친다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands are fists with the index and middle fingers extended and hooked (bent), held upright in front of her chest, BACKS facing viewer. The LITTLE-FINGER sides touch at the centre, with thumbs on the outer sides. Only the contact pose, no ghost hands. Questioning expression.
```

## 36 학교  ·  생활

사전 1352: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=1352
원문: 두 손을 펴서 손끝이 위로 손등이 밖으로 향하게 얼굴 앞에 세워 한 번 당긴다.

**sl1352-01.png** 두 손을 펴서 손등이 밖을 향하게 얼굴 앞에 세운다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands open flat, fingers straight together upward, held in front of face at shoulder width. BACKS of hands face viewer, palms toward her face. Show fingernails, no palm creases. Hands a little away from face.
```

**sl1352-02.png** 두 손을 얼굴 쪽으로 한 번 당긴다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both open flat hands are now closer to the face, fingers straight upward, BACKS facing viewer and palms facing her cheeks. End of one inward pull, same configuration.
```

## 37 먹다  ·  생활

사전 10419: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=10419
원문: 오른손을 펴서, 손바닥이 위로 향하게 하여 두 번 입으로 올린다.

**sl10419-01.png** 오른손을 펴 손바닥이 위를 향하게 입 아래에 둔다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her RIGHT hand, on viewer left, is fully open with straight fingers together and PALM UP like a flat tray, held below her mouth at upper chest. Left arm rests down.
```

**sl10419-02.png** 손바닥이 위인 채 입으로 올린다 (두 번 반복)

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Her RIGHT flat open hand is raised near lips, PALM UP, fingers straight together aimed toward her mouth, not pinched. Left arm relaxed. End pose of lifting open hand toward mouth.
```

## 38 친구  ·  생활

사전 7028: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=7028
원문: 두 손을 두 번 맞잡는다.

**sl7028-01.png** 가슴 앞에서 두 손을 마주 보게 벌린다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands are open and naturally curved in front of the chest, palms facing each other, separated by about 10 cm before clasping. One still pose, two hands only.
```

**sl7028-02.png** 두 손을 맞잡는다 (두 번 반복)

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands clasp each other at the centre of the chest, fingers wrapping around the opposite hand, as in the central contact pose of dictionary entry 7028. Not prayer palms. Repeat clasping twice; draw only one contact pose.
```

## 39 만나다  ·  생활

사전 12165: https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=12165
원문: 두 주먹의 1지를 펴서 마주 세웠다가 중앙으로 모아 마주 댄다.

**sl12165-01.png** 두 주먹의 검지만 펴서 양옆에 마주 세운다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: Both hands are fists with ONLY the index fingers extended straight up, facing each other at shoulder width. Thumbs folded across the other three curled fingers.
```

**sl12165-02.png** 두 손을 중앙으로 모아 세운 검지를 마주 댄다

```
Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. No text, no letters, no arrows, no motion lines, no labels, no frames. Her RIGHT hand appears on the VIEWER'S LEFT side of the image.

Scene: The same two upright index fingers have moved to the centre of the chest and their facing sides touch. Fists meet below them. Keep both index fingers straight up, not pointing horizontally. Only the endpoint pose.
```

