#!/usr/bin/env python3
"""
Cartes d'origine avec leur décor (porte, voiture, dégradé…) pour la fiche personnage.

Les cartes déposées dans un dossier (par défaut public/images/autres/, non publié) sont :
  1. reconnues : on retrouve le copain et la famille en comparant au <famille>-blanc.png
     de chaque tenue (même dessin, même cadre) ;
  2. recadrées au cadre 708×1068 des autres images (la vidéo s'y superpose au pixel près) ;
  3. nettoyées : le nom du rôle en bas de carte (« L'ONCLE »…) est effacé ;
  4. installées en public/images/personnages/<copain>/<famille>-decor.webp
     (l'original part dans sources/personnages/<copain>/decor/<famille>.png).

    python3 scripts/decors.py                     # tout le dossier public/images/autres
    python3 scripts/decors.py dossier/ carte.png  # d'autres fichiers / dossiers
    python3 scripts/decors.py --essai ...         # affiche la reconnaissance sans rien écrire
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public/images/personnages"
SRC = ROOT / "sources/personnages"
W, H = 708, 1068
# Zone du nom du rôle : bas de carte, sous les pieds du personnage
TITRE_Y = 0.80
# En dessous de ce score (écart moyen sur le dessin, 0–255), la reconnaissance est jugée sûre
SEUIL = 28


def gris(im, size):
    return np.asarray(im.convert("L").resize(size, Image.BILINEAR), dtype=np.float32)


def carte(path):
    """Ouvre la carte et la ramène au cadre 708×1068 (bords unis retirés si le format diffère)."""
    im = Image.open(path).convert("RGB")
    ratio = im.width / im.height
    if abs(ratio - W / H) > 0.02:
        # Capture d'écran : on garde la zone non unie autour de la carte
        a = np.asarray(im.convert("L"), dtype=np.int16)
        fond = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]))
        ys, xs = np.where(np.abs(a - fond) > 18)
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    return im.resize((W, H), Image.LANCZOS)


def references():
    refs = {}
    for f in sorted(PUB.glob("*/*-blanc.png")):
        im = Image.open(f).convert("RGB")
        small = gris(im, (W // 6, H // 6))
        refs[(f.parent.name, f.name.replace("-blanc.png", ""))] = (small, small < 235)
    return refs


def reconnaitre(im, refs):
    small = gris(im, (W // 6, H // 6))
    scores = []
    for key, (ref, mask) in refs.items():
        # Petit jeu de décalages : la carte peut être recadrée de quelques pixels
        best = min(
            np.abs(np.roll(small, (dy, dx), (0, 1))[mask] - ref[mask]).mean()
            for dy in (-2, -1, 0, 1, 2)
            for dx in (-2, -1, 0, 1, 2)
        )
        scores.append((best, key))
    scores.sort()
    return scores[0], scores[1]


def effacer_titre(im, blanc):
    """Efface le texte du bas : pixels sombres hors du dessin (blanc) sous TITRE_Y, remplacés par le fond."""
    a = np.asarray(im, dtype=np.float32).copy()
    b = np.asarray(blanc.convert("L"), dtype=np.float32)
    g = a.mean(axis=2)
    y0 = int(H * TITRE_Y)
    zone = np.zeros_like(g, dtype=bool)
    zone[y0:] = True
    texte = zone & (g < 200) & (b > 245)
    m = Image.fromarray((texte * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
    texte = np.asarray(m) > 0
    # Fond de remplacement : médiane de chaque ligne hors texte (dégradés horizontaux conservés)
    for y in np.where(texte.any(axis=1))[0]:
        row = a[y]
        ok = ~texte[y]
        if ok.sum() < 10:
            continue
        xs = np.arange(W)
        for c in range(3):
            row[~ok, c] = np.interp(xs[~ok], xs[ok], row[ok, c])
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    essai = "--essai" in sys.argv
    entrees = [Path(a) for a in args] or [ROOT / "public/images/autres"]
    fichiers = []
    for e in entrees:
        fichiers += sorted(p for p in e.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")) if e.is_dir() else [e]
    refs = references()
    for f in fichiers:
        im = carte(f)
        (score, key), (score2, key2) = reconnaitre(im, refs)
        slug, fam = key
        sur = score < SEUIL and score2 - score > 4
        print(f"{f.name:28s} → {slug}/{fam}  (écart {score:.0f}, suivant {key2[0]}/{key2[1]} {score2:.0f}){'' if sur else '  ⚠ pas sûr, ignoré'}")
        if essai or not sur:
            continue
        (SRC / slug / "decor").mkdir(parents=True, exist_ok=True)
        Image.open(f).save(SRC / slug / "decor" / f"{fam}.png")
        propre = effacer_titre(im, Image.open(PUB / slug / f"{fam}-blanc.png"))
        propre.save(PUB / slug / f"{fam}-decor.webp", quality=90, method=6)


if __name__ == "__main__":
    main()
