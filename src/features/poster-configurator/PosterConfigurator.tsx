/**
 * Configurateur d'affiche — prototype V1.
 *
 * Inspirations : sélection de personnage façon Mario Kart (grille de têtes +
 * personnage mis en avant) et flèches ‹ › façon « Cartoonize » pour changer de tenue.
 * Une « tenue » = une famille du jeu dans laquelle le copain apparaît.
 *
 * Pas encore développé : accessoires, véhicules, animations avancées, panier.
 */
import { useMemo, useState } from 'preact/hooks';
import type { Placement, PosterState, RosterEntry, Selection } from './types';
import { BACKGROUNDS, FORMATS, FRAMES, LANDSCAPE_HINT_FROM, MAX_CHARACTERS, ORIENTATIONS, UPCOMING_ACCESSORIES } from './types';
import PosterCanvas from './PosterCanvas';
import { autoLayout } from './layout';
import Standee from './Standee';
import './configurator.css';

interface Props {
  roster: RosterEntry[];
}

const STEPS = [
  { id: 'bande', label: 'La bande' },
  { id: 'style', label: 'Style' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'texte', label: 'Texte' },
  { id: 'format', label: 'Format & cadre' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

export default function PosterConfigurator({ roster }: Props) {
  const playable = roster.filter((r) => r.looks.length);
  const [step, setStep] = useState<StepId>('bande');
  const [active, setActive] = useState<string | undefined>(playable[0]?.slug);
  /** Tenue affichée pour chaque copain (même s'il n'est pas encore sur l'affiche). */
  const [looks, setLooks] = useState<Record<string, number>>({});
  const [state, setState] = useState<PosterState>({
    // Par défaut : toute la bande déjà dessinée
    selection: playable.slice(0, MAX_CHARACTERS.portrait).map((r) => ({ slug: r.slug, look: 0 })),
    background: 'bandes',
    frame: 'bois',
    format: 'A3',
    orientation: 'portrait',
    layout: null,
    title: 'La Grande Armée',
    subtitle: '',
  });

  const bySlug = useMemo(() => new Map(roster.map((r) => [r.slug, r])), [roster]);
  const current = active ? bySlug.get(active) : undefined;
  const currentLook = current ? (looks[current.slug] ?? 0) : 0;
  const onPoster = (slug: string) => state.selection.findIndex((s) => s.slug === slug);
  const max = MAX_CHARACTERS[state.orientation];
  const full = state.selection.length >= max;
  const tooMany = state.selection.length > max;
  const suggestLandscape = state.orientation === 'portrait' && state.selection.length >= LANDSCAPE_HINT_FROM;

  const update = (patch: Partial<PosterState>) => setState((s) => ({ ...s, ...patch }));

  // ── Disposition de l'affiche ──
  const [selected, setSelected] = useState<string | undefined>();
  const auto = useMemo(
    () =>
      autoLayout(
        state.selection.map((s) => {
          const l = bySlug.get(s.slug)!.looks[s.look];
          return { slug: s.slug, scale: l.cutoutScale ?? 0.65, ratio: l.cutoutRatio ?? 0.6 };
        }),
        state.orientation,
      ),
    [state.selection, state.orientation, bySlug],
  );
  // Disposition libre : les copains déjà placés gardent leur place, les nouveaux arrivent devant au centre
  const placements = useMemo(() => {
    if (!state.layout) return auto;
    const custom = state.layout;
    const zMax = Math.max(0, ...Object.values(custom).map((p) => p.z));
    const result: Record<string, Placement> = {};
    state.selection.forEach((s, i) => {
      result[s.slug] = custom[s.slug] ?? { ...auto[s.slug], x: 50, z: zMax + 1 + i };
    });
    return result;
  }, [state.layout, state.selection, auto]);

  const edit = (slug: string, patch: Partial<Placement>) =>
    setState((s) => ({ ...s, layout: { ...placements, [slug]: { ...placements[slug], ...patch } } }));
  const sel = selected && placements[selected] ? placements[selected] : undefined;
  const zValues = Object.values(placements).map((p) => p.z);
  const resize = (factor: number) => sel && edit(selected!, { h: Math.min(95, Math.max(8, sel.h * factor)) });

  const changeLook = (delta: number) => {
    if (!current) return;
    const n = current.looks.length;
    const next = (currentLook + delta + n) % n;
    setLooks((l) => ({ ...l, [current.slug]: next }));
    // Si le copain est déjà sur l'affiche, sa tenue suit.
    update({ selection: state.selection.map((s) => (s.slug === current.slug ? { ...s, look: next } : s)) });
  };

  const togglePoster = (slug: string) => {
    const idx = onPoster(slug);
    if (idx >= 0) update({ selection: state.selection.filter((s) => s.slug !== slug) });
    else if (!full) update({ selection: [...state.selection, { slug, look: looks[slug] ?? 0 }] });
    if (idx >= 0 && selected === slug) setSelected(undefined);
  };

  const autoSubtitle = state.selection.map((s) => bySlug.get(s.slug)?.name).filter(Boolean).join(', ');

  return (
    <div class="pc">
      {/* ── Aperçu ── */}
      <div class="pc__preview">
        <div class="pc__wall">
          <PosterCanvas
            state={{ ...state, subtitle: state.subtitle || autoSubtitle }}
            characters={state.selection.map((s: Selection) => ({ entry: bySlug.get(s.slug)!, look: s.look }))}
            placements={placements}
            selected={selected}
            onSelect={setSelected}
            onMove={(slug, p) => edit(slug, p)}
          />
        </div>

        {/* Barre d'édition de l'affiche */}
        <div class="pc__editbar" aria-live="polite">
          {sel ? (
            <>
              <strong class="pc__editbar-name">{bySlug.get(selected!)?.name}</strong>
              <div class="pc__editbar-tools">
                <button type="button" onClick={() => resize(1 / 1.12)} aria-label="Réduire" title="Réduire">−</button>
                <button type="button" onClick={() => resize(1.12)} aria-label="Agrandir" title="Agrandir">+</button>
                <button type="button" onClick={() => edit(selected!, { z: Math.max(...zValues) + 1 })}>Devant</button>
                <button type="button" onClick={() => edit(selected!, { z: Math.max(1, Math.min(...zValues) - 1) })}>Derrière</button>
                <button type="button" onClick={() => edit(selected!, { flip: !sel.flip })} title="Retourner">↔ Miroir</button>
                <button type="button" onClick={() => togglePoster(selected!)} title="Retirer de l'affiche">Retirer</button>
              </div>
            </>
          ) : (
            <p class="pc__editbar-hint">
              {state.selection.length ? 'Clique sur un copain de l’affiche pour le déplacer, l’agrandir ou le passer devant.' : ''}
            </p>
          )}
          {state.layout && (
            <button type="button" class="pc__editbar-reset" onClick={() => { update({ layout: null }); setSelected(undefined); }}>
              ↺ Réorganiser
            </button>
          )}
        </div>
        <p class="pc__summary">
          Affiche {state.format} {state.orientation} · {FRAMES.find((f) => f.id === state.frame)?.label} ·{' '}
          {state.selection.length} copain{state.selection.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Panneau de réglages ── */}
      <div class="pc__panel">
        <ol class="pc__steps" role="tablist">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                role="tab"
                aria-selected={step === s.id}
                class="pc__step"
                onClick={() => setStep(s.id)}
              >
                <span class="pc__step-num">{i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        <div class="pc__body" role="tabpanel">
          {step === 'bande' && (
            <section>
              {current && (
                <div class="pc__showcase" style={{ '--c': `var(--${current.looks[currentLook].familyColor})` }}>
                  <div class="pc__pedestal" aria-hidden="true" />
                  {current.looks[currentLook].cutout ? (
                    <div key={`${current.slug}-${currentLook}`} class="pc__hero">
                      <Standee
                        src={current.looks[currentLook].cutout!}
                        alt={`${current.name}, famille ${current.looks[currentLook].familyName}`}
                        color={current.looks[currentLook].familyColor}
                        familyName={current.looks[currentLook].familyName}
                        walk={current.looks[currentLook].animation === 'walk'}
                      />
                    </div>
                  ) : (
                  <div key={`${current.slug}-${currentLook}`} class="pc__hero">
                    <img
                      class={`pc__hero-img ${current.looks[currentLook].animation ? `anim-${current.looks[currentLook].animation}` : 'is-idle'}`}
                      src={current.looks[currentLook].image}
                      alt={`${current.name}, famille ${current.looks[currentLook].familyName}`}
                    />
                  </div>
                  )}
                  <div class="pc__showcase-info">
                    <h3 class="pc__name">{current.name}</h3>
                    <div class="pc__switch">
                      <button type="button" onClick={() => changeLook(-1)} aria-label="Tenue précédente" disabled={current.looks.length < 2}>
                        ‹
                      </button>
                      <span>
                        <small>Tenue</small>
                        {current.looks[currentLook].familyName}
                      </span>
                      <button type="button" onClick={() => changeLook(1)} aria-label="Tenue suivante" disabled={current.looks.length < 2}>
                        ›
                      </button>
                    </div>
                    <button
                      type="button"
                      class={`pc__toggle ${onPoster(current.slug) >= 0 ? 'is-on' : ''}`}
                      onClick={() => togglePoster(current.slug)}
                      disabled={onPoster(current.slug) < 0 && full}
                    >
                      {onPoster(current.slug) >= 0 ? '✓ Sur l’affiche — retirer' : '+ Ajouter à l’affiche'}
                    </button>
                  </div>
                </div>
              )}

              <div class="pc__roster-head">
                <h4>Choisis tes copains</h4>
                <span>
                  {state.selection.length}/{max}
                </span>
              </div>
              <ul class="pc__roster">
                {roster.map((r) => {
                  const idx = onPoster(r.slug);
                  if (!r.looks.length) {
                    return (
                      <li key={r.slug}>
                        <div class="pc__tile is-locked" title={`${r.name} — bientôt`}>
                          <span>?</span>
                        </div>
                      </li>
                    );
                  }
                  const look = r.looks[looks[r.slug] ?? 0];
                  return (
                    <li key={r.slug}>
                      <button
                        type="button"
                        class={`pc__tile ${active === r.slug ? 'is-active' : ''}`}
                        style={{ '--c': `var(--${look.familyColor})` }}
                        onClick={() => setActive(r.slug)}
                        onDblClick={() => togglePoster(r.slug)}
                        aria-pressed={active === r.slug}
                        aria-label={r.name}
                      >
                        <span class="pc__tile-img">
                          <img src={look.image} alt="" style={{ transform: look.bust }} draggable={false} />
                        </span>
                        {idx >= 0 && <span class="pc__badge">{idx + 1}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {suggestLandscape && (
                <div class="pc__tip">
                  <span>Grosse bande ? En paysage, tout le monde a plus de place (jusqu'à {MAX_CHARACTERS.paysage}).</span>
                  <button type="button" onClick={() => update({ orientation: 'paysage', layout: null })}>
                    Passer en paysage
                  </button>
                </div>
              )}
              {roster.some((r) => !r.looks.length) && (
                <p class="pc__hint">Les cases « ? » arrivent bientôt : le reste de la bande est en cours de dessin.</p>
              )}
            </section>
          )}

          {step === 'style' && (
            <section>
              <h4 class="pc__label">Fond de l'affiche</h4>
              <div class="pc__swatches">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    class={`pc__swatch pc__swatch--${b.id}`}
                    aria-pressed={state.background === b.id}
                    onClick={() => update({ background: b.id })}
                  >
                    <span class="pc__swatch-color" />
                    {b.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 'accessoires' && (
            <section>
              <h4 class="pc__label">Accessoires, vêtements, véhicules</h4>
              <p class="pc__hint">Bientôt : habille tes copains et ajoute-leur des accessoires.</p>
              <ul class="pc__accessories">
                {UPCOMING_ACCESSORIES.map((a) => (
                  <li key={a}>
                    <span>{a}</span>
                    <small>Bientôt</small>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {step === 'texte' && (
            <section class="pc__fields">
              <label>
                <span class="pc__label">Titre</span>
                <input
                  type="text"
                  maxLength={28}
                  value={state.title}
                  onInput={(e) => update({ title: (e.target as HTMLInputElement).value })}
                />
              </label>
              <label>
                <span class="pc__label">Sous-titre</span>
                <input
                  type="text"
                  maxLength={48}
                  placeholder={autoSubtitle || 'Les prénoms de la bande'}
                  value={state.subtitle}
                  onInput={(e) => update({ subtitle: (e.target as HTMLInputElement).value })}
                />
                <small>Laisse vide pour afficher automatiquement les prénoms.</small>
              </label>
            </section>
          )}

          {step === 'format' && (
            <section>
              <h4 class="pc__label">Orientation</h4>
              <div class="pc__chips">
                {ORIENTATIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    class={`pc__chip pc__chip--orient-${o.id}`}
                    aria-pressed={state.orientation === o.id}
                    onClick={() => update({ orientation: o.id, layout: null })}
                  >
                    <span class="pc__orient-icon" />
                    <strong>{o.label}</strong>
                    <small>jusqu'à {MAX_CHARACTERS[o.id]} copains</small>
                  </button>
                ))}
              </div>
              {tooMany && (
                <p class="pc__warn">
                  {state.selection.length} copains, c'est trop pour le portrait (max {max}) : passe en paysage ou retires-en quelques-uns.
                </p>
              )}
              <h4 class="pc__label">Format</h4>
              <div class="pc__chips">
                {FORMATS.map((f) => (
                  <button key={f.id} type="button" class="pc__chip" aria-pressed={state.format === f.id} onClick={() => update({ format: f.id })}>
                    <strong>{f.label}</strong>
                    <small>{f.size}</small>
                  </button>
                ))}
              </div>
              <h4 class="pc__label">Encadrement</h4>
              <div class="pc__chips">
                {FRAMES.map((f) => (
                  <button key={f.id} type="button" class={`pc__chip pc__chip--frame-${f.id}`} aria-pressed={state.frame === f.id} onClick={() => update({ frame: f.id })}>
                    <span class="pc__frame-dot" />
                    <strong>{f.label}</strong>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div class="pc__footer">
          <div>
            <small>Prix</small>
            <strong>À venir</strong>
          </div>
          <button type="button" class="pc__cart" disabled>
            Ajouter au panier · bientôt
          </button>
        </div>
      </div>
    </div>
  );
}
