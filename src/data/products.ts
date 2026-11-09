/** Emplacements produits provisoires pour le teaser boutique. */
export interface Product {
  slug: string;
  name: string;
  price?: string;
  image?: string;
  tag?: string;
  /** Page du produit (par défaut : la boutique). */
  href?: string;
  /** Page Boutique (catalogue) : présentation, ce qui est proposé, bouton. */
  description?: string;
  details?: string[];
  cta?: { label: string; href: string };
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
    description:
      "Tu choisis tes copains, leur tenue, le fond et le format : l'affiche se compose sous tes yeux, puis part à l'impression en haute définition.",
    details: ['A5, A4 ou A3, en portrait ou en paysage', 'Accessoires, titre et sous-titre à ton goût', "Des modèles tout faits si t'as la flemme"],
    cta: { label: 'Créer mon affiche', href: '/creer-mon-affiche' },
  },
  {
    slug: 'affiche-bande',
    name: 'Affiche « La bande »',
    tag: 'Bientôt',
    color: 'green',
    image: 'images/boutique/affiche-la-bande-vignette.webp',
    href: '/boutique/affiche-la-bande',
    description:
      'Toute la Grande Armée réunie sur une seule grande affiche : les copains dans toutes leurs tenues, empilés joyeusement sur les bandes pastel.',
    details: ['Format panoramique', 'Tous les copains, toutes les familles', "Assez de détails pour s'y chercher longtemps"],
    cta: { label: "Voir l'affiche", href: '/boutique/affiche-la-bande' },
  },
  {
    slug: 'goodies',
    name: 'Goodies & autocollants',
    tag: 'Bientôt',
    color: 'coral',
    description: 'Des autocollants et quelques petites surprises à l\'effigie de la bande, pour coller la Grande Armée partout.',
    details: ['En préparation', 'Les têtes des copains en autocollants'],
  },
  {
    slug: 'jeu-7-familles',
    name: 'Le jeu des 7 familles',
    tag: 'Le jeu',
    color: 'purple',
    image: 'images/boutique/jeu-7-familles.webp',
    description:
      "Le jeu de cartes qui a tout lancé : chaque copain dessiné dans chacune de ses familles. Il faut réunir la famille complète… et assumer qui on pioche.",
    details: ['Le jeu des 7 familles d\'origine', 'Toutes les illustrations de la bande'],
    cta: { label: 'Voir les personnages', href: '/personnages' },
  },
];
