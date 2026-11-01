"""손말 단어 그림을 코드로 그린다 (SVG → PNG).

지금 그림체를 따른다: 검은 바탕, 인물 둘레의 흰 빛, 남색 굵은 선, 살구색 피부,
흰 긴소매, 가운데 가르마의 남색 머리와 낮게 묶은 머리.
인물의 오른손은 보는 사람의 왼쪽에 온다.

손은 '선이 있는 스티커'를 겹쳐 붙이는 식으로 그린다. 부위마다 남색으로 한 번 굵게
칠하고 그 위에 살색을 칠해, 겹친 자리에 자연스럽게 경계선이 생기게 한다.
"""
W, H = 1536, 1024
INK = '#141c33'      # 선
SKIN = '#fdd3b5'
SHIRT = '#fefefe'
HAIR = '#16213f'
HAIR_HI = '#1f2d55'
LW = 7               # 선 굵기


class Svg:
    def __init__(self):
        self.parts = []      # 실루엣(빛 번짐용)
        self.body = []

    # ── 기본 도형 ───────────────────────────────
    def fat(self, pts, width, fill=SKIN, outline=True, cap='round'):
        """굵은 선 하나를 테두리 있는 막대로 그린다 (팔, 손가락)."""
        d = 'M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in pts)
        if outline:
            self.body.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{width + 2 * LW}" stroke-linecap="{cap}" stroke-linejoin="round"/>')
        self.body.append(f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{width}" stroke-linecap="{cap}" stroke-linejoin="round"/>')
        self.parts.append(f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{width + 2 * LW}" stroke-linecap="{cap}" stroke-linejoin="round"/>')

    def blob(self, d, fill=SKIN, outline=True, glow=True):
        """닫힌 도형을 테두리와 함께 (손바닥, 얼굴)."""
        if outline:
            self.body.append(f'<path d="{d}" fill="{INK}" stroke="{INK}" stroke-width="{2 * LW}" stroke-linejoin="round"/>')
        self.body.append(f'<path d="{d}" fill="{fill}"/>')
        if glow:
            self.parts.append(f'<path d="{d}" fill="#fff" stroke="#fff" stroke-width="{2 * LW}"/>')

    def line(self, d, width=LW):
        self.body.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')

    def raw(self, s):
        self.body.append(s)

    def render(self):
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
  <filter id="haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
  <radialGradient id="hairg" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="{HAIR_HI}"/><stop offset="1" stop-color="{HAIR}"/></radialGradient>
</defs>
<rect width="{W}" height="{H}" fill="#000"/>
<ellipse cx="768" cy="300" rx="260" ry="280" fill="#1b2650" opacity=".55" filter="url(#haze)"/>
<g filter="url(#glow)" opacity=".85">{''.join(self.parts)}</g>
{''.join(self.body)}
</svg>'''


# ── 몸 ─────────────────────────────────────────
def head(s, mood='smile'):
    # 뒤 머리: 둥근 정수리에서 귀 높이까지
    dome = 'M 572 320 C 536 150 640 36 770 36 C 900 36 1004 150 966 320 Z'
    s.parts.append(f'<path d="{dome}" fill="#fff" opacity=".35"/>')
    s.raw(f'<path d="{dome}" fill="url(#hairg)"/>')
    s.raw(f'<circle cx="884" cy="448" r="50" fill="{HAIR}"/>')      # 묶은 머리
    s.blob('M 702 420 L 702 560 L 832 560 L 832 420 Z')             # 목
    s.blob('M 614 300 C 562 288 546 345 576 371 C 592 384 612 381 624 372 Z')   # 귀
    s.blob('M 920 300 C 972 288 988 345 958 371 C 942 384 922 381 910 372 Z')
    s.blob('M 612 300 C 612 420 690 470 767 470 C 844 470 922 420 922 300 C 922 60 612 60 612 300 Z')
    # 앞머리: 가운데 가르마에서 양옆으로 내려와 이마가 세모로 보인다
    s.raw(f'<path d="M 588 316 C 572 186 660 90 776 90 C 896 90 968 190 948 316 '
          f'Q 936 330 922 318 C 916 290 912 266 902 246 C 862 214 812 176 786 132 '
          f'C 764 180 706 222 646 248 C 630 264 622 290 614 318 Q 600 330 588 316 Z" fill="url(#hairg)"/>')
    s.raw(f'<circle cx="697" cy="308" r="16" fill="{INK}"/><circle cx="837" cy="308" r="16" fill="{INK}"/>')
    s.line('M 656 256 Q 688 238 722 250'); s.line('M 812 250 Q 846 238 878 256')
    s.line({'smile': 'M 732 380 Q 767 406 802 380', 'flat': 'M 744 390 Q 767 394 790 390'}.get(mood, 'M 732 380 Q 767 406 802 380'))


def torso(s, left='down', right='down'):
    """옷 실루엣. 내린 팔은 몸 실루엣에 포함하고 안쪽 선으로만 가른다.
    left/right 는 보는 사람 기준. 'bent' 면 팔꿈치까지만 실루엣에 넣는다."""
    L = ('L 470 640 Q 452 720 446 840 Q 470 880 560 890 L 576 1040' if left == 'bent'
         else 'L 470 640 L 446 1040')
    R = ('L 1066 640 Q 1084 720 1090 840 Q 1066 880 976 890 L 960 1040' if right == 'bent'
         else 'L 1066 640 L 1090 1040')
    d = (f'M 655 522 C 690 578 842 578 878 522 Q 960 545 1022 580 Q 1058 600 1066 640 '
         f'{R} L {576 if left == "bent" else 446} 1040 '
         f'M 655 522 Q 574 545 514 580 Q 478 600 470 640 {L} L 960 1040 Z')
    # 경로를 하나로: 왼쪽 어깨부터 시계 방향
    d = ('M 655 522 C 690 578 842 578 878 522 Q 960 545 1022 580 Q 1058 600 1066 640 '
         + R.replace('L 1066 640 ', '') + ' L ' + ('576' if left == 'bent' else '446') + ' 1040 '
         + {'bent': 'L 560 890 Q 470 880 446 840 Q 452 720 470 640',
            'down': 'L 470 640'}[left]
         + ' Q 478 600 514 580 Q 574 545 655 522 Z')
    s.blob(d, fill=SHIRT)
    if left == 'down': s.line('M 566 622 Q 578 800 572 1030')
    else: s.line('M 566 622 Q 578 700 572 770')
    if right == 'down': s.line('M 968 622 Q 956 800 962 1030')
    else: s.line('M 968 622 Q 956 700 962 770')


def forearm(s, elbow, wrist, width=98):
    """몸 앞으로 올라온 아래팔 소매."""
    s.fat([elbow, wrist], width, fill=SHIRT)


# ── 손 ─────────────────────────────────────────
def flat_hand_on_chest(s, wrist):
    """손등이 보이게 편 손을 가슴에 댄다. 손끝은 인물의 왼쪽(보는 사람 오른쪽), 엄지는 위."""
    wx, wy = wrist
    s.fat([(wx + 46, wy - 24), (wx + 70, wy - 84), (wx + 84, wy - 108)], 44)           # 엄지 (손바닥 뒤에서 나온다)
    palm = (f'M {wx-6} {wy-46} C {wx+40} {wy-66} {wx+100} {wy-66} {wx+134} {wy-56} '
            f'L {wx+140} {wy+48} C {wx+100} {wy+62} {wx+40} {wy+60} {wx-6} {wy+44} Z')
    s.blob(palm)
    for a, b, w in [((wx+128, wy+36), (wx+214, wy+40), 31),      # 새끼
                    ((wx+130, wy+8),  (wx+246, wy+10), 34),      # 약지
                    ((wx+132, wy-22), (wx+254, wy-22), 35),      # 중지
                    ((wx+130, wy-50), (wx+240, wy-54), 34)]:     # 검지
        s.fat([a, b], w)
    s.blob(f'M {wx} {wy-40} C {wx+40} {wy-58} {wx+100} {wy-58} {wx+146} {wy-50} '
           f'L {wx+148} {wy+42} C {wx+100} {wy+54} {wx+40} {wy+52} {wx} {wy+38} Z', outline=False, glow=False)
    s.line(f'M {wx+38} {wy-34} Q {wx+60} {wy-50} {wx+84} {wy-46}', 5)   # 엄지 뿌리 주름


def fist_pinky_up(s, at, k=1.32):
    """주먹에서 새끼손가락만 세운 손. 손등 쪽이 보이고 새끼가 위로 선다. at=주먹 가운데."""
    x, y = at
    P = lambda dx, dy: f'{x + dx * k:.1f} {y + dy * k:.1f}'
    s.fat([tuple(map(float, P(30, -30).split())), tuple(map(float, P(42, -92).split())), tuple(map(float, P(46, -116).split()))], 30 * k)
    s.blob(f'M {P(-58,-36)} C {P(-30,-58)} {P(30,-60)} {P(52,-40)} C {P(70,-10)} {P(66,40)} {P(40,58)} '
           f'C {P(0,70)} {P(-50,62)} {P(-62,30)} Z')
    for dx in (-40, -12, 16):
        s.line(f'M {P(dx,-42)} Q {P(dx+8,-16)} {P(dx+4,4)}', 5)
    s.fat([tuple(map(float, P(a, b).split())) for a, b in ((-54, 24), (-8, 34), (18, 26))], 30 * k)


def word_okay(step=2):
    s = Svg()
    head(s, 'smile')
    torso(s, left='bent')
    forearm(s, (496, 836), (660, 628))
    s.line('M 618 596 L 694 660')
    fist_pinky_up(s, (712, 590) if step == 2 else (700, 620))
    return s.render()


def word_na():
    s = Svg()
    head(s, 'smile')
    torso(s, left='bent')
    forearm(s, (500, 840), (650, 736))
    s.line('M 622 690 L 668 774')       # 소매 끝
    flat_hand_on_chest(s, (676, 716))
    return s.render()


if __name__ == '__main__':
    import sys
    open(sys.argv[1], 'w').write({'na': word_na, 'okay': word_okay}[sys.argv[2]]())
