#!/usr/bin/env python3
"""
Buste animé à fond transparent (WebP animé) à partir des images d'une vidéo.

    swift scripts/video/images.swift public/.../botefragile-marche.mp4 /tmp/images
    python3 scripts/video/buste_anime.py /tmp/images public/.../botefragile-buste-marche.webp \
        --cadre 180,172,530,662

--cadre x0,y0,x1,y1 : zone du buste dans l'image d'origine (ratio 200×280 conseillé).
Le fond clair est retiré image par image (remplissage depuis les bords haut/gauche/droite ;
le bas est coupé dans le corps). Nécessite Pillow avec WebP.
"""
import argparse
import glob
import os
from collections import deque

from PIL import Image, ImageFilter


def lum(c):
    return (c[0] * 299 + c[1] * 587 + c[2] * 114) // 1000


def key(path, box):
    im = Image.open(path).convert("RGB").crop(box)
    W, H = im.size
    px = im.filter(ImageFilter.GaussianBlur(1.0)).load()
    bg = bytearray(W * H)
    seeds = [(x, 0) for x in range(W)] + [(0, y) for y in range(H)] + [(W - 1, y) for y in range(H)]
    q = deque()
    for x, y in seeds:
        if lum(px[x, y]) > 200 and not bg[y * W + x]:
            bg[y * W + x] = 1
            q.append((x, y))
    while q:
        x, y = q.popleft()
        c = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and not bg[ny * W + nx]:
                n = px[nx, ny]
                if sum(abs(a - b) for a, b in zip(n, c)) < 16 and lum(n) > 195:
                    bg[ny * W + nx] = 1
                    q.append((nx, ny))
    mask = Image.frombytes("L", (W, H), bytes(0 if b else 255 for b in bg))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("images", help="dossier des images PNG extraites de la vidéo")
    ap.add_argument("sortie", help="fichier .webp à produire")
    ap.add_argument("--cadre", required=True, help="x0,y0,x1,y1 dans l'image d'origine")
    ap.add_argument("--largeur", type=int, default=280, help="largeur finale en px (défaut 280)")
    ap.add_argument("--fps", type=int, default=30)
    args = ap.parse_args()

    box = tuple(int(v) for v in args.cadre.split(","))
    files = sorted(glob.glob(os.path.join(args.images, "*.png")))
    size = (args.largeur, round(args.largeur * (box[3] - box[1]) / (box[2] - box[0])))
    frames = []
    for i, f in enumerate(files):
        frames.append(key(f, box).resize(size, Image.LANCZOS))
        print(f"\r{i + 1}/{len(files)}", end="", flush=True)
    frames[0].save(args.sortie, save_all=True, append_images=frames[1:], duration=round(1000 / args.fps),
                   loop=0, quality=82, method=6)
    print(f"\n{args.sortie} : {len(frames)} images, {os.path.getsize(args.sortie) // 1024} Ko")


if __name__ == "__main__":
    main()
