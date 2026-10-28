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
  /**
   * Texte de la bulle de paroles de la carte du jeu. La bulle elle-même est le calque
   * <famille>-bulle.png (extrait de la carte d'origine), affiché dans la fiche ; ce texte en est l'alternative.
   */
  bubble?: string;
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
        bubble: 'Holà muchacho !!',
        whiteBg: true,
        bust: { cx: 52, cy: 40, zoom: 1.8 },
        cutout: 'images/personnages/dim/gaulois-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/dim/branquignol-blanc.png',
        bubble: 'Oyez oyez messieurs dames, voici le spectacle de la bougie…',
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
        bubble: 'Je check comme je vis, sans dosage',
        whiteBg: true,
        bust: { cx: 50, cy: 33, zoom: 2 },
        cutout: 'images/personnages/dim/bouffetout-cutout.png',
        video: 'images/personnages/dim/bouffetout-shaker.mp4',
      },
      {
        family: 'mignon',
        image: 'images/personnages/dim/mignon-blanc.png',
        bust: { cx: 48, cy: 37, zoom: 1.5 },
        cutout: 'images/personnages/dim/mignon-cutout.png',
      },
      {
        family: 'beauf',
        image: 'images/personnages/dim/beauf-blanc.png',
        bust: { cx: 52, cy: 42, zoom: 2.0 },
        cutout: 'images/personnages/dim/beauf-cutout.png',
        video: 'images/personnages/dim/beauf-salut.mp4',
      },
      {
        family: 'troubadour',
        image: 'images/personnages/dim/troubadour-blanc.png',
        bust: { cx: 45, cy: 37, zoom: 2.4 },
        cutout: 'images/personnages/dim/troubadour-cutout.png',
      },
    ],
  },
  {
    slug: 'guigui',
    name: 'Guigui',
    cutout: 'images/personnages/guigui/gaulois-buste-course.webp',
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
        bubble: 'Old El Paso !!!',
        whiteBg: true,
        bust: { cx: 48, cy: 35, zoom: 2 },
        cutout: 'images/personnages/guigui/izikarate-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/guigui/gaulois-blanc.png',
        bubble: 'Jeanne au secours !!!',
        whiteBg: true,
        bust: { cx: 64, cy: 38, zoom: 1.6 },
        cutout: 'images/personnages/guigui/gaulois-cutout.png',
        video: 'images/personnages/guigui/gaulois-course.mp4',
      },
      {
        family: 'joystick',
        image: 'images/personnages/guigui/joystick-blanc.png',
        bubble: 'C’est pas évident !',
        bust: { cx: 40, cy: 37, zoom: 1.8 },
        cutout: 'images/personnages/guigui/joystick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/guigui/bouffetout-blanc.png',
        bubble: 'On est pas des bêtes !!',
        bust: { cx: 50, cy: 28, zoom: 2 },
        cutout: 'images/personnages/guigui/bouffetout-cutout.png',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/guigui/gochofacho-blanc.png',
        bust: { cx: 50, cy: 30, zoom: 1.9 },
        cutout: 'images/personnages/guigui/gochofacho-cutout.png',
      },
      {
        family: 'mignon',
        image: 'images/personnages/guigui/mignon-blanc.png',
        bust: { cx: 46, cy: 26, zoom: 1.5 },
        cutout: 'images/personnages/guigui/mignon-cutout.png',
      },
      {
        family: 'beauf',
        image: 'images/personnages/guigui/beauf-blanc.png',
        bust: { cx: 69, cy: 46, zoom: 2.0 },
        cutout: 'images/personnages/guigui/beauf-cutout.png',
      },
      {
        family: 'troubadour',
        image: 'images/personnages/guigui/troubadour-blanc.png',
        bust: { cx: 50, cy: 44, zoom: 2.2 },
        cutout: 'images/personnages/guigui/troubadour-cutout.png',
      },
    ],
  },
  {
    slug: 'dauby',
    name: 'Dauby',
    cutout: 'images/personnages/dauby/izikarate-buste.webp',
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
        video: 'images/personnages/dauby/botefragile-casquette.mp4',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/dauby/gaulois-blanc.png',
        whiteBg: true,
        bust: { cx: 42, cy: 39, zoom: 1.8 },
        cutout: 'images/personnages/dauby/gaulois-cutout.png',
        video: 'images/personnages/dauby/gaulois-potion.mp4',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/dauby/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 50, cy: 41, zoom: 2 },
        cutout: 'images/personnages/dauby/izikarate-cutout.png',
        video: 'images/personnages/dauby/izikarate-kata.mp4',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/dauby/bouffetout-blanc.png',
        bubble: 'Le poivre, ce démon !',
        bust: { cx: 53, cy: 37, zoom: 2 },
        cutout: 'images/personnages/dauby/bouffetout-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/dauby/branquignol-blanc.png',
        bust: { cx: 62, cy: 33, zoom: 2.1 },
        cutout: 'images/personnages/dauby/branquignol-cutout.png',
      },
      {
        family: 'capdag',
        image: 'images/personnages/dauby/capdag-blanc.png',
        bust: { cx: 40, cy: 46, zoom: 2.4 },
        cutout: 'images/personnages/dauby/capdag-cutout.png',
      },
      {
        family: 'troubadour',
        image: 'images/personnages/dauby/troubadour-blanc.png',
        bust: { cx: 45, cy: 37, zoom: 2.4 },
        cutout: 'images/personnages/dauby/troubadour-cutout.png',
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
        bubble: 'Aïïïe j’ai mal, j’ai mal à mon orteil !!!!!',
        whiteBg: true,
        bust: { cx: 83, cy: 58, zoom: 2.4 },
        cutout: 'images/personnages/donne/botefragile-cutout.png',
        video: 'images/personnages/donne/botefragile-allonge.mp4',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/donne/branquignol-blanc.png',
        bubble: 'Pardonnez-moi mon père, j’ai fauté sur les marches sacrées',
        whiteBg: true,
        bust: { cx: 58, cy: 49, zoom: 2 },
        cutout: 'images/personnages/donne/branquignol-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/donne/izikarate-blanc.png',
        bubble: 'Heil Homer',
        whiteBg: true,
        bust: { cx: 51, cy: 40, zoom: 1.9 },
        cutout: 'images/personnages/donne/izikarate-cutout.png',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/donne/gochofacho-blanc.png',
        bust: { cx: 53, cy: 35, zoom: 1.9 },
        cutout: 'images/personnages/donne/gochofacho-cutout.png',
        video: 'images/personnages/donne/gochofacho-censure.mp4',
      },
      {
        family: 'capdag',
        image: 'images/personnages/donne/capdag-blanc.png',
        bust: { cx: 52, cy: 52, zoom: 2.4 },
        cutout: 'images/personnages/donne/capdag-cutout.png',
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
        bubble: 'La clé c’est de respirer !',
        whiteBg: true,
        bust: { cx: 37, cy: 45, zoom: 1.9 },
        cutout: 'images/personnages/lenoir/botefragile-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/lenoir/gaulois-blanc.png',
        bubble: 'Comment ça ? Il est pas frais mon poisson ?',
        whiteBg: true,
        bust: { cx: 64, cy: 44, zoom: 1.7 },
        cutout: 'images/personnages/lenoir/gaulois-cutout.png',
      },
      {
        family: 'ludick',
        image: 'images/personnages/lenoir/ludick-blanc.png',
        bubble: 'Le seul boss que j’affronte chaque soir, c’est mon propre souffle',
        whiteBg: true,
        bust: { cx: 45, cy: 40, zoom: 2 },
        cutout: 'images/personnages/lenoir/ludick-cutout.png',
      },
      {
        family: 'beauf',
        image: 'images/personnages/lenoir/beauf-blanc.png',
        bust: { cx: 64, cy: 44, zoom: 2.1 },
        cutout: 'images/personnages/lenoir/beauf-cutout.png',
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
      {
        family: 'gochofacho',
        image: 'images/personnages/aubin/gochofacho-blanc.png',
        bust: { cx: 48, cy: 38, zoom: 2.1 },
        cutout: 'images/personnages/aubin/gochofacho-cutout.png',
        video: 'images/personnages/aubin/gochofacho-marche.mp4',
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
        bubble: 'Mon foie a dénoncé l’appendice',
        whiteBg: true,
        bust: { cx: 44, cy: 35, zoom: 2 },
        cutout: 'images/personnages/coco/botefragile-cutout.png',
      },
      {
        family: 'gaulois',
        image: 'images/personnages/coco/gaulois-blanc.png',
        bubble: 'Sans potion. Sans cardio. Sans regrets.',
        whiteBg: true,
        bust: { cx: 38, cy: 52, zoom: 2 },
        cutout: 'images/personnages/coco/gaulois-cutout.png',
        video: 'images/personnages/coco/gaulois-marche.mp4',
      },
      {
        family: 'joystick',
        image: 'images/personnages/coco/joystick-blanc.png',
        bust: { cx: 54, cy: 37, zoom: 2 },
        cutout: 'images/personnages/coco/joystick-cutout.png',
        video: 'images/personnages/coco/joystick-orc.mp4',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/coco/bouffetout-blanc.png',
        bubble: 'Facile !',
        bust: { cx: 51, cy: 45, zoom: 2.2 },
        cutout: 'images/personnages/coco/bouffetout-cutout.png',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/coco/gochofacho-blanc.png',
        bust: { cx: 50, cy: 35, zoom: 1.8 },
        cutout: 'images/personnages/coco/gochofacho-cutout.png',
        video: 'images/personnages/coco/gochofacho-censure.mp4',
      },
      {
        family: 'troubadour',
        image: 'images/personnages/coco/troubadour-blanc.png',
        bust: { cx: 50, cy: 39, zoom: 2.4 },
        cutout: 'images/personnages/coco/troubadour-cutout.png',
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
        bubble: 'Pas besoin de paire !',
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
        bubble: 'Je suis mieux à pied qu’au volant d’un naufrage',
        whiteBg: true,
        bust: { cx: 42, cy: 45, zoom: 2 },
        cutout: 'images/personnages/laurent/branquignol-cutout.png',
        video: 'images/personnages/laurent/branquignol-voiture.mp4',
      },
      {
        family: 'joystick',
        image: 'images/personnages/laurent/joystick-blanc.png',
        bust: { cx: 55, cy: 39, zoom: 2.2 },
        cutout: 'images/personnages/laurent/joystick-cutout.png',
        video: 'images/personnages/laurent/joystick-casque.mp4',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/laurent/gochofacho-blanc.png',
        bust: { cx: 56, cy: 32, zoom: 2 },
        cutout: 'images/personnages/laurent/gochofacho-cutout.png',
      },
      {
        family: 'capdag',
        image: 'images/personnages/laurent/capdag-blanc.png',
        bust: { cx: 52, cy: 51, zoom: 2.4 },
        cutout: 'images/personnages/laurent/capdag-cutout.png',
      },
    ],
  },
  {
    slug: 'merlot',
    name: 'Merlot',
    cutout: 'images/personnages/merlot/gaulois-buste.webp',
    color: 'coral',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'gaulois',
        image: 'images/personnages/merlot/gaulois-blanc.png',
        bubble: 'Nasbinal tombera avant le coucher du soleil !',
        whiteBg: true,
        bust: { cx: 42, cy: 33, zoom: 2 },
        cutout: 'images/personnages/merlot/gaulois-cutout.png',
        video: 'images/personnages/merlot/gaulois-salut.mp4',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/merlot/izikarate-blanc.png',
        whiteBg: true,
        bust: { cx: 52, cy: 37, zoom: 1.9 },
        cutout: 'images/personnages/merlot/izikarate-cutout.png',
        video: 'images/personnages/merlot/izikarate-anim.mp4',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/merlot/bouffetout-blanc.png',
        bust: { cx: 51, cy: 37, zoom: 2 },
        cutout: 'images/personnages/merlot/bouffetout-cutout.png',
      },
      {
        family: 'beauf',
        image: 'images/personnages/merlot/beauf-blanc.png',
        bust: { cx: 51, cy: 62, zoom: 2.4 },
        cutout: 'images/personnages/merlot/beauf-cutout.png',
      },
    ],
  },
  {
    slug: 'nael',
    name: 'Nael',
    cutout: 'images/personnages/nael/izikarate-buste.webp',
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
        video: 'images/personnages/nael/gaulois-lyre.mp4',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/nael/izikarate-blanc.png',
        bubble: 'T’inquiètes !',
        whiteBg: true,
        bust: { cx: 50, cy: 61, zoom: 2.2 },
        cutout: 'images/personnages/nael/izikarate-cutout.png',
        video: 'images/personnages/nael/izikarate-garde.mp4',
      },
      {
        family: 'ludick',
        image: 'images/personnages/nael/ludick-blanc.png',
        bust: { cx: 34, cy: 37, zoom: 2 },
        cutout: 'images/personnages/nael/ludick-cutout.png',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/nael/gochofacho-blanc.png',
        bust: { cx: 50, cy: 55, zoom: 2.2 },
        cutout: 'images/personnages/nael/gochofacho-cutout.png',
      },
      {
        family: 'beauf',
        image: 'images/personnages/nael/beauf-blanc.png',
        bust: { cx: 45, cy: 64, zoom: 2.4 },
        cutout: 'images/personnages/nael/beauf-cutout.png',
        video: 'images/personnages/nael/beauf-danse.mp4',
      },
      {
        family: 'capdag',
        image: 'images/personnages/nael/capdag-blanc.png',
        bust: { cx: 53, cy: 60, zoom: 2.4 },
        cutout: 'images/personnages/nael/capdag-cutout.png',
      },
    ],
  },
  {
    slug: 'petit',
    name: 'Petit',
    cutout: 'images/personnages/petit/branquignol-buste-golf.webp',
    color: 'blue',
    placeholder: { hair: 'long' },
    featured: true,
    looks: [
      {
        family: 'gaulois',
        image: 'images/personnages/petit/gaulois-blanc.png',
        bubble: 'Vous savez, moi je ne crois pas qu’il y ait de bonne ou de mauvaise situation. Moi, si je devais résumer ma vie aujourd’hui avec vous, je dirais que c’est d’abord des rencontres. Des gens qui m’ont tendu la main, peut-être à un moment où je ne pouvais pas, où j’étais seul chez moi. Et c’est assez curieux de se dire que les hasards, les rencontres, forgent une destinée…',
        whiteBg: true,
        bust: { cx: 49, cy: 39, zoom: 2 },
        cutout: 'images/personnages/petit/gaulois-cutout.png',
        video: 'images/personnages/petit/gaulois-anim.mp4',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/petit/branquignol-blanc.png',
        bubble: 'Un sport où l’oseille remplace les muscles',
        whiteBg: true,
        bust: { cx: 51, cy: 39, zoom: 1.9 },
        cutout: 'images/personnages/petit/branquignol-cutout.png',
        video: 'images/personnages/petit/branquignol-golf.mp4',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/petit/gochofacho-blanc.png',
        bust: { cx: 60, cy: 35, zoom: 2.1 },
        cutout: 'images/personnages/petit/gochofacho-cutout.png',
      },
      {
        family: 'capdag',
        image: 'images/personnages/petit/capdag-blanc.png',
        bust: { cx: 52, cy: 52, zoom: 2.4 },
        cutout: 'images/personnages/petit/capdag-cutout.png',
      },
    ],
  },
  {
    slug: 'szabo',
    name: 'Szabo',
    cutout: 'images/personnages/szabo/gochofacho-buste-micro.webp',
    color: 'orange',
    placeholder: { hair: 'short' },
    featured: true,
    looks: [
      {
        family: 'branquignol',
        image: 'images/personnages/szabo/branquignol-blanc.png',
        bubble: 'Je me sèche !',
        whiteBg: true,
        bust: { cx: 45, cy: 36, zoom: 2.3 },
        cutout: 'images/personnages/szabo/branquignol-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/szabo/bouffetout-blanc.png',
        bubble: 'Pâte au poivron, recette du champion !',
        bust: { cx: 36, cy: 36, zoom: 2 },
        cutout: 'images/personnages/szabo/bouffetout-cutout.png',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/szabo/gochofacho-blanc.png',
        bust: { cx: 48, cy: 35, zoom: 2 },
        cutout: 'images/personnages/szabo/gochofacho-cutout.png',
        video: 'images/personnages/szabo/gochofacho-micro.mp4',
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
        bubble: 'Attendez, j’tente un truc',
        whiteBg: true,
        bust: { cx: 54, cy: 36, zoom: 1.7 },
        cutout: 'images/personnages/turquet/gaulois-cutout.png',
        video: 'images/personnages/turquet/gaulois-chute.mp4',
      },
      {
        family: 'botefragile',
        image: 'images/personnages/turquet/botefragile-blanc.png',
        bubble: 'Tu es plus belle que la vie elle-même',
        whiteBg: true,
        bust: { cx: 50, cy: 32, zoom: 2 },
        cutout: 'images/personnages/turquet/botefragile-cutout.png',
      },
      {
        family: 'izi-karate',
        image: 'images/personnages/turquet/izikarate-blanc.png',
        bubble: 'Tu vas pas commencer à me glonfler !',
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
      {
        family: 'gochofacho',
        image: 'images/personnages/turquet/gochofacho-blanc.png',
        bust: { cx: 48, cy: 32, zoom: 2 },
        cutout: 'images/personnages/turquet/gochofacho-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/turquet/branquignol-blanc.png',
        bubble: '38-39 des pieds comme ça, c’est pas une meuf !!!!',
        bust: { cx: 50, cy: 36, zoom: 1.8 },
        cutout: 'images/personnages/turquet/branquignol-cutout.png',
        video: 'images/personnages/turquet/branquignol-pied.mp4',
      },
      {
        family: 'beauf',
        image: 'images/personnages/turquet/beauf-blanc.png',
        bust: { cx: 56, cy: 38, zoom: 1.8 },
        cutout: 'images/personnages/turquet/beauf-cutout.png',
      },
      {
        family: 'capdag',
        image: 'images/personnages/turquet/capdag-blanc.png',
        bust: { cx: 52, cy: 54, zoom: 2.4 },
        cutout: 'images/personnages/turquet/capdag-cutout.png',
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
        bubble: 'Capitaine Fredo au rapport !',
        bust: { cx: 43, cy: 55, zoom: 2 },
        cutout: 'images/personnages/fred/ludick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/fred/bouffetout-blanc.png',
        bust: { cx: 54, cy: 34, zoom: 2 },
        cutout: 'images/personnages/fred/bouffetout-cutout.png',
        video: 'images/personnages/fred/bouffetout-cuisine.mp4',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/fred/branquignol-blanc.png',
        bubble: '♪ Dim dam talé lam vacarme, s’en va dans lumi éternam, et Gustave dôme guardéam, dilim dili lili lam, Lutèce séra dolilom séram ♪',
        bust: { cx: 50, cy: 52, zoom: 1.8 },
        cutout: 'images/personnages/fred/branquignol-cutout.png',
      },
      {
        family: 'capdag',
        image: 'images/personnages/fred/capdag-blanc.png',
        bust: { cx: 53, cy: 49, zoom: 2.4 },
        cutout: 'images/personnages/fred/capdag-cutout.png',
      },
      {
        family: 'troubadour',
        image: 'images/personnages/fred/troubadour-blanc.png',
        bust: { cx: 43, cy: 39, zoom: 2.4 },
        cutout: 'images/personnages/fred/troubadour-cutout.png',
        video: 'images/personnages/fred/troubadour-anim.mp4',
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
        video: 'images/personnages/hugo/joystick-kart.mp4',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/hugo/bouffetout-blanc.png',
        bust: { cx: 52, cy: 40, zoom: 2 },
        cutout: 'images/personnages/hugo/bouffetout-cutout.png',
      },
    ],
  },
  {
    slug: 'saby',
    name: 'Saby',
    color: 'orange',
    placeholder: { hair: 'long', beard: true },
    featured: true,
    looks: [
      {
        family: 'bouffetout',
        image: 'images/personnages/saby/bouffetout-blanc.png',
        bust: { cx: 50, cy: 36, zoom: 2 },
        cutout: 'images/personnages/saby/bouffetout-cutout.png',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/saby/gochofacho-blanc.png',
        bust: { cx: 52, cy: 37, zoom: 2 },
        cutout: 'images/personnages/saby/gochofacho-cutout.png',
      },
    ],
  },
  {
    slug: 'theo',
    name: 'Théo',
    color: 'green',
    placeholder: { hair: 'short', cap: true },
    featured: true,
    looks: [
      {
        family: 'branquignol',
        image: 'images/personnages/theo/branquignol-blanc.png',
        bubble: 'J’appelle ça une belle journée !',
        bust: { cx: 42, cy: 32, zoom: 2 },
        cutout: 'images/personnages/theo/branquignol-cutout.png',
      },
      {
        family: 'capdag',
        image: 'images/personnages/theo/capdag-blanc.png',
        bust: { cx: 49, cy: 47, zoom: 2.4 },
        cutout: 'images/personnages/theo/capdag-cutout.png',
      },
      {
        family: 'troubadour',
        image: 'images/personnages/theo/troubadour-blanc.png',
        bust: { cx: 44, cy: 42, zoom: 2.4 },
        cutout: 'images/personnages/theo/troubadour-cutout.png',
        video: 'images/personnages/theo/troubadour-epee.mp4',
      },
    ],
  },
  {
    slug: 'rene',
    name: 'René',
    color: 'purple',
    placeholder: { hair: 'bald', glasses: true, beard: true },
    looks: [
      {
        family: 'branquignol',
        image: 'images/personnages/rene/branquignol-blanc.png',
        bubble: 'Le Titanic a coulé… comme ma boîte…',
        bust: { cx: 70, cy: 44, zoom: 1.6 },
        cutout: 'images/personnages/rene/branquignol-cutout.png',
      },
    ],
  },
  {
    slug: 'momo',
    name: 'Momo',
    color: 'yellow',
    placeholder: { hair: 'spiky' },
    looks: [
      {
        family: 'botefragile',
        image: 'images/personnages/momo/botefragile-blanc.png',
        bubble: 'Oh là là…',
        bust: { cx: 50, cy: 36, zoom: 2.4 },
        cutout: 'images/personnages/momo/botefragile-cutout.png',
      },
      {
        family: 'branquignol',
        image: 'images/personnages/momo/branquignol-blanc.png',
        bust: { cx: 52, cy: 35, zoom: 2.3 },
        cutout: 'images/personnages/momo/branquignol-cutout.png',
      },
      {
        family: 'ludick',
        image: 'images/personnages/momo/ludick-blanc.png',
        bubble: 'Oh là là !!!',
        bust: { cx: 50, cy: 48, zoom: 2.2 },
        cutout: 'images/personnages/momo/ludick-cutout.png',
      },
      {
        family: 'bouffetout',
        image: 'images/personnages/momo/bouffetout-blanc.png',
        bubble: 'Oh là là',
        bust: { cx: 52, cy: 35, zoom: 2.1 },
        cutout: 'images/personnages/momo/bouffetout-cutout.png',
        video: 'images/personnages/momo/bouffetout-danse.mp4',
      },
      {
        family: 'gochofacho',
        image: 'images/personnages/momo/gochofacho-blanc.png',
        bubble: 'Oh Allah',
        bust: { cx: 47, cy: 34, zoom: 2.4 },
        cutout: 'images/personnages/momo/gochofacho-cutout.png',
      },
    ],
  },
];

export const featuredCharacters = characters.filter((c) => c.featured);
