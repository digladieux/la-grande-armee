#!/usr/bin/env python3
"""
Bustes animés de l'accueil (WebP à fond transparent) générés depuis les vidéos des copains.

    python3 scripts/video/bustes.py              # tous les bustes de scripts/video/bustes.json
    python3 scripts/video/bustes.py momo nael     # seulement ceux dont le nom contient « momo » ou « nael »

Pour chaque entrée de bustes.json :
  1. extraction des images de la vidéo (images.swift), dans un dossier temporaire ;
  2. suivi du visage (visages.swift ; à défaut, suivi par ressemblance depuis "visage") —
     mis en cache dans sources/videos/suivis/ ;
  3. détourage sur l'IMAGE ENTIÈRE : le fond (gris très clair / blanc, sans couleur) est retiré
     par remplissage depuis les bords de l'image (les zones blanches du dessin, entourées d'un trait,
     ne sont pas atteintes). Un panneau blanc
     ou un bras clair qui sort du cadre du buste reste donc bien opaque ;
  4. recadrage sur le buste, qui suit la tête (8,4 rayons de visage de large, ratio 5:7).

Réglages facultatifs par buste : "zoom" (< 1 = plus large), "decalage" [dx, dy] en rayons de
visage, "effacer" [[x0, y0, x1, y1], …] en fraction du buste, "visage" [x %, y %, largeur %]
(position de départ si la détection échoue), "trous": true (retire le fond enfermé).
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CONFIG = HERE / "bustes.json"
CACHE = ROOT / "sources/videos/suivis"
TMP = Path(tempfile.gettempdir()) / "lga-bustes"
LARGEUR = 240
PAS = 3  # une image sur 3 → 10 i/s
SAT_MAX = 9  # fond : saturation max (écart entre canaux)
LUM_MIN = 228  # fond : luminosité min


def images(video, name):
    d = TMP / name
    if not d.exists() or len(list(d.glob("*.png"))) < 10:
        d.mkdir(parents=True, exist_ok=True)
        subprocess.run(["swift", str(HERE / "images.swift"), str(video), str(d)], check=True, capture_output=True)
    return sorted(d.glob("*.png"))


def suivi(name, files, entry):
    CACHE.mkdir(parents=True, exist_ok=True)
    cache = CACHE / f"{name}.json"
    if cache.exists():
        return json.loads(cache.read_text())
    raw = subprocess.run(["swift", str(HERE / "visages.swift"), *map(str, files)], capture_output=True, text=True).stdout
    found = json.loads(raw or "{}")
    W, H = Image.open(files[0]).size
    ref = entry.get("visage")
    pos, widths = [None] * len(files), []
    for i, f in enumerate(files):
        faces = found.get(str(f)) or []
        if ref:
            faces = [q for q in faces if abs(q[0] - ref[0]) < 15 and abs(q[1] - ref[1]) < 15]
        if faces:
            q = max(faces, key=lambda q: q[2]) if not ref else min(faces, key=lambda q: abs(q[0] - ref[0]) + abs(q[1] - ref[1]))
            pos[i] = (q[0] / 100 * W, q[1] / 100 * H)
            widths.append(q[2])
            ref = ref or q
    if sum(p is not None for p in pos) < len(files) * 0.3:
        if not entry.get("visage"):
            raise SystemExit(f"{name} : visage non détecté, ajouter \"visage\" dans bustes.json")
        pos = suivre(files, entry["visage"])
        widths = [entry["visage"][2]]
    known = [i for i, p in enumerate(pos) if p]
    for i in range(len(pos)):
        if pos[i] is None:
            a = max((k for k in known if k < i), default=None)
            b = min((k for k in known if k > i), default=None)
            if a is None or b is None:
                pos[i] = pos[b if a is None else a]
            else:
                t = (i - a) / (b - a)
                pos[i] = tuple(pos[a][j] + (pos[b][j] - pos[a][j]) * t for j in range(2))
    lisse = []
    for i in range(len(pos)):
        w = pos[max(0, i - 6) : i + 7]
        lisse.append((sum(p[0] for p in w) / len(w), sum(p[1] for p in w) / len(w)))
    widths.sort()
    data = {"r": widths[len(widths) // 2] / 100 * W / 2, "pos": lisse}
    cache.write_text(json.dumps(data))
    return data


def suivre(files, visage):
    """Suivi par ressemblance (demi-résolution) quand la détection de visage échoue (dessins très cartoon)."""
    W, H = Image.open(files[0]).size
    sc = 0.5
    R = int(max(visage[2], 8) / 100 * W / 2 * sc * 1.3)
    cx, cy = visage[0] / 100 * W * sc, visage[1] / 100 * H * sc
    small = lambda f: Image.open(f).convert("L").resize((int(W * sc), int(H * sc)))
    tpl = small(files[0]).crop((int(cx - R), int(cy - R), int(cx + R), int(cy + R)))
    pos = [(cx / sc, cy / sc)]
    for f in files[1:]:
        im = small(f)

        def ecart(dx, dy):
            c = im.crop((int(cx + dx - R), int(cy + dy - R), int(cx + dx + R), int(cy + dy + R)))
            return ImageStat.Stat(ImageChops.difference(c, tpl)).sum[0]

        best = min(((ecart(dx, dy), dx, dy) for dy in range(-30, 31, 3) for dx in range(-30, 31, 3)))
        best = min([best] + [(ecart(dx, dy), dx, dy) for dy in range(best[2] - 2, best[2] + 3) for dx in range(best[1] - 2, best[1] + 3)])
        cx, cy = cx + best[1], cy + best[2]
        tpl = im.crop((int(cx - R), int(cy - R), int(cx + R), int(cy + R)))
        pos.append((cx / sc, cy / sc))
    return pos


def detourer(path, trous=False):
    """Fond retiré sur l'image entière : seuls les pixels de la couleur exacte du fond, reliés aux bords."""
    im = Image.open(path).convert("RGB")
    W, H = im.size
    # Fond = gris très clair ou blanc, sans couleur (la peau, même claire, est colorée)
    r, g, b = im.split()
    sat = ImageChops.subtract(ImageChops.lighter(ImageChops.lighter(r, g), b), ImageChops.darker(ImageChops.darker(r, g), b))
    lum = im.convert("L")
    proche = ImageChops.multiply(sat.point(lambda v: 255 if v <= SAT_MAX else 0), lum.point(lambda v: 255 if v >= LUM_MIN else 0))
    # Remplissage depuis les bords (marque 128) : uniquement le fond relié à l'extérieur
    for x in range(0, W, 6):
        for y in (0, H - 1):
            if proche.getpixel((x, y)) == 255:
                ImageDraw.floodfill(proche, (x, y), 128, thresh=0)
    for y in range(0, H, 6):
        for x in (0, W - 1):
            if proche.getpixel((x, y)) == 255:
                ImageDraw.floodfill(proche, (x, y), 128, thresh=0)
    alpha = proche.point(lambda v: 0 if v == 128 else 255)
    # Option "trous" : retire aussi le fond gris enfermé (entre un bras et le corps…). À éviter
    # quand le dessin a de grands aplats blanc cassé (panneaux, kimonos), qui seraient troués.
    if trous:
        gris = ImageChops.multiply(sat.point(lambda v: 255 if v <= 6 else 0), lum.point(lambda v: 255 if 233 <= v <= 249 else 0))
        gris = gris.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(11))
        alpha = ImageChops.subtract(alpha, gris)
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out


