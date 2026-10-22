import type { PaletteColor } from './theme';

/**
 * Familles du jeu des 7 familles.
 * Un même copain peut apparaître dans plusieurs familles (voir `looks` dans characters.ts).
 */
export interface Family {
  name: string;
  /** Couleur pastel de l'identité du site (teintes des vignettes, configurateur). */
  color: PaletteColor;
  /** Couleur exacte du fond des cartes du jeu de cette famille (encart « Famille », pastilles). */
  bg: string;
}

export const families = {
  botefragile: { name: 'Botéfragile', color: 'blue', bg: '#BDDDF2' },
  branquignol: { name: 'Branquignol', color: 'coral', bg: '#F8A08E' },
  gaulois: { name: 'Gaulois', color: 'green', bg: '#8FC178' },
  'izi-karate': { name: 'Izi Karaté', color: 'yellow', bg: '#FFFFEA' },
  ludick: { name: 'Ludick', color: 'purple', bg: '#C0A1FF' },
  bouffetout: { name: 'Bouffetout', color: 'orange', bg: '#FFBA75' },
  joystick: { name: 'Joystick', color: 'pink', bg: '#C0A1FF' },
  gochofacho: { name: 'Gaucho Facho', color: 'teal', bg: '#F6E894' },
  mignon: { name: 'Minion', color: 'blue', bg: '#89B9E0' },
  beauf: { name: 'Beauf', color: 'pink', bg: '#EDB6CF' },
  capdag: { name: 'Capdag', color: 'teal', bg: '#98D7D5' },
  troubadour: { name: 'Troubadour', color: 'purple', bg: '#6973B3' },
} satisfies Record<string, Family>;

export type FamilyId = keyof typeof families;
