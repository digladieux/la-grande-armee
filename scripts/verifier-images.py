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
refs = {nfc(r) for r in re.findall(r"'images/personnages/([^']+)'", DATA.read_text())}
on_disk = {
    nfc(f"{d.name}/{f.name}")
    for d in IMAGES.iterdir() if d.is_dir()
    for f in d.iterdir() if f.is_file() and not f.name.startswith(".")
}

# Les versions « -plein » sont dérivées des détourages (utilisées automatiquement par les vignettes)
derived = {r.replace("-cutout.png", "-plein.png") for r in refs if r.endswith("-cutout.png")}
unused = sorted(on_disk - refs - derived)
broken = sorted(r for r in refs if not (IMAGES / r).exists())
print("Nouvelles images à intégrer :", *(unused or ["aucune"]), sep="\n  ")
print("Références cassées :", *(broken or ["aucune"]), sep="\n  ")
sys.exit(1 if broken else 0)
