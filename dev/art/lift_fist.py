"""'언제' 2장(오른 주먹이 왼 주먹 위에 얹힘)에서 위 주먹과 아래팔을 들어 올려 '만들다' 1장을 만든다.

  python3 dev/art/lift_fist.py <바탕 PNG> <출력 SVG> <올릴 픽셀>

선 색과 굵기는 바탕 그림에서 잰 값(#172846, 7px)을 쓴다.
"""
import base64, io, sys
import numpy as np
from PIL import Image, ImageDraw

INK, SKIN, SHIRT, LW = '#172846', '#fed7be', '#fefefe', 7
src, out, L = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA')
A = np.array(im)

# 위 주먹만 (아래 주먹 윗선보다 위)
fist_poly = [(700, 640), (720, 580), (750, 556), (850, 556), (858, 610), (850, 686), (800, 694), (735, 696), (705, 690)]
# 지울 곳: 옛 아래팔과 위 주먹
erase_poly = [(603, 694), (700, 622), (735, 572), (760, 552), (856, 552), (862, 610), (852, 690),
              (790, 697), (738, 700), (712, 706), (703, 744), (672, 770), (642, 800), (624, 812)]
mk = lambda poly: np.array(Image.new('L', im.size, 0).__class__.__call__ if False else (lambda m: (ImageDraw.Draw(m).polygon(poly, fill=255), m)[1])(Image.new('L', im.size, 0))) > 0
fm, em = mk(fist_poly), mk(erase_poly)
fist = np.zeros_like(A); fist[fm] = A[fm]
fist = np.roll(fist, -L, axis=0)
B = A.copy()
B[em] = [254, 254, 254, 255]
buf = io.BytesIO(); Image.fromarray(B).save(buf, 'PNG')
base = base64.b64encode(buf.getvalue()).decode()
buf = io.BytesIO(); Image.fromarray(fist).save(buf, 'PNG')
fistb = base64.b64encode(buf.getvalue()).decode()

# 새 아래팔: 윗선은 (580,704)에서 새 손목 위쪽으로, 아랫선은 (628,812)에서 새 소매 끝 아래로
t0, b0 = (585, 702), (628, 812)
t1, b1 = (705, 628 - L), (712, 742 - L)
sleeve = f'M {t0[0]} {t0[1]} L {t1[0]} {t1[1]} L {b1[0]} {b1[1]} L {b0[0]} {b0[1]} Z'
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
<image href="data:image/png;base64,{base}" width="1536" height="1024"/>
<path d="M 706 712 Q 770 688 846 702" fill="none" stroke="{INK}" stroke-width="{LW}" stroke-linecap="round"/>
<path d="M 710 708 Q 702 736 714 764" fill="none" stroke="{INK}" stroke-width="{LW}" stroke-linecap="round"/>
<path d="{sleeve}" fill="{SHIRT}"/>
<path d="M {t0[0]} {t0[1]} L {t1[0]} {t1[1]}" stroke="{INK}" stroke-width="{LW+3}" stroke-linecap="round"/>
<path d="M {b0[0]} {b0[1]} L {b1[0]} {b1[1]}" stroke="{INK}" stroke-width="{LW+3}" stroke-linecap="round"/>
<image href="data:image/png;base64,{fistb}" width="1536" height="1024"/>
<path d="M 716 {626 - L + 70} Q 782 {634 - L + 70} 840 {600 - L + 70}" fill="none" stroke="{INK}" stroke-width="{LW}" stroke-linecap="round"/>
<path d="M {t1[0]-4} {t1[1]+2} Q {t1[0]+16} {(t1[1]+b1[1])/2} {b1[0]} {b1[1]}" fill="none" stroke="{INK}" stroke-width="{LW+3}" stroke-linecap="round"/>
</svg>'''
open(out, 'w').write(svg)
