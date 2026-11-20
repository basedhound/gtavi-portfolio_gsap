#!/usr/bin/env python3
"""Cut artwork for slots that src/assets/site/ has no file for, from src/assets/source/.
   python3 tools/cut-art.py [name]     writes the files below (AVIF, never upscaled); with a name, only
                                       the outputs whose path contains it
Each cut: (source, output, crop box as fractions of the source (left, top, right, bottom)).
  featured-desktop  2.5:1 wide card (live slot 1153×461 at 1440, 1882×753 at 2560). Rider stays right
                    of centre, clear of the text bottom-left; his head stays inside the top edge.
  featured-mobile   phone card (live 318.75×506 at 375, ratio ≈ .63), centred on the rider.
  mission-4         "After Hours" wide card (2.5:1). The source is only 1024×572, so 1024×410: top-aligned,
                    which keeps the developer's head and cuts the sparkle watermark at the bottom right.
  mission-4-mobile  its portrait-phone card (live short card, ≈ .76 at 375; top-aligned, so a taller
                    canvas only crops at the bottom): the head-and-shoulders box (fractions as given) at
                    full size at the top of a 600×860 canvas, faded into a blurred, enlarged copy of
                    itself, so the face sits above the text and the text sits on the blur.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / 'src/assets'
CUTS = [
    ('source/scenes/sportbike-rider.png', 'site/meet-the-developer/featured-desktop.avif', 'wide', 2.5, 0.5, 0.08),
    ('source/scenes/sportbike-rider.png', 'site/meet-the-developer/featured-mobile.avif', 'tall', 0.63, 0.63, 0.0),
    ('source/scenes/after-hours-nightclub.png', 'site/highlights/mission-4.avif', 'wide', 2.5, 0.5, 0.0),
    ('source/scenes/after-hours-nightclub.png', 'site/highlights/mission-4-mobile.avif', 'extend', (600, 860), (40 / 1024, 0, 640 / 1024, 440 / 572), 0),
]

def extend(im, out, size, box):
    from PIL import ImageFilter
    W, H = im.size
    cw, ch = size
    art = im.crop(tuple(round(v * d) for v, d in zip(box, (W, H, W, H))))
    if art.width != cw:  # never upscale the sharp part
        art = art.resize((cw, round(art.height * cw / art.width)), Image.LANCZOS) if art.width > cw else art
    # background: the art scaled to cover the canvas, heavily blurred
    k = max(cw / art.width, ch / art.height)
    bg = art.resize((round(art.width * k), round(art.height * k)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
    canvas = bg.crop(((bg.width - cw) // 2, 0, (bg.width - cw) // 2 + cw, ch))
    # sharp art on top, fading into the blur over its bottom 35%
    mask = Image.new('L', art.size, 255)
    fade = round(art.height * 0.35)
    for y in range(art.height - fade, art.height):
        mask.paste(round(255 * (art.height - y) / fade), (0, y, art.width, y + 1))
    canvas.paste(art, ((cw - art.width) // 2, 0), mask)
    canvas.save(ROOT / out, quality=70)
    print(f'{out}: {cw}x{ch}, art {art.width}x{art.height} at the top')

def cut(src, out, mode, ratio, fx, fy):
    im = Image.open(ROOT / src).convert('RGB')
    if mode == 'extend':
        return extend(im, out, ratio, fx)
    W, H = im.size
    if mode == 'wide':  # full width, crop height
        w, h = W, round(W / ratio)
    else:               # full height, crop width
        w, h = round(H * ratio), H
    # fx, fy: focal point as a fraction of the source; the box is centred on it, clamped to the image
    left = min(max(round(fx * W - w / 2), 0), W - w)
    top = min(max(round(fy * H - h / 2) if mode == 'tall' else round(fy * H), 0), H - h)
    box = im.crop((left, top, left + w, top + h))
    box.save(ROOT / out, quality=70)
    print(f'{out}: {w}x{h} from {src} at ({left},{top})')

import sys
only = sys.argv[1] if len(sys.argv) > 1 else ''
for c in CUTS:
    if only in c[1]:
        cut(*c)
