#!/usr/bin/env python3
"""
Vérifie la cohérence entre public/images/personnages/ et src/data/characters.ts :
- fichiers présents sur le disque mais pas encore utilisés par le site (nouvelles photos à intégrer) ;
- références du site vers des fichiers absents.

    python3 scripts/verifier-images.py
"""
import os
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "public/images/personnages"
DATA = ROOT / "src/data/characters.ts"

nfc = lambda s: unicodedata.normalize("NFC", s)
# characters.ts + bustes animés de l'accueil (hero-busts.ts)
SOURCES = [DATA, ROOT / "src/data/hero-busts.ts"]
refs = {nfc(r) for f in SOURCES if f.exists() for r in re.findall(r"'images/personnages/([^']+)'", f.read_text())}
on_disk = {
    nfc(f"{d.name}/{f.name}")
    for d in IMAGES.iterdir() if d.is_dir()
    for f in d.iterdir() if f.is_file() and not f.name.startswith(".")
}

# Les versions « -plein » sont dérivées des détourages (utilisées automatiquement par les vignettes)
derived = {r.replace("-cutout.png", "-plein.png") for r in refs if r.endswith("-cutout.png")}
# Les calques « -bulle » accompagnent l'illustration « -blanc » (utilisés automatiquement par la fiche)
derived |= {r.replace("-blanc.png", "-bulle.png") for r in refs if r.endswith("-blanc.png")}
# Les cartes avec décor « -decor.webp » (scripts/decors.py) remplacent l'illustration dans la fiche
derived |= {r.replace("-blanc.png", "-decor.webp") for r in refs if r.endswith("-blanc.png")}
unused = sorted(on_disk - refs - derived)
broken = sorted(r for r in refs if not (IMAGES / r).exists())
print("Nouvelles images à intégrer :", *(unused or ["aucune"]), sep="\n  ")
print("Références cassées :", *(broken or ["aucune"]), sep="\n  ")
sys.exit(1 if broken else 0)
