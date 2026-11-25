# Redessine la grande affiche « foule » sans refaire l'optimisation de banniere.py :
#   - à partir du placement (.json écrit par banniere.py : [clé, échelle, x, y] par tenue) ;
#   - ou à partir d'une affiche déjà faite (.jpg) : seule la bande du titre (sans personnage) est refaite.
#   python3 sources/affiches/banniere-rendu.py sources/affiches/donnees placement.json|affiche.jpg sortie.jpg [écart|sans]
#   « sans » : affiche sans titre (bande du haut laissée en rayures pastel).
# Titre : le logo du site, lettres espacées (écart en fraction de la largeur moyenne d'une lettre).
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw

S, placement, out = sys.argv[1:4]
SANS_TITRE = len(sys.argv) > 4 and sys.argv[4] == "sans"
ECART = 0.35 if len(sys.argv) <= 4 or SANS_TITRE else float(sys.argv[4])
W = 6000; TITLE = 550; H = 2400 + TITLE
POSTERS = {"aubin/joystick", "hugo/joystick"}
PIEDS = {"dim/branquignol"}

chemins = {}
for l in json.load(open(f"{S}/looks.json")):
    key = l["image"].split("/")[2] + "/" + l["image"].split("/")[-1].replace("-blanc.png", "")
    chemins[key] = f"{S}/posters/{key.replace('/', '-')}.png" if key in POSTERS else (
        "public/" + l["cutout"].replace("-cutout", "-plein") if l["cutout"] else f"{S}/rene-branquignol-plein.png")

# Fond : bandes pastel (comme banniere.py)
cols = ["#c9e6c7", "#fbd2c6", "#fdf8e3", "#e3d1f9", "#fcefbe", "#fcdab4", "#d4e9f8"]
bg = Image.new("RGB", (W, H)); d = ImageDraw.Draw(bg)
a = math.radians(-50); dx, dy = math.sin(a), -math.cos(a); L = abs(W * math.sin(a)) + abs(H * math.cos(a)); band = 0.06 * L
for k in range(-int(L / band) - 2, int(L / band) + 3):
    t0 = -L / 2 + k * band; t1 = t0 + band
    d.polygon([(W / 2 + dx * t - dy * e, H / 2 + dy * t + dx * e) for t, e in ((t0, -L), (t0, L), (t1, L), (t1, -L))], fill=cols[k % 7])
canvas = bg.convert("RGBA")

if placement.endswith(".json"):
    rangs = json.load(open(placement))
    # ordre de dessin : les « pieds » tout au fond, puis les emplacements dans l'ordre
    for key, s, x, y in sorted(rangs, key=lambda r: r[0] not in PIEDS):
        im = Image.open(chemins[key]).convert("RGBA").resize((int(708 * s), int(1068 * s)), Image.LANCZOS)
        canvas.paste(im, (x, y), im)
else:
    # affiche existante : on garde tout sous la bande du titre (aucun personnage ne monte au-dessus de BANDE)
    BANDE = 520
    ancienne = Image.open(placement).convert("RGBA")
    canvas.paste(ancienne.crop((0, BANDE, W, H)), (0, BANDE))


def titre_espace(t, ecart):
    """Logo découpé en lettres (colonnes vides entre elles) puis reposé avec plus d'espace."""
    a = np.asarray(t.getchannel("A")) > 20
    plein = a.any(0)
    lettres, x = [], 0
    while x < len(plein):
        if plein[x]:
            x0 = x
            while x < len(plein) and plein[x]:
                x += 1
            lettres.append((x0, x))
        x += 1
    larg = np.median([b - a_ for a_, b in lettres])
    # lettres collées dans le logo (« DE ») : coupées à la colonne la moins remplie du milieu
    cols = a.sum(0)
    coupees = []
    for x0, x1 in lettres:
        if x1 - x0 > 1.5 * larg:
            m0, m1 = x0 + int((x1 - x0) * 0.3), x0 + int((x1 - x0) * 0.7)
            c = m0 + int(np.argmin(cols[m0:m1]))
            coupees += [(x0, c), (c, x1)]
        else:
            coupees.append((x0, x1))
    lettres = coupees
    larg = np.median([b - a_ for a_, b in lettres])
    # espaces entre mots : les deux plus grands écarts (« LA | GRANDE | ARMÉE »)
    trous = [lettres[i + 1][0] - lettres[i][1] for i in range(len(lettres) - 1)]
    mots = set(np.argsort(trous)[-2:])
    pas = [larg * ecart * (2.5 if i in mots else 1) + (g if i in mots else max(g, 0)) for i, g in enumerate(trous)]
    total = sum(b - a_ for a_, b in lettres) + sum(pas)
    res = Image.new("RGBA", (int(total) + 2, t.height), (0, 0, 0, 0))
    cx = 0
    for i, (x0, x1) in enumerate(lettres):
        res.alpha_composite(t.crop((x0, 0, x1, t.height)), (int(cx), 0))
        cx += (x1 - x0) + (pas[i] if i < len(pas) else 0)
    return res


if not SANS_TITRE:
    t = titre_espace(Image.open(f"{S}/titre-la-grande-armee.png").convert("RGBA"), ECART)
    tw = int(W * 0.44)
    t = t.resize((tw, int(t.height * tw / t.width)), Image.LANCZOS)
    canvas.alpha_composite(t, ((W - tw) // 2, int(TITLE * 0.16)))
canvas.convert("RGB").save(out, quality=92)
print(out, canvas.size)
