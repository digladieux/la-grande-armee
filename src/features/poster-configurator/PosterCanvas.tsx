/** Rendu de l'affiche (aperçu). Les illustrations ont un fond clair : `multiply` le fond dans le décor. */
import type { PosterState, RosterEntry } from './types';

interface Props {
  state: PosterState;
  characters: { entry: RosterEntry; look: number }[];
}

/** Largeur relative de l'affiche selon le format, pour rendre la différence de taille visible. */
const SCALE = { A4: 0.78, A3: 0.9, A2: 1 } as const;

export default function PosterCanvas({ state, characters }: Props) {
  const n = characters.length;
  return (
    <div class={`poster-frame poster-frame--${state.frame}`} style={{ '--scale': SCALE[state.format] }}>
      <div class="poster-mat">
        <div class={`poster-sheet poster-sheet--${state.background}`}>
          <div class="poster-sheet__title">
            <strong>{state.title || 'La Grande Armée'}</strong>
            {state.subtitle && <span>{state.subtitle}</span>}
          </div>

          <div class="poster-sheet__crew" style={{ '--n': Math.max(n, 1) }}>
            {n === 0 ? (
              <p class="poster-sheet__empty">Choisis tes copains →</p>
            ) : (
              characters.map(({ entry, look }, i) => (
                <img
                  key={`${entry.slug}-${look}`}
                  class="poster-sheet__member"
                  style={{ '--i': i, zIndex: n - Math.abs(i - (n - 1) / 2) }}
                  src={entry.looks[look].image}
                  alt={`${entry.name}, famille ${entry.looks[look].familyName}`}
                />
              ))
            )}
          </div>

          <p class="poster-sheet__brand">La Grande Armée</p>
        </div>
      </div>
    </div>
  );
}
