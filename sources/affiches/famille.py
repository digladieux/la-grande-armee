# Affiche A4 paysage d'une famille : photo de groupe, aucun visage caché.
# Usage : python3 sources/affiches/famille.py sources/affiches/donnees sortie.jpg <graine> <itérations> <famille>
# Bannière « foule » : emplacements fixes (rangées), personnages échangés jusqu'à ce qu'aucun visage ne soit caché.
import json, random, sys, math
from PIL import Image, ImageDraw
S=sys.argv[1]; out=sys.argv[2]; seed=int(sys.argv[3]); iters=int(sys.argv[4]); FAM=sys.argv[5]
W,H=3508,2480; TITLE=420; K=6
# Ludick et Joystick : même famille « Ludick » sur les cartes du jeu
GROUPS={"ludick":{"ludick","joystick"}}
BG={"botefragile":"#BDDDF2","branquignol":"#F8A08E","gaulois":"#8FC178","izi-karate":"#F6EBA8","ludick":"#C0A1FF","bouffetout":"#FFBA75","gochofacho":"#F6E894"}
looks=json.load(open(f"{S}/looks.json")); faces=json.load(open(f"{S}/faces.json"))
for i,l in enumerate(looks): l["i"]=i
looks=[l for l in looks if l["family"] in GROUPS.get(FAM,{FAM})]
n=len(looks); nb=(n+1)//2; nf=n-nb
# rangée du fond (visages plus petits, plus haut) puis rangée de devant
rows_def=[(0.17*(H-TITLE), W/(nb+0.2)/0.95, nb),(0.43*(H-TITLE), W/(nf+0.1)/0.78, nf)]
for l in looks:
    i=l["i"]; l["slug"]=l["image"].split("/")[2]
    l["key"]=l["slug"]+"/"+l["image"].split("/")[-1].replace("-blanc.png","")
    l["plein"]=("public/"+l["cutout"].replace("-cutout","-plein")) if l["cutout"] else f"{S}/rene-branquignol-plein.png"
    if l["key"]=="hugo/joystick": l["plein"]=f"{S}/hugo-joystick-sans-arc-en-ciel.png"
    l["im"]=Image.open(l["plein"]).convert("RGBA")
    l["lo"]=l["im"].getchannel("A").point(lambda v:255 if v>100 else 0)
    fx,fy,fw=faces[str(i)]; l["face"]=(fx/100*708, fy/100*1068, max(fw,7)/100*708*0.55)
FOND={"dim/branquignol","aubin/botefragile","laurent/branquignol","lenoir/botefragile","fred/branquignol","rene/branquignol","hugo/joystick","aubin/joystick","donne/botefragile"}
rnd=random.Random(seed)
# Emplacements : (rangée, x du visage, y du visage, taille du buste) ; ordre de dessin du fond vers l'avant
slots=[]
for ri,(y,b,n) in enumerate(rows_def):
    m=0.11*W; step=(W-2*m)/max(n-0.5,1); off=m+(0.5*step if ri%2 else 0)
    row=[]
    for i in range(n):
        row.append(dict(r=ri,col=i,x=min(W-m,off+i*step+rnd.uniform(-0.1,0.1)*step),y=TITLE+y+rnd.uniform(-0.06,0.06)*b,b=b*rnd.uniform(0.92,1.08)))
    rnd.shuffle(row); slots+=row
pool=looks[:]; rnd.shuffle(pool); pool.sort(key=lambda l: l["key"] not in FOND)
assign=pool[:]          # assign[k] = look dans slots[k] (slots déjà triés par rangée)
# NB : slots est rangé par rangée, l'ordre aléatoire dans la rangée sert d'ordre de dessin
def geom(sl,l):
    s=sl["b"]*l["zoom"]/708
    # on aligne le visage sur l'emplacement (tête à la bonne hauteur dans la rangée)
    fx,fy,_=l["face"]
    return s, int(sl["x"]-fx*s), int(sl["y"]-(fy+0.12*708/l["zoom"])*s)
