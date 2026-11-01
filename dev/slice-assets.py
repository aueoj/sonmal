#!/usr/bin/env python3
"""지문자·수어 도표를 자모별, 단어별 그림으로 자른다.

사용법:  python3 dev/slice-assets.py <도표가 있는 폴더>

칸 하나에 손이 둘인 자모(복합모음·쌍자음)가 있으므로 '가장 큰 덩어리'를
고르면 한 손만 남는다. 그래서 칸에서 아래쪽 라벨 띠만 떼고 남은 전체를 쓴다.
라벨을 떼고 나면 손만 남으므로 흰 여백을 다듬는 것으로 충분하다.
"""
from PIL import Image
import sys, os

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets')

# 8.webp — 자모 35자, 7열 5행
JAMO = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ',
        'ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
        'ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ',
        'ㅖ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ',
        'ㅘ','ㅚ','ㅙ','ㅝ','ㅟ','ㅞ','ㅢ']   # 마지막 줄 둘째 칸은 라벨이 ㅙ로 찍혀 있으나
                                             # ㅚ가 빠져 있어 ㅚ로 본다. 확인 필요.
# 6.webp — 쌍자음과 일부 자음, 4열 3행
DOUBLE = ['ㄲ','ㄸ','ㅃ','ㅆ',
          'ㅉ', None, None, None,
          None, None, None]
# 7.webp — 단어 12개, 3열 4행
WORDS = ['안녕하세요','감사합니다','미안합니다',
         '괜찮아요','네','아니요',
         '도와주세요','다시','천천히',
         '이해했어요','물','화장실']

def on_white(p, kill_checker=False):
    """투명한 그림은 흰 바탕에 올린다.
       체크무늬가 '그려져 있는' 그림은 투명이 아니므로, 회색빛이 도는 밝은 픽셀을
       흰색으로 바꿔 지운다. 손의 테두리(진한 남색)와 살색은 그대로 남는다."""
    im = Image.open(p)
    im = Image.alpha_composite(Image.new('RGBA', im.size, (255,255,255,255)),
                               im.convert('RGBA')).convert('RGB')
    if kill_checker:
        px = im.load()
        w, h = im.size
        for y in range(h):
            for x in range(w):
                r, g, b = px[x, y]
                if max(r,g,b) - min(r,g,b) < 20 and (r+g+b)/3 > 180:
                    px[x, y] = (255, 255, 255)
    return im

def trim_box(im, thresh=246):
    g = im.convert('L'); w,h = g.size; px = g.load()
    x0,y0,x1,y1 = w,h,-1,-1
    for y in range(h):
        row = False
        for x in range(w):
            if px[x,y] < thresh:
                row = True
                if x < x0: x0 = x
                if x > x1: x1 = x
        if row:
            if y < y0: y0 = y
            y1 = y
    return None if x1 < 0 else (x0,y0,x1,y1)

def cut(path, cols, rows, labels, outdir, label_frac, box_size=None, max_w=760,
        pad=10, top_frac=0.04, kill_checker=False):
    im = on_white(os.path.join(SRC, path), kill_checker); W,H = im.size
    cw,ch = W/cols, H/rows; n = 0
    for i,name in enumerate(labels):
        if not name: continue
        r,c = divmod(i, cols)
        cell = im.crop((int(c*cw), int(r*ch), int((c+1)*cw), int((r+1)*ch)))
        # 위쪽에는 윗줄 글자의 꼬리가, 아래쪽에는 이 칸의 글자가 걸린다
        cell = cell.crop((0, int(cell.height*top_frac),
                          cell.width, int(cell.height*(1-label_frac))))
        box = trim_box(cell)
        if not box: print('  못 찾음:', name); continue
        x0,y0,x1,y1 = box
        crop = cell.crop((max(0,x0-pad), max(0,y0-pad),
                          min(cell.width,x1+pad+1), min(cell.height,y1+pad+1)))
        if box_size:                      # 자모는 정사각 캔버스에 담아 크기를 고른다
            crop.thumbnail((box_size-20, box_size-20), Image.LANCZOS)
            canvas = Image.new('RGB', (box_size,box_size), (255,255,255))
            canvas.paste(crop, ((box_size-crop.width)//2, (box_size-crop.height)//2))
            crop = canvas
        elif crop.width > max_w:
            crop = crop.resize((max_w, round(crop.height*max_w/crop.width)), Image.LANCZOS)
        crop.save(os.path.join(outdir, f'{name}.png')); n += 1
    return n

os.makedirs(f'{OUT}/jamo', exist_ok=True)
os.makedirs(f'{OUT}/word', exist_ok=True)
a = cut('8.webp', 7, 5, JAMO,   f'{OUT}/jamo', label_frac=0.26, box_size=340)
b = cut('6.webp', 4, 3, DOUBLE, f'{OUT}/jamo', label_frac=0.22, box_size=340,
        top_frac=0.06, kill_checker=True)
c = cut('7.webp', 3, 4, WORDS,  f'{OUT}/word', label_frac=0.20)
print(f'자모 {a} · 쌍자음 {b} · 단어 {c}')
