import type { Character } from '@/data/characters';
import { families, type FamilyId } from '@/data/families';

/**
 * Choisit la tenue affichée sur chaque carte d'une liste, pour alterner les
 * couleurs de famille : jamais la même couleur que la carte précédente, et
 * de préférence la couleur la moins utilisée jusque-là.
 * Renvoie, pour chaque personnage, l'index du look à afficher.
 *
 * `prefer` : familles à mettre en avant (ex. les nouvelles) ; parmi elles, tirage au sort
 * à chaque construction du site.
 */
export function pickCovers(characters: Character[], prefer: FamilyId[] = []): Map<string, number> {
  const covers = new Map<string, number>();
  const used = new Map<string, number>();
  let previous: string | undefined;

  for (const c of characters) {
    const looks = c.looks ?? [];
    if (!looks.length) continue;
    const ranked = looks
      .map((look, index) => ({
        index,
        color: families[look.family].color,
        preferred: prefer.includes(look.family),
        luck: Math.random(),
      }))
      .sort(
        (a, b) =>
          Number(a.color === previous) - Number(b.color === previous) ||
          Number(b.preferred) - Number(a.preferred) ||
          (used.get(a.color) ?? 0) - (used.get(b.color) ?? 0) ||
          (a.preferred && b.preferred ? a.luck - b.luck : a.index - b.index),
      );
    const pick = ranked[0];
    covers.set(c.slug, pick.index);
    used.set(pick.color, (used.get(pick.color) ?? 0) + 1);
    previous = pick.color;
  }
  return covers;
}
