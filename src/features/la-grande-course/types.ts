/** Une tenue jouable / un obstacle (images préparées par scripts/jeu-sprites.py). */
export interface CourseLook {
  /** « copain/famille », ex. turquet/gaulois. */
  key: string;
  slug: string;
  name: string;
  familyName: string;
  /** Couleur de fond des cartes de la famille. */
  bg: string;
  sprite: string;
  head: string;
  /** Largeur / hauteur du personnage détouré. */
  ratio: number;
}

export interface CourseCharacter {
  slug: string;
  name: string;
  /** Vignette tête + buste pour l'écran de choix. */
  portrait: string;
  portraitTransform: string;
  portraitBg: string;
  looks: CourseLook[];
}
