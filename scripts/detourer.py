#!/usr/bin/env python3
"""
Détourage automatique d'une illustration sur fond blanc (ou dégradé clair).

    python3 scripts/detourer.py public/images/personnages/guigui/botefragile-blanc.png \
        --ombre 150,164,196

Produit <nom>-cutout.png (fond transparent, recadré au personnage) à côté de l'image.
--ombre R,G,B : couleur de l'ombre portée au sol, à retirer (facultatif).
--trous N     : retire aussi les zones blanches enfermées de plus de N pixels
                (ex. l'espace entre un bras et le corps). Désactivé par défaut pour
                ne jamais effacer dents, yeux ou vêtements blancs.
Nécessite Pillow (pip install pillow).
"""
import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


def lum(c):
    return (c[0] * 299 + c[1] * 587 + c[2] * 114) // 1000


def dist(a, b):
    return sum(abs(x - y) for x, y in zip(a, b))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--ombre", help="couleur R,G,B de l'ombre au sol à retirer")
    ap.add_argument("--sortie", help="chemin du PNG détouré")
    ap.add_argument("--trous", type=int, default=0, help="taille mini (px) des zones blanches enfermées à retirer")
    args = ap.parse_args()

    src = Path(args.image)
    im = Image.open(src).convert("RGB")
    W, H = im.size
    px = im.filter(ImageFilter.GaussianBlur(0.8)).load()
    shadow = tuple(int(v) for v in args.ombre.split(",")) if args.ombre else None

    def is_bg(n, c):
        # Fond : pas de rupture nette (pas un trait) et clair
        if dist(n, c) < 14 and lum(n) > 140:
            return True
        # Ombre portée : proche de la couleur donnée, ou mélange ombre/blanc
        if shadow and (dist(n, shadow) < 70 or (dist(n, c) < 30 and n[2] >= n[0] and lum(n) > 130)):
            return dist(n, shadow) < 70 or lum(n) > 170
        return False

    bg = bytearray(W * H)
    q = deque()
    for x in range(W):
        q.extend([(x, 0), (x, H - 1)])
    for y in range(H):
        q.extend([(0, y), (W - 1, y)])
    for x, y in q:
        bg[y * W + x] = 1
    while q:
        x, y = q.popleft()
        c = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and not bg[ny * W + nx] and is_bg(px[nx, ny], c):
                bg[ny * W + nx] = 1
                q.append((nx, ny))

    # Plus grande zone restante = le personnage
    seen = bytearray(W * H)
    best = []
    for sy in range(H):
        for sx in range(W):
            i = sy * W + sx
            if bg[i] or seen[i]:
                continue
            comp, q = [], deque([(sx, sy)])
            seen[i] = 1
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    j = ny * W + nx
                    if 0 <= nx < W and 0 <= ny < H and not bg[j] and not seen[j]:
                        seen[j] = 1
                        q.append((nx, ny))
            if len(comp) > len(best):
                best = comp

    mask = Image.new("L", (W, H), 0)
    mp = mask.load()
    for x, y in best:
        mp[x, y] = 255
    # Zones blanches enfermées (entre bras et corps…), seulement si demandé et assez grandes
    if args.trous:
        orig = im.load()
        white = lambda x, y: min(orig[x, y]) > 238 and mp[x, y]
        done = bytearray(W * H)
        for sx, sy in best:
            if done[sy * W + sx] or not white(sx, sy):
                continue
            zone, q = [], deque([(sx, sy)])
            done[sy * W + sx] = 1
            while q:
                x, y = q.popleft()
                zone.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < W and 0 <= ny < H and not done[ny * W + nx] and white(nx, ny):
                        done[ny * W + nx] = 1
                        q.append((nx, ny))
            if len(zone) >= args.trous:
                for x, y in zone:
                    mp[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))

    out = im.convert("RGBA")
    out.putalpha(mask)
    bbox = mask.point(lambda v: 255 if v > 20 else 0).getbbox()
    pad = 12
    bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0), min(bbox[2] + pad, W), min(bbox[3] + pad, H))
    dst = Path(args.sortie) if args.sortie else src.with_name(src.stem.replace("-blanc", "") + "-cutout.png")
    out.crop(bbox).save(dst, optimize=True)
    print(f"{dst}  {bbox[2] - bbox[0]}×{bbox[3] - bbox[1]}")


if __name__ == "__main__":
    main()
