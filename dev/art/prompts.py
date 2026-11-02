"""단어 수어 그림을 만들 때 쓰는 지시문.

js/wordBank.js 의 단계마다 한 장. 영어로 쓴 이유는 이미지 모델이 손가락 지시를
영어에서 더 정확히 따르기 때문이다. 아래 STYLE 은 지금 화면에 있는 그림체다.

  python3 dev/art/prompts.py > docs/ILLUSTRATION-PROMPTS.md
"""
STYLE = (
    "Match docs/illustration-style-reference.png exactly for character proportions, face, hair silhouette, palette and line weight. Use its character style only, never its arrows, layout or hand poses. Flat vector illustration in exactly this style: a friendly young woman, upper body, centered and facing the viewer; "
    "dark navy side-parted hair with a low side bun; peach skin; simple dot eyes; plain white long-sleeve top; "
    "thick, even dark-navy outlines; solid pure black background with a soft white glow around the figure; "
    "landscape 3:2 (1536x1024). Hands are large, clear and anatomically correct with exactly five fingers each. "
    "No text, no letters, no arrows, no motion lines, no labels, no frames. "
    "Her RIGHT hand appears on the VIEWER'S LEFT side of the image."
)

R, L = "her right hand (viewer's left)", "her left hand (viewer's right)"

