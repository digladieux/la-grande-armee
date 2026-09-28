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
 * `placeholder` : silhouette SVG utilisée dans le hero tant que le copain n'a pas de buste détouré (`cutout`).
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
    color: 'coral',
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
      {
        family: 'izi-karate',
        image: 'images/personnages/guigui/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 48, cy: 35, zoom: 2 },
        cutout: 'images/personnages/guigui/izikarate-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/guigui/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 64, cy: 38, zoom: 1.6 },
        cutout: 'images/personnages/guigui/gaulois-cutout.png',
      },
      {
        family: 'joystick',
        image: 'images/personnages/guigui/joystick-blanc.png',
        bust: { cx: 40, cy: 37, zoom: 1.8 },
        cutout: 'images/personnages/guigui/joystick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/guigui/bouffetout-blanc.png',
        bust: { cx: 50, cy: 28, zoom: 2 },
        cutout: 'images/personnages/guigui/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'dauby',
    name: 'Dauby',
    color: 'green',
    placeholder: { hair: 'bald', beard: true },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/dauby/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 44, cy: 32, zoom: 2 },
        cutout: 'images/personnages/dauby/botefragile-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/dauby/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 42, cy: 39, zoom: 1.8 },
        cutout: 'images/personnages/dauby/gaulois-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/dauby/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 50, cy: 41, zoom: 2 },
        cutout: 'images/personnages/dauby/izikarate-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/dauby/bouffetout-blanc.png',
        bust: { cx: 53, cy: 37, zoom: 2 },
        cutout: 'images/personnages/dauby/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'donne',
    name: 'Donné',
    color: 'yellow',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/donne/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 83, cy: 58, zoom: 2.4 },
        cutout: 'images/personnages/donne/botefragile-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/donne/branquignol-blanc.png',
        whiteBg: true,
        bust: { cx: 58, cy: 49, zoom: 2 },
        cutout: 'images/personnages/donne/branquignol-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/donne/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 51, cy: 40, zoom: 1.9 },
        cutout: 'images/personnages/donne/izikarate-cutout.png',
      },
    ],
  },
  {
    slug: 'lenoir',
    name: 'Lenoir',
    color: 'purple',
    placeholder: { hair: 'short', beard: true },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/lenoir/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 37, cy: 45, zoom: 1.9 },
        cutout: 'images/personnages/lenoir/botefragile-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/lenoir/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 64, cy: 44, zoom: 1.7 },
        cutout: 'images/personnages/lenoir/gaulois-cutout.png',
      },
      {
        family: 'ludick',
        image: 'images/personnages/lenoir/ludick-blanc.png',
        whiteBg: true,
        bust: { cx: 45, cy: 40, zoom: 2 },
        cutout: 'images/personnages/lenoir/ludick-cutout.png',
      },
    ],
  },
  {
    slug: 'aubin',
    name: 'Aubin',
    color: 'orange',
    placeholder: { hair: 'short', beard: true },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/aubin/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 73, cy: 47, zoom: 2.2 },
        cutout: 'images/personnages/aubin/botefragile-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/aubin/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 30, cy: 62, zoom: 1.6 },
        cutout: 'images/personnages/aubin/izikarate-cutout.png',
      },
      {
        family: 'joystick',
        image: 'images/personnages/aubin/joystick-blanc.png',
        bust: { cx: 46, cy: 44, zoom: 2.2 },
        cutout: 'images/personnages/aubin/joystick-cutout.png',
      },
    ],
  },
  {
    slug: 'coco',
    name: 'Coco',
    color: 'green',
    placeholder: { hair: 'short', beard: true },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/coco/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 44, cy: 35, zoom: 2 },
        cutout: 'images/personnages/coco/botefragile-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/coco/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 38, cy: 52, zoom: 2 },
        cutout: 'images/personnages/coco/gaulois-cutout.png',
      },
      {
        family: 'joystick',
        image: 'images/personnages/coco/joystick-blanc.png',
        bust: { cx: 54, cy: 37, zoom: 2 },
        cutout: 'images/personnages/coco/joystick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/coco/bouffetout-blanc.png',
        bust: { cx: 51, cy: 45, zoom: 2.2 },
        cutout: 'images/personnages/coco/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'laurent',
    name: 'Laurent',
    color: 'yellow',
    placeholder: { hair: 'short', glasses: true },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/laurent/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 59, cy: 41, zoom: 2 },
        cutout: 'images/personnages/laurent/botefragile-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/laurent/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 50, cy: 37, zoom: 1.9 },
        cutout: 'images/personnages/laurent/izikarate-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/laurent/branquignol-blanc.png',
        whiteBg: true,
        bust: { cx: 42, cy: 45, zoom: 2 },
        cutout: 'images/personnages/laurent/branquignol-cutout.png',
      },
      {
        family: 'joystick',
        image: 'images/personnages/laurent/joystick-blanc.png',
        bust: { cx: 55, cy: 39, zoom: 2.2 },
        cutout: 'images/personnages/laurent/joystick-cutout.png',
      },
    ],
  },
  {
    slug: 'merlot',
    name: 'Merlot',
    color: 'coral',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'gaulois',
        image: 'images/personnages/merlot/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 42, cy: 33, zoom: 2 },
        cutout: 'images/personnages/merlot/gaulois-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/merlot/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 52, cy: 37, zoom: 1.9 },
        cutout: 'images/personnages/merlot/izikarate-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/merlot/bouffetout-blanc.png',
        bust: { cx: 51, cy: 37, zoom: 2 },
        cutout: 'images/personnages/merlot/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'nael',
    name: 'Nael',
    color: 'purple',
    placeholder: { hair: 'short', beard: true },
    featured: true,
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/nael/botefragile-blanc.png',
        whiteBg: true,
        bust: { cx: 57, cy: 36, zoom: 2 },
        cutout: 'images/personnages/nael/botefragile-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/nael/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 51, cy: 47, zoom: 1.8 },
        cutout: 'images/personnages/nael/gaulois-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/nael/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 50, cy: 61, zoom: 2.2 },
        cutout: 'images/personnages/nael/izikarate-cutout.png',
      },
      {
        family: 'ludick',
        image: 'images/personnages/nael/ludick-blanc.png',
        bust: { cx: 34, cy: 37, zoom: 2 },
        cutout: 'images/personnages/nael/ludick-cutout.png',
      },
    ],
  },
  {
    slug: 'petit',
    name: 'Petit',
    color: 'blue',
    placeholder: { hair: 'long' },
    featured: true,
    looks: [
      {
        family: 'gaulois',
        image: 'images/personnages/petit/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 49, cy: 39, zoom: 2 },
        cutout: 'images/personnages/petit/gaulois-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/petit/branquignol-blanc.png',
        whiteBg: true,
        bust: { cx: 51, cy: 39, zoom: 1.9 },
        cutout: 'images/personnages/petit/branquignol-cutout.png',
      },
    ],
  },
  {
    slug: 'szabo',
    name: 'Szabo',
    color: 'orange',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'branquignol',
        image: 'images/personnages/szabo/branquignol-blanc.png',
        whiteBg: true,
        bust: { cx: 45, cy: 36, zoom: 2.3 },
        cutout: 'images/personnages/szabo/branquignol-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/szabo/bouffetout-blanc.png',
        bust: { cx: 36, cy: 36, zoom: 2 },
        cutout: 'images/personnages/szabo/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'turquet',
    name: 'Turquet',
    color: 'yellow',
    placeholder: { hair: 'spiky' },
    featured: true,
    looks: [
      {
        family: 'gaulois',
        image: 'images/personnages/turquet/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 54, cy: 36, zoom: 1.7 },
        cutout: 'images/personnages/turquet/gaulois-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/turquet/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 47, cy: 40, zoom: 2 },
        cutout: 'images/personnages/turquet/izikarate-cutout.png',
      },
      {
        family: 'joystick',
        image: 'images/personnages/turquet/joystick-blanc.png',
        bust: { cx: 50, cy: 45, zoom: 1.9 },
        cutout: 'images/personnages/turquet/joystick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/turquet/bouffetout-blanc.png',
        bust: { cx: 50, cy: 36, zoom: 2 },
        cutout: 'images/personnages/turquet/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'fred',
    name: 'Fred',
    color: 'green',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'izi-karate',
        image: 'images/personnages/fred/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 48, cy: 40, zoom: 1.8 },
        cutout: 'images/personnages/fred/izikarate-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/fred/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 49, cy: 41, zoom: 1.8 },
        cutout: 'images/personnages/fred/gaulois-cutout.png',
      },
      {
        family: 'ludick',
        image: 'images/personnages/fred/ludick-blanc.png',
        bust: { cx: 43, cy: 55, zoom: 2 },
        cutout: 'images/personnages/fred/ludick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/fred/bouffetout-blanc.png',
        bust: { cx: 54, cy: 34, zoom: 2 },
        cutout: 'images/personnages/fred/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'hugo',
    name: 'Hugo',
    color: 'pink',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'joystick',
        image: 'images/personnages/hugo/joystick-blanc.png',
        bust: { cx: 42, cy: 50, zoom: 1.8 },
        cutout: 'images/personnages/hugo/joystick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/hugo/bouffetout-blanc.png',
        bust: { cx: 52, cy: 40, zoom: 2 },
        cutout: 'images/personnages/hugo/bouffetout-cutout.png',
      },
    ],
  },
];

export const featuredCharacters = characters.filter((c) => c.featured);
