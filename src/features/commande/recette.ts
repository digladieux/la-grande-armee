/**
 * « Recette » d'une affiche : tout ce qu'il faut pour la redessiner à l'identique,
 * à n'importe quelle résolution (aperçu du panier, PDF d'impression 300 dpi).
 * Elle voyage dans le panier (localStorage) et dans le lien envoyé à Elora.
 */
import type { Background, Frame, Orientation, Placement } from '../poster-configurator/types';

export type PrintFormat = 'A5' | 'A4' | 'A3';

export interface RecetteMembre {
  /** Prénom (pour le récapitulatif). */
  name: string;
  /** Famille de la tenue. */
  family: string;
  /** Chemin du détourage, relatif à /public (sans base), ex. images/personnages/dim/gaulois-cutout.png */
  src: string;
  /** Position sur la feuille (voir Placement). */
  p: Placement;
}

export interface Recette {
  v: 1;
  orientation: Orientation;
  background: Background;
  /** Cadre de l'aperçu seulement (jamais fourni : on n'imprime que l'affiche). */
  frame: Frame;
  title: string;
  subtitle: string;
  showSubtitle: boolean;
  showBrand: boolean;
  members: RecetteMembre[];
  /** Accessoires posés sur l'affiche (name = nom de l'accessoire, family vide). */
  accessories?: RecetteMembre[];
}

/** Dimensions en mm. */
export const PRINT_SIZES: Record<PrintFormat, [number, number]> = {
  A5: [148, 210],
  A4: [210, 297],
  A3: [297, 420],
};

// ── Encodage compact pour les liens (base64url du JSON) ──
export function encodeRecette(r: Recette): string {
  const json = JSON.stringify(r);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeRecette(s: string): Recette | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const r = JSON.parse(new TextDecoder().decode(bytes));
    return r && r.v === 1 ? (r as Recette) : null;
  } catch {
    return null;
  }
}

/** Titre affiché (vide = « La Grande Armée »). */
export const titreAffiche = (r: Recette) => r.title.trim() || 'La Grande Armée';
