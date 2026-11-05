# Affiches par famille (paysage) : composition « photo de groupe » harmonieuse, rendue ensuite par le site.
#
#   python3 sources/affiches/familles.py            # écrit sources/affiches/familles/recettes.json
#   node sources/affiches/rendre-familles.mjs       # (serveur local lancé) → familles/<famille>.jpg
#
# Règles de composition :
#  - tous les copains à la même échelle de dessin (comme dans le configurateur) ;
#  - au fond les grands debout, devant les couchés / larges / petits, un peu plus grands (plus proches) ;
#  - les plus grands au centre (silhouette en pyramide) ;
#  - un copain tourné vers la droite se place à gauche, et inversement : tout le monde regarde le centre ;
#  - aucun visage caché, personne coupé par le bord, place laissée au titre et au sous-titre.
# Le résultat est une « recette » d'affiche (même format que le panier) : positions en % de la feuille.
import json, re, itertools
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "sources/affiches/donnees"
A = 1.414                     # largeur de la feuille paysage (hauteur = 1)
TOP, BOTTOM = 0.31, 0.955     # zone des copains (sous le titre et le sous-titre)
MARGE = 0.035                 # marge gauche / droite (fraction de la largeur)
R = 400                       # hauteur du raster de contrôle des visages
GROUPES = {"ludick": ["ludick", "joystick"]}
NOMS = {"botefragile": "Botéfragile", "branquignol": "Branquignol", "gaulois": "Gaulois", "izi-karate": "Izi Karaté",
        "ludick": "Ludick", "bouffetout": "Bouffetout", "gochofacho": "Gaucho Facho", "mignon": "Minion", "beauf": "Beauf",
        "capdag": "Capdag", "troubadour": "Troubadour"}
COULEURS = {"botefragile": "#BDDDF2", "branquignol": "#F8A08E", "gaulois": "#8FC178", "izi-karate": "#F6EBA8",
            "ludick": "#C0A1FF", "bouffetout": "#FFBA75", "gochofacho": "#F6E894", "mignon": "#89B9E0",
            "beauf": "#EDB6CF", "capdag": "#96D5D3", "troubadour": "#5B66AB"}
# Tenues dessinées en marche vers la gauche (voir src/features/la-grande-course/sens.ts)
GAUCHE = set(re.findall(r"'([a-z]+/[a-z-]+)'", (ROOT / "src/features/la-grande-course/sens.ts").read_text()))
PRENOMS = dict(re.findall(r"slug: '([a-z]+)',\s*name: '([^']+)'", (ROOT / "src/data/characters.ts").read_text()))


def charger(fam):
    looks = json.load(open(DATA / "looks.json"))
    faces = json.load(open(DATA / "faces.json"))
    out = []
    for i, l in enumerate(looks):
        if l["family"] not in GROUPES.get(fam, [fam]) or not l["cutout"]:
            continue
        slug = l["image"].split("/")[2]
        nom = l["image"].split("/")[-1].replace("-blanc.png", "")
        plein = Image.open(ROOT / "public" / l["cutout"].replace("-cutout", "-plein")).convert("RGBA")
        W, H = plein.size
        alpha = plein.getchannel("A").point(lambda v: 255 if v > 24 else 0)
        x0, y0, x1, y1 = alpha.getbbox()
        fx, fy, fw = faces[str(i)]
        u, v = (fx / 100 * W - x0) / (x1 - x0), (fy / 100 * H - y0) / (y1 - y0)
        # orientation : tenue en marche vers la gauche, sinon côté du visage par rapport au corps
        d = -1 if f"{slug}/{nom}" in GAUCHE else (1 if u > 0.58 else -1 if u < 0.42 else 0)
        out.append(dict(key=f"{slug}/{nom}", slug=slug, src=l["cutout"], s=(y1 - y0) / H, r=(x1 - x0) / (y1 - y0),
                        u=u, v=v, rayon=max(fw, 7) / 100 * W * 0.55 / (y1 - y0), d=d,
                        masque=alpha.crop((x0, y0, x1, y1))))
    return out


def ordre(rang):
    """Plus grands au centre ; tournés à droite → à gauche, tournés à gauche → à droite, en équilibrant."""
    rang = sorted(rang, key=lambda it: -it["s"])
    gauche, droite = [], []
    centre = rang[0]
    for it in rang[1:]:
        if it["d"] > 0 and len(gauche) <= len(droite) + 1:
            gauche.append(it)
        elif it["d"] < 0 and len(droite) <= len(gauche) + 1:
            droite.append(it)
        elif len(gauche) <= len(droite):
            gauche.append(it)
        else:
            droite.append(it)
    return gauche[::-1] + [centre] + droite


def placer(rangs, k, base_fond, chevauche):
    """Positions : (x centre, y pieds, hauteur, z) en unités de feuille, rangée du fond d'abord."""
    pos = []
    for ri, rang in enumerate(rangs):
        devant = ri == len(rangs) - 1 and len(rangs) > 1
        kk = k * (1.12 if devant else 1)
        base = BOTTOM if (devant or len(rangs) == 1) else base_fond
        w = [it["s"] * kk * it["r"] for it in rang]
        pas = [(w[i] + w[i + 1]) / 2 * chevauche[ri] for i in range(len(rang) - 1)]
        total = sum(pas)
        x = A / 2 - total / 2
        n = len(rang)
        for i, it in enumerate(rang):
            pos.append(dict(it=it, x=x, y=base, h=it["s"] * kk, z=(ri * 20) + 10 - round(abs(i - (n - 1) / 2))))
            if i < n - 1:
                x += pas[i]
    return pos


