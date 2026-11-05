/** Emplacements produits provisoires pour le teaser boutique. */
export interface Product {
  slug: string;
  name: string;
  price?: string;
  image?: string;
  tag?: string;
  /** Page du produit (par défaut : la boutique). */
  href?: string;
  color: import('./theme').PaletteColor;
}

export const teaserProducts: Product[] = [
  {
    slug: 'affiche-perso',
    name: 'Affiche personnalisée',
    tag: 'Sur mesure',
    color: 'yellow',
    image: 'images/boutique/affiche-izi-karate.webp',
    href: '/creer-mon-affiche',
  },
  {
    slug: 'affiche-bande',
    name: 'Affiche « La bande »',
    tag: 'Bientôt',
    color: 'green',
    image: 'images/boutique/affiche-la-bande-vignette.webp',
    href: '/boutique/affiche-la-bande',
  },
  { slug: 'goodies', name: 'Goodies & autocollants', tag: 'Bientôt', color: 'coral' },
  {
    slug: 'jeu-7-familles',
    name: 'Le jeu des 7 familles',
    tag: 'Le jeu',
    color: 'purple',
    image: 'images/boutique/jeu-7-familles.webp',
  },
];
