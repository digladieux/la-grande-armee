/** Emplacements produits provisoires pour le teaser boutique. */
export interface Product {
  slug: string;
  name: string;
  price?: string;
  image?: string;
  tag?: string;
  color: import('./theme').PaletteColor;
}

export const teaserProducts: Product[] = [
  { slug: 'jeu-7-familles', name: 'Le jeu des 7 familles', tag: 'Le jeu', color: 'purple' },
  { slug: 'affiche-perso', name: 'Affiche personnalisée', tag: 'Sur mesure', color: 'yellow' },
  { slug: 'affiche-bande', name: 'Affiche « La bande »', tag: 'Bientôt', color: 'green' },
  { slug: 'goodies', name: 'Goodies & autocollants', tag: 'Bientôt', color: 'coral' },
];
