"""기존 그림의 몸(얼굴, 머리, 옷)을 그대로 두고 팔과 손만 새로 그려 낱말 그림을 만든다.

코덱스 그림과 같은 인물로 보이게 하려는 것이다. 바탕 그림에서 팔과 손이 있던 자리를
옷 색으로 지우고, 몸통 안쪽 선을 다시 긋고, 그 위에 새 팔과 손을 같은 선 굵기와
색으로 얹는다. SVG 로 쓰고 브라우저로 PNG 를 뽑는다.

  python3 dev/art/draw_on_base.py <낱말> <출력 폴더>
"""
import base64, sys

INK = '#172846'     # 바탕 그림의 선 색 (재서 맞춤)
SKIN = '#fed7be'
SHIRT = '#fefefe'
LW = 7

class Layer:
    def __init__(self): self.out = []
    def fat(self, pts, w, fill=SHIRT, cap='round'):
        d = 'M ' + ' L '.join(f'{x} {y}' for x, y in pts)
        self.out.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w + 2*LW}" stroke-linecap="{cap}" stroke-linejoin="round"/>')
        self.out.append(f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="round"/>')
    def blob(self, d, fill=SKIN, outline=True):
        if outline: self.out.append(f'<path d="{d}" fill="{INK}" stroke="{INK}" stroke-width="{2*LW}" stroke-linejoin="round"/>')
        self.out.append(f'<path d="{d}" fill="{fill}"/>')
    def line(self, d, w=LW):
        self.out.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')
    def rect(self, x, y, w, h, fill):
        self.out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>')

def side_fist(L, cx, cy, facing):
    """엄지 쪽이 위, 새끼 쪽이 아래로 가게 옆으로 세운 주먹. facing: 손가락 끝이 감기는 쪽 (+1 오른쪽, -1 왼쪽)."""
    w, h = 118, 108
    x0, y0 = cx - w/2, cy - h/2
    # 주먹 몸통: 손가락 마디 쪽이 둥글다
    k = facing
    near, far = (x0, x0 + w) if k > 0 else (x0 + w, x0)
    L.blob(f'M {near} {y0+18} Q {near} {y0} {near + k*24} {y0} L {far - k*30} {y0} '
           f'Q {far} {y0} {far} {y0+30} L {far} {y0+h-26} Q {far} {y0+h} {far - k*30} {y0+h} '
           f'L {near + k*24} {y0+h} Q {near} {y0+h} {near} {y0+h-18} Z')
    # 접은 네 손가락의 마디 선 (위에서 아래로: 검지 중지 약지 새끼)
    for i in range(1, 4):
        yy = y0 + 22 + i * 21
        L.line(f'M {far - k*6} {yy} Q {far - k*22} {yy + 3} {far - k*44} {yy}', 5)
    # 엄지: 위쪽을 가로질러 감싼다
    L.fat([(near + k*14, y0 + 10), (far - k*40, y0 + 4), (far - k*18, y0 + 18)], 26, fill=SKIN)

def build(word, step):
    base = '/home/user/sonmal/assets/word-steps/sl3331-02.png'
    b64 = base64.b64encode(open(base, 'rb').read()).decode()
    L = Layer()
    # 1) 원래 두 주먹과 아래팔을 지운다
    L.rect(436, 640, 660, 235, SHIRT)
    # 2) 몸통 안쪽 세로선을 다시 긋는다(지운 구간)
    L.line('M 531 636 L 531 880'); L.line('M 980 636 L 980 880')
    if word == '만들다':
        lower = (790, 790)                       # 왼 주먹(보는 쪽 오른쪽)은 아래, 제자리
        upper = (775, 612) if step == 1 else (775, 690)   # 오른 주먹은 위에서 내려와 두드린다
        # 아래팔: 왼팔은 오른쪽 옆에서 가운데로, 오른팔은 왼쪽 아래에서 위로
        L.fat([(1100, 830), (900, 800)], 92)
        L.fat([(430, 820), (520, 790), (700, upper[1] + 20)], 92)
        side_fist(L, *lower, facing=-1)
        side_fist(L, *upper, facing=+1)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">'
           f'<image href="data:image/png;base64,{b64}" width="1536" height="1024"/>' + ''.join(L.out) + '</svg>')
    return svg

if __name__ == '__main__':
    word, outdir = sys.argv[1], sys.argv[2]
    for step in (1, 2):
        open(f'{outdir}/{word}-{step}.svg', 'w').write(build(word, step))