FRAMES = {
 '만들다': [
  "Both hands are closed fists held SIDEWAYS in front of her chest: thumb side on TOP, little-finger side at the BOTTOM, curled fingers facing her body. "
  "Her LEFT fist (viewer's right) is at mid-chest. Her RIGHT fist (viewer's left) is held about one fist-height ABOVE it, not touching. Neutral expression.",
  "Same sideways fists. The little-finger side (bottom) of her RIGHT fist (viewer's left) is now pressing down on the thumb side (top) of her LEFT fist, "
  "the two fists stacked vertically and touching, as if hammering. Neutral expression."],
 '친구': [
  'Both hands are open and naturally curved in front of the chest, palms facing each other, separated by about 10 cm before clasping. One still pose, two hands only.',
  'Both hands clasp each other at the centre of the chest, fingers wrapping around the opposite hand, as in the central contact pose of dictionary entry 7028. Not prayer palms. Repeat clasping twice; draw only one contact pose.'],
 '만나다': [
  'Both hands are fists with ONLY the index fingers extended straight up, facing each other at shoulder width. Thumbs folded across the other three curled fingers.',
  'The same two upright index fingers have moved to the centre of the chest and their facing sides touch. Fists meet below them. Keep both index fingers straight up, not pointing horizontally. Only the endpoint pose.'],
 '안녕하세요': [
  f"{L} is a closed fist with the forearm held horizontally in front of her waist. {R} is open and flat, palm down, stroking along the top of the left forearm from the elbow toward the wrist. Calm, polite smile.",
  "Both hands are closed fists held side by side in front of her lower chest, palms facing down, knuckles facing forward, as if pressing both fists slightly downward. Calm, polite smile."],
 '감사합니다': [
  f"{L} is flat with the palm facing down, fingers pointing to her right, held in front of her chest. {R} is flat and held vertically on its edge (thumb on top, little-finger edge at the bottom), fingertips pointing forward away from her body, raised a few centimetres above the back of the left hand. Warm smile.",
  f"Same hands: the little-finger edge of {R} (held vertically, fingertips pointing forward) is touching the back of the flat palm-down left hand, like a gentle chop. Warm smile, head slightly bowed."],
 '미안합니다': [
  f"{R} makes a small circle by touching the tip of the index finger to the tip of the thumb, the other three fingers extended; the circle is placed against the middle of her forehead. {L} is flat, palm down, fingertips pointing to her right, in front of her chest. Apologetic expression.",
  f"{R} is now fully open, fingers and thumb spread, its little-finger edge lowered onto the back of {L}. The left hand is flat, palm down, fingertips pointing to her right (viewer left), wrist on viewer right. Follow the lower endpoint pose in the official dictionary illustration. Apologetic expression."],
 '괜찮아요': [
  f"{R} is a fist seen at a three-quarter angle with ONLY a SHORT, THIN little finger (pinky) extended, held 2 cm in front of her chin without touching. Index, middle and ring fingers are folded; the bent thumb lies visibly across those three curled fingers. The pinky is visibly slimmer and shorter than an index finger. Other hand relaxed down. Gentle smile.",
  f"{R} is a fist seen at a three-quarter angle with ONLY a SHORT, THIN little finger extended; the fingertip PAD touches the middle of her chin. Index, middle and ring fingers are folded; the folded thumb is clearly visible lying across them. Gentle smile."],
 '네': [
  f"{R} has the index, middle and little fingers extended and spread, ring finger and thumb folded, back of the hand facing outward; the tips of the index and middle fingers touch the side of her right eye. Friendly expression."],
 '아니요': [
  f"{R} is open and flat, held upright in front of her chest with the palm facing the viewer, fingers together pointing up, slightly to her right. Neutral expression with a slight head shake.",
  f"{R} is open and flat, upright in front of her chest, palm facing the viewer, now shifted slightly to her left (mid-wave). Neutral expression with a slight head shake."],
 '도와주세요': [
  f"{L} is a fist with the thumb sticking straight up (thumbs-up), the pad of the thumb facing the viewer, held in front of her chest. {R} is open, flat and upright, palm facing the back of that thumb, a short distance away from it. Earnest expression.",
  f"Same hands: the palm of the upright flat {R} is pressed against the back of the raised left thumb. Earnest expression."],
 '다시': [
  f"{R} is raised in front of her right shoulder, back of the hand facing the viewer; the thumb presses on the fingernails of the curled index and middle fingers (as if ready to flick); ring and little fingers folded. Neutral expression.",
  "Her right arm has crossed her torso toward her left shoulder (viewer right), with the index and middle fingers flicked open and extended; thumb, ring and little fingers folded. BACK of right hand faces viewer, fingertips point diagonally to viewer right. Left arm relaxed down. Neutral expression."],
 '천천히': [
  'LEFT hand is flat PALM DOWN, BACK UP, fingers pointing to her RIGHT (viewer left), wrist at viewer right. RIGHT hand is an upright VERTICAL BLADE: four fingers fully extended straight together, thumb at TOP and little-finger EDGE at BOTTOM, palm vertical, not horizontal. Its little-finger edge rests on the left HAND BACK close to the left WRIST. Use a three-quarter view showing the two perpendicular hand planes. No closed thumbs-up fist.',
  'Keep the LEFT hand exactly palm DOWN, back UP, fingers to her RIGHT. Keep the RIGHT hand in exactly the same vertical blade shape, all four fingers straight, thumb TOP, little-finger edge BOTTOM. Slide that whole upright hand FORWARD beyond the LEFT FINGERTIPS; do not roll it palm-down or bend the fingers. Same camera, body, scale and left-hand position as frame one.'],
 '이해했어요': [
  f"{L} has the index and middle fingers extended and spread in a V, pointing to her right (sideways), back of the hand facing the viewer, in front of her chest; other fingers folded. {R} is a fist with only the index finger extended, its tip just behind the gap of the V. Thoughtful expression.",
  f"Same hands: the extended right index finger is pushed forward through the gap between the left index and middle fingers. Understanding nod."],
 '물': [
  f"{R} has the index finger and thumb extended and curved into a C shape as if holding a small cup, other fingers folded, held just in front of her chin. Neutral expression.",
  f"The C-shaped {R} (index finger and thumb curved) is raised to her mouth and tilted toward her lips as if drinking from a cup."],
 '화장실': [
  f"{R} is held up in front of her chest with the palm facing the viewer: the middle, ring and little fingers are extended upward and spread apart, while the index finger and thumb curve into an open 'C' shape (not touching). Neutral expression."],
 '배고파요': [
  "Both hands are relaxed and open in front of her stomach, the backs of both thumbs touching her belly, fingers loosely open. Hungry expression with slightly drooping eyebrows.",
  "Both hands at her stomach: the four fingers of each hand are brought together and pressed onto the pad of its thumb, pressing into the belly; her upper body leans forward slightly. Hungry, weak expression."],
 '화나요': [
  f"{R} is a fist with the thumb sticking straight up, held in front of her stomach. Angry expression with furrowed brows.",
  f"{R}, still a thumbs-up fist, has been pushed forcefully upward to the front of her chest. Angry expression with furrowed brows."],
 '슬퍼요': [
  f"{R} has the tips of the index finger and thumb touching (other fingers folded), placed just under her right eye like a falling tear. Sad expression with downturned mouth.",
  f"{R} is open with the fingers bent like a claw, fingertips placed on the centre of her chest, as if circling over the heart. Sad expression with downturned mouth."],
 '기뻐요': [
  "Both hands have only the index finger and thumb extended (L shape), backs of the hands facing the viewer, index fingertips pointing at either side of her chest; her right hand is higher and her left hand is lower. Big happy smile.",
  "Both hands have only the index finger and thumb extended (L shape), backs facing the viewer, index fingertips at either side of her chest; now her right hand is lower and her left hand is higher. Big happy smile."],
 '좋아요': [
  f"{R} is a loose fist placed against her nose so that the side formed by the thumb and index finger touches the nose. Pleased smile."],
 '싫어요': [
  f"{R} has the index finger and thumb extended and slightly bent (other fingers folded), their tips touching her chin. Displeased expression, head turned slightly as if shaking it."],
 '무서워요': [
  "Both hands are open with fingers spread, palms toward her body, fingers pointing sideways; the right hand is placed high on the centre of her chest and the left hand lower near her stomach, both thumb tips touching the centre line of her body, fingers trembling. Frightened expression."],
 '피곤해요': [
  "Both open palms are placed flat on either side of her chest. Tired expression with half-closed eyes.",
  "Both open hands have dropped limply down to the level of her stomach, palms facing her body, fingers hanging down. Exhausted expression with drooping shoulders."],
 '아파요': [
  f"{R} is slightly cupped with the palm facing up, held in front of her lower chest. Left arm relaxed down. One still moment of the side-to-side movement, without motion marks. Pained expression with furrowed brows."],
 '놀랐어요': [
  "Both hands have the index fingertip touching the thumb tip; the right hand is against her upper chest and the left hand is just below it. Palms face her torso, BACKS face viewer, fingertips point sideways across torso. Neutral face about to react.",
  "Both hands have sprung wide open with all fingers spread, still in front of her chest, right above left. Palms face her torso, BACKS face viewer. Surprised expression with wide eyes and open mouth."],
 '행복해요': [
  f"{R} spans her lower face: the four fingers rest on her left cheek and the thumb rests on her right cheek, palm toward her face. Happy, glowing smile.",
  f"{R} has slid down below her chin and the fingertips and thumb are drawn together into a bunched point. Happy, glowing smile."],
 '걱정돼요': [
  f"{R} is slightly bent with the fingertips placed on the centre of her chest, as if slowly circling over the heart. Worried expression with raised inner eyebrows."],
 '나': [
  f"{R} is open and flat with the palm placed on the centre of her chest, thumb up. Neutral expression."],
 '너': [
  f"{R} is a fist with only the index finger extended, pointing straight toward the viewer, held in front of her chest. Neutral expression."],
 '우리': [
  f"{R} is open and flat with the palm placed on her chest. Neutral expression.",
  f"{R} is open and flat, back of the hand facing up, held in front of her stomach during a wide horizontal circle. Left arm relaxed down. One still pose, no arrows or motion marks. Neutral, inclusive expression."],
 '여기': [
  f"{R} is a fist with only the index finger extended, pointing slightly downward in front of her body. Neutral expression."],
 '그': [
  f"{L} is a fist with the thumb raised, the pad of the thumb facing the viewer, in front of her chest. {R} is a fist with only the index finger extended, its tip pointing at the back of the left thumb. Neutral expression."],
 '무엇': [
  f"{R} is a fist with only the index finger extended straight up, the pad of the finger facing the viewer, held in front of her chest, shaking side to side. Questioning expression with raised eyebrows."],
 '어디': [
  f"{R} is a fist with only the index finger extended straight up, pad facing the viewer, in front of her chest, moving to her left. Questioning expression with raised eyebrows.",
  f"{R} is half-bent with the palm facing down, held in front of her chest as if setting something down and stopping. Questioning expression with raised eyebrows."],
 '언제': [
  "Both hands are open and held vertically on their edges in front of her chest, fingers pointing forward; the right hand rests on top of the left hand. Questioning expression with raised eyebrows.",
  "The left hand stays vertical on its edge BELOW the right hand; the right hand on top is now folded into a fist after folding thumb, index, middle, ring and little finger in order. The hands remain touching, stacked vertically as in the official endpoint illustration. Questioning expression with raised eyebrows."],
 '누구': [
  f"{R} has its fingers bent; the backs of the bent fingers lightly rub her right cheek. Questioning expression with raised eyebrows."],
 '왜': [
  f"{R} is a fist with only the index finger extended, the fingertip touching her right temple. Puzzled, questioning expression with one eyebrow raised."],
 '어떻게': [
  f"{R} is a fist with only the index finger extended straight up, pad facing the viewer, in front of her chest, moving to her left. Questioning expression.",
  "Both hands are fists with the index and middle fingers extended and hooked (bent), held upright in front of her chest, BACKS facing viewer. The LITTLE-FINGER sides touch at the centre, with thumbs on the outer sides. Only the contact pose, no ghost hands. Questioning expression."],
}

