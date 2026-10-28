/** Mélange de Fisher-Yates (copie) : chaque ordre a la même chance de sortir. */
export function melanger<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Remet les enfants d'un élément dans un ordre aléatoire (à chaque chargement de page). */
export function melangerEnfants(parent: Element) {
  parent.append(...melanger([...parent.children]));
}
