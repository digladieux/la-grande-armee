#!/usr/bin/env python3
"""
Cartes d'origine avec leur décor (porte, voiture, dégradé…) pour la fiche personnage.

Les cartes déposées dans un dossier (par défaut public/images/autres/, non publié) sont :
  1. reconnues : on retrouve le copain et la famille en comparant au <famille>-blanc.png
     de chaque tenue (même dessin, même cadre) ;
  2. recadrées au cadre 708×1068 des autres images (la vidéo s'y superpose au pixel près) ;
  3. nettoyées : le titre « Famille … » en haut et le nom du rôle en bas (« L'ONCLE »…) sont effacés
     (la fiche affiche déjà la famille dans son encart) ;
  4. installées en public/images/personnages/<copain>/<famille>-decor.webp, avec
     <famille>-fond.webp : le fond de la carte prolongé tout autour (la fiche le pose derrière
     la carte pour que sa couleur remplisse tout le cadre, sans effet d'encart)
     (une carte encore inconnue est rangée dans sources/personnages/<copain>/cartes/ et ajoutée
     à sources/personnages/cartes.json ; une carte déjà connue n'est pas recopiée).

    python3 scripts/decors.py                     # tout le dossier public/images/autres
    python3 scripts/decors.py dossier/ carte.png  # d'autres fichiers / dossiers
    python3 scripts/decors.py --essai ...         # affiche la reconnaissance sans rien écrire
    python3 scripts/decors.py --tout [copain/famille ...]  # refait les cartes déjà installées
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

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


# Fond prolongé : le fond de la carte (hors dessin), lissé et étendu sur un cadre de MARGE_X largeurs
# de carte de chaque côté et MARGE_Y hauteurs en haut / en bas (basse définition : dégradé doux).
MARGE_X, MARGE_Y, ECHELLE = 1.5, 1.0, 8
# Bande du bord de la carte fondue dans le fond prolongé (fraction de largeur / hauteur)
FONDU = 0.12
# Lisière du panneau coloré (px), souvent plus pâle : repeinte avec les marges
LISIERE = 41
# Écart (0–255) au fond lissé au-delà duquel un pixel « de fond » est en fait du décor
ECART = 40
# Hors de la carte, la couleur s'estompe vers le blanc (distance en largeurs de carte)
ESTOMPE = 0.9


def flou(a, r):
    """Flou gaussien d'écart-type r (hors de l'image : zéro)."""
    n = int(3 * r)
    k = np.exp(-0.5 * (np.arange(-n, n + 1) / r) ** 2)
    k /= k.sum()
    for axe in (0, 1):
        a = np.moveaxis(a, axe, 0)
        p = np.pad(a, ((n, n), (0, 0)))
        a = np.moveaxis(sum(k[i] * p[i:i + a.shape[0]] for i in range(2 * n + 1)), 0, axe)
    return a


def remplir(v, poids):
    """Comble les trous (poids nul) par « push-pull » : chaque trou prend la couleur des pixels connus
    les plus proches, de plus en plus lissée en s'en éloignant."""
    h, w = poids.shape
    if poids.min() > 0:
        return v
    if min(h, w) <= 2:
        moyenne = (v * poids[..., None]).sum((0, 1)) / max(poids.sum(), 1e-6) if poids.sum() > 0 else np.full(3, 255.0)
        p = np.minimum(poids, 1)[..., None]
        return v * p + moyenne * (1 - p)
    hp, wp = h + h % 2, w + w % 2
    vp = np.pad(v * poids[..., None], ((0, hp - h), (0, wp - w), (0, 0)))
    pp = np.pad(poids, ((0, hp - h), (0, wp - w)))
    ps = pp.reshape(hp // 2, 2, wp // 2, 2).sum(axis=(1, 3))
    vs = vp.reshape(hp // 2, 2, wp // 2, 2, 3).sum(axis=(1, 3)) / np.maximum(ps, 1e-6)[..., None]
    grossier = remplir(vs, np.minimum(ps, 1))
    agrandir = lambda x: np.asarray(Image.fromarray(x.astype(np.float32)).resize((wp, hp), Image.BILINEAR))
    haut = np.stack([agrandir(grossier[..., c]) for c in range(3)], axis=2)[:h, :w]
    p = np.minimum(poids, 1)[..., None]
    return v * p + haut * (1 - p)


def marges_blanches(im, fond):
    """Le blanc de fond relié au bord de la carte (marges autour du panneau coloré, zone des titres
    effacés) ; l'intérieur des bulles, entouré d'un trait, n'en fait pas partie."""
    a = np.asarray(im, dtype=np.int16)
    blanc = (a.min(axis=2) > 238) & (a.max(axis=2) - a.min(axis=2) < 12) & fond
    m = Image.fromarray((blanc * 255).astype(np.uint8)).copy()
    for x, y in [(x, y) for x in range(0, W, 4) for y in (0, H - 1)] + [(x, y) for y in range(0, H, 4) for x in (0, W - 1)]:
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
    return np.asarray(m) == 128


def champ(im, perso):
    """Le fond coloré de la carte comme un champ de couleur continu, sur tout le cadre étendu (unités :
    pixels basse définition). Ne comptent que les pixels de fond colorés : hors personnage, sans
    trait (faible variation locale) et hors marges blanches. Ailleurs (marges, autour de la carte),
    la couleur du fond connu le plus proche, qui s'estompe vers le blanc en s'éloignant de la carte."""
    lum = np.asarray(im.convert("L"), dtype=np.float32)
    n = flou(np.ones_like(lum), 4)
    var = flou(lum * lum, 4) / n - (flou(lum, 4) / n) ** 2
    fond = ~perso & (var < 40)
    marges = marges_blanches(im, fond)
    # les gris neutres (carrosserie, ombres…) appartiennent au dessin, pas au fond coloré
    rgb = np.asarray(im, dtype=np.int16)
    gris_neutre = rgb.max(axis=2) - rgb.min(axis=2) < 10
    ok = (fond & ~gris_neutre & ~dilater(marges, LISIERE)).astype(np.float32)
    w, h = W // ECHELLE, H // ECHELLE
    mx, my = round(w * MARGE_X), round(h * MARGE_Y)
    a = np.asarray(im, dtype=np.float32) * ok[..., None]
    reduire = lambda x: np.asarray(Image.fromarray(x).resize((w, h), Image.BOX), dtype=np.float32)
    lisser = lambda x, r: np.stack([flou(x[..., c], r) for c in range(3)], axis=2) / flou(np.ones(x.shape[:2], np.float32), r)[..., None]
    poids = reduire(ok)
    connu = poids > 0.5
    couleur = np.stack([reduire(a[..., c]) for c in range(3)], axis=2) / np.maximum(poids, 1e-6)[..., None]
    # un élément de décor coloré (porte, canapé, roseaux…) tranche sur la teinte dominante du fond
    # ou sur le fond lissé à grande échelle : écarté, pour ne pas baver autour de la carte
    if connu.sum() >= 20:
        connu &= np.abs(couleur - np.median(couleur[connu], axis=0)).max(axis=2) < 2 * ECART
        large = lisser(remplir(couleur, connu.astype(np.float32)), 6)
        connu &= np.abs(couleur - large).max(axis=2) < ECART
    if connu.sum() >= 20:
        carte_ = lisser(remplir(couleur, connu.astype(np.float32)), 2)
    else:
        carte_ = np.full((h, w, 3), 255, np.float32)  # sans fond coloré, le champ reste blanc
    # autour de la carte : la couleur du bord le plus proche, de plus en plus lissée en s'éloignant
    ys = np.clip(np.arange(h + 2 * my) - my, 0, h - 1)
    xs = np.clip(np.arange(w + 2 * mx) - mx, 0, w - 1)
    champ = lisser(carte_, 6)[ys[:, None], xs[None, :]]
    X = (np.arange(w + 2 * mx)[None, :] - mx + 0.5) / w
    Y = (np.arange(h + 2 * my)[:, None] - my + 0.5) / h
    dx = np.maximum(np.maximum(-X, X - 1), 0)
    dy = np.maximum(np.maximum(-Y, Y - 1), 0) * H / W
    d = np.sqrt(dx * dx + dy * dy)[..., None]
    t = np.clip(d / 0.15, 0, 1)
    champ = champ * (1 - t) + lisser(champ, 25) * t
    garde = np.exp(-(d * d / ESTOMPE ** 2))
    return (255 - (255 - champ) * garde).clip(0, 255), fond, marges


def fondre_bords(im, fond_lisse, fond, marges, perso):
    """Les marges blanches prennent la couleur du fond prolongé, et près des bords tout le fond de la
    carte la rejoint (le dessin n'est pas touché)."""
    w, h = W // ECHELLE, H // ECHELLE
    mx, my = round(w * MARGE_X), round(h * MARGE_Y)
    interieur = Image.fromarray(fond_lisse[my:my + h, mx:mx + w].astype(np.uint8)).resize((W, H), Image.BICUBIC)
    m = np.asarray(interieur, dtype=np.float32)
    a = np.asarray(im, dtype=np.float32)
    X = np.arange(W)[None, :] / W
    Y = np.arange(H)[:, None] / H
    bord = np.minimum(np.minimum(X, 1 - X) / FONDU, np.minimum(Y, 1 - Y) / (FONDU * W / H))
    un = flou(np.ones((H, W), np.float32), 2)
    f = np.clip(1 - bord, 0, 1) ** 2 * flou(fond.astype(np.float32), 2) / un
    # les marges, élargies pour couvrir la lisière du panneau coloré (pixels clairs, entre le blanc
    # et la couleur du panneau : les traits du dessin, plus sombres, restent)
    bande = np.zeros((H, W), dtype=bool)
    bande[:8], bande[-8:], bande[:, :8], bande[:, -8:] = True, True, True, True
    lisiere = (dilater(marges, LISIERE) | bande) & ~perso & (a >= m - 25).all(axis=2)
    f = np.maximum(f, flou(lisiere.astype(np.float32), 2) / un)[..., None]
    r = a * (1 - f) + m * f
    # au-delà, le dégradé d'origine ne doit pas repasser plus pâle que le fond prolongé (liseré clair)
    pres = flou((dilater(marges, 2 * LISIERE + 1) & fond).astype(np.float32), 4) / flou(np.ones((H, W), np.float32), 4)
    r = np.where(pres[..., None] > 0, r * (1 - pres[..., None]) + np.minimum(r, m) * pres[..., None], r)
    return Image.fromarray(r.clip(0, 255).astype(np.uint8))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    essai = "--essai" in sys.argv
    entrees = [] if "--tout" in sys.argv else [Path(a) for a in args] or [ROOT / "public/images/autres"]
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
    if "--tout" in sys.argv:
        # Refait toutes les cartes déjà installées (ou seulement copain/famille donnés en argument)
        faites = {tuple(k.split("/")) for k in cartes if (PUB / f"{k}-decor.webp").exists() and (not args or k in args)}
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
            perso = personnage(slug, fam)
            lisse, fond_, marges = champ(propre, perso)
            fondre_bords(propre, lisse, fond_, marges, perso).save(PUB / slug / f"{fam}-decor.webp", quality=90, method=6)
            Image.fromarray(lisse.astype(np.uint8)).save(PUB / slug / f"{fam}-fond.webp", quality=85)


if __name__ == "__main__":
    main()
