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
}

export interface Character {
  slug: string;
  name: string;
  tagline?: string;
  color: PaletteColor;
  looks?: Look[];
  /** PNG détouré (fond transparent) pour les compositions de groupe (hero). */
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
    placeholder: { hair: 'short', glasses: true, beard: true },
    featured: true,
    looks: [
      { family: 'botefragile', image: 'images/personnages/dim/botefragile.png', bust: { cx: 50, cy: 33, zoom: 2.4 } },
      { family: 'izi-karate', image: 'images/personnages/dim/izikarate.png', bust: { cx: 51, cy: 36, zoom: 2 } },
      { family: 'gaulois', image: 'images/personnages/dim/gaulois.png', bust: { cx: 52, cy: 40, zoom: 1.8 } },
      { family: 'branquignol', image: 'images/personnages/dim/branquignol.png', bust: { cx: 46, cy: 71, zoom: 2.3 } },
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
