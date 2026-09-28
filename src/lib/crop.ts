/**
 * Cadrage « tête + buste » d'une illustration pleine page, en pur CSS.
 *
 * `cx`, `cy` : centre du cadrage en % de l'image ; `zoom` : 1 = pleine largeur.
 * Le conteneur doit avoir `aspect-ratio: 4 / 5` et `overflow: hidden`,
 * l'image `position: absolute; width: 100%; transform-origin: 0 0`.
 */
export interface Crop {
  cx: number;
  cy: number;
  zoom: number;
}

/** Ratio largeur/hauteur des illustrations du jeu (708 × 1068 px). */
export const CARD_RATIO = 708 / 1068;

export function cropTransform({ cx, cy, zoom }: Crop, imageRatio = CARD_RATIO, frameRatio = 4 / 5): string {
  const visW = 100 / zoom;
  const visH = (100 / frameRatio) * imageRatio / zoom;
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
  const left = clamp(cx - visW / 2, 100 - visW);
  const top = clamp(cy - visH / 2, 100 - visH);
  return `scale(${zoom}) translate(${-left}%, ${-top}%)`;
}
