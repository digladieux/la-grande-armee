/** Données sérialisées passées par la page Astro à l'îlot du configurateur. */
export interface RosterLook {
  familyName: string;
  /** Clé de palette (blue, coral…) → var(--blue). */
  familyColor: string;
  /** Couleur exacte du fond des cartes de la famille. */
  familyBg: string;
  /** URL finale (base GitHub Pages incluse). */
  image: string;
  /** Transform CSS du cadrage tête + buste (voir lib/crop.ts). */
  bust: string;
  animation?: 'walk';
  /** URL du PNG détouré (figurine en carton, affiche). */
  cutout?: string;
  /** Hauteur du détourage / hauteur de la carte d'origine (échelle du dessin). */
  cutoutScale?: number;
  /** Largeur / hauteur du détourage. */
  cutoutRatio?: number;
  whiteBg?: boolean;
}

export interface RosterEntry {
  slug: string;
  name: string;
  /** Vide = personnage pas encore dessiné (case « ? » verrouillée). */
  looks: RosterLook[];
}

export interface Selection {
  slug: string;
  look: number;
}

export type Background = 'creme' | 'bandes' | 'ciel' | 'corail';
export type Frame = 'sans' | 'bois' | 'noir' | 'blanc';
export type Format = 'A5' | 'A4' | 'A3';
export type Orientation = 'portrait' | 'paysage';

export interface PosterState {
  selection: Selection[];
  background: Background;
  /** Aperçu seulement : le cadre n'est pas fourni (affiche seule). */
  frame: Frame;
  format: Format;
  orientation: Orientation;
  /**
   * Placement libre de chaque copain (clé = slug), une fois que l'utilisateur a
   * modifié l'affiche. `null` = disposition automatique (photo de groupe).
   */
  layout: Record<string, Placement> | null;
  title: string;
  /** Sous-titre facultatif (vide = pas de sous-titre). */
  subtitle: string;
  showSubtitle: boolean;
  /** Mention « La Grande Armée » en bas de l'affiche. */
  showBrand: boolean;
  /** Accessoires posés sur l'affiche (clé = id de l'accessoire) et leur position. */
  accessories: Record<string, Placement>;
}

/** Nombre maximum de copains selon l'orientation. */
export const MAX_CHARACTERS: Record<Orientation, number> = { portrait: 6, paysage: 10 };
/** Au-delà, on suggère le format paysage. */
export const LANDSCAPE_HINT_FROM = 4;

export const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: 'portrait', label: 'Portrait' },
  { id: 'paysage', label: 'Paysage' },
];

export const BACKGROUNDS: { id: Background; label: string }[] = [
  { id: 'creme', label: 'Crème' },
  { id: 'bandes', label: 'Bandes pastel' },
  { id: 'ciel', label: 'Ciel' },
  { id: 'corail', label: 'Corail' },
];

export const FRAMES: { id: Frame; label: string }[] = [
  { id: 'sans', label: 'Affiche seule' },
  { id: 'bois', label: 'Bois' },
  { id: 'noir', label: 'Noir' },
  { id: 'blanc', label: 'Blanc' },
];

export const FORMATS: { id: Format; label: string; size: string }[] = [
  { id: 'A5', label: 'A5', size: '14,8 × 21 cm' },
  { id: 'A4', label: 'A4', size: '21 × 29,7 cm' },
  { id: 'A3', label: 'A3', size: '29,7 × 42 cm' },
];

/** Accessoires à poser sur l'affiche (détourages : scripts/accessoires.py). */
export interface Accessory {
  id: string;
  label: string;
  /** Chemin relatif à /public (sans base). */
  src: string;
  /** Hauteur par défaut sur l'affiche (% de la feuille). */
  h: number;
}

export const ACCESSORIES: Accessory[] = [
  { id: 'biere', label: 'Bière', src: 'images/accessoires/biere.png', h: 11 },
  { id: 'elephant-delirium', label: 'Éléphant Delirium', src: 'images/accessoires/elephant-delirium.png', h: 13 },
];

/** Accessoires prévus, pas encore dessinés. */
export const UPCOMING_ACCESSORIES = ['Lunettes', 'Casquette', 'Barbecue', 'Couronne', 'Ballon'];

/**
 * Position d'un copain sur l'affiche, en % de la feuille :
 * x = centre horizontal, y = ligne des pieds, h = hauteur du personnage.
 */
export interface Placement {
  x: number;
  y: number;
  h: number;
  z: number;
  flip?: boolean;
}