def noter(pos):
    """Pénalité : visages cachés, débordements, place perdue."""
    Wr = round(R * A)
    lab = Image.new("L", (Wr, R), 0)
    ordre_z = sorted(range(len(pos)), key=lambda i: pos[i]["z"])
    for n, i in enumerate(ordre_z, 1):
        p = pos[i]
        h = p["h"] * R
        w = h * p["it"]["r"]
        m = p["it"]["masque"].resize((max(1, round(w)), max(1, round(h))))
        lab.paste(n, (round(p["x"] * R - w / 2), round(p["y"] * R - h)), m)
    lp = lab.load()
    pen, vis = 0.0, []
    for n, i in enumerate(ordre_z, 1):
        p, it = pos[i], pos[i]["it"]
        h = p["h"] * R
        w = h * it["r"]
        x0, y0 = p["x"] * R - w / 2, p["y"] * R - h
        cx, cy, rr = x0 + it["u"] * w, y0 + it["v"] * h, max(2, it["rayon"] * h)
        tot = v = 0
        for yy in range(int(cy - rr), int(cy + rr) + 1):
            for xx in range(int(cx - rr), int(cx + rr) + 1):
                if (xx - cx) ** 2 + (yy - cy) ** 2 > rr * rr or not (0 <= xx < Wr and 0 <= yy < R):
                    continue
                tot += 1
                v += lp[xx, yy] == n
        f = v / max(tot, 1)
        vis.append((it["key"], f))
        pen += max(0, 0.9 - f) ** 1.5 * 40
        # débordements : bords de la feuille, zone du titre
        gauche, droite = x0 / R, (x0 + w) / R
        pen += max(0, MARGE * A - gauche) * 400 + max(0, droite - (1 - MARGE) * A) * 400
        pen += max(0, TOP - y0 / R) * 400
    # pas de grand vide entre le titre et les têtes les plus hautes
    haut = min(p["y"] - p["h"] for p in pos)
    pen += max(0, haut - (TOP + 0.03)) * 120
    return pen, vis


def composer(fam):
    items = charger(fam)
    n = len(items)
    best = None
    # répartitions possibles : une rangée (petites familles) ou deux rangées (fond / devant)
    if n <= 5:
        splits = [(items, [])]
    else:
        bas = sorted(items, key=lambda it: -(it["r"] / it["s"]))  # les plus « bas / larges » d'abord
        splits = [([it for it in items if it not in bas[:nf]], bas[:nf]) for nf in range(n // 2 - 1, n // 2 + 2) if 0 < nf < n]
    for fond, devant in splits:
        rangs = [ordre(fond)] + ([ordre(devant)] if devant else [])
        for k in [x / 100 for x in range(40, 151, 4)]:
            for bf in ([BOTTOM] if not devant else [BOTTOM - d / 100 for d in range(8, 46, 3)]):
                for ch in ([(0.82,), (0.7,), (0.92,)] if not devant else [(0.78, 0.86), (0.85, 0.9), (0.72, 0.8), (0.66, 0.72), (0.72, 0.66)]):
                    pos = placer(rangs, k, bf, ch)
                    pen, vis = noter(pos)
                    score = pen - k * 12  # le plus grand possible sans cacher personne
                    if best is None or score < best[0]:
                        best = (score, pos, vis, rangs, k, bf, ch)
    score, pos, vis, rangs, k, bf, ch = best
    # retouche : échanges dans une même rangée s'ils libèrent un visage
    amelioree = True
    while amelioree:
        amelioree = False
        for ri, rang in enumerate(rangs):
            for a, b in itertools.combinations(range(len(rang)), 2):
                rang[a], rang[b] = rang[b], rang[a]
                pos2 = placer(rangs, k, bf, ch)
                pen2, vis2 = noter(pos2)
                if pen2 - k * 12 < score - 0.5:
                    score, pos, vis, amelioree = pen2 - k * 12, pos2, vis2, True
                else:
                    rang[a], rang[b] = rang[b], rang[a]
    print(f"{fam:12s} {n:2d} copains  échelle {k:.2f}  visage le moins visible : {min(v for _, v in vis):.0%}",
          [f"{key} {v:.0%}" for key, v in vis if v < 0.85])
    return dict(
        v=1, orientation="paysage", background="creme", couleur=COULEURS[fam], frame="sans",
        title="La Grande Armée", subtitle=f"Famille {NOMS[fam]}", showSubtitle=True, showBrand=False,
        members=[dict(name=PRENOMS.get(p["it"]["slug"], p["it"]["slug"]), family=NOMS[fam], src=p["it"]["src"],
                      p=dict(x=round(p["x"] / A * 100, 2), y=round(p["y"] * 100, 2), h=round(p["h"] * 100, 2), z=p["z"]))
                 for p in pos],
    )


if __name__ == "__main__":
    import sys
    fams = sys.argv[1:] or list(NOMS)
    sortie = ROOT / "sources/affiches/familles/recettes.json"
    recettes = json.loads(sortie.read_text()) if sortie.exists() else {}
    for fam in fams:
        recettes[fam] = composer(fam)
    sortie.write_text(json.dumps(recettes, indent=1, ensure_ascii=False))
