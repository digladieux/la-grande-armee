/**
 * Configurateur d'affiche — prototype V1.
 *
 * Inspirations : sélection de personnage façon Mario Kart (grille de têtes +
 * personnage mis en avant) et flèches ‹ › façon « Cartoonize » pour changer de tenue.
 * Une « tenue » = une famille du jeu dans laquelle le copain apparaît.
 *
 * Accessoires : calques posés sur l'affiche comme les copains (clé « acc:<id> »).
 * Pas encore développé : vêtements, véhicules, animations avancées.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Placement, PosterState, RosterEntry, Selection } from './types';
import { ACCESSORIES, BACKGROUNDS, FORMATS, FRAMES, LANDSCAPE_HINT_FROM, MAX_CHARACTERS, ORIENTATIONS, UPCOMING_ACCESSORIES } from './types';
import PosterCanvas from './PosterCanvas';
import { ALIGNED_MAX, autoLayout } from './layout';
import Standee from './Standee';
import { ajouterAuPanier } from '../commande/panier';
import type { Recette } from '../commande/recette';
import './configurator.css';

interface Props {
  roster: RosterEntry[];
}

const STEPS = [
  { id: 'bande', label: 'La bande' },
  { id: 'style', label: 'Style' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'texte', label: 'Texte' },
  { id: 'format', label: 'Format' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

/** Les accessoires partagent la sélection / le déplacement des copains, sous la clé « acc:<id> ». */
const ACC = 'acc:';
const accessoryById = new Map(ACCESSORIES.map((a) => [a.id, a]));

/** Copains debout d'abord (tenue par défaut peu large) : affiche de départ bien alignée. */
function defaultSelection(roster: RosterEntry[], count: number): Selection[] {
  const playable = roster.filter((r) => r.looks.length);
  const standing = playable.filter((r) => (r.looks[0].cutoutRatio ?? 0.6) < 0.9);
  const others = playable.filter((r) => !standing.includes(r));
  return [...standing, ...others].slice(0, count).map((r) => ({ slug: r.slug, look: 0 }));
}

