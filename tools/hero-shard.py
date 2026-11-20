#!/usr/bin/env python3
"""Re-cut one hero collage shard from source art, then rebuild the poster from all 10 shards.
   python3 tools/hero-shard.py <desktop|mobile> <shard number> <source png> <focal x> [focal y]
e.g. python3 tools/hero-shard.py desktop 8 source/scenes/sportbike-rider.png 0.66 0.5

The shard is the source scaled to cover the piece's outline box (src/assets/source/hero-masks/<set>/
shard-NN.png), cropped around the focal point (fractions of the source), never upscaled, with the
outline as its alpha, on the full canvas (desktop 2560×1440, mobile 1366×1366) like the other layers.
The poster is then the 10 shards over the collage background (#1c012e; the existing poster equals
background + shards to within AVIF noise, checked 2026-11-18), so the intro's last frame and the poster
stay identical.
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / 'src/assets'
BACKGROUND = (28, 1, 46, 255)  # #1c012e

def main(kind, n, src, fx, fy=0.5):
    n, fx, fy = int(n), float(fx), float(fy)
    site = ROOT / 'site/hero' / kind
    mask = Image.open(ROOT / f'source/hero-masks/{kind}/shard-{n:02d}.png').convert('L')
    x0, y0, x1, y1 = mask.getbbox()
    bw, bh = x1 - x0, y1 - y0
    im = Image.open(ROOT / src).convert('RGB')
    W, H = im.size
    k = max(bw / W, bh / H)
    if k > 1:
        sys.exit(f'{src} is {W}x{H}: too small for the {bw}x{bh} slot (would upscale {k:.2f}x)')
    cw, ch = round(bw / k), round(bh / k)  # crop box in source pixels
    left = min(max(round(fx * W - cw / 2), 0), W - cw)
    top = min(max(round(fy * H - ch / 2), 0), H - ch)
    piece = im.crop((left, top, left + cw, top + ch)).resize((bw, bh), Image.LANCZOS)
    layer = Image.new('RGBA', mask.size, (0, 0, 0, 0))
    layer.paste(piece, (x0, y0))
    layer.putalpha(mask)
    layer.save(site / f'shard-{n:02d}.avif', quality=80)
    print(f'{kind}/shard-{n:02d}: {src} crop ({left},{top},{cw}x{ch}) -> {bw}x{bh} at ({x0},{y0})')

    poster = Image.new('RGBA', mask.size, BACKGROUND)
    for i in range(1, 11):
        poster.alpha_composite(Image.open(site / f'shard-{i:02d}.avif').convert('RGBA'))
    poster.convert('RGB').save(site / 'poster.avif', quality=80)
    print(f'{kind}/poster.avif rebuilt from the 10 shards')

if __name__ == '__main__':
    main(*sys.argv[1:])
