#!/usr/bin/env python3
"""
Détourages (<famille>-plein.png / -cutout.png) corrigés d'après la carte avec décor (<famille>-decor.webp,
déjà nettoyée par scripts/trous-fond.py) :
  - trou blanc resté opaque (entre les jambes, entre un bras et le corps) : il est coloré sur la carte → transparent ;
  - blanc du dessin rendu transparent par erreur (cheveux blancs de Panoramix…) : il est blanc sur la carte alors
    que le fond y est coloré → rendu opaque, avec la couleur de la carte.
Seulement pour les cartes qui ont un original (sinon la carte vient du détourage lui-même : rien à comparer).

    python3 scripts/plein-trous.py [copain/famille ...]
Puis : python3 scripts/jeu-sprites.py
"""
import importlib.util
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import halos  # noqa: E402

spec = importlib.util.spec_from_file_location("trous_fond", Path(__file__).resolve().parent / "trous-fond.py")
trous_fond = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trous_fond)

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public/images/personnages"
SRC = ROOT / "sources/personnages"
# Tenues aux cheveux blancs en mèches : le blanc manquant est repris même au bord de la silhouette
CHEVEUX = {"dauby/gaulois"}
# Rectangles (fractions de la carte) où le dessin transparent est rendu opaque d'après la carte
FORCER = {"lenoir/ludick": [(0.32, 0.355, 0.43, 0.43)]}
# Rectangles où le blanc opaque est un trou (carte d'origine trop pâle pour le voir : Izi Karaté)
VIDER = {"turquet/izikarate": [(0.44, 0.6, 0.58, 0.87)]}


