#!/usr/bin/env python3
"""
Remet dans les détourages les traits d'encre perdus (mèches de cheveux, traits de mouvement…).

Le détourage supprime les petits morceaux détachés du personnage ; ces traits existent pourtant
dans l'illustration sur fond blanc (<famille>-blanc.png). Pour chaque tenue dont l'illustration
est bien sur fond blanc, tout pixel d'encre situé à moins de RAYON px de la silhouette est
rajouté à <famille>-plein.png, puis <famille>-cutout.png est régénéré.

    python3 scripts/traits.py                 # toutes les tenues
    python3 scripts/traits.py dauby/gaulois   # une seule
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "public/images/personnages"
RAYON = 44  # px autour de la silhouette
ENCRE = 90  # en dessous : encre pleine ; fondu jusqu'à ENCRE + 35 (les ombres grises au sol, plus claires, restent exclues)


TROU_MAX = 500  # px : au-delà, c'est un vrai vide (entre les jambes…), on n'y touche pas
FERME = 12  # px : écart maximal entre deux traits d'une même mèche


def trous(masque, maxi):
    """Zones vides entièrement enfermées par le masque et plus petites que `maxi` px."""
    from collections import deque

    w, h = masque.size
    m = masque.load()
    seen = bytearray(w * h)
    out = Image.new("L", (w, h), 0)
    o = out.load()
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0 * w + x0] or m[x0, y0]:
                continue
            zone, q, bord = [], deque([(x0, y0)]), False
            seen[y0 * w + x0] = 1
            while q:
                x, y = q.popleft()
                zone.append((x, y))
                if x in (0, w - 1) or y in (0, h - 1):
                    bord = True
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and not m[nx, ny]:
                        seen[ny * w + nx] = 1
                        q.append((nx, ny))
            if not bord and len(zone) <= maxi:
                for x, y in zone:
                    o[x, y] = 255
    return out


def combler(masque, gris, autorise, ecart):
    """Pixels clairs situés entre deux pixels du masque à moins de `ecart` px (horizontalement ou verticalement)."""
    w, h = masque.size
    m, g, a = masque.load(), gris.load(), autorise.load()
    out = Image.new("L", (w, h), 0)
    o = out.load()

    def ligne(coords):
        last = None
        for i, (x, y) in enumerate(coords):
            if m[x, y]:
                if last is not None and 1 < i - last <= ecart:
                    trou = coords[last + 1 : i]
                    if all(a[px, py] and g[px, py] > 150 for px, py in trou):
                        for px, py in trou:
                            o[px, py] = 255
                last = i

    for y in range(h):
        ligne([(x, y) for x in range(w)])
    for x in range(w):
        ligne([(x, y) for y in range(h)])
    return out


def fond_blanc(im):
    w, h = im.size
    coins = [im.getpixel(p) for p in ((4, 4), (w - 5, 4), (4, h - 5), (w - 5, h - 5))]
    return all(min(c[:3]) > 245 for c in coins)


def traiter(plein_path):
    fam = plein_path.name.replace("-plein.png", "")
    blanc_path = plein_path.with_name(f"{fam}-blanc.png")
    if not blanc_path.exists():
        return None
    blanc = Image.open(blanc_path).convert("RGB")
    plein = Image.open(plein_path).convert("RGBA")
    if blanc.size != plein.size or not fond_blanc(blanc):
        return None
    alpha = plein.getchannel("A")
    # Zone autorisée : silhouette élargie (calcul en quart de résolution pour aller vite)
    small = alpha.resize((alpha.width // 4, alpha.height // 4)).point(lambda v: 255 if v > 40 else 0)
    zone = small.filter(ImageFilter.MaxFilter(2 * (RAYON // 4) + 1)).filter(ImageFilter.GaussianBlur(2)).resize(alpha.size, Image.BILINEAR).point(lambda v: 255 if v > 127 else 0)
    # Encre de l'illustration : opacité selon la noirceur du trait
    encre = blanc.convert("L").point(lambda v: 0 if v > ENCRE + 35 else 255 if v < ENCRE else int((ENCRE + 35 - v) * 255 / 35))
    # Encre = noir ou gris neutre (pas les couleurs du décor)
    r, g, b = blanc.split()
    sat = ImageChops.subtract(ImageChops.lighter(ImageChops.lighter(r, g), b), ImageChops.darker(ImageChops.darker(r, g), b))
    encre = ImageChops.multiply(encre, sat.point(lambda v: 255 if v < 60 else 0))
    ajout = ImageChops.multiply(encre, zone)
    nouvel_alpha = ImageChops.lighter(alpha, ajout)
    # Remplit le blanc à l'intérieur des traits remis (mèches de cheveux…) : petites zones
    # enfermées par le trait, après avoir refermé les interstices de quelques px
    # Blanc entre les traits fins détachés du corps (mèches) : on comble, ligne par ligne et
    # colonne par colonne, les petits écarts clairs entre deux traits voisins
    masque = nouvel_alpha.point(lambda v: 255 if v > 60 else 0)
    corps = alpha.point(lambda v: 255 if v > 60 else 0)
    fins = ImageChops.subtract(masque, corps.filter(ImageFilter.MaxFilter(5)))
    pres_fins = fins.filter(ImageFilter.GaussianBlur(9)).point(lambda v: 255 if v > 18 else 0)
    # Fermeture « ronde » (flou + seuil) : comble les écarts entre traits sans angles droits
    dilate = masque.filter(ImageFilter.GaussianBlur(FERME / 2)).point(lambda v: 255 if v > 40 else 0)
    ferme = dilate.filter(ImageFilter.GaussianBlur(FERME / 2)).point(lambda v: 255 if v > 215 else 0)
    clair = blanc.convert("L").point(lambda v: 255 if v > 150 else 0)
    interieur = ImageChops.multiply(ImageChops.multiply(ImageChops.subtract(ferme, masque), clair), ImageChops.multiply(pres_fins, zone))
    interieur = interieur.filter(ImageFilter.GaussianBlur(0.8)).point(lambda v: 255 if v > 100 else 0)
    nouvel_alpha = ImageChops.lighter(nouvel_alpha, interieur)
    gagne = ImageChops.subtract(nouvel_alpha, alpha)
    n = sum(1 for v in gagne.getdata() if v > 60)
    if n < 30:
        return 0
    rgb = Image.composite(blanc, plein.convert("RGB"), gagne.point(lambda v: 255 if v > 0 else 0))
    out = rgb.convert("RGBA")
    out.putalpha(nouvel_alpha)
    out.save(plein_path, optimize=True)
    bbox = nouvel_alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
    out.crop(bbox).save(plein_path.with_name(f"{fam}-cutout.png"), optimize=True)
    return n


def main():
    cibles = [ROOT / f"{a.split('/')[0]}/{a.split('/')[1]}-plein.png" for a in sys.argv[1:]] or sorted(ROOT.glob("*/*-plein.png"))
    for p in cibles:
        n = traiter(p)
        if n:
            print(f"{p.parent.name}/{p.name.replace('-plein.png', '')} : {n} px de traits remis")


if __name__ == "__main__":
    main()
