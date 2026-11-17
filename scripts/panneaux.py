#!/usr/bin/env python3
"""
Panneaux de manif de la famille Gaucho Facho, découpés dans les cartes, pour La Grande Course (obstacles).

    python3 scripts/panneaux.py

Pour chaque panneau de PANNEAUX : la pancarte (et le haut de son bâton) est découpée dans
<copain>/gochofacho-plein.png, les morceaux de main ou de tête qui dépassent sont effacés, puis le bâton est
prolongé jusqu'au sol (panneau planté). Sortie : public/images/jeu/panneaux/<copain>.png
+ src/data/panneaux.json (liste des fichiers, lue par le jeu).
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public/images/personnages"
OUT = ROOT / "public/images/jeu/panneaux"
DATA = ROOT / "src/data/panneaux.json"
HAUTEUR = 360  # px, comme les sprites du jeu
BOIS, TRAIT = (139, 94, 52, 255), (22, 20, 18, 255)

# copain : (cadre dans la carte x0, y0, x1, y1 en fractions), [zones à effacer en fractions du cadre], bord du bas à redessiner
PANNEAUX = {
    "guigui": ((0.15, 0.17, 0.44, 0.425), [(0.62, 0.78, 1, 1)]),
    "saby": ((0.34, 0.19, 0.53, 0.355), [(0.8, 0.82, 1, 1)]),
    # pancarte tenue à deux mains : coupée juste au-dessus des mains, bord du bas redessiné
    "turquet": ((0.38, 0.18, 0.65, 0.287), [], True),
    "szabo": ((0.65, 0.57, 0.98, 0.79), [(0, 0.8, 0.12, 1)]),
    "nael": ((0.43, 0.43, 0.66, 0.565), [(0, 0.72, 0.25, 1)]),
}


def baton(alpha):
    """Colonnes du bâton sur la dernière ligne opaque (le plus proche du centre), ou None."""
    for y in range(alpha.shape[0] - 1, alpha.shape[0] - 12, -1):
        row = alpha[y] > 128
        runs, x = [], 0
        while x < len(row):
            if row[x]:
                x0 = x
                while x < len(row) and row[x]:
                    x += 1
                runs.append((x0, x))
            x += 1
        runs = [r for r in runs if 4 <= r[1] - r[0] <= alpha.shape[1] * 0.2]
        if runs:
            c = alpha.shape[1] / 2
            return min(runs, key=lambda r: abs((r[0] + r[1]) / 2 - c)), y
    return None, alpha.shape[0] - 1


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    liste = []
    for slug, (cadre, effacer, *bord) in PANNEAUX.items():
        a, b, c, d = cadre
        im = Image.open(PUB / slug / "gochofacho-plein.png").convert("RGBA")
        W, H = im.size
        cr = im.crop((int(a * W), int(b * H), int(c * W), int(d * H)))
        w, h = cr.size
        dr = ImageDraw.Draw(cr)
        for x0, y0, x1, y1 in effacer:
            dr.rectangle((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)), fill=(0, 0, 0, 0))
        alpha = np.asarray(cr.getchannel("A"))
        if bord:
            cols = np.where(alpha[-1] > 128)[0]
            dr.line((cols.min(), h - 3, cols.max(), h - 3), fill=TRAIT, width=5)
            alpha = np.asarray(cr.getchannel("A"))
        run, ybas = baton(alpha) if not bord else (None, h - 1)
        # bâton prolongé jusqu'au sol : le panneau fait ~2,1 fois la hauteur de la pancarte
        ext = int(h * 1.1)
        out = Image.new("RGBA", (w, ybas + ext), (0, 0, 0, 0))
        x0, x1 = run if run else (int(w * 0.47), int(w * 0.53))
        bw = max(x1 - x0, 10)
        # bâton dessiné d'abord : la pancarte passe devant
        ImageDraw.Draw(out).rectangle((x0, ybas - (0 if run else int(h * 0.3)), x0 + bw, ybas + ext - 1), fill=BOIS, outline=TRAIT, width=max(2, bw // 6))
        out.alpha_composite(cr.crop((0, 0, w, ybas + 1)), (0, 0))
        bb = out.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        out = out.crop(bb)
        out = out.resize((round(out.width * HAUTEUR / out.height), HAUTEUR), Image.LANCZOS)
        out.save(OUT / f"{slug}.png", optimize=True)
        liste.append(f"images/jeu/panneaux/{slug}.png")
        print(slug, out.size)
    DATA.write_text(json.dumps(liste, indent=1))


if __name__ == "__main__":
    main()
