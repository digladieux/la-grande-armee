export interface NavItem {
  label: string;
  href: string;
}

export const mainNav: NavItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Personnages', href: '/personnages' },
  { label: 'Créer mon affiche', href: '/creer-mon-affiche' },
  { label: 'Quiz', href: '/quiz' },
  { label: 'Boutique', href: '/boutique' },
];

export const legalNav: NavItem[] = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Confidentialité', href: '/confidentialite' },
];

/** Renseigner les URLs quand les comptes existent (laisser vide = lien masqué-préparé). */
export const socialLinks = [
  { label: 'Instagram', href: '', icon: 'instagram' },
  { label: 'TikTok', href: '', icon: 'tiktok' },
  { label: 'Facebook', href: '', icon: 'facebook' },
] as const;
