#!/usr/bin/env python3
"""
Passe des tenues en HD (cadre ×2 : 1416×2136) quand l'illustration d'origine est trop petite (floue).

Agrandissement par IA spécialisée dessin en ligne claire (Real-ESRGAN, modèle realesr-animevideov3,
×2) : traits nets, aplats propres, visages conservés. Pour chaque tenue :
  <famille>-blanc.png   illustration sur fond blanc, agrandie par l'IA ;
  <famille>-plein.png   détourage dans le cadre : couleurs de la version HD, transparence d'origine
                        agrandie (même silhouette, même cadrage) ;
  <famille>-cutout.png  le détourage recadré au personnage (comme avant, ×2).
Les positions en % (vignettes, visages) ne changent pas. Relancer ensuite scripts/jeu-sprites.py.

L'outil n'est pas dans le dépôt : télécharger realesrgan-ncnn-vulkan (macOS) depuis
https://github.com/xinntao/Real-ESRGAN/releases (v0.2.5.0) et indiquer son dossier.

    python3 scripts/hd.py --esrgan ~/outils/realesrgan dauby/capdag fred/capdag ...
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public/images/personnages"
W, H = 708, 1068


def agrandir(src, dst, outil):
    subprocess.run(
        [str(outil / "realesrgan-ncnn-vulkan"), "-i", str(src), "-o", str(dst), "-n", "realesr-animevideov3", "-s", "2"],
        check=True,
        capture_output=True,
        cwd=outil,
    )


def traiter(slug, fam, outil):
    dossier = PUB / slug
    blanc = Image.open(dossier / f"{fam}-blanc.png")
    if blanc.size != (W, H):
        print(f"{slug}/{fam} : déjà en {blanc.width}×{blanc.height}, ignorée")
        return
    plein = Image.open(dossier / f"{fam}-plein.png").convert("RGBA")
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = Path(tmp) / "in.png", Path(tmp) / "out.png"
        blanc.convert("RGB").save(src)
        agrandir(src, dst, outil)
        hd = Image.open(dst).convert("RGB")
    assert hd.size == (2 * W, 2 * H), hd.size
    alpha = plein.getchannel("A").resize(hd.size, Image.LANCZOS)
    hd.convert("RGBA").save(dossier / f"{fam}-blanc.png", optimize=True)
    plein_hd = hd.convert("RGBA")
    plein_hd.putalpha(alpha)
    plein_hd.save(dossier / f"{fam}-plein.png", optimize=True)
    plein_hd.crop(alpha.point(lambda v: 255 if v > 24 else 0).getbbox()).save(dossier / f"{fam}-cutout.png", optimize=True)
    print(f"{slug}/{fam} → {hd.width}×{hd.height}")


def main():
    args = sys.argv[1:]
    if "--esrgan" not in args:
        sys.exit(__doc__)
    i = args.index("--esrgan")
    outil = Path(args[i + 1]).expanduser().resolve()
    for key in args[:i] + args[i + 2:]:
        traiter(*key.split("/"), outil)


if __name__ == "__main__":
    main()
