#!/usr/bin/env python3
"""
Buste animé qui suit la tête du personnage (WebP animé à fond transparent).

Comme buste_anime.py, mais le cadre se déplace avec la tête, image par image :
utile quand le personnage court, tombe ou se penche.

    swift scripts/video/images.swift public/.../gaulois-course.mp4 /tmp/images
    python3 scripts/video/buste_suivi.py /tmp/images suivi.json public/.../gaulois-buste.webp

suivi.json : {"r": rayon du visage (px), "pos": [[x, y], …]} — centre du visage pour
chaque image (obtenu par détection de visage ou suivi, puis lissé).
Facultatif : "zoom" (< 1 = cadre plus large) et "decalage" [dx, dy] en rayons de visage ;
"effacer" : rectangles [x0, y0, x1, y1] en fraction du buste (0-1) à rendre transparents
(ex. un chaudron qui entre dans le cadre, un pied qui dépasse).
Le cadre fait 8,4 rayons de large, ratio 5:7, visage au tiers haut.
"""
import argparse
import glob
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from buste_anime import key  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("images")
    ap.add_argument("suivi")
    ap.add_argument("sortie")
    ap.add_argument("--largeur", type=int, default=240)
    ap.add_argument("--pas", type=int, default=3, help="garde une image sur N (défaut 3 → 10 i/s)")
    ap.add_argument("--qualite", type=int, default=72)
    args = ap.parse_args()

    t = json.load(open(args.suivi))
    files = sorted(glob.glob(os.path.join(args.images, "*.png")))
    w = t["r"] * 8.4 / t.get("zoom", 1)
    dx, dy = (v * t["r"] for v in t.get("decalage", (0, 0)))
    h = w * 1.4
    size = (args.largeur, round(args.largeur * 1.4))
    frames = []
    for i in range(0, len(files), args.pas):
        x, y = t["pos"][i]
        x, y = x + dx, y + dy
        box = (round(x - w / 2), round(y - 0.3 * h), round(x + w / 2), round(y + 0.7 * h))
        fr = key(files[i], box).resize(size, Image.LANCZOS)
        for x0, y0, x1, y1 in t.get("effacer", []):
            fr.paste((0, 0, 0, 0), (round(x0 * size[0]), round(y0 * size[1]), round(x1 * size[0]), round(y1 * size[1])))
        frames.append(fr)
        print(f"\r{i + 1}/{len(files)}", end="", flush=True)
    frames[0].save(args.sortie, save_all=True, append_images=frames[1:], duration=round(1000 / 30 * args.pas),
                   loop=0, quality=args.qualite, method=6)
    print(f"\n{args.sortie} : {len(frames)} images, {os.path.getsize(args.sortie) // 1024} Ko")


if __name__ == "__main__":
    main()
