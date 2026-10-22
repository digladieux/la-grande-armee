#!/usr/bin/env python3
"""
Intègre les versions « sans fond » fournies par l'illustratrice : public/images/personnages/<copain>/<famille>_sf.png

Pour chaque fichier _sf (illustration sur fond blanc, même cadre 708×1068 que la carte) :
  1. il devient l'illustration officielle <famille>-blanc.png (l'ancienne est remplacée) ;
  2. le détourage <famille>-cutout.png et <famille>-plein.png est refait à partir de ce fond blanc
     (garde tous les traits du dessin) ;
  3. le fichier _sf est supprimé.
Puis relancer scripts/jeu-sprites.py pour le jeu.

    python3 scripts/sans-fond.py

Noms de famille acceptés : ceux des fichiers existants, plus « ludick » pour une tenue rangée en joystick.
"""
import subprocess
import unicodedata
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PERSOS = ROOT / "public/images/personnages"
ALIASES = {"ludick": ["joystick"], "izi-karate": ["izikarate"]}


def main():
    done = 0
    for sf in sorted(PERSOS.glob("*/*_sf.png")):
        # sans accents (macOS écrit « é » en deux caractères : e + accent)
        name = unicodedata.normalize("NFKD", sf.stem[:-3]).encode("ascii", "ignore").decode()
        folder = sf.parent
        stem = next((s for s in [name, *ALIASES.get(name, [])] if (folder / f"{s}-blanc.png").exists()), name)
        blanc = folder / f"{stem}-blanc.png"
        sf.replace(blanc)
        subprocess.run([sys.executable, str(ROOT / "scripts/detourer.py"), str(blanc), "--clair", "225"], check=True)
        print(f"{folder.name}/{name}_sf → {stem}")
        done += 1
    print(done, "version(s) sans fond intégrée(s)")


if __name__ == "__main__":
    main()
