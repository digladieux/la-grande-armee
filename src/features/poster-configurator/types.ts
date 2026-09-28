/** Données sérialisées passées par la page Astro à l'îlot du configurateur. */
export interface RosterLook {
  familyName: string;
  /** Clé de palette (blue, coral…) → var(--blue). */
  familyColor: string;
  /** URL finale (base GitHub Pages incluse). */
  image: string;
  /** Transform CSS du cadrage tête + buste (voir lib/crop.ts). */
  bust: string;
  animation?: 'walk';
  /** URL du PNG détouré (figurine en carton, affiche). */
  cutout?: string;
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
export type Format = 'A4' | 'A3' | 'A2';
export type Orientation = 'portrait' | 'paysage';

export interface PosterState {
  selection: Selection[];
  background: Background;
  frame: Frame;
  format: Format;
  orientation: Orientation;
  title: string;
  subtitle: string;
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
  { id: 'sans', label: 'Sans cadre' },
  { id: 'bois', label: 'Bois' },
  { id: 'noir', label: 'Noir' },
  { id: 'blanc', label: 'Blanc' },
];

export const FORMATS: { id: Format; label: string; size: string }[] = [
  { id: 'A4', label: 'A4', size: '21 × 29,7 cm' },
  { id: 'A3', label: 'A3', size: '29,7 × 42 cm' },
  { id: 'A2', label: 'A2', size: '42 × 59,4 cm' },
];

/** Accessoires prévus (étape désactivée pour l'instant). */
export const UPCOMING_ACCESSORIES = ['Lunettes', 'Casquette', 'Bière', 'Barbecue', 'Couronne', 'Ballon'];
