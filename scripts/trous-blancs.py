#!/usr/bin/env python3
"""
Retire les zones de fond blanc restées enfermées dans un détourage (entre les jambes,
entre un bras et le corps…), sans toucher aux vraies parties blanches du dessin.

    python3 scripts/trous-blancs.py <copain>/<famille> [--min 600] [--garder x0,y0,x1,y1 ...]

Travaille sur <famille>-plein.png (cadre 708×1068), puis régénère <famille>-cutout.png.
--min     : taille minimale (px) d'une zone blanche pour être retirée (défaut 600).
--garder  : zones à protéger, en px du cadre (ex. un panneau blanc, un kimono).
--bas F   : ne retire que les zones dont le centre est sous F (0-1) de la hauteur du personnage
            et faites d'au moins 85 % de blanc pur (le fond) — idéal pour le blanc entre les jambes.
"""
import argparse
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public/images/personnages"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("look")
    ap.add_argument("--min", type=int, default=600)
    ap.add_argument("--garder", nargs="*", default=[])
    ap.add_argument("--bas", type=float, default=None)
    args = ap.parse_args()
    slug, fam = args.look.split("/")
    plein_path = ROOT / slug / f"{fam}-plein.png"
    im = Image.open(plein_path).convert("RGBA")
    W, H = im.size
    px = im.load()
    keep = [tuple(int(v) for v in g.split(",")) for g in args.garder]
    bbox = im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()

    def white(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and min(r, g, b) > 232 and max(r, g, b) - min(r, g, b) < 14

    seen = bytearray(W * H)
    removed = 0
    for y in range(H):
        for x in range(W):
            if seen[y * W + x] or not white(x, y):
                continue
            zone, q = [], deque([(x, y)])
            seen[y * W + x] = 1
            while q:
                cx, cy = q.popleft()
                zone.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < W and 0 <= ny < H and not seen[ny * W + nx] and white(nx, ny):
                        seen[ny * W + nx] = 1
                        q.append((nx, ny))
            if len(zone) < args.min:
                continue
            zx = sum(p[0] for p in zone) / len(zone)
            zy = sum(p[1] for p in zone) / len(zone)
            if any(k[0] <= zx <= k[2] and k[1] <= zy <= k[3] for k in keep):
                continue
            if args.bas is not None:
                pur = sum(1 for a, b in zone if px[a, b][:3] == (255, 255, 255)) / len(zone)
                if zy < bbox[1] + args.bas * (bbox[3] - bbox[1]) or pur < 0.85:
                    continue
            for zx_, zy_ in zone:
                r, g, b, _ = px[zx_, zy_]
                px[zx_, zy_] = (r, g, b, 0)
            removed += len(zone)
    im.save(plein_path, optimize=True)
    bbox = im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    im.crop(bbox).save(plein_path.with_name(f"{fam}-cutout.png"), optimize=True)
    print(f"{args.look} : {removed} px de fond retirés")


if __name__ == "__main__":
    main()
