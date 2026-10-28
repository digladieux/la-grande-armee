#!/usr/bin/env python3
"""
Accessoires de l'affiche (et du jeu) : détourage des dessins fournis sur fond blanc.

Les fichiers « accesoire_<nom>.png » (ou « accessoire_… ») déposés dans public/images/autres/
(non publié) sont :
  1. rangés tels quels dans sources/accessoires/<nom>.png ;
  2. détourés : le blanc pur devient transparent (fond, trou de l'anse…) ; la mousse ou les
     reflets, gris très clair, restent ; le bord du trait est adouci (trait sur blanc → trait
     semi-transparent, sans liseré blanc) ;
  3. recadrés au plus près et installés en public/images/accessoires/<nom>.png.

Le nom est mis en minuscules avec tirets : « elephantDelirium » → « elephant-delirium ».

    python3 scripts/accessoires.py                 # tout public/images/autres/accesoire_*
    python3 scripts/accessoires.py fichier.png ... # d'autres fichiers
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "sources/accessoires"
PUB = ROOT / "public/images/accessoires"
# Au-dessus de ce niveau (sur les trois canaux), un pixel est du blanc de fond
BLANC = 250
MARGE = 4


def nom(path):
    base = re.sub(r"^acc?es?soire_", "", path.stem, flags=re.I)
    return re.sub(r"(?<=[a-z])(?=[A-Z])", "-", base).replace("_", "-").replace(" ", "-").lower()


def detourer(im):
    a = np.asarray(im.convert("RGB"), dtype=np.float32)
    blanc = a.min(axis=2) >= BLANC
    alpha = (~blanc).astype(np.float32)
    # Bord du dessin : pixel mêlé de blanc → couleur du trait, opacité selon sa part de blanc
    voisin = np.asarray(Image.fromarray((blanc * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    bord = voisin & ~blanc
    encre = 34.0
    lum = a.min(axis=2)
    alpha[bord] = np.clip((255 - lum[bord]) / (255 - encre), 0, 1)
    rgb = a.copy()
    k = np.maximum(alpha[bord], 1e-3)[:, None]
    rgb[bord] = np.clip((a[bord] - 255 * (1 - k)) / k, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    ys, xs = np.where(alpha > 0.05)
    y0, y1 = max(ys.min() - MARGE, 0), min(ys.max() + MARGE + 1, out.shape[0])
    x0, x1 = max(xs.min() - MARGE, 0), min(xs.max() + MARGE + 1, out.shape[1])
    return Image.fromarray(out[y0:y1, x0:x1])


def main():
    fichiers = [Path(a) for a in sys.argv[1:]] or sorted(
        p for p in (ROOT / "public/images/autres").iterdir() if re.match(r"acc?es?soire_", p.name, re.I)
    )
    SRC.mkdir(parents=True, exist_ok=True)
    PUB.mkdir(parents=True, exist_ok=True)
    for f in fichiers:
        n = nom(f)
        im = Image.open(f)
        im.save(SRC / f"{n}.png")
        d = detourer(im)
        d.save(PUB / f"{n}.png", optimize=True)
        print(f"{f.name} → images/accessoires/{n}.png  ({d.width}×{d.height})")


if __name__ == "__main__":
    main()
