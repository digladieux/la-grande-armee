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
  /** Correction de taille (1 = normal) pour que les têtes paraissent toutes de la même taille. */
  scale?: number;
}

export const heroBusts: HeroBust[] = [
  { slug: 'dim', name: 'Dim', family: 'botefragile', src: 'images/personnages/dim/botefragile-buste-marche.webp' },
  { slug: 'dim', name: 'Dim', family: 'bouffetout', src: 'images/personnages/dim/bouffetout-buste-shaker.webp' },
  { slug: 'dauby', name: 'Dauby', family: 'izi-karate', src: 'images/personnages/dauby/izikarate-buste.webp' },
  { slug: 'dauby', name: 'Dauby', family: 'botefragile', src: 'images/personnages/dauby/botefragile-buste-casquette.webp', scale: 1.1 },
  { slug: 'guigui', name: 'Guigui', family: 'gaulois', src: 'images/personnages/guigui/gaulois-buste-course.webp' },
  { slug: 'merlot', name: 'Merlot', family: 'gaulois', src: 'images/personnages/merlot/gaulois-buste.webp', scale: 1.1 },
  { slug: 'nael', name: 'Naël', family: 'izi-karate', src: 'images/personnages/nael/izikarate-buste.webp', scale: 1.1 },
  { slug: 'petit', name: 'Petit', family: 'branquignol', src: 'images/personnages/petit/branquignol-buste-golf.webp' },
  { slug: 'szabo', name: 'Szabo', family: 'gochofacho', src: 'images/personnages/szabo/gochofacho-buste-micro.webp', scale: 0.85 },
  { slug: 'momo', name: 'Momo', family: 'bouffetout', src: 'images/personnages/momo/bouffetout-buste-danse.webp', scale: 0.75 },
  { slug: 'laurent', name: 'Laurent', family: 'joystick', src: 'images/personnages/laurent/joystick-buste-casque.webp', scale: 0.75 },
  { slug: 'nael', name: 'Naël', family: 'gaulois', src: 'images/personnages/nael/gaulois-buste-lyre.webp', scale: 0.79 },
  { slug: 'turquet', name: 'Turquet', family: 'branquignol', src: 'images/personnages/turquet/branquignol-buste-pied.webp', scale: 0.85 },
  { slug: 'donne', name: 'Donné', family: 'gochofacho', src: 'images/personnages/donne/gochofacho-buste-censure.webp', scale: 1.15 },
  { slug: 'coco', name: 'Coco', family: 'gochofacho', src: 'images/personnages/coco/gochofacho-buste-censure.webp', scale: 1.15 },
  { slug: 'aubin', name: 'Aubin', family: 'gochofacho', src: 'images/personnages/aubin/gochofacho-buste-marche.webp', scale: 1.15 },
  { slug: 'coco', name: 'Coco', family: 'gaulois', src: 'images/personnages/coco/gaulois-buste-marche.webp' },
  { slug: 'dim', name: 'Dim', family: 'beauf', src: 'images/personnages/dim/beauf-buste-salut.webp' },
  { slug: 'fred', name: 'Fred', family: 'troubadour', src: 'images/personnages/fred/troubadour-buste.webp', scale: 0.92 },
  { slug: 'guigui', name: 'Guigui', family: 'botefragile', src: 'images/personnages/guigui/botefragile-buste-perceuse.webp', scale: 0.92 },
  { slug: 'merlot', name: 'Merlot', family: 'izi-karate', src: 'images/personnages/merlot/izikarate-buste-anim.webp' },
  { slug: 'petit', name: 'Petit', family: 'gaulois', src: 'images/personnages/petit/gaulois-buste.webp', scale: 0.85 },
  { slug: 'theo', name: 'Théo', family: 'troubadour', src: 'images/personnages/theo/troubadour-buste-epee.webp' },
];
