import type { PaletteColor } from './theme';

/**
 * Familles du jeu des 7 familles.
 * Un même copain peut apparaître dans plusieurs familles (voir `looks` dans characters.ts).
 */
export interface Family {
  name: string;
  color: PaletteColor;
}

export const families = {
  botefragile: { name: 'Botéfragile', color: 'blue' },
  branquignol: { name: 'Branquignol', color: 'coral' },
  gaulois: { name: 'Gaulois', color: 'green' },
  'izi-karate': { name: 'Izi Karaté', color: 'yellow' },
  ludick: { name: 'Ludick', color: 'purple' },
  bouffetout: { name: 'Bouffetout', color: 'orange' },
  joystick: { name: 'Joystick', color: 'pink' },
} satisfies Record<string, Family>;

export type FamilyId = keyof typeof families;