def evaluate(assign):
    lab=Image.new("L",(W//K,H//K),0)
    G=[]
    for k,(sl,l) in enumerate(zip(slots,assign),1):
        s,x,y=geom(sl,l); G.append((s,x,y))
        m=l["lo"].resize((max(1,int(708*s/K)),max(1,int(1068*s/K))))
        lab.paste(k,(x//K,y//K,x//K+m.width,y//K+m.height),m)
    lp=lab.load(); pen=0; vis=[]
    for k,(sl,l) in enumerate(zip(slots,assign),1):
        s,x,y=G[k-1]; lo=l["lo"]; fx,fy,r=l["face"]; cx,cy,rr=(x+fx*s)/K,(y+fy*s)/K,r*s/K
        tot=v=0
        for yy in range(int(cy-rr),int(cy+rr)+1):
            for xx in range(int(cx-rr),int(cx+rr)+1):
                if (xx-cx)**2+(yy-cy)**2<=rr*rr:
                    u,w=int((xx*K-x)/s),int((yy*K-y)/s)
                    if not (0<=u<708 and 0<=w<1068 and lo.getpixel((u,w))): continue   # hors de sa propre silhouette
                    tot+=1
                    if 0<=xx<W//K and 0<=yy<H//K and lp[xx,yy]==k: v+=1
        f=v/max(tot,1); vis.append(f); pen+=max(0,0.9-f)**1.5*10
    # voisins : même copain ou même famille côte à côte
    for a in range(len(slots)):
        for b in range(a+1,len(slots)):
            sa,sb=slots[a],slots[b]
            if sa["r"]==sb["r"] and abs(sa["col"]-sb["col"])==1:
                la,lb=assign[a],assign[b]
                if la["slug"]==lb["slug"]: pen+=3
                pass
    # décors encombrants : uniquement dans les deux rangées du fond
    for sl,l in zip(slots,assign):
        if l["key"] in FOND and sl["r"]>1: pen+=4
    return pen,vis,G
pen,vis,G=evaluate(assign)
for it in range(iters):
    a,b=rnd.randrange(len(assign)),rnd.randrange(len(assign))
    if a==b: continue
    assign[a],assign[b]=assign[b],assign[a]
    p2,v2,g2=evaluate(assign)
    if p2<=pen: pen,vis,G=p2,v2,g2
    else: assign[a],assign[b]=assign[b],assign[a]
print("graine",seed,"pénalité",round(pen,2),"min visible",round(min(vis),2),"visages < 85 % :",[(l["key"],round(v,2)) for l,v in zip(assign,vis) if v<0.85])
# Fond : couleur des cartes de la famille, halo clair au centre (comme sur les cartes)
col=Image.new("RGB",(W,H),BG[FAM]); white=Image.new("RGB",(W,H),"#ffffff")
mask=Image.radial_gradient("L").resize((W,H)).point(lambda v:min(255,int(v*1.25)))
bg=Image.composite(col,white,mask)
canvas=bg.convert("RGBA")
for (s,x,y),l in zip(G,assign):
    im=l["im"].resize((int(708*s),int(1068*s)),Image.LANCZOS); canvas.paste(im,(x,y),im)
canvas.convert("RGB").save(out,quality=92)
dbg=canvas.copy(); dd=ImageDraw.Draw(dbg)
for (s,x,y),l,v in zip(G,assign,vis):
    fx,fy,r=l["face"]; cx,cy,rr=x+fx*s,y+fy*s,r*s
    dd.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),outline=(220,0,0,255) if v<0.85 else (0,170,0,255),width=8)
dbg.convert("RGB").resize((1500,int(1500*H/W))).save(out.replace(".jpg","_dbg.png"))
json.dump([[l["key"],s,x,y] for (s,x,y),l in zip(G,assign)],open(out.replace(".jpg",".json"),"w"))
