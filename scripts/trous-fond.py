#!/usr/bin/env python3
"""
Trous blancs dans les cartes avec décor (<famille>-decor.webp) : entre un bras et le corps, sous une canne à pêche…

Quand une tenue est passée en HD, le dessin détouré (-plein.png) est reposé sur la carte : ses zones blanches
enfermées (le fond blanc d'origine, que le détourage ne pouvait pas atteindre) recouvrent alors la couleur de la
carte. On compare donc chaque carte à sa carte d'origine (sources/personnages/cartes.json, ou la version
« avec fond » fournie) : une zone blanche de la carte installée qui était colorée sur l'original est un trou,
recoloré avec le dégradé du halo (scripts/halos.py). Les vrais blancs du dessin (t-shirt, yeux, bulle) sont
blancs aussi sur l'original : ils ne bougent pas.

Deux autres retouches, pour toutes les cartes :
  - bulles (<famille>-bulle.png) : l'intérieur prend la couleur du fond (plus de traces blanches autour du texte) ;
  - cartes sans original (Momo, cartes fabriquées) : les fines bandes blanches enfermées (entre un pied de micro
    et son fil…) sont recolorées.

    python3 scripts/trous-fond.py                      # toutes les cartes
    python3 scripts/trous-fond.py theo/branquignol ...  # seulement certaines
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import decors  # noqa: E402
import halos  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public/images/personnages"
SRC = ROOT / "sources/personnages"
# Cartes fournies directement « avec fond » (pas dans cartes.json)
AUTRES = {
    "coco/mignon": "coco/originaux/minion.png",
    "dauby/mignon": "dauby/originaux/minion.png",
    "merlot/mignon": "merlot/originaux/minion.png",
    "coco/beauf": "coco/originaux/beauf-fond.png",
    "fred/beauf": "fred/originaux/beauf-fond.png",
}
BLANC = 244  # au-dessus (sur les trois canaux) : blanc
AIRE_MIN = 10  # px (carte HD) : en dessous, on ne touche pas (reflets, pointillés)


def bulle(slug, fam, w, h):
    """Intérieur de la bulle (hors texte et contour), ou None."""
    f = PUB / slug / f"{fam}-bulle.png"
    if not f.exists():
        return None
    al = np.asarray(Image.open(f).convert("RGBA").getchannel("A").resize((w, h), Image.BILINEAR))
    trait = (al > 20).astype(np.uint8)
    # intérieur = ce qui n'est pas relié au bord de l'image une fois les traits posés
    dehors = np.zeros((h + 2, w + 2), np.uint8)
    rempli = trait.copy()
    cv2.floodFill(rempli, dehors, (0, 0), 1)
    interieur = (rempli == 0)
    texte = cv2.dilate(trait, np.ones((3, 3), np.uint8)) > 0
    return interieur & ~texte


def bandes(a, slug, fam):
    """Fines bandes blanches enfermées dans le dessin (carte sans original)."""
    blanc = (a.min(2) >= 248).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(blanc, 8)
    dist = cv2.distanceTransform(blanc, cv2.DIST_L2, 3)
    larg = np.zeros(n)
    np.maximum.at(larg, lab.ravel(), dist.ravel())
    h, w = blanc.shape
    bord = np.zeros(n, bool)
    bord[np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))] = True
    long = np.maximum(st[:, cv2.CC_STAT_WIDTH], st[:, cv2.CC_STAT_HEIGHT])
    ok = (larg <= 5) & (long >= 60) & ~bord & (st[:, cv2.CC_STAT_AREA] >= 20)
    ok[0] = False
    return ok[lab]


def corriger(key, original):
    slug, fam = key.split("/")
    chemin = PUB / slug / f"{fam}-decor.webp"
    d = Image.open(chemin).convert("RGB")
    w, h = d.size
    a = np.asarray(d, dtype=np.float32)
    m = halos.ajuster(d, slug, fam)
    lisse = halos.evaluer(m["p"], halos.rayon(w, h, m["cx"], m["cy"], m["asp"]))
    total = 0
    b = bulle(slug, fam, w, h)
    if b is not None and b.any():
        poids = cv2.GaussianBlur(b.astype(np.float32), (0, 0), 1.5)
        a = a * (1 - poids[..., None]) + lisse * poids[..., None]
        total += int(b.sum())
    if original is None:
        masque = bandes(a, slug, fam)
        if masque.any():
            masque = cv2.dilate(masque.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
            poids = np.clip((a.min(2) - 200) / (BLANC - 200), 0, 1) * masque
            a = a * (1 - poids[..., None]) + lisse * poids[..., None]
            total += int(masque.sum())
        if total:
            Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(chemin, quality=90, method=6)
        return total
    o = np.asarray(decors.carte(original).resize((w, h), Image.LANCZOS), dtype=np.float32)
    blanc = (a.min(2) >= BLANC).astype(np.uint8)
    # coloré sur l'original, même à 3 px près (le dessin peut être décalé d'un ou deux pixels)
    # coloré sur l'original ET de la couleur du fond à cet endroit (un blanc du dessin légèrement teinté,
    # comme des voiles ou un masque, reste un blanc du dessin)
    colore = (o.min(2) < 236) & (o.max(2) - o.min(2) > 10) & (np.abs(o - lisse).max(2) < 30)
    colore = cv2.erode(colore.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(blanc, 8)
    part = np.bincount(lab[colore], minlength=n) / np.maximum(st[:, cv2.CC_STAT_AREA], 1)
    trou = (part > 0.6) & (st[:, cv2.CC_STAT_AREA] >= AIRE_MIN)
    trou[0] = False
    masque = trou[lab]
    if not masque.any():
        if total:
            Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(chemin, quality=90, method=6)
        return total
    # couleur du fond à cet endroit : celle de l'original, lissée (le halo est un dégradé doux)
    fond = np.where(np.abs(o - lisse).max(2, keepdims=True) < 40, o, lisse)
    fond = cv2.GaussianBlur(fond, (0, 0), 3)
    masque = cv2.dilate(masque.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    # bord du trou : on ne recolore que le blanc (le trait noir voisin reste net)
    poids = np.clip((a.min(2) - 200) / (BLANC - 200), 0, 1) * masque
    r = a * (1 - poids[..., None]) + fond * poids[..., None]
    Image.fromarray(r.clip(0, 255).astype(np.uint8)).save(chemin, quality=90, method=6)
    return total + int(masque.sum())


def main():
    seuls = sys.argv[1:]
    sources = {k: SRC / v for k, v in json.loads((SRC / "cartes.json").read_text()).items()}
    sources.update({k: SRC / v for k, v in AUTRES.items()})
    for decor in sorted(PUB.glob("*/*-decor.webp")):
        key = f"{decor.parent.name}/{decor.name.replace('-decor.webp', '')}"
        if seuls and key not in seuls:
            continue
        original = sources.get(key)
        n = corriger(key, original if original and original.exists() else None)
        if n:
            print(f"{key:24s} {n} px de trous recolorés")


if __name__ == "__main__":
    main()
