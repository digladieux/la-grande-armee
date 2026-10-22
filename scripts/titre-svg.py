#!/usr/bin/env python3
"""
Titre « LA GRANDE ARMÉE » vectorisé depuis l'image fournie (public/images/jeu/titre_logo.png).

Le titre d'origine est sur une seule ligne, « gonflé » (plus haut au centre). On le déplie
(lettres droites), on le coupe en deux lignes, puis on regonfle chaque ligne de façon symétrique :
  public/images/titre-la-grande.svg  « LA GRANDE »
  public/images/titre-armee.svg      « ARMÉE »
  public/images/titre-la-grande-armee.svg  la ligne d'origine, telle quelle

    python3 scripts/titre-svg.py

Nécessite : pip install --user potracer
"""
from pathlib import Path

import potrace
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/images/jeu/titre_logo.png"
OUT = ROOT / "public/images"
ZONE = (100, 400, 610, 488)  # cadre du titre seul (sans « Le jeu des 7 familles »)
UP = 6  # agrandissement avant tracé, pour des courbes lisses
GONFLE = 0.16  # les extrémités d'une ligne font (1 - GONFLE) de la hauteur du centre
ARC = 0.05  # remontée du pied des lettres aux extrémités (en hauteur de capitale)


def binaire(im):
    # léger flou avant seuil : bords lisses après l'étirement colonne par colonne
    return im.filter(ImageFilter.GaussianBlur(2.2)).point(lambda v: 255 if v > 127 else 0)


def quad_fit(xs, ys):
    """Moindres carrés y = a x² + b x + c."""
    s = [sum(x**k for x in xs) for k in range(5)]
    t = [sum(y * x**k for x, y in zip(xs, ys)) for k in range(3)]
    m = [[s[4], s[3], s[2], t[2]], [s[3], s[2], s[1], t[1]], [s[2], s[1], s[0], t[0]]]
    for i in range(3):
        p = max(range(i, 3), key=lambda r: abs(m[r][i]))
        m[i], m[p] = m[p], m[i]
        for r in range(3):
            if r != i:
                f = m[r][i] / m[i][i]
                m[r] = [a - f * b for a, b in zip(m[r], m[i])]
    a, b, c = (m[i][3] / m[i][i] for i in range(3))
    return lambda x: a * x * x + b * x + c


def colonnes(img):
    w, h = img.size
    px = img.load()
    out = []
    for x in range(w):
        ys = [y for y in range(h) if px[x, y]]
        out.append((min(ys), max(ys)) if ys else None)
    return out


def deplier(img):
    """Redresse le titre : chaque colonne est étirée pour que le haut et le pied des capitales soient droits."""
    w, h = img.size
    cols = colonnes(img)
    hauteurs = sorted(b - t for c in cols if c for t, b in [c])
    med = hauteurs[len(hauteurs) // 2]
    pts = [(x, t, b) for x, c in enumerate(cols) if c for t, b in [c] if 0.8 * med < b - t < 1.12 * med]
    top = quad_fit([p[0] for p in pts], [p[1] for p in pts])
    bot = quad_fit([p[0] for p in pts], [p[2] for p in pts])
    cap = sorted(bot(x) - top(x) for x in range(w))[w // 2]
    H = int(cap * 1.5)
    flat = Image.new("L", (w, H), 0)
    for x in range(w):
        t, b = top(x), bot(x)
        k = (b - t) / cap
        y0 = t - 0.4 * cap * k
        col = img.crop((x, int(y0), x + 1, int(b + 0.08 * cap * k))).resize((1, int(H * 0.99)), Image.BILINEAR)
        flat.paste(col, (x, 0))
    return binaire(flat), cap


def mots(img):
    """Segments de colonnes séparés par un vrai espace (> 0,25 capitale)."""
    w, _ = img.size
    cols = colonnes(img)
    segs, start, vide = [], None, 0
    for x in range(w):
        if cols[x]:
            if start is None:
                start = x
            vide = 0
            end = x
        elif start is not None:
            vide += 1
            if vide > 60:
                segs.append((start, end + 1))
                start = None
    if start is not None:
        segs.append((start, end + 1))
    return segs


def gonfler(line, cap):
    w, H = line.size
    out = Image.new("L", (w, H), 0)
    base = 0.4 * cap + cap  # pied des capitales dans l'image dépliée
    for x in range(w):
        u = 2 * x / max(w - 1, 1) - 1
        s = 1 - GONFLE * u * u
        lift = ARC * cap * u * u
        col = line.crop((x, 0, x + 1, H)).resize((1, max(1, int(H * s))), Image.BILINEAR)
        out.paste(col, (x, int(base - base * s - lift)))
    return binaire(out)


def tracer(img, path):
    w, h = img.size
    px = img.load()
    # potracer remplit les pixels « faux » : on lui passe le fond comme vrai
    bmp = potrace.Bitmap([[not px[x, y] for x in range(w)] for y in range(h)])
    curves = bmp.trace(turdsize=40, alphamax=1.0, opticurve=True, opttolerance=0.3)
    parts = []
    for curve in curves:
        d = [f"M{curve.start_point.x:.1f},{curve.start_point.y:.1f}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x:.1f},{seg.c.y:.1f}L{seg.end_point.x:.1f},{seg.end_point.y:.1f}")
            else:
                d.append(f"C{seg.c1.x:.1f},{seg.c1.y:.1f} {seg.c2.x:.1f},{seg.c2.y:.1f} {seg.end_point.x:.1f},{seg.end_point.y:.1f}")
        parts.append("".join(d) + "Z")
    x0, y0, x1, y1 = img.getbbox()
    pad = UP * 2
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0 - pad} {y0 - pad} {x1 - x0 + 2 * pad} {y1 - y0 + 2 * pad}" '
        f'aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="{"".join(parts)}"/></svg>\n'
    )
    path.write_text(svg)
    print(path.relative_to(ROOT), f"{len(svg) // 1024} Ko, ratio {(x1 - x0) / (y1 - y0):.2f}")


def main():
    im = Image.open(SRC).convert("L").crop(ZONE)
    im = im.resize((im.width * UP, im.height * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UP * 0.5))
    encre = im.point(lambda v: 255 if v < 90 else 0)
    tracer(encre, OUT / "titre-la-grande-armee.svg")
    flat, cap = deplier(encre)
    segs = mots(flat)
    if len(segs) != 3:
        raise SystemExit(f"{len(segs)} mots trouvés au lieu de 3 (LA, GRANDE, ARMÉE)")
    (la0, _), (_, gr1), (ar0, ar1) = segs
    tracer(gonfler(flat.crop((la0, 0, gr1, flat.height)), cap), OUT / "titre-la-grande.svg")
    tracer(gonfler(flat.crop((ar0, 0, ar1, flat.height)), cap), OUT / "titre-armee.svg")


if __name__ == "__main__":
    main()
