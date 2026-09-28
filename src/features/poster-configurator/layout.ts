/**
 * Disposition automatique « photo de groupe ».
 *
 * - Tous les copains gardent l'échelle de leur dessin (cutoutScale).
 * - Une seule rangée, alignée et sans chevauchement, pour les petites bandes
 *   (jusqu'à ALIGNED_MAX copains) ou si la bande tient en largeur.
 * - Sinon deux rangées : derrière les grands debout, devant les couchés / petits,
 *   légèrement plus grands (plus proches), qui passent devant.
 *
 * Unités : % de la feuille (x = centre, y = ligne des pieds, h = hauteur).
 */
import type { Orientation, Placement } from './types';

export interface LayoutItem {
  slug: string;
  /** Hauteur du dessin rapportée à la carte d'origine. */
  scale: number;
  /** Largeur / hauteur du détourage. */
  ratio: number;
}

/** Zone disponible pour la bande, en fraction de la hauteur de feuille. */
const AREA = {
  portrait: { top: 0.3, bottom: 0.925 },
  paysage: { top: 0.3, bottom: 0.9 },
} as const;
const ASPECT = { portrait: 1 / 1.414, paysage: 1.414 } as const;
/** Part de largeur réellement occupée (les copains se chevauchent un peu). */
const OVERLAP = 0.82;
const MARGIN = 0.06;
/** Espace entre deux copains alignés (en hauteur de feuille). */
const GAP = 0.02;
/** Nombre de copains affichés sur une seule rangée alignée. */
export const ALIGNED_MAX = { portrait: 3, paysage: 5 } as const;

export function autoLayout(items: LayoutItem[], orientation: Orientation): Record<string, Placement> {
  const out: Record<string, Placement> = {};
  if (!items.length) return out;

  const { top, bottom } = AREA[orientation];
  const aspect = ASPECT[orientation];
  const usableW = aspect * (1 - 2 * MARGIN); // en hauteurs de feuille
  const areaH = bottom - top;

  // k = hauteur (en fraction de feuille) d'un dessin de scale 1
  // overlap = 1 : côte à côte avec un petit espace ; < 1 : légers chevauchements
  const fitRow = (row: LayoutItem[], maxH: number, overlap = OVERLAP) => {
    const tallest = Math.max(...row.map((i) => i.scale));
    const gaps = overlap >= 1 ? GAP * (row.length - 1) : 0;
    const width = row.reduce((sum, i) => sum + i.scale * i.ratio, 0) * overlap;
    return Math.min(maxH / tallest, (usableW - gaps) / Math.max(width, 0.01));
  };

  const place = (row: LayoutItem[], k: number, baseline: number, zBase: number, overlap = OVERLAP) => {
    const widths = row.map((i) => i.scale * k * i.ratio);
    const step = (w: number) => (overlap >= 1 ? w + GAP : w * overlap);
    const total = widths.slice(0, -1).reduce((a, w) => a + step(w), 0) + widths[widths.length - 1];
    let cursor = aspect / 2 - total / 2;
    row.forEach((item, idx) => {
      const w = widths[idx];
      out[item.slug] = {
        x: ((cursor + w / 2) / aspect) * 100,
        y: baseline * 100,
        h: item.scale * k * 100,
        // Le centre de la rangée passe légèrement devant les bords
        z: zBase + Math.round(10 - Math.abs(idx - (row.length - 1) / 2)),
      };
      cursor += step(w);
    });
  };

  const tallest = Math.max(...items.map((i) => i.scale));
  // Petite bande : une rangée bien alignée, sans chevauchement
  if (items.length <= ALIGNED_MAX[orientation]) {
    place(items, fitRow(items, areaH, 1), bottom, 10, 1);
    return out;
  }
  // Une rangée (légers chevauchements) si le plus grand occupe encore 70 % de la hauteur
  const single = fitRow(items, areaH);
  if (single * tallest >= areaH * 0.7) {
    place(items, single, bottom, 10);
    return out;
  }

  // Deux rangées : devant les couchés (larges) et les plus petits
  const byLowness = [...items].sort((a, b) => b.ratio / b.scale - a.ratio / a.scale);
  const frontCount = Math.max(1, Math.min(Math.floor(items.length / 2), items.filter((i) => i.ratio > 1 || i.scale < tallest * 0.7).length || Math.floor(items.length / 3)));
  const frontSet = new Set(byLowness.slice(0, frontCount).map((i) => i.slug));
  // On garde l'ordre choisi par l'utilisateur à l'intérieur de chaque rangée
  const front = items.filter((i) => frontSet.has(i.slug));
  const back = items.filter((i) => !frontSet.has(i.slug));

  const backBaseline = bottom - areaH * 0.28;
  const kBack = fitRow(back, backBaseline - top);
  const kFront = Math.min(kBack * 1.12, fitRow(front, areaH * 0.62));
  place(back, kBack, backBaseline, 10);
  place(front, kFront, bottom, 40);
  return out;
}
