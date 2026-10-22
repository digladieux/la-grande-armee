#!/usr/bin/env python3
"""
Extrait les bulles de paroles des cartes du jeu (sources/personnages/<copain>/cartes/)
en calques transparents <famille>-bulle.png, au même cadre 708×1068 que <famille>-blanc.png.

    python3 scripts/bulles.py            # toutes les bulles
    python3 scripts/bulles.py coco dim   # seulement ces copains

Ajouter une bulle : une entrée dans B avec le cadre (x0, y0, x1, y1) de la bulle sur la carte.
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter
SRC=Path("sources/personnages"); PUB=Path("public/images/personnages")
B = {
 ("coco","IMG_3880","gaulois"):[(373,337,622,474)],
 ("coco","IMG_3891","botefragile"):[(408,230,702,367)],
 ("coco","IMG_3933","bouffetout"):[(426,305,601,376)],
 ("dauby","IMG_3935","bouffetout"):[(409,228,655,316)],
 ("dim","IMG_3883","gaulois"):[(33,246,350,332)],
 ("dim","IMG_3924","branquignol"):[(416,273,700,462)],
 ("dim","IMG_3932","bouffetout"):[(336,196,693,262)],
 ("donne","IMG_3887","botefragile"):[(170,356,607,511)],
 ("donne","IMG_3900","izikarate"):[(425,263,591,341)],
 ("donne","IMG_3918","branquignol"):[(17,246,364,406)],
 ("fred","IMG_3910","ludick"):[(328,312,597,437)],
 ("fred","IMG_3919","branquignol"):[(93,258,333,376)],
 ("guigui","IMG_3875","gaulois"):[(27,224,385,318)],
 ("guigui","IMG_3902","izikarate"):[(385,215,641,286)],
 ("guigui","IMG_3916","joystick"):[(281,253,582,317)],
 ("guigui","IMG_3927","bouffetout"):[(419,219,699,286)],
 ("laurent","IMG_3896","botefragile"):[(63,303,385,397)],
 ("laurent","IMG_3926","branquignol"):[(359,300,619,424)],
 ("lenoir","IMG_3881","gaulois"):[(10,247,592,419)],
 ("lenoir","IMG_3886","botefragile"):[(293,247,681,408)],
 ("lenoir","IMG_3908","ludick"):[(273,203,707,332)],
 ("merlot","IMG_3876","gaulois"):[(363,196,665,327)],
 ("nael","IMG_3899","izikarate"):[(372,451,606,570)],
 ("petit","IMG_3885","gaulois"):[(418,196,686,393)],
 ("petit","IMG_3925","branquignol"):[(16,264,303,362)],
 ("rene","IMG_3921","branquignol"):[(235,273,482,379)],
 ("szabo","IMG_3917","branquignol"):[(3,227,221,329),(343,247,585,316)],
 ("szabo","IMG_3928","bouffetout"):[(329,214,688,307)],
 ("theo","IMG_3920","branquignol"):[(268,230,587,333)],
 ("turquet","IMG_3884","gaulois"):[(56,235,388,344)],
 ("turquet","IMG_3905","izikarate"):[(364,252,701,346)],
 ("turquet","IMG_3923","branquignol"):[(335,264,666,375)],
}
only=sys.argv[1:]
for (slug,img,fam),boxes in B.items():
    if only and slug not in only: continue
    card=Image.open(SRC/slug/"cartes"/f"{img}.PNG").convert("RGB"); W,H=card.size
    L=card.convert("L"); lp=L.load()
    bg=L.filter(ImageFilter.MaxFilter(15)).load()   # fond local (sans les traits)
    blanc=Image.open(PUB/slug/f"{fam}-blanc.png").convert("L").load()
    out=Image.new("RGBA",(W,H),(0,0,0,0)); op=out.load()
    for x0,y0,x1,y1 in boxes:
        for y in range(max(y0-4,0),min(y1+5,H)):
            for x in range(max(x0-4,0),min(x1+5,W)):
                if slug!="rene" and blanc[x,y]<150: continue   # trait déjà présent dans l'illustration
                d=bg[x,y]-lp[x,y]
                if d<=8: continue
                a=min(255,int(d*255/max(bg[x,y]-25,1)))
                op[x,y]=(26,24,22,a)
    dst=PUB/slug/f"{fam}-bulle.png"; out.save(dst,optimize=True); print(dst)
