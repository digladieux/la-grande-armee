/**
 * Rendu de l'affiche (aperçu).
 * - Personnages détourés (`cutout`) : tous à la même hauteur, côte à côte en se chevauchant ;
 *   si la bande est trop large, elle est réduite pour tenir dans l'affiche.
 * - Sans détourage : illustration pleine, fondue dans le décor (multiply + masque).
 */
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { PosterState, RosterEntry } from './types';

interface Props {
  state: PosterState;
  characters: { entry: RosterEntry; look: number }[];
}

/** Largeur relative de l'affiche selon le format, pour rendre la différence de taille visible. */
const SCALE = { A4: 0.78, A3: 0.9, A2: 1 } as const;

export default function PosterCanvas({ state, characters }: Props) {
  const n = characters.length;
  // Le plus grand personnage occupe toute la hauteur ; les autres gardent leur échelle relative
  const scaleOf = (c: Props['characters'][number]) => c.entry.looks[c.look].cutoutScale ?? 1;
  const tallest = Math.max(...characters.map(scaleOf), 0.01);
  const crewRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, h: 0 });

  // Réduit la bande si elle dépasse la largeur de l'affiche
  const measure = () => {
    const crew = crewRef.current;
    const row = rowRef.current;
    if (!crew || !row) return;
    const scale = Math.min(1, crew.clientWidth / Math.max(row.scrollWidth, 1));
    setFit({ scale, h: crew.clientHeight });
  };
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (crewRef.current) ro.observe(crewRef.current);
    return () => ro.disconnect();
  }, [n, state.orientation, state.format, characters.map((c) => `${c.entry.slug}${c.look}`).join()]);

  return (
    <div
      class={`poster-frame poster-frame--${state.frame} poster-frame--${state.orientation}`}
      style={{ '--scale': SCALE[state.format] }}
    >
      <div class="poster-mat">
        <div class={`poster-sheet poster-sheet--${state.background} poster-sheet--${state.orientation}`}>
          <div class="poster-sheet__title">
            <strong>{state.title || 'La Grande Armée'}</strong>
            {state.subtitle && <span>{state.subtitle}</span>}
          </div>

          <div class="poster-sheet__crew" ref={crewRef} style={{ '--crew-h': `${fit.h}px` }}>
            {n === 0 ? (
              <p class="poster-sheet__empty">Choisis tes copains →</p>
            ) : (
              <div class="poster-sheet__row" ref={rowRef} style={{ transform: `scale(${fit.scale})` }}>
                {characters.map(({ entry, look }, i) => {
                  const l = entry.looks[look];
                  return (
                    <img
                      key={`${entry.slug}-${look}`}
                      class={`poster-sheet__member ${l.cutout ? 'is-cutout' : 'is-flat'}`}
                      style={{
                        '--i': i,
                        zIndex: n - Math.abs(i - (n - 1) / 2),
                        height: l.cutout ? `${(100 * scaleOf({ entry, look })) / tallest}%` : '100%',
                      }}
                      src={l.cutout ?? l.image}
                      alt={`${entry.name}, famille ${l.familyName}`}
                      onLoad={measure}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <p class="poster-sheet__brand">La Grande Armée</p>
        </div>
      </div>
    </div>
  );
}
