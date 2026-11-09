#!/usr/bin/env python3
"""
Halo des cartes lissé : le fond coloré de chaque carte (<famille>-decor.webp) est remplacé par un dégradé
radial parfaitement régulier, ajusté sur ses propres couleurs, et le fond prolongé (<famille>-fond.webp)
est recalculé avec le même dégradé (plus de marques ni de cadre visible autour du halo).

    python3 scripts/halos.py                  # toutes les cartes (et celles qui n'ont pas encore de fond)
    python3 scripts/halos.py dauby/troubadour  # seulement certaines

Seuls les pixels de fond proches du dégradé sont remplacés (fondu doux) : le dessin, les bulles et les
éléments de décor (voiture, canapé, golf…) restent tels quels.

Une tenue sans carte d'origine (pas de -decor.webp) reçoit une carte fabriquée : le dégradé d'une autre carte
de la même famille, sinon la couleur de la famille (src/data/families.ts) avec un halo blanc au centre,
et le dessin HD (-plein.png) posé dessus.
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public/images/personnages"
W, H = 708, 1068  # cadre des cartes (basse définition)
ECHELLE = 8
MARGE_X, MARGE_Y, ESTOMPE = 1.5, 1.0, 0.9  # comme scripts/decors.py
TOLERANCE = 46  # écart (0–255) au dégradé en dessous duquel un pixel est du fond à lisser
# Carte dont le fond n'est pas qu'un halo (mur, sol…) : tolérance réduite, pour ne pas étaler le décor
SCORE_DECOR, TOLERANCE_DECOR = 8, 22
NB = 48  # pas du profil radial
REFERENCE = "capdag"  # halo modèle pour une famille sans aucune carte

COULEURS = dict(re.findall(r"'?([a-z-]+)'?: \{ name: '[^']+', color: '[a-z]+', bg: '(#[0-9A-Fa-f]{6})'", (ROOT / "src/data/families.ts").read_text()))


def rayon(w, h, cx, cy, asp):
    """Distance elliptique au centre du halo (en largeurs de carte)."""
    x = (np.arange(w)[None, :] + 0.5) / w
    y = (np.arange(h)[:, None] + 0.5) / h * (H / W)
    return np.sqrt((x - cx) ** 2 + ((y - cy * H / W) / asp) ** 2)


def profil(r, couleurs, poids):
    """Couleur moyenne par anneau, comblée et lissée (régulière)."""
    rmax = 1.6
    b = np.clip((r / rmax * NB).astype(int), 0, NB - 1)
    p = np.zeros((NB, 3))
    for c in range(3):
        s = np.bincount(b[poids], couleurs[..., c][poids], NB)
        n = np.bincount(b[poids], minlength=NB)
        p[:, c] = np.where(n > 3, s / np.maximum(n, 1), np.nan)
    ok = ~np.isnan(p[:, 0])
    if ok.sum() < 4:
        return None
    i = np.arange(NB)
    for c in range(3):
        p[:, c] = np.interp(i, i[ok], p[ok, c])  # au-delà des données : valeur du dernier anneau
    k = np.array([1, 4, 6, 4, 1], float); k /= k.sum()
    for _ in range(3):
        p = np.stack([np.convolve(np.pad(p[:, c], 2, mode="edge"), k, "valid") for c in range(3)], 1)
    return p


def evaluer(p, r):
    rmax = 1.6
    t = np.clip(r / rmax * NB - 0.5, 0, NB - 1)
    i0 = np.floor(t).astype(int); i1 = np.minimum(i0 + 1, NB - 1); f = (t - i0)[..., None]
    return p[i0] * (1 - f) + p[i1] * f


def masque_dessin(slug, fam, size):
    plein = PUB / slug / f"{fam}-plein.png"
    if not plein.exists():
        return np.zeros(size[::-1], bool)
    a = Image.open(plein).getchannel("A").resize(size, Image.BILINEAR)
    return np.asarray(a.filter(ImageFilter.MaxFilter(5))) > 10


def ajuster(decor, slug, fam):
    """Centre, allongement et profil du halo qui collent le mieux au fond de la carte."""
    w, h = W // ECHELLE * 2, H // ECHELLE * 2
    a = np.asarray(decor.convert("RGB").resize((w, h), Image.BOX), dtype=np.float32)
    lum = a.mean(2)
    L = Image.fromarray(lum.astype(np.uint8))
    detail = np.abs(lum - np.asarray(L.filter(ImageFilter.BoxBlur(2)), dtype=np.float32))
    var = np.asarray(Image.fromarray(detail.clip(0, 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))
    fond = ~masque_dessin(slug, fam, (w, h)) & (var < 6)
    best = None
    for cx in (0.46, 0.5, 0.54):
        for cy in (0.42, 0.47, 0.52, 0.57, 0.62):
            for asp in (1.0, 1.2, 1.45, 1.7):
                r = rayon(w, h, cx, cy, asp)
                p = profil(r, a, fond)
                if p is None:
                    continue
                e = np.abs(evaluer(p, r) - a).max(2)
                # robuste : on ignore les pixels de décor (très loin du dégradé)
                score = np.mean(np.minimum(e[fond], 40))
                if best is None or score < best[0]:
                    best = (score, cx, cy, asp)
    score, cx, cy, asp = best
    r = rayon(w, h, cx, cy, asp)
    p = profil(r, a, fond)
    # second passage sans les pixels de décor
    e = np.abs(evaluer(p, r) - a).max(2)
    p = profil(r, a, fond & (e < TOLERANCE)) if (fond & (e < TOLERANCE)).sum() > 50 else p
    return dict(cx=cx, cy=cy, asp=asp, p=p, score=score)


def fond_prolonge(m):
    """Fond étendu autour de la carte (même cadre que scripts/decors.py), même dégradé, estompé vers le blanc."""
    w, h = W // ECHELLE, H // ECHELLE
    mx, my = round(w * MARGE_X), round(h * MARGE_Y)
    X = (np.arange(w + 2 * mx)[None, :] - mx + 0.5) / w
    Y = (np.arange(h + 2 * my)[:, None] - my + 0.5) / h
    r = np.sqrt((X - m["cx"]) ** 2 + ((Y - m["cy"]) * H / W / m["asp"]) ** 2)
    c = evaluer(m["p"], r)
    dx = np.maximum(np.maximum(-X, X - 1), 0)
    dy = np.maximum(np.maximum(-Y, Y - 1), 0) * H / W
    garde = np.exp(-((dx * dx + dy * dy) / ESTOMPE ** 2))[..., None]
    return Image.fromarray((255 - (255 - c) * garde).clip(0, 255).astype(np.uint8))


def lisser(slug, fam, m=None):
    chemin = PUB / slug / f"{fam}-decor.webp"
    decor = Image.open(chemin).convert("RGB")
    m = m or ajuster(decor, slug, fam)
    w, h = decor.size
    a = np.asarray(decor, dtype=np.float32)
    lisse = evaluer(m["p"], rayon(w, h, m["cx"], m["cy"], m["asp"]))
    e = np.abs(lisse - a).max(2)
    tol = TOLERANCE if m.get("score", 0) < SCORE_DECOR else TOLERANCE_DECOR
    if m.get("score", 0) < SCORE_DECOR:
        # près des bords, l'ancien nettoyage a éclairci le fond : tolérance doublée dans une bande de 8 %,
        # pour que le bord de la carte rejoigne exactement le fond prolongé (pas de cassure dans la fiche)
        X = np.arange(w)[None, :] / w
        Y = np.arange(h)[:, None] / h
        bord = np.minimum(np.minimum(X, 1 - X), np.minimum(Y, 1 - Y) * h / w)
        tol = tol * (1 + np.clip(1 - bord / 0.08, 0, 1))
    poids = np.clip((tol - e) / (tol * 0.5), 0, 1)
    poids[masque_dessin(slug, fam, (w, h))] = 0
    # ombres au sol (gris neutres plus sombres que le halo) : elles font partie du dessin
    ombre = (a.max(2) - a.min(2) < 14) & (a.mean(2) < lisse.mean(2) - 10)
    poids[ombre] = 0
    poids = np.asarray(Image.fromarray((poids * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), dtype=np.float32)[..., None] / 255
    r = a * (1 - poids) + lisse * poids
    Image.fromarray(r.clip(0, 255).astype(np.uint8)).save(chemin, quality=90, method=6)
    fond_prolonge(m).save(PUB / slug / f"{fam}-fond.webp", quality=85)
    return m


def fabriquer(slug, fam, modeles):
    """Carte sans original : dégradé de la famille + dessin HD."""
    plein = Image.open(PUB / slug / f"{fam}-plein.png").convert("RGBA")
    m = modeles.get(fam)
    if m is None:
        # aucune carte de la famille : forme du halo d'une carte de référence (blanc au centre, anneau
        # coloré, bords plus pâles), recolorée à la couleur de la famille
        ref = modeles.get(REFERENCE) or next(iter(modeles.values()))
        intensite = (255 - ref["p"]).mean(1)
        s = intensite / intensite.max()
        c = np.array([int(COULEURS[fam][i:i + 2], 16) for i in (1, 3, 5)], float)
        m = dict(ref, p=255 - (255 - c)[None, :] * s[:, None])
    w, h = plein.size
    base = Image.fromarray(evaluer(m["p"], rayon(w, h, m["cx"], m["cy"], m["asp"])).clip(0, 255).astype(np.uint8)).convert("RGBA")
    base.alpha_composite(plein)
    base.convert("RGB").save(PUB / slug / f"{fam}-decor.webp", quality=90, method=6)
    fond_prolonge(m).save(PUB / slug / f"{fam}-fond.webp", quality=85)
    return m


def main():
    seuls = [a for a in sys.argv[1:] if not a.startswith("--")]
    looks = sorted(p for p in PUB.glob("*/*-blanc.png"))
    modeles, manquants = {}, []
    for b in looks:
        slug, fam = b.parent.name, b.name.replace("-blanc.png", "")
        if seuls and f"{slug}/{fam}" not in seuls:
            continue
        if (PUB / slug / f"{fam}-decor.webp").exists():
            m = lisser(slug, fam)
            modeles.setdefault(fam, m)
            print(f"{slug}/{fam:12s} halo lissé (centre {m['cx']:.2f},{m['cy']:.2f} allongement {m['asp']}, écart {m['score']:.1f})")
        else:
            manquants.append((slug, fam))
    if manquants and REFERENCE not in modeles:
        for b in looks:
            if b.name.startswith(REFERENCE) and (b.parent / b.name.replace("-blanc.png", "-decor.webp")).exists():
                modeles[REFERENCE] = ajuster(Image.open(b.parent / b.name.replace("-blanc.png", "-decor.webp")), b.parent.name, REFERENCE)
                break
    for slug, fam in manquants:
        if (PUB / slug / f"{fam}-plein.png").exists():
            fabriquer(slug, fam, modeles)
            print(f"{slug}/{fam:12s} carte fabriquée ({'halo de la famille' if fam in modeles else 'couleur ' + COULEURS.get(fam, '?')})")


if __name__ == "__main__":
    main()
