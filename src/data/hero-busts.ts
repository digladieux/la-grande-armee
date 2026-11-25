import type { FamilyId } from './families';

/**
 * Bustes animés de l'accueil (WebP animés, voir scripts/video/buste_suivi.py).
 * À chaque chargement de page, 7 bustes sont tirés au sort (un copain différent par buste).
 */
export interface HeroBust {
  slug: string;
  name: string;
  family: FamilyId;
  src: string;
  /**
   * Échelle pour que toutes les têtes aient la même taille (visage mesuré dans le buste,
   * scripts : détection macOS Vision ; à défaut, d'après le zoom de scripts/video/bustes.json).
   */
  k: number;
  /** Centre du visage dans le buste (% largeur, % hauteur) : point fixe de la mise à l'échelle. */
  o: [number, number];
}

export const heroBusts: HeroBust[] = [
  { slug: 'dim', name: 'Dim', family: 'botefragile', src: 'images/personnages/dim/botefragile-buste-marche.webp', k: 1.07, o: [50, 30] },
  { slug: 'dim', name: 'Dim', family: 'bouffetout', src: 'images/personnages/dim/bouffetout-buste-shaker.webp', k: 1.06, o: [49, 29] },
  { slug: 'dauby', name: 'Dauby', family: 'izi-karate', src: 'images/personnages/dauby/izikarate-buste.webp', k: 0.98, o: [51, 30] },
  { slug: 'dauby', name: 'Dauby', family: 'botefragile', src: 'images/personnages/dauby/botefragile-buste-casquette.webp', k: 0.98, o: [50, 30] },
  { slug: 'guigui', name: 'Guigui', family: 'gaulois', src: 'images/personnages/guigui/gaulois-buste-course.webp', k: 1.30, o: [47, 41] },
  { slug: 'merlot', name: 'Merlot', family: 'gaulois', src: 'images/personnages/merlot/gaulois-buste.webp', k: 1.18, o: [63, 43] },
  { slug: 'nael', name: 'Naël', family: 'izi-karate', src: 'images/personnages/nael/izikarate-buste.webp', k: 0.99, o: [50, 30] },
  { slug: 'petit', name: 'Petit', family: 'branquignol', src: 'images/personnages/petit/branquignol-buste-golf.webp', k: 0.98, o: [50, 30] },
  { slug: 'szabo', name: 'Szabo', family: 'gochofacho', src: 'images/personnages/szabo/gochofacho-buste-micro.webp', k: 0.95, o: [50, 30] },
  { slug: 'momo', name: 'Momo', family: 'bouffetout', src: 'images/personnages/momo/bouffetout-buste-danse.webp', k: 1.05, o: [50, 30] },
  { slug: 'laurent', name: 'Laurent', family: 'joystick', src: 'images/personnages/laurent/joystick-buste-casque.webp', k: 1.00, o: [50, 30] },
  { slug: 'nael', name: 'Naël', family: 'gaulois', src: 'images/personnages/nael/gaulois-buste-lyre.webp', k: 0.94, o: [50, 30] },
  { slug: 'turquet', name: 'Turquet', family: 'branquignol', src: 'images/personnages/turquet/branquignol-buste-pied.webp', k: 1.00, o: [50, 30] },
  { slug: 'donne', name: 'Donné', family: 'gochofacho', src: 'images/personnages/donne/gochofacho-buste-censure.webp', k: 1.30, o: [39, 37] },
  { slug: 'coco', name: 'Coco', family: 'gochofacho', src: 'images/personnages/coco/gochofacho-buste-censure.webp', k: 1.30, o: [47, 41] },
  { slug: 'aubin', name: 'Aubin', family: 'gochofacho', src: 'images/personnages/aubin/gochofacho-buste-marche.webp', k: 1.30, o: [47, 39] },
  { slug: 'coco', name: 'Coco', family: 'gaulois', src: 'images/personnages/coco/gaulois-buste-marche.webp', k: 1.28, o: [50, 38] },
  { slug: 'dim', name: 'Dim', family: 'beauf', src: 'images/personnages/dim/beauf-buste-salut.webp', k: 0.95, o: [49, 31] },
  { slug: 'fred', name: 'Fred', family: 'troubadour', src: 'images/personnages/fred/troubadour-buste.webp', k: 1.10, o: [50, 30] },
  { slug: 'guigui', name: 'Guigui', family: 'botefragile', src: 'images/personnages/guigui/botefragile-buste-perceuse.webp', k: 0.99, o: [50, 30] },
  { slug: 'merlot', name: 'Merlot', family: 'izi-karate', src: 'images/personnages/merlot/izikarate-buste-anim.webp', k: 1.06, o: [51, 30] },
  { slug: 'petit', name: 'Petit', family: 'gaulois', src: 'images/personnages/petit/gaulois-buste.webp', k: 1.00, o: [50, 30] },
  { slug: 'theo', name: 'Théo', family: 'troubadour', src: 'images/personnages/theo/troubadour-buste-epee.webp', k: 1.00, o: [50, 30] },
  { slug: 'coco', name: 'Coco', family: 'bouffetout', src: 'images/personnages/coco/bouffetout-buste-anim.webp', k: 1.18, o: [49, 30] },
  { slug: 'coco', name: 'Coco', family: 'troubadour', src: 'images/personnages/coco/troubadour-buste-anim.webp', k: 1.01, o: [50, 30] },
  { slug: 'dauby', name: 'Dauby', family: 'branquignol', src: 'images/personnages/dauby/branquignol-buste-anim.webp', k: 0.85, o: [51, 30] },
  { slug: 'dauby', name: 'Dauby', family: 'gaulois', src: 'images/personnages/dauby/gaulois-buste-potion.webp', k: 1.00, o: [50, 30] },
  { slug: 'dim', name: 'Dim', family: 'troubadour', src: 'images/personnages/dim/troubadour-buste-anim.webp', k: 1.08, o: [51, 28] },
  { slug: 'fred', name: 'Fred', family: 'bouffetout', src: 'images/personnages/fred/bouffetout-buste-cuisine.webp', k: 1.05, o: [50, 30] },
  { slug: 'fred', name: 'Fred', family: 'gaulois', src: 'images/personnages/fred/gaulois-buste-anim.webp', k: 0.87, o: [50, 30] },
  { slug: 'guigui', name: 'Guigui', family: 'gochofacho', src: 'images/personnages/guigui/gochofacho-buste-anim.webp', k: 1.22, o: [51, 30] },
  { slug: 'laurent', name: 'Laurent', family: 'branquignol', src: 'images/personnages/laurent/branquignol-buste-voiture.webp', k: 1.03, o: [50, 30] },
  { slug: 'laurent', name: 'Laurent', family: 'izi-karate', src: 'images/personnages/laurent/izikarate-buste-anim.webp', k: 1.04, o: [50, 30] },
  { slug: 'momo', name: 'Momo', family: 'ludick', src: 'images/personnages/momo/ludick-buste-anim.webp', k: 0.97, o: [51, 30] },
  { slug: 'nael', name: 'Naël', family: 'beauf', src: 'images/personnages/nael/beauf-buste-danse.webp', k: 0.96, o: [51, 30] },
  { slug: 'nael', name: 'Naël', family: 'gochofacho', src: 'images/personnages/nael/gochofacho-buste-anim.webp', k: 1.16, o: [49, 30] },
  { slug: 'turquet', name: 'Turquet', family: 'beauf', src: 'images/personnages/turquet/beauf-buste-anim.webp', k: 0.99, o: [50, 30] },
  { slug: 'dim', name: 'Dim', family: 'gaulois', src: 'images/personnages/dim/gaulois-buste-anim.webp', k: 1.00, o: [50, 30] },
  { slug: 'dim', name: 'Dim', family: 'izi-karate', src: 'images/personnages/dim/izikarate-buste-danse.webp', k: 0.96, o: [50, 30] },
  { slug: 'donne', name: 'Donné', family: 'branquignol', src: 'images/personnages/donne/branquignol-buste-anim.webp', k: 0.92, o: [51, 42] },
  { slug: 'turquet', name: 'Turquet', family: 'gaulois', src: 'images/personnages/turquet/gaulois-buste-chute.webp', k: 1.00, o: [50, 30] },
  { slug: 'turquet', name: 'Turquet', family: 'izi-karate', src: 'images/personnages/turquet/izikarate-buste-anim.webp', k: 1.00, o: [50, 30] },
];
