import type { PaletteColor } from './theme';

/**
 * Personnages de La Grande Armée.
 *
 * Pour ajouter / modifier un personnage : éditer ce tableau uniquement.
 * Pour afficher une vraie illustration : déposer un PNG détouré (fond transparent)
 * dans public/images/personnages/ puis renseigner `image`, ex. 'images/personnages/le-fetard.png'.
 * Sans `image`, une silhouette provisoire est affichée.
 *
 * ⚠️ FAUX PERSONNAGES PROVISOIRES — à remplacer par les vrais personnages de l'artiste.
 */
export interface Character {
  slug: string;
  name: string;
  tagline: string;
  color: PaletteColor;
  /** Chemin relatif à /public, sans slash initial. */
  image?: string;
  /** Familles du jeu où il apparaît (Ludick, Bouffetout, Botéfragile, Gaulois…). */
  families?: string[];
  /** Réglages de la silhouette provisoire. */
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
  { slug: 'gege', name: 'Gégé', tagline: 'Personnage provisoire.', color: 'coral', placeholder: { hair: 'short', glasses: true }, featured: true },
  { slug: 'dede', name: 'Dédé', tagline: 'Personnage provisoire.', color: 'blue', placeholder: { hair: 'bald', beard: true }, featured: true },
  { slug: 'lulu', name: 'Lulu', tagline: 'Personnage provisoire.', color: 'yellow', placeholder: { hair: 'spiky' }, featured: true },
  { slug: 'momo', name: 'Momo', tagline: 'Personnage provisoire.', color: 'orange', placeholder: { hair: 'short', beard: true }, featured: true },
  { slug: 'jojo', name: 'Jojo', tagline: 'Personnage provisoire.', color: 'green', placeholder: { hair: 'short', cap: true }, featured: true },
  { slug: 'titi', name: 'Titi', tagline: 'Personnage provisoire.', color: 'purple', placeholder: { hair: 'long' }, featured: true },
  { slug: 'bebert', name: 'Bébert', tagline: 'Personnage provisoire.', color: 'cream', placeholder: { hair: 'bald', glasses: true }, featured: true },
  { slug: 'riri', name: 'Riri', tagline: 'Personnage provisoire.', color: 'blue', placeholder: { hair: 'long', glasses: true } },
];

export const featuredCharacters = characters.filter((c) => c.featured);
