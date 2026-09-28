/**
 * Disposition automatique « photo de groupe ».
 *
 * - Tous les copains gardent l'échelle de leur dessin (cutoutScale).
 * - Une seule rangée si la bande tient en largeur sans devenir minuscule.
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

export function autoLayout(items: LayoutItem[], orientation: Orientation): Record<string, Placement> {
  const out: Record<string, Placement> = {};
  if (!items.length) return out;

  const { top, bottom } = AREA[orientation];
  const aspect = ASPECT[orientation];
  const usableW = aspect * (1 - 2 * MARGIN); // en hauteurs de feuille
  const areaH = bottom - top;

  // k = hauteur (en fraction de feuille) d'un dessin de scale 1
  const fitRow = (row: LayoutItem[], maxH: number) => {
    const tallest = Math.max(...row.map((i) => i.scale));
    const width = row.reduce((sum, i) => sum + i.scale * i.ratio, 0) * OVERLAP;
    return Math.min(maxH / tallest, usableW / Math.max(width, 0.01));
  };

  const place = (row: LayoutItem[], k: number, baseline: number, zBase: number) => {
    const widths = row.map((i) => i.scale * k * i.ratio);
    const total = widths.reduce((a, b) => a + b, 0) * OVERLAP + widths[widths.length - 1] * (1 - OVERLAP);
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
      cursor += w * OVERLAP;
    });
  };

  const single = fitRow(items, areaH);
  const tallest = Math.max(...items.map((i) => i.scale));
  // Une rangée suffit si le plus grand occupe au moins 70 % de la hauteur disponible
  if (items.length < 4 || single * tallest >= areaH * 0.7) {
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
