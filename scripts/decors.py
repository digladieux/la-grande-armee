#!/usr/bin/env python3
"""
Cartes d'origine avec leur décor (porte, voiture, dégradé…) pour la fiche personnage.

Les cartes déposées dans un dossier (par défaut public/images/autres/, non publié) sont :
  1. reconnues : on retrouve le copain et la famille en comparant au <famille>-blanc.png
     de chaque tenue (même dessin, même cadre) ;
  2. recadrées au cadre 708×1068 des autres images (la vidéo s'y superpose au pixel près) ;
  3. nettoyées : le titre « Famille … » en haut et le nom du rôle en bas (« L'ONCLE »…) sont effacés
     (la fiche affiche déjà la famille dans son encart) ;
  4. installées en public/images/personnages/<copain>/<famille>-decor.webp
     (une carte encore inconnue est rangée dans sources/personnages/<copain>/cartes/ et ajoutée
     à sources/personnages/cartes.json ; une carte déjà connue n'est pas recopiée).

    python3 scripts/decors.py                     # tout le dossier public/images/autres
    python3 scripts/decors.py dossier/ carte.png  # d'autres fichiers / dossiers
    python3 scripts/decors.py --essai ...         # affiche la reconnaissance sans rien écrire
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public/images/personnages"
SRC = ROOT / "sources/personnages"
CARTES = SRC / "cartes.json"
W, H = 708, 1068
# Bande du nom du rôle, en bas de carte (même place sur toutes les cartes)
ROLE = (940, 1036)
# Haut de carte où se trouve le titre « Famille … » (jusqu'à deux lignes)
FAMILLE_Y = 270
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


def dilater(mask, n):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(n))) > 0


def personnage(slug, fam):
    """Masque du personnage dessiné (détourage -plein.png, à défaut l'illustration -blanc.png)."""
    plein = PUB / slug / f"{fam}-plein.png"
    if plein.exists():
        return dilater(np.asarray(Image.open(plein).convert("RGBA"))[..., 3] > 0, 5)
    return np.asarray(Image.open(PUB / slug / f"{fam}-blanc.png").convert("L")) < 235


def titre_famille(cartes):
    """Le titre « Famille … » est identique sur toutes les cartes d'une famille : pixels sombres
    communs à la plupart d'entre elles, en haut de carte (le décor, propre à chaque carte, n'y est pas)."""
    sombre = np.stack([np.asarray(c.convert("L"))[:FAMILLE_Y] < 140 for c in cartes])
    commun = sombre.mean(axis=0) >= 0.6
    mask = np.zeros((H, W), dtype=bool)
    mask[:FAMILLE_Y] = commun
    return mask


def recaler(mask, im):
    """Décale le masque du titre (quelques px) pour coller au titre de cette carte-ci, puis l'élargit
    pour couvrir l'anticrénelage des lettres."""
    if not mask.any():
        return mask
    sombre = np.asarray(im.convert("L")) < 140
    best = max(
        ((np.roll(mask, (dy, dx), (0, 1)) & sombre).sum(), dy, dx)
        for dy in range(-10, 11, 2)
        for dx in range(-10, 11, 2)
    )
    return dilater(np.roll(mask, best[1:], (0, 1)), 11)


def effacer_titre(im, perso, famille):
    """Efface le titre de famille (masque commun) et le nom du rôle (bande du bas), hors personnage."""
    a = np.asarray(im, dtype=np.float32).copy()
    g = a.mean(axis=2)
    role = np.zeros((H, W), dtype=bool)
    role[ROLE[0]:ROLE[1]] = g[ROLE[0]:ROLE[1]] < 170
    texte = (famille | dilater(role, 9)) & ~perso
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
    cartes = json.loads(CARTES.read_text())
    faites = set()
    for f in fichiers:
        im = carte(f)
        (score, key), (score2, key2) = reconnaitre(im, refs)
        slug, fam = key
        sur = score < SEUIL and score2 - score > 4
        print(f"{f.name:28s} → {slug}/{fam}  (écart {score:.0f}, suivant {key2[0]}/{key2[1]} {score2:.0f}){'' if sur else '  ⚠ pas sûr, ignoré'}")
        if essai or not sur:
            continue
        if key in faites:
            print(f"  (déjà fournie par un autre fichier, ignorée)")
            continue
        connue = cartes.get(f"{slug}/{fam}")
        if not (connue and np.array_equal(np.asarray(carte(SRC / connue)), np.asarray(im))):
            dst = SRC / slug / "cartes" / f"{f.stem.replace(' ', '-')}.png"
            dst.parent.mkdir(parents=True, exist_ok=True)
            Image.open(f).save(dst)
            cartes[f"{slug}/{fam}"] = str(dst.relative_to(SRC))
            print(f"  nouvelle carte → {dst.relative_to(ROOT)}")
        faites.add(key)
    if not essai:
        CARTES.write_text(json.dumps(cartes, indent=1, ensure_ascii=False) + "\n")
    # Nettoyage, famille par famille (le titre de famille se déduit de toutes ses cartes)
    for fam in sorted({k[1] for k in faites}):
        originaux = {k.split("/")[0]: carte(SRC / v) for k, v in sorted(cartes.items()) if k.split("/")[1] == fam}
        famille = titre_famille(list(originaux.values())) if len(originaux) >= 3 else np.zeros((H, W), dtype=bool)
        if len(originaux) < 3:
            print(f"⚠ {fam} : moins de 3 cartes, titre de famille non effacé")
        for slug, im in originaux.items():
            if (slug, fam) not in faites:
                continue
            propre = effacer_titre(im, personnage(slug, fam), recaler(famille, im))
            propre.save(PUB / slug / f"{fam}-decor.webp", quality=90, method=6)


if __name__ == "__main__":
    main()
