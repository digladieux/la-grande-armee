import type { PaletteColor } from './theme';
import type { FamilyId } from './families';
import type { Crop } from '@/lib/crop';

/**
 * Personnages de La Grande Armée.
 *
 * Un personnage = un copain. Il peut « incarner » plusieurs personnages du jeu,
 * un par famille : ce sont ses `looks`.
 *
 * Ajouter un look :
 *  1. déposer l'illustration dans public/images/personnages/<copain>/<famille>.png
 *     (noms de fichiers sans accents ni espaces) ;
 *  2. ajouter une entrée dans `looks` avec la famille et le cadrage `bust`
 *     (centre cx/cy en % de l'image + zoom) utilisé pour les vignettes tête + buste.
 *
 * Les copains sans `looks` sont de FAUX PERSONNAGES PROVISOIRES (silhouettes SVG).
 */
export interface Look {
  family: FamilyId;
  /** Chemin relatif à /public, sans slash initial. */
  image: string;
  /** Rôle dans la famille (le père, le cousin…). */
  role?: string;
  bust: Crop;
  /** Illustration sur fond blanc (fondue dans les décors clairs de l'affiche). */
  whiteBg?: boolean;
  /** Vidéo MP4 en boucle (marche, danse…) jouée dans la fiche personnage. Fond clair, fondu en CSS. */
  video?: string;
  /** PNG détouré de ce look : active la figurine en carton dans le configurateur. */
  cutout?: string;
  /** Animation légère appliquée à l'illustration (voir .anim-* dans global.css). */
  animation?: 'walk';
}

export interface Character {
  slug: string;
  name: string;
  tagline?: string;
  color: PaletteColor;
  looks?: Look[];
  /**
   * Buste détouré (fond transparent) pour la composition de groupe du hero, cadré en 200×280.
   * Peut être animé : WebP animé généré depuis une vidéo (voir scripts/video/).
   */
  cutout?: string;
  /** Réglages de la silhouette provisoire (utilisée tant qu'il n'y a pas de `cutout`). */
  placeholder?: {
    hair?: 'short' | 'spiky' | 'bald' | 'long';
    cap?: boolean;
    glasses?: boolean;
    beard?: boolean;
  };
  /** Mis en avant sur la home (hero + carousel). */
  featured?: boolean;
}

export const characters: Character[] = [
  {
    slug: 'dim',
    name: 'Dim',
    color: 'blue',
    cutout: 'images/personnages/dim/botefragile-buste-marche.webp',
    placeholder: { hair: 'short', glasses: true, beard: true },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/dim/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 50, cy: 33, zoom: 2.4 },
        cutout: 'images/personnages/dim/botefragile-cutout.png',
        video: 'images/personnages/dim/botefragile-marche.mp4',
        animation: 'walk',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/dim/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 51, cy: 36, zoom: 2 },
        cutout: 'images/personnages/dim/izikarate-cutout.png',
        video: 'images/personnages/dim/izikarate-danse.mp4',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/dim/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 52, cy: 40, zoom: 1.8 },
        cutout: 'images/personnages/dim/gaulois-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/dim/branquignol-blanc.png',
        whiteBg: true,
        bust: { cx: 46, cy: 71, zoom: 2.3 },
        cutout: 'images/personnages/dim/branquignol-cutout.png',
      },
      {
        family: 'ludick',
        image: 'images/personnages/dim/ludick-blanc.png',
        whiteBg: true,
        bust: { cx: 50, cy: 36, zoom: 2 },
        cutout: 'images/personnages/dim/ludick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/dim/bouffetout-blanc.png',
        whiteBg: true,
        bust: { cx: 50, cy: 33, zoom: 2 },
        cutout: 'images/personnages/dim/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'guigui',
    name: 'Guigui',
    color: 'blue',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/guigui/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 45, cy: 41, zoom: 1.9 },
        cutout: 'images/personnages/guigui/botefragile-cutout.png',
        video: 'images/personnages/guigui/botefragile-perceuse.mp4',
      },
    ],
  },
  { slug: 'dede', name: 'Dédé', tagline: 'Personnage provisoire.', color: 'blue', placeholder: { hair: 'bald', beard: true }, featured: true },
  { slug: 'lulu', name: 'Lulu', tagline: 'Personnage provisoire.', color: 'yellow', placeholder: { hair: 'spiky' }, featured: true },
  { slug: 'momo', name: 'Momo', tagline: 'Personnage provisoire.', color: 'orange', placeholder: { hair: 'short', beard: true }, featured: true },
  { slug: 'jojo', name: 'Jojo', tagline: 'Personnage provisoire.', color: 'green', placeholder: { hair: 'short', cap: true }, featured: true },
  { slug: 'titi', name: 'Titi', tagline: 'Personnage provisoire.', color: 'purple', placeholder: { hair: 'long' }, featured: true },
  { slug: 'bebert', name: 'Bébert', tagline: 'Personnage provisoire.', color: 'cream', placeholder: { hair: 'bald', glasses: true }, featured: true },
  { slug: 'riri', name: 'Riri', tagline: 'Personnage provisoire.', color: 'blue', placeholder: { hair: 'long', glasses: true } },
];

export const featuredCharacters = characters.filter((c) => c.featured);
