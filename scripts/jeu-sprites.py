#!/usr/bin/env python3
"""
Images du jeu « La Grande Course » (public/images/jeu/) + manifeste src/data/jeu-sprites.json.

Pour chaque tenue détourée :
  <copain>-<famille>.webp       personnage entier détouré, 360 px de haut (joueur / obstacle au sol)
  <copain>-<famille>-tete.webp  tête carrée 160 px (obstacle volant), d'après la position du visage

    python3 scripts/jeu-sprites.py

Positions des visages : sources/affiches/donnees/faces.json (même ordre que looks.json).
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
OUT = PUB / "images/jeu"
DATA = ROOT / "sources/affiches/donnees"
# Versions « poster » (sans décor encombrant) fournies par l'illustratrice
SPECIAL = {"hugo/joystick": DATA / "posters/hugo-joystick.png", "aubin/joystick": DATA / "posters/aubin-joystick.png"}
POSTER_FACES = {"aubin/joystick": (48.8, 42.4, 9.1), "hugo/joystick": (49.7, 38.8, 14)}
H = 360
HEAD = 160


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    looks = json.load(open(DATA / "looks.json"))
    faces = json.load(open(DATA / "faces.json"))
    manifest = {}
    for i, l in enumerate(looks):
        if not l["cutout"]:
            continue
        slug = l["image"].split("/")[2]
        fam = l["image"].split("/")[-1].replace("-blanc.png", "")
        key = f"{slug}/{fam}"
        plein = SPECIAL.get(key, PUB / l["cutout"].replace("-cutout", "-plein"))
        im = Image.open(plein).convert("RGBA")
        bbox = im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
        body = im.crop(bbox)
        w = round(body.width * H / body.height)
        body.resize((w, H), Image.LANCZOS).save(OUT / f"{slug}-{fam}.webp", quality=82, method=6)
        # Tête : carré centré sur le visage (un peu au-dessus pour les cheveux / casques)
        fx, fy, fw = POSTER_FACES.get(key, faces[str(i)])
        cx, cy = fx / 100 * 708, fy / 100 * 1068
        side = max(fw, 8) / 100 * 708 * 1.9
        box = (round(cx - side / 2), round(cy - side * 0.58), round(cx + side / 2), round(cy + side * 0.42))
        im.crop(box).resize((HEAD, HEAD), Image.LANCZOS).save(OUT / f"{slug}-{fam}-tete.webp", quality=82, method=6)
        manifest[key] = {"w": w, "h": H, "ratio": round(body.width / body.height, 3)}
        print(key, w)
    (ROOT / "src/data/jeu-sprites.json").write_text(json.dumps(manifest, indent=1))
    print(len(manifest), "tenues")


if __name__ == "__main__":
    main()
