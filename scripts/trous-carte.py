#!/usr/bin/env python3
"""
Retire le fond blanc resté enfermé dans les détourages (entre les jambes, sous un bras…)
en le comparant à la carte d'origine à fond coloré (sources/personnages/<copain>/<famille>.png,
ou la carte du jeu listée dans sources/personnages/cartes.json) :
un pixel blanc du détourage qui est de la couleur du fond sur la carte est un trou.

    python3 scripts/trous-carte.py            # toutes les tenues qui ont une carte source
    python3 scripts/trous-carte.py dim/troubadour

Régénère <famille>-plein.png et <famille>-cutout.png.
"""
import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PERSOS = ROOT / "public/images/personnages"
SOURCES = ROOT / "sources/personnages"
# Cartes du jeu d'origine : sources/personnages/cartes.json (« copain/famille » → fichier)
CARTES = json.load(open(SOURCES / "cartes.json")) if (SOURCES / "cartes.json").exists() else {}
STEMS = {"joystick": ["ludick", "joystick"], "izikarate": ["izikarate", "izi-karate"]}


def couleur_fond(carte):
    """Couleur la plus saturée des bords de la carte (le fond dégradé)."""
    w, h = carte.size
    p = carte.load()
    pts = [p[x, y] for y in range(h // 4, 3 * h // 4, 6) for x in list(range(4, 60, 4)) + list(range(w - 60, w - 4, 4))]
    return max(pts, key=lambda c: max(c) - min(c))


def traiter(slug, fam):
    plein_path = PERSOS / slug / f"{fam}-plein.png"
    carte_path = next((SOURCES / slug / f"{s}.png" for s in STEMS.get(fam, [fam]) if (SOURCES / slug / f"{s}.png").exists()), None)
    if carte_path is None and f"{slug}/{fam}" in CARTES:
        carte_path = SOURCES / CARTES[f"{slug}/{fam}"]  # carte du jeu d'origine (avec titre et bulle)
    if not plein_path.exists() or carte_path is None:
        return None
    plein = Image.open(plein_path).convert("RGBA")
    carte = Image.open(carte_path).convert("RGB")
    if carte.size != plein.size:
        return None
    fond = couleur_fond(carte)
    if max(fond) - min(fond) < 25:
        return None  # carte sans fond coloré : rien à comparer
    W, H = plein.size
    pp, cp = plein.load(), carte.load()

    def trou(x, y):
        r, g, b, a = pp[x, y]
        if a == 0 or min(r, g, b) < 228:
            return False
        c = cp[x, y]
        sat = max(c) - min(c)
        # même teinte que le fond, nettement colorée (le blanc du dessin reste blanc sur la carte)
        return sat > 0.45 * (max(fond) - min(fond)) and sum(abs(u - v) for u, v in zip(c, fond)) < 140

    seen = bytearray(W * H)
    retire = 0
    for y0 in range(H):
        for x0 in range(W):
            if seen[y0 * W + x0] or not trou(x0, y0):
                continue
            zone, q = [], deque([(x0, y0)])
            seen[y0 * W + x0] = 1
            while q:
                x, y = q.popleft()
                zone.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < W and 0 <= ny < H and not seen[ny * W + nx] and trou(nx, ny):
                        seen[ny * W + nx] = 1
                        q.append((nx, ny))
            if len(zone) < 40:
                continue
            for x, y in zone:
                r, g, b, _ = pp[x, y]
                pp[x, y] = (r, g, b, 0)
            retire += len(zone)
    if retire:
        plein.save(plein_path, optimize=True)
        bbox = plein.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
        plein.crop(bbox).save(plein_path.with_name(f"{fam}-cutout.png"), optimize=True)
    return retire


def main():
    cibles = [a.split("/") for a in sys.argv[1:]] or [
        (p.parent.name, p.name.replace("-plein.png", "")) for p in sorted(PERSOS.glob("*/*-plein.png"))
    ]
    for slug, fam in cibles:
        n = traiter(slug, fam)
        if n:
            print(f"{slug}/{fam} : {n} px de fond retirés")


if __name__ == "__main__":
    main()
