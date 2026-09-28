#!/usr/bin/env python3
"""
Crée <famille>-plein.png : le détourage (fond transparent) replacé dans le cadre
d'origine 708×1068, pour que les vignettes tête + buste utilisent les mêmes
coordonnées de cadrage que l'image sur fond blanc.

    python3 scripts/plein.py                # tous les looks qui n'ont pas encore leur -plein
    python3 scripts/plein.py --force        # tout régénérer
"""
import argparse
import random
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public/images/personnages"


def locate(cut, ref):
    """Retrouve la position du détourage dans l'image d'origine (comparaison de pixels opaques)."""
    cw, ch = cut.size
    W, H = ref.size
    cp, rp = cut.load(), ref.load()
    opaque = [(x, y) for y in range(0, ch, 3) for x in range(0, cw, 3) if cp[x, y][3] == 255]
    # Pixels distinctifs (pas blancs) pour éviter les faux positifs
    colored = [p for p in opaque if sum(cp[p[0], p[1]][:3]) < 600]
    random.seed(1)
    probe = random.sample(colored, min(40, len(colored)))
    first = probe[0]
    best, best_score = None, -1
    for oy in range(0, H - ch + 1):
        for ox in range(0, W - cw + 1):
            a = cp[first[0], first[1]]
            b = rp[first[0] + ox, first[1] + oy]
            if abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) > 30:
                continue
            score = sum(
                1 for x, y in probe
                if sum(abs(u - v) for u, v in zip(cp[x, y][:3], rp[x + ox, y + oy][:3])) <= 30
            )
            if score > best_score:
                best, best_score = (ox, oy), score
                if score == len(probe):
                    return best, score / len(probe)
    return best, best_score / len(probe)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    for cut_path in sorted(ROOT.glob("*/*-cutout.png")):
        fam = cut_path.name.replace("-cutout.png", "")
        ref_path = cut_path.with_name(f"{fam}-blanc.png")
        out = cut_path.with_name(f"{fam}-plein.png")
        if not ref_path.exists() or (out.exists() and not args.force):
            continue
        cut = Image.open(cut_path).convert("RGBA")
        ref = Image.open(ref_path).convert("RGB")
        pos, conf = locate(cut, ref)
        full = Image.new("RGBA", ref.size, (0, 0, 0, 0))
        full.alpha_composite(cut, pos)
        full.save(out, optimize=True)
        flag = "" if conf > 0.9 else "  ⚠️ correspondance faible"
        print(f"{out.relative_to(ROOT)}  position {pos}  ({conf:.0%}){flag}")


if __name__ == "__main__":
    main()