def buste(entry):
    name = entry["nom"]
    files = images(ROOT / entry["video"], name)
    t = suivi(name, files, entry)
    r = t["r"]
    w = r * 8.4 / entry.get("zoom", 1)
    h = w * 1.4
    dx, dy = (v * r for v in entry.get("decalage", (0, 0)))
    size = (LARGEUR, round(LARGEUR * 1.4))
    frames = []
    # Les premières images de certaines vidéos ont un fond blanc pur (fondu d'entrée) : on les saute
    for i in range(2 * PAS, len(files), PAS):
        x, y = t["pos"][i]
        x, y = x + dx, y + dy
        box = (round(x - w / 2), round(y - 0.3 * h), round(x + w / 2), round(y + 0.7 * h))
        fr = detourer(files[i], entry.get("trous", False)).crop(box).resize(size, Image.LANCZOS)
        for x0, y0, x1, y1 in entry.get("effacer", []):
            fr.paste((0, 0, 0, 0), (round(x0 * size[0]), round(y0 * size[1]), round(x1 * size[0]), round(y1 * size[1])))
        frames.append(fr)
    out = ROOT / entry["sortie"]
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=round(1000 / 30 * PAS), loop=0, quality=72, method=6)
    print(f"{entry['sortie']} : {len(frames)} images, {out.stat().st_size // 1024} Ko", flush=True)


def main():
    entries = json.loads(CONFIG.read_text())
    filtres = sys.argv[1:]
    for e in entries:
        if not filtres or any(f in e["nom"] for f in filtres):
            buste(e)


if __name__ == "__main__":
    main()