FRAMES.update({'학교': ['Both hands open flat, fingers straight together upward, held in front of face at shoulder width. BACKS of hands face viewer, palms toward her face. Show fingernails, no palm creases. Hands a little away from face.', 'Both open flat hands are now closer to the face, fingers straight upward, BACKS facing viewer and palms facing her cheeks. End of one inward pull, same configuration.'], '먹다': ['Her RIGHT hand, on viewer left, is fully open with straight fingers together and PALM UP like a flat tray, held below her mouth at upper chest. Left arm rests down.', 'Her RIGHT flat open hand is raised near lips, PALM UP, fingers straight together aimed toward her mouth, not pinched. Left arm relaxed. End pose of lifting open hand toward mouth.']})

if __name__ == '__main__':
    import json, re, subprocess
    bank = json.loads(subprocess.check_output(['node', '-e',
        "import('./js/wordBank.js').then(m=>console.log(JSON.stringify(m.WORD_BANK)))"]))
    out = ['# 단어 수어 그림 지시문', '',
           '`js/wordBank.js` 의 단계마다 한 장이다. 이미지 모델에 **[공통 스타일] + 장면** 을 함께 넣는다.',
           '오른손잡이 기준이고, 그림 속 인물의 오른손은 보는 사람의 왼쪽에 온다(지금 그림과 같다).', '',
           '만든 그림은 각 장 제목의 파일 이름 그대로 `assets/incoming/` 에 넣는다.',
           '`node dev/art/ingest.mjs` 가 장 수와 형식을 검사하고, 손 모양을 사람이 확인한 뒤 `--apply` 로 붙인다.', '',
           '## 공통 스타일', '', '```', STYLE, '```', '']
    n = 0
    for w in bank:
        frames = FRAMES[w['word']]
        assert len(frames) == len(w['steps']), w['word']
        n += 1
        tag = '' if w['status'] == 'ok' else '  (확인 필요: 그리지 말 것)'
        out += [f"## {n:02d} {w['word']}  ·  {w['category']}{tag}", '',
                f"사전 {w['entryNo']}: {w['sourceUrl']}", f"원문: {w['원문']}", '']
        for i, (step, f) in enumerate(zip(w['steps'], frames), 1):
            f = re.sub(r'(^|\. )her ', lambda m: m.group(1) + 'Her ', f)
            out += [f"**sl{w['entryNo']}-{i:02d}.png** {step}", '', '```', f"{STYLE}\n\nScene: {f}", '```', '']
    print('\n'.join(out))
