/**
 * Redessine une affiche (Recette) sur un canvas, à la taille voulue — même mise en page que
 * l'aperçu du configurateur (PosterCanvas.tsx + configurator.css), exprimée en fraction de la feuille.
 */
import type { Recette } from './recette';

const GONFLE = 0.16;
const ARC = 0.05;
const STRIPES = ['#c9e6c7', '#fbd2c6', '#fdf8e3', '#e3d1f9', '#fcefbe', '#fcdab4', '#d4e9f8'];
const INK = '#161412';

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

function lignes(text: string, max: number): string[] {
  const out: string[] = [];
  for (const word of text.trim().split(/\s+/)) {
    const last = out[out.length - 1];
    if (last && (last + ' ' + word).length <= max) out[out.length - 1] = last + ' ' + word;
    else out.push(word);
  }
  return out;
}

const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Image introuvable : ${src}`));
        img.src = src;
      }),
    );
  }
  return cache.get(src)!;
}

export interface QualiteMembre {
  name: string;
  /** Résolution effective à l'impression (points par pouce). */
  dpi: number;
}

/**
 * Dessine l'affiche. `base` = préfixe des URL (BASE_URL, avec « / » final).
 * `mmLargeur` (facultatif) sert à calculer la qualité d'impression de chaque dessin.
 */
export async function dessinerAffiche(
  canvas: HTMLCanvasElement,
  r: Recette,
  largeurPx: number,
  base: string,
  mmLargeur?: number,
): Promise<QualiteMembre[]> {
  const paysage = r.orientation === 'paysage';
  const W = Math.round(largeurPx);
  const H = Math.round(paysage ? W / 1.414 : W * 1.414);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const cqi = W / 100;

  await Promise.all([
    document.fonts.load(`400 ${Math.round(13 * cqi)}px Anton`),
    document.fonts.load(`700 ${Math.round(5 * cqi)}px Caveat`),
  ]).catch(() => {});

  // ── Fond ──
  if (r.background === 'creme') {
    ctx.fillStyle = '#fdf8ea';
    ctx.fillRect(0, 0, W, H);
  } else if (r.background === 'ciel' || r.background === 'corail') {
    const [a, b] = r.background === 'ciel' ? ['#cfe7f8', '#f3f9fd'] : ['#fbd3c6', '#fff4ef'];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, a);
    g.addColorStop(0.7, b);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    // repeating-linear-gradient(-50deg, bandes de 6 %) : ligne de dégradé CSS de longueur L,
    // centrée sur la feuille, orientée vers (sin a, -cos a) ; les bandes lui sont perpendiculaires
    const ang = (-50 * Math.PI) / 180;
    const L = Math.abs(W * Math.sin(ang)) + Math.abs(H * Math.cos(ang));
    const band = 0.06 * L;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.atan2(-Math.cos(ang), Math.sin(ang)));
    for (let k = 0; k * band < L + band; k++) {
      ctx.fillStyle = STRIPES[k % 7];
      ctx.fillRect(-L / 2 + k * band, -L, band + 1, 2 * L);
    }
    ctx.restore();
  }

  // ── Copains et accessoires (ordre de profondeur) ──
  const qualite: QualiteMembre[] = [];
  const membres = [...r.members, ...(r.accessories ?? [])].sort((a, b) => a.p.z - b.p.z);
  const imgs = await Promise.all(membres.map((m) => loadImage(base + m.src).catch(() => null)));
  membres.forEach((m, i) => {
    const img = imgs[i];
    if (!img) return;
    const h = (m.p.h / 100) * H;
    const w = (h * img.naturalWidth) / img.naturalHeight;
    const x = (m.p.x / 100) * W - w / 2;
    const y = (m.p.y / 100) * H - h;
    ctx.save();
    ctx.shadowColor = 'rgba(22, 20, 18, 0.18)';
    ctx.shadowOffsetY = 0.006 * W;
    ctx.shadowBlur = 0.005 * W;
    if (m.p.flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
    } else ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    if (mmLargeur) {
      const pouces = ((h / W) * mmLargeur) / 25.4;
      qualite.push({ name: m.name, dpi: Math.round(img.naturalHeight / pouces) });
    }
  });

  // ── Titre ──
  const padTop = (paysage ? 0.05 : 0.09) * W;
  const titre = r.title.trim() || 'La Grande Armée';
  let yBas = padTop;
  if (norm(titre) === 'la grande armee') {
    const logo = await loadImage(base + 'images/titre-la-grande-armee.svg');
    const boite = W * 0.88;
    const lw = boite * (paysage ? 0.62 : 0.88);
    const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
    // le SVG est en currentColor : on le dessine en noir via un masque
    const tmp = document.createElement('canvas');
    tmp.width = Math.round(lw);
    tmp.height = Math.round(lh);
    const t = tmp.getContext('2d')!;
    t.drawImage(logo, 0, 0, lw, lh);
    t.globalCompositeOperation = 'source-in';
    t.fillStyle = INK;
    t.fillRect(0, 0, lw, lh);
    ctx.drawImage(tmp, (W - lw) / 2, padTop);
    yBas = padTop + lh;
  } else {
    const fs = (paysage ? 8.5 : 13) * cqi;
    ctx.font = `400 ${fs}px Anton, Impact, sans-serif`;
    ctx.fillStyle = INK;
    ctx.textBaseline = 'alphabetic';
    const rows = lignes(titre.toUpperCase(), paysage ? 18 : 11);
    rows.forEach((row, li) => {
      const chars = [...row];
      const widths = chars.map((c) => ctx.measureText(c).width);
      const total = widths.reduce((a, b) => a + b, 0);
      let x = (W - total) / 2;
      const base = padTop + fs * 0.92 * li + fs * 0.82;
      chars.forEach((c, i) => {
        const u = chars.length > 1 ? (2 * i) / (chars.length - 1) - 1 : 0;
        const s = 1 - GONFLE * u * u;
        ctx.save();
        ctx.translate(x + widths[i] / 2, base - ARC * fs * u * u);
        ctx.scale(1, s);
        ctx.fillText(c, -widths[i] / 2, 0);
        ctx.restore();
        x += widths[i];
      });
    });
    yBas = padTop + fs * 0.92 * rows.length;
  }

  // ── Sous-titre (pastille) ──
  if (r.showSubtitle && r.subtitle.trim()) {
    const fs = (paysage ? 3.4 : 5.2) * cqi;
    ctx.font = `700 ${fs}px Caveat, cursive`;
    const tw = ctx.measureText(r.subtitle).width;
    const padX = 3 * cqi;
    const bh = fs * 1.3 + cqi;
    const by = yBas + (paysage ? 1.5 : 3) * cqi;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.roundRect((W - tw) / 2 - padX, by, tw + 2 * padX, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(r.subtitle, W / 2, by + bh / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // ── Mention en bas ──
  if (r.showBrand) {
    const fs = (paysage ? 2.2 : 3.4) * cqi;
    ctx.font = `400 ${fs}px Anton, Impact, sans-serif`;
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    const txt = 'LA GRANDE ARMÉE';
    // espacement des lettres 0,2 em
    const ls = 0.2 * fs;
    const widths = [...txt].map((c) => ctx.measureText(c).width + ls);
    const total = widths.reduce((a, b) => a + b, 0) - ls;
    let x = (W - total) / 2;
    const y = H - (paysage ? 2.2 : 3.5) * cqi;
    ctx.textAlign = 'left';
    [...txt].forEach((c, i) => {
      ctx.fillText(c, x, y);
      x += widths[i];
    });
  }
  return qualite;
}
