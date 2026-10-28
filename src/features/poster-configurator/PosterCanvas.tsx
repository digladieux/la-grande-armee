/**
 * Rendu de l'affiche (aperçu) — éditable.
 * Chaque copain (et chaque accessoire) est un calque positionné en % de la feuille (voir Placement) :
 * clic = sélection, glisser = déplacer. Les réglages (taille, devant/derrière,
 * miroir) sont dans la barre d'outils du configurateur.
 */
import PosterTitle from './PosterTitle';
import { useRef } from 'preact/hooks';
import type { Placement, PosterState, RosterEntry } from './types';

interface Props {
  state: PosterState;
  characters: { entry: RosterEntry; look: number }[];
  /** Accessoires posés (key = clé dans placements, src = URL finale). */
  accessories: { key: string; label: string; src: string }[];
  placements: Record<string, Placement>;
  selected?: string;
  onSelect: (slug: string | undefined) => void;
  onMove: (slug: string, placement: Placement) => void;
}

/** Largeur relative de l'affiche selon le format, pour rendre la différence de taille visible. */
const SCALE = { A5: 0.7, A4: 0.84, A3: 1 } as const;

export default function PosterCanvas({ state, characters, accessories, placements, selected, onSelect, onMove }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ slug: string; x0: number; y0: number; start: Placement; moved: boolean } | null>(null);

  const onPointerDown = (slug: string) => (e: PointerEvent) => {
    e.stopPropagation();
    const p = placements[slug];
    if (!p) return;
    // Au doigt, un copain non sélectionné laisse défiler la page : un premier toucher le sélectionne,
    // on peut ensuite le faire glisser (sinon, impossible de faire défiler la page sur téléphone)
    if (e.pointerType !== 'mouse' && selected !== slug) {
      onSelect(slug);
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { slug, x0: e.clientX, y0: e.clientY, start: p, moved: false };
    onSelect(slug);
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    const sheet = sheetRef.current;
    if (!d || !sheet) return;
    const r = sheet.getBoundingClientRect();
    const dx = ((e.clientX - d.x0) / r.width) * 100;
    const dy = ((e.clientY - d.y0) / r.height) * 100;
    if (Math.abs(dx) + Math.abs(dy) > 0.5) d.moved = true;
    onMove(d.slug, {
      ...d.start,
      x: Math.min(100, Math.max(0, d.start.x + dx)),
      y: Math.min(100, Math.max(d.start.h * 0.3, d.start.y + dy)),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (slug: string) => (e: KeyboardEvent) => {
    const p = placements[slug];
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = moves[e.key];
    if (!p || !m) return;
    e.preventDefault();
    onMove(slug, { ...p, x: p.x + m[0], y: p.y + m[1] });
  };

  return (
    <div
      class={`poster-frame poster-frame--${state.frame} poster-frame--${state.orientation}`}
      style={{ '--scale': SCALE[state.format] }}
    >
      <div class="poster-mat">
        <div
          ref={sheetRef}
          class={`poster-sheet poster-sheet--${state.background} poster-sheet--${state.orientation}`}
          onPointerDown={() => onSelect(undefined)}
        >
          <div class="poster-sheet__title">
            <PosterTitle title={state.title} base={import.meta.env.BASE_URL.replace(/\/?$/, '/')} maxChars={state.orientation === 'paysage' ? 18 : 11} />
            {state.showSubtitle && state.subtitle && <span>{state.subtitle}</span>}
          </div>

          {characters.length === 0 && <p class="poster-sheet__empty">Choisis tes copains →</p>}

          {characters.map(({ entry, look }, i) => {
            const l = entry.looks[look];
            const p = placements[entry.slug];
            if (!p) return null;
            return (
              <button
                key={entry.slug}
                type="button"
                class={`poster-member ${selected === entry.slug ? 'is-selected' : ''}`}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  height: `${p.h}%`,
                  zIndex: p.z,
                  '--i': i,
                }}
                onPointerDown={onPointerDown(entry.slug)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown(entry.slug)}
                onFocus={() => onSelect(entry.slug)}
                aria-label={`${entry.name} : déplacer (glisser ou flèches du clavier)`}
                aria-pressed={selected === entry.slug}
              >
                <img
                  class={`poster-member__img ${l.cutout ? 'is-cutout' : 'is-flat'}`}
                  style={{ transform: p.flip ? 'scaleX(-1)' : undefined }}
                  src={l.cutout ?? l.image}
                  alt=""
                  draggable={false}
                />
              </button>
            );
          })}

          {accessories.map(({ key, label, src }, i) => {
            const p = placements[key];
            if (!p) return null;
            return (
              <button
                key={key}
                type="button"
                class={`poster-member poster-member--accessory ${selected === key ? 'is-selected' : ''}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, height: `${p.h}%`, zIndex: p.z, '--i': characters.length + i }}
                onPointerDown={onPointerDown(key)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown(key)}
                onFocus={() => onSelect(key)}
                aria-label={`${label} : déplacer (glisser ou flèches du clavier)`}
                aria-pressed={selected === key}
              >
                <img
                  class="poster-member__img is-cutout"
                  style={{ transform: p.flip ? 'scaleX(-1)' : undefined }}
                  src={src}
                  alt=""
                  draggable={false}
                />
              </button>
            );
          })}

          {state.showBrand && <p class="poster-sheet__brand">La Grande Armée</p>}
        </div>
      </div>
    </div>
  );
}
