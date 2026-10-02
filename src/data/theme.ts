/** Couleurs pastel de l'identité (reprises des bandes diagonales du jeu). */
export const palette = {
  yellow: '#F8DF7E',
  coral: '#F6A48E',
  green: '#93CD8F',
  purple: '#C7A4F3',
  blue: '#A8D4F2',
  orange: '#F8B46A',
  cream: '#FBF2C8',
  pink: '#F5B8D6',
  teal: '#9FDCD0',
} as const;

export type PaletteColor = keyof typeof palette;