def corriger(slug, fam):
    plein_f = PUB / slug / f"{fam}-plein.png"
    decor = Image.open(PUB / slug / f"{fam}-decor.webp").convert("RGB")
    plein = Image.open(plein_f).convert("RGBA")
    if plein.size != decor.size:
        decor = decor.resize(plein.size, Image.LANCZOS)
    w, h = plein.size
    p = np.asarray(plein).astype(np.float32)
    d = np.asarray(decor, dtype=np.float32)
    al = p[..., 3]
    m = halos.ajuster(decor, slug, fam)
    lisse = halos.evaluer(m["p"], halos.rayon(w, h, m["cx"], m["cy"], m["asp"]))
    fond_colore = lisse.min(2) < 232
    blanc_d = (d.min(2) >= 236) & (d.max(2) - d.min(2) < 12)
    # coloré sur la carte : pas blanc, et d'une couleur (pas un trait gris) — le fond, ou proche du fond
    colore_d = fond_colore & ~blanc_d & (d.max(2) - d.min(2) > 8) & (np.abs(d - lisse).max(2) < 30)

    # 1. trous blancs opaques du détourage, colorés sur la carte
    blanc_p = ((al > 128) & (p[..., :3].min(2) >= 240)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(blanc_p, 8)
    part = np.bincount(lab[colore_d], minlength=n) / np.maximum(st[:, cv2.CC_STAT_AREA], 1)
    trou = (part > 0.7) & (st[:, cv2.CC_STAT_AREA] >= 10)
    trou[0] = False
    vider = cv2.dilate(trou[lab].astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    vider &= p[..., :3].min(2) >= 200

    # 2. blanc du dessin devenu transparent : blanc sur la carte, fond coloré, tout près de la silhouette
    opaque = (al > 128).astype(np.uint8)
    pres = cv2.dilate(opaque, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))) > 0
    # blanc ou gris neutre (cheveux blancs et leurs traits) bien différent du fond coloré
    neutre = (d.max(2) - d.min(2) < 14) & (d.min(2) >= 200) & (np.abs(d - lisse).max(2) > 25)
    manque = ((al < 230) & neutre & fond_colore & pres).astype(np.uint8)
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(manque, 8)
    # seulement les zones presque entourées par le dessin (entre deux mèches), pas un liseré autour de la silhouette
    anneau = cv2.dilate(manque, np.ones((3, 3), np.uint8)) & (1 - manque)
    autour = np.bincount(lab2[anneau > 0], weights=(al[anneau > 0] > 128).astype(float), minlength=n2)
    total = np.bincount(lab2[anneau > 0], minlength=n2)
    # cheveux blancs ébouriffés (mèches ouvertes vers l'extérieur) : pas besoin d'être entouré
    entoure = -1.0 if f"{slug}/{fam}" in CHEVEUX else 0.75
    garde = (st2[:, cv2.CC_STAT_AREA] >= 15) & (autour / np.maximum(total, 1) > entoure)
    garde[0] = False
    remplir = garde[lab2]

    # 3. zone transparente ou à moitié, enfermée dans le dessin (pas reliée au bord de l'image), alors que la
    #    carte y montre du dessin (loin du fond) : masque de Lenoir, etc. → opaque
    clair = (al < 230).astype(np.uint8)
    n3, lab3, st3, _ = cv2.connectedComponentsWithStats(clair, 4)
    bord = np.zeros(n3, bool)
    bord[np.unique(np.concatenate([lab3[0], lab3[-1], lab3[:, 0], lab3[:, -1]]))] = True
    ecart = np.bincount(lab3.ravel(), weights=np.abs(d - lisse).max(2).ravel(), minlength=n3) / np.maximum(st3[:, cv2.CC_STAT_AREA], 1)
    enferme = ~bord & (ecart > 35) & (st3[:, cv2.CC_STAT_AREA] >= 15)
    enferme[0] = False
    remplir |= enferme[lab3] & ~vider
    # zones signalées à la main (dessin transparent ouvert sur l'extérieur : masque de Lenoir)
    for x0, y0, x1, y1 in FORCER.get(f"{slug}/{fam}", []):
        z = np.zeros_like(remplir)
        z[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = True
        remplir |= z & (al < 230) & (np.abs(d - lisse).max(2) > 35)

    if f"{slug}/{fam}" in VIDER:
        # zones blanches (séparées du dessin par un trait) presque entièrement dans le rectangle
        blanc_v = ((al > 0) & (p[..., :3].min(2) >= 232)).astype(np.uint8)
        nv, labv, stv, _ = cv2.connectedComponentsWithStats(blanc_v, 4)
        for x0, y0, x1, y1 in VIDER[f"{slug}/{fam}"]:
            z = np.zeros(al.shape, bool)
            z[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = True
            dedans = np.bincount(labv[z], minlength=nv) / np.maximum(stv[:, cv2.CC_STAT_AREA], 1)
            ok = dedans > 0.8
            ok[0] = False
            vider |= ok[labv]

    if not vider.any() and not remplir.any():
        return 0, 0
    out = p.copy()
    out[vider, 3] = 0
    out[remplir, :3] = d[remplir]
    out[remplir, 3] = 255
    res = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    res.save(plein_f, optimize=True)
    bb = res.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    res.crop(bb).save(PUB / slug / f"{fam}-cutout.png", optimize=True)
    # illustration sur fond blanc (vignettes) assortie
    blanc = Image.new("RGBA", res.size, (255, 255, 255, 255))
    blanc.alpha_composite(res)
    if (PUB / slug / f"{fam}-blanc.png").exists():
        blanc.save(PUB / slug / f"{fam}-blanc.png", optimize=True)
    return int(vider.sum()), int(remplir.sum())


def main():
    seuls = sys.argv[1:]
    sources = set(json.loads((SRC / "cartes.json").read_text())) | set(trous_fond.AUTRES)
    for key in sorted(sources):
        slug, fam = key.split("/")
        if seuls and key not in seuls:
            continue
        if not (PUB / slug / f"{fam}-plein.png").exists() or not (PUB / slug / f"{fam}-decor.webp").exists():
            continue
        v, r = corriger(slug, fam)
        if v or r:
            print(f"{key:24s} {v} px rendus transparents, {r} px rendus opaques")


if __name__ == "__main__":
    main()
