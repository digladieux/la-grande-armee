export interface NavItem {
  label: string;
  href: string;
}

export const mainNav: NavItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Personnages', href: '/personnages' },
  { label: 'Créer mon affiche', href: '/creer-mon-affiche' },
  { label: 'Jeux', href: '/jeux' },
  { label: 'Boutique', href: '/boutique' },
];

export const legalNav: NavItem[] = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Confidentialité', href: '/confidentialite' },
];
