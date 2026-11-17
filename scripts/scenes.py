#!/usr/bin/env python3
"""
« Avec le décor de la carte » : le personnage ET les objets de sa carte (voiture, porte, canapé, bulle…),
sans le halo coloré du fond, pour les poser sur l'affiche.

    python3 scripts/scenes.py                       # toutes les cartes qui ont des objets de décor
    python3 scripts/scenes.py donne/botefragile ...  # seulement certaines

Pour chaque carte (<famille>-decor.webp) :
  1. le halo est retrouvé (même modèle que scripts/halos.py) et rendu transparent ;
  2. les lueurs du fond sans aucun trait sont retirées ; EFFACER enlève à la main ce qui reste
     (lumière du mur au-dessus de la porte de Guigui…) ;
  3. si la carte a assez d'objets en plus du personnage, <famille>-scene.png (recadré au plus près)
     est écrit, et src/data/scenes.json garde de quoi le caler sur le personnage seul :
     k  = hauteur de la scène / hauteur du détourage (-cutout) ;
     dx = décalage du centre, dy = décalage du bas, en hauteurs de détourage.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import halos  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public/images/personnages"
DATA = ROOT / "src/data/scenes.json"
# Part minimale de la carte occupée par des objets (hors personnage) pour proposer le décor
OBJETS_MIN = 0.03
# Rectangles à effacer (fractions de la carte : x0, y0, x1, y1)
EFFACER = {"guigui/botefragile": [(0.6, 0, 1, 0.2)]}
# Tenues dont le décor n'apporte presque rien (juste la bulle et l'ombre) : pas d'option « décor »
SANS = {"guigui/joystick"}


def bbox(alpha, seuil=24):
    return Image.fromarray(alpha).point(lambda v: 255 if v > seuil else 0).getbbox()


def scene(slug, fam):
    d = Image.open(PUB / slug / f"{fam}-decor.webp").convert("RGB")
    m = halos.ajuster(d, slug, fam)
    w, h = d.size
    a = np.asarray(d, dtype=np.float32)
    lisse = halos.evaluer(m["p"], halos.rayon(w, h, m["cx"], m["cy"], m["asp"]))
    al = np.clip((np.abs(lisse - a).max(2) - 10) / 20, 0, 1)
    dessin = halos.masque_dessin(slug, fam, (w, h))
    al[dessin] = 1
    # zones sans aucun trait (lueurs du fond) : retirées
    b = (al > 0.3).astype(np.uint8)
    n, lab, _, _ = cv2.connectedComponentsWithStats(b, 8)
    traits = np.bincount(lab[a.mean(2) < 80], minlength=n)
    garde = traits > 40
    garde[0] = False
    al = al * garde[lab]
    for x0, y0, x1, y1 in EFFACER.get(f"{slug}/{fam}", []):
        al[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 0
    alpha = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)))
    objets = ((alpha > 128) & ~dessin).mean()
    return d, alpha, objets


def main():
    seuls = sys.argv[1:]
    data = json.loads(DATA.read_text()) if DATA.exists() else {}
    for decor in sorted(PUB.glob("*/*-decor.webp")):
        slug, fam = decor.parent.name, decor.name.replace("-decor.webp", "")
        key = f"{slug}/{fam}"
        if seuls and key not in seuls:
            continue
        cutout = PUB / slug / f"{fam}-cutout.png"
        plein = PUB / slug / f"{fam}-plein.png"
        if not cutout.exists() or not plein.exists():
            continue
        sortie = PUB / slug / f"{fam}-scene.png"
        if key in SANS:
            data.pop(key, None)
            sortie.unlink(missing_ok=True)
            continue
        d, alpha, objets = scene(slug, fam)
        if objets < OBJETS_MIN:
            data.pop(key, None)
            sortie.unlink(missing_ok=True)
            continue
        out = d.convert("RGBA")
        out.putalpha(Image.fromarray(alpha))
        sb = bbox(alpha)
        out.crop(sb).save(sortie, optimize=True)
        pl = Image.open(plein).convert("RGBA").resize(d.size)
        cb = bbox(np.asarray(pl.getchannel("A")))
        ch = cb[3] - cb[1]
        data[key] = dict(
            src=f"images/personnages/{slug}/{fam}-scene.png",
            k=round((sb[3] - sb[1]) / ch, 4),
            dx=round(((sb[0] + sb[2]) - (cb[0] + cb[2])) / 2 / ch, 4),
            dy=round((sb[3] - cb[3]) / ch, 4),
        )
        print(f"{key:24s} décor proposé (objets {objets:.0%})")
    DATA.write_text(json.dumps(dict(sorted(data.items())), indent=1))


if __name__ == "__main__":
    main()
