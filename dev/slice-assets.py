#!/usr/bin/env python3
"""지문자·수어 도표를 자모별, 단어별 그림으로 자른다.

사용법:  python3 dev/slice-assets.py <도표가 있는 폴더>

자모는 한 칸에 손 하나뿐이므로 '가장 큰 덩어리'만 집어낸다. 글자 라벨은
손보다 훨씬 작아 자연히 떨어져 나간다.
단어는 한 칸에 동작이 여러 컷 이어지므로 덩어리를 고르면 한 컷만 남는다.
그래서 아래쪽 라벨 띠만 떼어 내고 나머지 전체를 쓴다.
"""
from PIL import Image
from collections import deque
import sys, os

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets')

CONS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
VOW  = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ',
        'ㅘ','ㅚ','ㅙ','ㅝ','ㅞ','ㅟ','ㅢ']
WORDS = ['안녕하세요','감사합니다','네','아니요','화장실','병원','도와주세요','어디']

def on_white(p):
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255,255,255,255))
    return Image.alpha_composite(bg, im).convert('RGB')

def biggest_blob(im, thresh=238, min_frac=0.004):
    g = im.convert('L'); w, h = g.size; px = g.load()
    seen = bytearray(w*h); best = None; best_area = 0
    for sy in range(h):
        for sx in range(w):
            i = sy*w+sx
            if seen[i] or px[sx,sy] >= thresh: continue
            q = deque([(sx,sy)]); seen[i] = 1
            x0=x1=sx; y0=y1=sy; area=0
            while q:
                x,y = q.popleft(); area += 1
                x0=min(x0,x); x1=max(x1,x); y0=min(y0,y); y1=max(y1,y)
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                    nx,ny = x+dx, y+dy
                    if 0<=nx<w and 0<=ny<h:
                        j = ny*w+nx
                        if not seen[j] and px[nx,ny] < thresh:
                            seen[j] = 1; q.append((nx,ny))
            if area > best_area and area > w*h*min_frac:
                best_area = area; best = (x0,y0,x1,y1)
    return best

def trim(im, thresh=244):
    g = im.convert('L'); w,h = g.size; px = g.load()
    x0,y0,x1,y1 = w,h,-1,-1
    for y in range(h):
        for x in range(w):
            if px[x,y] < thresh:
                x0=min(x0,x); x1=max(x1,x); y0=min(y0,y); y1=max(y1,y)
    return None if x1 < 0 else (x0,y0,x1,y1)

def fit(im, size, pad=14):
    im = im.copy(); im.thumbnail((size-pad*2, size-pad*2), Image.LANCZOS)
    c = Image.new('RGB', (size,size), (255,255,255))
    c.paste(im, ((size-im.width)//2, (size-im.height)//2)); return c

def cells(path, cols, rows, labels):
    im = on_white(os.path.join(SRC, path)); W,H = im.size
    cw,ch = W/cols, H/rows
    for i,name in enumerate(labels):
        r,c = divmod(i, cols)
        yield name, im.crop((int(c*cw), int(r*ch), int((c+1)*cw), int((r+1)*ch)))

def do_jamo(path, cols, rows, labels, size=320, pad=8):
    n = 0
    for name, cell in cells(path, cols, rows, labels):
        box = biggest_blob(cell)
        if not box: print('  못 찾음:', name); continue
        x0,y0,x1,y1 = box
        crop = cell.crop((max(0,x0-pad), max(0,y0-pad),
                          min(cell.width,x1+pad+1), min(cell.height,y1+pad+1)))
        fit(crop, size).save(f'{OUT}/jamo/{name}.png'); n += 1
    return n

def do_words(path, cols, rows, labels, label_frac=0.30, maxw=760):
    """라벨 띠만 떼고 동작 컷 전체를 남긴다."""
    n = 0
    for name, cell in cells(path, cols, rows, labels):
        cell = cell.crop((0, 0, cell.width, int(cell.height*(1-label_frac))))
        box = trim(cell)
        if not box: print('  못 찾음:', name); continue
        x0,y0,x1,y1 = box
        crop = cell.crop((max(0,x0-8), max(0,y0-8),
                          min(cell.width,x1+9), min(cell.height,y1+9)))
        if crop.width > maxw:
            crop = crop.resize((maxw, round(crop.height*maxw/crop.width)), Image.LANCZOS)
        crop.save(f'{OUT}/word/{name}.png'); n += 1
    return n

os.makedirs(f'{OUT}/jamo', exist_ok=True)
os.makedirs(f'{OUT}/word', exist_ok=True)
a = do_jamo('1.webp', 4, 4, CONS)
b = do_jamo('2.webp', 5, 5, VOW)
c = do_words('3.webp', 2, 4, WORDS)
print(f'자음 {a} · 모음 {b} · 단어 {c}')