export default function PosterConfigurator({ roster }: Props) {
  const playable = roster.filter((r) => r.looks.length);
  /** Tant que l'utilisateur n'a pas choisi ses copains, l'affiche de départ suit l'orientation. */
  const [pickedByUser, setPickedByUser] = useState(false);
  const [step, setStep] = useState<StepId>('bande');
  // Parcours guidé : on avance étape par étape ; une étape n'est accessible qu'une fois les précédentes vues
  const [reached, setReached] = useState(0);
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const goToStep = (i: number) => {
    if (i > reached) return;
    setStep(STEPS[i].id);
  };
  const nextStep = () => {
    const i = Math.min(STEPS.length - 1, stepIndex + 1);
    setReached((r) => Math.max(r, i));
    setStep(STEPS[i].id);
    document.querySelector('.pc__panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  const allSeen = reached >= STEPS.length - 1;
  const [active, setActive] = useState<string | undefined>(playable[0]?.slug);
  /** Tenue affichée pour chaque copain (même s'il n'est pas encore sur l'affiche). */
  const [looks, setLooks] = useState<Record<string, number>>({});
  const [state, setState] = useState<PosterState>({
    // Affiche de départ : 3 copains debout, alignés (5 en paysage)
    selection: defaultSelection(roster, ALIGNED_MAX.portrait),
    background: 'bandes',
    // Seule l'affiche est fournie : le cadre n'est qu'un aperçu, désactivé par défaut
    frame: 'sans',
    format: 'A3',
    orientation: 'portrait',
    layout: null,
    title: 'La Grande Armée',
    subtitle: '',
    showSubtitle: false,
    showBrand: true,
    accessories: {},
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
  const [ajoute, setAjoute] = useState(false);
  const [big, setBig] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openBig = () => setBig(true);
  const closeBig = () => setBig(false);
  useEffect(() => {
    if (!big) return;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeBig();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [big]);
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

  // Copains + accessoires : tout ce qui se sélectionne et se déplace sur l'affiche
  const allPlacements = useMemo(() => {
    const result: Record<string, Placement> = { ...placements };
    for (const [id, p] of Object.entries(state.accessories)) result[ACC + id] = p;
    return result;
  }, [placements, state.accessories]);

  const edit = (key: string, patch: Partial<Placement>) => {
    if (key.startsWith(ACC)) {
      const id = key.slice(ACC.length);
      setState((s) => ({ ...s, accessories: { ...s.accessories, [id]: { ...s.accessories[id], ...patch } } }));
    } else setState((s) => ({ ...s, layout: { ...placements, [key]: { ...placements[key], ...patch } } }));
  };
  const sel = selected && allPlacements[selected] ? allPlacements[selected] : undefined;
  const zValues = Object.values(allPlacements).map((p) => p.z);
  const resize = (factor: number) => sel && edit(selected!, { h: Math.min(95, Math.max(8, sel.h * factor)) });

  /** Ajoute l'accessoire en bas de l'affiche (à gauche, puis à droite…), ou le retire. */
  const toggleAccessory = (id: string) => {
    const { [id]: present, ...rest } = state.accessories;
    if (present) {
      update({ accessories: rest });
      if (selected === ACC + id) setSelected(undefined);
      return;
    }
    const n = Object.keys(state.accessories).length;
    const x = n % 2 ? 82 - (n >> 1) * 8 : 18 + (n >> 1) * 8;
    const z = Math.max(0, ...zValues) + 1;
    update({ accessories: { ...state.accessories, [id]: { x, y: 94, h: accessoryById.get(id)!.h, z } } });
    setSelected(ACC + id);
  };

  const changeLook = (delta: number) => {
    if (!current) return;
    const n = current.looks.length;
    const next = (currentLook + delta + n) % n;
    setLooks((l) => ({ ...l, [current.slug]: next }));
    // Si le copain est déjà sur l'affiche, sa tenue suit.
    update({ selection: state.selection.map((s) => (s.slug === current.slug ? { ...s, look: next } : s)) });
  };

  const setOrientation = (orientation: PosterState['orientation']) =>
    update({
      orientation,
      layout: null,
      ...(pickedByUser ? {} : { selection: defaultSelection(roster, ALIGNED_MAX[orientation]) }),
    });

  const togglePoster = (slug: string) => {
    setPickedByUser(true);
    const idx = onPoster(slug);
    if (idx >= 0) update({ selection: state.selection.filter((s) => s.slug !== slug) });
    else if (!full) update({ selection: [...state.selection, { slug, look: looks[slug] ?? 0 }] });
    if (idx >= 0 && selected === slug) setSelected(undefined);
  };


  // Panier : on enregistre la « recette » de l'affiche (redessinée en HD pour l'impression)
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const addToCart = () => {
    const recette: Recette = {
      v: 1,
      orientation: state.orientation,
      background: state.background,
      frame: state.frame,
      title: state.title,
      subtitle: state.subtitle,
      showSubtitle: state.showSubtitle,
      showBrand: state.showBrand,
      members: state.selection.flatMap((s) => {
        const entry = bySlug.get(s.slug);
        const look = entry?.looks[s.look];
        const p = placements[s.slug];
        if (!entry || !look || !p) return [];
        const src = (look.cutout ?? look.image).replace(base, '').replace(/^\//, '');
        return [{ name: entry.name, family: look.familyName, src, p }];
      }),
      accessories: Object.entries(state.accessories).flatMap(([id, p]) => {
        const a = accessoryById.get(id);
        return a ? [{ name: a.label, family: '', src: a.src, p }] : [];
      }),
    };
    ajouterAuPanier(recette, state.format);
    setAjoute(true);
  };

  // Affiche + barre d'outils : affichées dans la page et dans l'aperçu en grand
  const renderCanvas = () => (
    <PosterCanvas
      state={state}
      characters={state.selection.map((s: Selection) => ({ entry: bySlug.get(s.slug)!, look: s.look }))}
      accessories={Object.keys(state.accessories).flatMap((id) => {
        const a = accessoryById.get(id);
        return a ? [{ key: ACC + id, label: a.label, src: base + a.src }] : [];
      })}
      placements={allPlacements}
      selected={selected}
      onSelect={setSelected}
      onMove={(slug, p) => edit(slug, p)}
    />
  );
  const renderEditBar = () => (
    <div class="pc__editbar" aria-live="polite">
      {sel ? (
        <>
          <strong class="pc__editbar-name">
            {selected!.startsWith(ACC) ? accessoryById.get(selected!.slice(ACC.length))?.label : bySlug.get(selected!)?.name}
          </strong>
          <div class="pc__editbar-tools">
            <button type="button" onClick={() => resize(1 / 1.12)} aria-label="Réduire" title="Réduire">−</button>
            <button type="button" onClick={() => resize(1.12)} aria-label="Agrandir" title="Agrandir">+</button>
            <button type="button" onClick={() => edit(selected!, { z: Math.max(...zValues) + 1 })}>Devant</button>
            <button type="button" onClick={() => edit(selected!, { z: Math.max(1, Math.min(...zValues) - 1) })}>Derrière</button>
            <button type="button" onClick={() => edit(selected!, { flip: !sel.flip })} title="Retourner">↔ Miroir</button>
            <button
              type="button"
              onClick={() => (selected!.startsWith(ACC) ? toggleAccessory(selected!.slice(ACC.length)) : togglePoster(selected!))}
              title="Retirer de l'affiche"
            >
              Retirer
            </button>
          </div>
        </>
      ) : (
        <p class="pc__editbar-hint">
          {state.selection.length || Object.keys(state.accessories).length
            ? 'Touche un copain ou un accessoire de l’affiche pour le sélectionner, puis fais-le glisser, agrandis-le ou passe-le devant.'
            : ''}
        </p>
      )}
      {state.layout && (
        <button type="button" class="pc__editbar-reset" onClick={() => { update({ layout: null }); setSelected(undefined); }}>
          ↺ Réorganiser
        </button>
      )}
    </div>
  );

  return (
    <div class="pc">
      {/* ── Aperçu ── */}
      <div class="pc__preview">
        <div class="pc__wall">
          {renderCanvas()}
          <button type="button" class="pc__zoom" onClick={openBig}>
            ⤢ Aperçu en grand
          </button>
        </div>

        {!big && renderEditBar()}
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
                class={`pc__step ${i < reached && step !== s.id ? 'is-done' : ''}`}
                onClick={() => goToStep(i)}
                disabled={i > reached}
                title={i > reached ? 'Termine d’abord les étapes précédentes' : undefined}
              >
                <span class="pc__step-num">{i < reached && step !== s.id ? '✓' : i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        <div class="pc__body" role="tabpanel">
          {step === 'bande' && (
            <section>
              {current && (
                <div class="pc__showcase" style={{ '--c': current.looks[currentLook].familyBg }}>
                  {current.looks[currentLook].cutout ? (
                    <div key={`${current.slug}-${currentLook}`} class="pc__hero">
                      <Standee
                        src={current.looks[currentLook].cutout!}
                        alt={`${current.name}, famille ${current.looks[currentLook].familyName}`}
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
                  {/* Prénom en étiquette par-dessus : toujours lisible, quelle que soit la taille du dessin */}
                  <h3 class="pc__name">{current.name}</h3>
                  <div class="pc__showcase-info">
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
                        style={{ '--c': look.familyBg }}
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
                  <button type="button" onClick={() => setOrientation('paysage')}>
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
              <h4 class="pc__label">Accessoires</h4>
              <p class="pc__hint">Ajoute-les à l’affiche, puis place-les à la main : glisse-les près d’un copain, agrandis-les, retourne-les.</p>
              <ul class="pc__accessories">
                {ACCESSORIES.map((a) => {
                  const on = a.id in state.accessories;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        class={`pc__accessory ${on ? 'is-on' : ''}`}
                        aria-pressed={on}
                        onClick={() => toggleAccessory(a.id)}
                      >
                        <img src={base + a.src} alt="" draggable={false} />
                        <span>{a.label}</span>
                        <small>{on ? '✓ Ajouté' : '+ Ajouter'}</small>
                      </button>
                    </li>
                  );
                })}
                {UPCOMING_ACCESSORIES.map((a) => (
                  <li key={a} class="is-upcoming">
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
              <label class="pc__check">
                <input
                  type="checkbox"
                  checked={state.showSubtitle}
                  onChange={(e) => update({ showSubtitle: (e.target as HTMLInputElement).checked })}
                />
                <span>Ajouter un sous-titre</span>
              </label>
              {state.showSubtitle && (
                <label>
                  <span class="pc__label">Sous-titre</span>
                  <input
                    type="text"
                    maxLength={48}
                    placeholder="Ex. : Promo 2026, Les copains d'abord…"
                    value={state.subtitle}
                    onInput={(e) => update({ subtitle: (e.target as HTMLInputElement).value })}
                  />
                </label>
              )}
              <label class="pc__check">
                <input
                  type="checkbox"
                  checked={state.showBrand}
                  onChange={(e) => update({ showBrand: (e.target as HTMLInputElement).checked })}
                />
                <span>Afficher « La Grande Armée » en bas de l'affiche</span>
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
                    onClick={() => setOrientation(o.id)}
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
              <h4 class="pc__label">Aperçu encadré</h4>
              <p class="pc__hint">
                Tu reçois l’affiche imprimée seule, sans cadre. Ces cadres servent juste à imaginer le rendu une fois encadrée chez toi.
              </p>
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

        {ajoute && (
          <div class="pc__added" role="status">
            <span>✓ Affiche ajoutée au panier</span>
            <a href={`${base}panier`}>Voir le panier →</a>
            <button type="button" onClick={() => setAjoute(false)} aria-label="Fermer">×</button>
          </div>
        )}
        <div class="pc__footer">
          <div>
            <small>Prix</small>
            <strong>À venir</strong>
          </div>
          <div class="pc__footer-actions">
            <button type="button" class="pc__check" onClick={openBig}>
              Vérifier en grand
            </button>
            {stepIndex < STEPS.length - 1 ? (
              <button type="button" class="pc__cart" onClick={nextStep} disabled={!state.selection.length}>
                Étape suivante : {STEPS[stepIndex + 1].label} →
              </button>
            ) : (
              <button type="button" class="pc__cart" onClick={addToCart} disabled={!state.selection.length || !allSeen}>
                Ajouter au panier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Aperçu en grand (avant impression) : l'affiche reste éditable ── */}
      {big && (
        <div class={`pc-big pc-big--${state.orientation}`} role="dialog" aria-modal="true" aria-label="Aperçu en grand de l'affiche">
          <div class="pc-big__top">
            <p class="pc-big__title">
              Aperçu avant impression <span>· {state.format} {state.orientation}</span>
            </p>
            <button type="button" class="pc-big__close" onClick={closeBig} ref={closeRef}>
              ✕ Fermer
            </button>
          </div>
          <div class="pc-big__stage" onPointerDown={(e) => e.target === e.currentTarget && setSelected(undefined)}>
            {renderCanvas()}
          </div>
          <div class="pc-big__bar">{renderEditBar()}</div>
        </div>
      )}
    </div>
  );
}
