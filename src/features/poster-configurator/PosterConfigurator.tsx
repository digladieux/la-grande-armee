/**
 * Configurateur d'affiche — prototype V1.
 *
 * Inspirations : sélection de personnage façon Mario Kart (grille de têtes +
 * personnage mis en avant) et flèches ‹ › façon « Cartoonize » pour changer de tenue.
 * Une « tenue » = une famille du jeu dans laquelle le copain apparaît.
 *
 * Accessoires : calques posés sur l'affiche comme les copains (clé « acc:<id> »).
 * Un copain peut être posé plusieurs fois, une fois par tenue (clé « slug~n », voir keyOf).
 * Les affiches « un copain dans toutes ses familles » sont proposées toutes faites (ModelesAffiches).
 * Pas encore développé : vêtements, véhicules, animations avancées.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Placement, PosterState, RosterEntry, Selection } from './types';
import { ACCESSORIES, BACKGROUNDS, FORMATS, FRAMES, LANDSCAPE_HINT_FROM, MAX_CHARACTERS, ORIENTATIONS, keyOf } from './types';
import PosterCanvas from './PosterCanvas';
import { autoLayout } from './layout';
import Standee from './Standee';
import { ajouterAuPanier, ecrirePanier, lirePanier, lireProjets, sauverProjet } from '../commande/panier';
import { decodeRecette, type PrintFormat, type Recette } from '../commande/recette';
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

export default function PosterConfigurator({ roster }: Props) {
  const playable = roster.filter((r) => r.looks.length);
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
    // Affiche de départ vide : « Choisis tes copains → » invite à cliquer sur un copain
    selection: [],
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

  // Retouche d'un modèle « T'as la flemme ? » (réservé à Elora) : ?retouche=<famille>&r=<recette>
  // ouvre le modèle tel quel ; « Copier pour Claude » renvoie les nouvelles positions.
  const [retouche, setRetouche] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  // Modifier une affiche déjà dans le panier : ?modifier=<id de l'article> ; « Mettre à jour » la remplace
  const [modifier, setModifier] = useState<string | null>(null);
  /** Affiche sauvegardée en cours (rouverte depuis « Mes affiches sauvegardées ») : la sauvegarder la remplace. */
  const [projet, setProjet] = useState<string | null>(null);
  const [sauve, setSauve] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get('retouche');
    const idPanier = q.get('modifier');
    const idProjet = q.get('projet');
    const article = idPanier
      ? lirePanier().find((a) => a.id === idPanier)
      : idProjet
        ? lireProjets().find((a) => a.id === idProjet)
        : undefined;
    const r = article ? article.recette : id && q.get('r') ? decodeRecette(q.get('r')!) : null;
    if ((!id && !article) || !r) return;
    const selection: Selection[] = [];
    const layout: Record<string, Placement> = {};
    for (const m of r.members) {
      const slug = m.src.split('/')[2];
      const entry = bySlug.get(slug);
      const decor = m.src.endsWith('-scene.png');
      const look = entry?.looks.findIndex((l) => (decor ? l.scene?.src : l.cutout ?? l.image)?.endsWith(m.src)) ?? -1;
      if (!entry || look < 0) continue;
      const n = selection.filter((x) => x.slug === slug).length;
      const sel: Selection = { slug, look, ...(n ? { key: `${slug}~${n + 1}` } : {}), ...(decor ? { decor } : {}) };
      selection.push(sel);
      layout[keyOf(sel)] = m.p;
    }
    // Accessoires du modèle (tracteur, bière…), retrouvés par leur image
    const accessories: Record<string, Placement> = {};
    for (const a of r.accessories ?? []) {
      const acc = ACCESSORIES.find((x) => a.src.endsWith(x.src));
      if (acc) accessories[acc.id] = a.p;
    }
    setState((s) => ({
      ...s,
      selection,
      layout,
      accessories,
      orientation: r.orientation,
      background: r.background,
      title: r.title,
      subtitle: r.subtitle,
      showSubtitle: r.showSubtitle,
      showBrand: r.showBrand,
      couleur: r.couleur,
      ...(article ? { format: article.format as PosterState['format'] } : {}),
    }));
    setReached(STEPS.length - 1);
    if (article && idPanier) setModifier(article.id);
    else if (article) setProjet(article.id);
    else setRetouche(id);
  }, []);
  const copierPourClaude = async () => {
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const members = state.selection.flatMap((s) => {
      const look = bySlug.get(s.slug)?.looks[s.look];
      const p = placements[keyOf(s)];
      if (!look || !p) return [];
      const src = visuel(s).src.replace(base, '').replace(/^\//, '');
      return [{ src, p: { x: r2(p.x), y: r2(p.y), h: r2(p.h), z: p.z, ...(p.flip ? { flip: true } : {}) } }];
    });
    const accessoires = Object.entries(state.accessories).map(([id, p]) => ({
      id,
      p: { x: r2(p.x), y: r2(p.y), h: r2(p.h), z: p.z, ...(p.flip ? { flip: true } : {}) },
    }));
    const texte = `Retouche du modèle « ${retouche} » :\n${JSON.stringify({ modele: retouche, members, ...(accessoires.length ? { accessoires } : {}) })}`;
    try {
      await navigator.clipboard.writeText(texte);
    } catch {
      window.prompt('Copie ce texte et colle-le à Claude :', texte);
    }
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  };
  const current = active ? bySlug.get(active) : undefined;
  const currentLook = current ? (looks[current.slug] ?? 0) : 0;
  const onPoster = (slug: string) => state.selection.findIndex((s) => s.slug === slug);
  /** Tenues de ce copain déjà sur l'affiche. */
  const instances = (slug: string) => state.selection.filter((s) => s.slug === slug);
  const lookOnPoster = (slug: string, look: number) => state.selection.find((s) => s.slug === slug && s.look === look);
  /** Image posée sur l'affiche : le détourage, ou la scène « avec le décor de la carte ». */
  const visuel = (s: Selection) => {
    const l = bySlug.get(s.slug)!.looks[s.look];
    if (s.decor && l.scene) return { src: l.scene.src, scale: l.scene.scale, ratio: l.scene.ratio };
    return { src: l.cutout ?? l.image, scale: l.cutoutScale ?? 0.65, ratio: l.cutoutRatio ?? 0.6 };
  };
  /** Copain d'un calque (clé « slug » ou « slug~n »). */
  const slugOf = (key: string) => key.split('~')[0];
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
          const v = visuel(s);
          return { slug: keyOf(s), scale: v.scale, ratio: v.ratio };
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
      const k = keyOf(s);
      result[k] = custom[k] ?? { ...auto[k], x: 50, z: zMax + 1 + i };
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

  /** Place de départ du n-ième accessoire : en bas de l'affiche, à gauche puis à droite, de plus en plus vers le centre. */
  const placeAccessoire = (n: number, id: string) => ({
    x: n % 2 ? 82 - (n >> 1) * 8 : 18 + (n >> 1) * 8,
    y: 94,
    h: accessoryById.get(id)!.h,
  });
  /** Ajoute l'accessoire en bas de l'affiche (à gauche, puis à droite…), ou le retire. */
  const toggleAccessory = (id: string) => {
    const { [id]: present, ...rest } = state.accessories;
    if (present) {
      update({ accessories: rest });
      if (selected === ACC + id) setSelected(undefined);
      return;
    }
    const z = Math.max(0, ...zValues) + 1;
    update({ accessories: { ...state.accessories, [id]: { ...placeAccessoire(Object.keys(state.accessories).length, id), z } } });
    setSelected(ACC + id);
  };

  const changeLook = (delta: number) => {
    if (!current) return;
    const n = current.looks.length;
    const next = (currentLook + delta + n) % n;
    // On parcourt ses tenues sans toucher à l'affiche : les boutons proposent ensuite d'ajouter / remplacer
    setLooks((l) => ({ ...l, [current.slug]: next }));
  };

  const setOrientation = (orientation: PosterState['orientation']) =>
    update({
      orientation,
      layout: null,
    });

  /** Retire un calque copain (clé) de l'affiche. */
  const removeKey = (key: string) => {
    update({ selection: state.selection.filter((s) => keyOf(s) !== key) });
    if (selected === key) setSelected(undefined);
  };
  /** Ajoute une tenue d'un copain (une tenue de plus si le copain est déjà sur l'affiche). */
  const addLook = (slug: string, look: number) => {
    if (full || lookOnPoster(slug, look)) return;
    const keys = new Set(state.selection.map(keyOf));
    let n = 1;
    while (keys.has(`${slug}~${n}`)) n++;
    const key = keys.has(slug) || instances(slug).length ? `${slug}~${n}` : undefined;
    const decor = !!decors[`${slug}:${look}`] && !!bySlug.get(slug)?.looks[look].scene;
    update({ selection: [...state.selection, { slug, look, ...(key ? { key } : {}), ...(decor ? { decor } : {}) }] });
  };
  /** Ajoute / retire la tenue affichée de ce copain. */
  const togglePoster = (slug: string) => {
    const look = looks[slug] ?? 0;
    const there = lookOnPoster(slug, look);
    if (there) removeKey(keyOf(there));
    else addLook(slug, look);
  };
  /** Le copain est sur l'affiche avec une autre tenue : il prend celle affichée (même place). */
  /** « Avec le décor de la carte », choisi tenue par tenue (avant ou après l'avoir posée sur l'affiche). */
  const [decors, setDecors] = useState<Record<string, boolean>>({});
  const decorOf = (slug: string, look: number) => lookOnPoster(slug, look)?.decor ?? decors[`${slug}:${look}`] ?? false;
  const toggleDecor = (slug: string, look: number) => {
    const on = !decorOf(slug, look);
    setDecors((d) => ({ ...d, [`${slug}:${look}`]: on }));
    const there = lookOnPoster(slug, look);
    const sc = bySlug.get(slug)?.looks[look].scene;
    if (!there || !sc) return;
    const key = keyOf(there);
    // Le personnage reste à sa place : la scène est calée sur lui (même taille, mêmes pieds)
    let layout = state.layout;
    const p = layout?.[key];
    if (layout && p) {
      const r = state.orientation === 'portrait' ? 1.414 : 1 / 1.414; // hauteur / largeur de la feuille
      const q = on
        ? { ...p, h: p.h * sc.k, y: p.y + sc.dy * p.h, x: p.x + sc.dx * p.h * r * (p.flip ? -1 : 1) }
        : ((h) => ({ ...p, h, y: p.y - sc.dy * h, x: p.x - sc.dx * h * r * (p.flip ? -1 : 1) }))(p.h / sc.k);
      layout = { ...layout, [key]: q };
    }
    update({ selection: state.selection.map((s) => (keyOf(s) === key ? { ...s, decor: on } : s)), layout });
  };
  const replaceLook = (slug: string) => {
    const look = looks[slug] ?? 0;
    update({ selection: state.selection.map((s) => (s.slug === slug ? { ...s, look } : s)) });
  };
  // Panier : on enregistre la « recette » de l'affiche (redessinée en HD pour l'impression)
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const recetteActuelle = (): Recette => ({
      v: 1,
      orientation: state.orientation,
      background: state.background,
      frame: state.frame,
      title: state.title,
      subtitle: state.subtitle,
      showSubtitle: state.showSubtitle,
      showBrand: state.showBrand,
      ...(state.couleur ? { couleur: state.couleur } : {}),
      members: state.selection.flatMap((s) => {
        const entry = bySlug.get(s.slug);
        const look = entry?.looks[s.look];
        const p = placements[keyOf(s)];
        if (!entry || !look || !p) return [];
        const src = visuel(s).src.replace(base, '').replace(/^\//, '');
        return [{ name: entry.name, family: look.familyName, src, p }];
      }),
      accessories: Object.entries(state.accessories).flatMap(([id, p]) => {
        const a = accessoryById.get(id);
        return a ? [{ name: a.label, family: '', src: a.src, p }] : [];
      }),
  });
  const sauvegarder = () => {
    setProjet(sauverProjet(recetteActuelle(), state.format as PrintFormat, projet ?? undefined));
    setSauve(true);
  };
  const addToCart = () => {
    const recette = recetteActuelle();
    if (modifier && lirePanier().some((a) => a.id === modifier)) {
      // Affiche reprise depuis le panier : on la remplace (même quantité) et on retourne au panier
      ecrirePanier(lirePanier().map((a) => (a.id === modifier ? { ...a, recette, format: state.format as PrintFormat } : a)));
      location.href = `${base}panier`;
      return;
    }
    ajouterAuPanier(recette, state.format);
    setAjoute(true);
  };

  // Affiche + barre d'outils : affichées dans la page et dans l'aperçu en grand
  const renderCanvas = () => (
    <PosterCanvas
      state={state}
      characters={state.selection.map((s: Selection) => ({ key: keyOf(s), entry: bySlug.get(s.slug)!, look: s.look, src: visuel(s).src }))}
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
            {selected!.startsWith(ACC) ? accessoryById.get(selected!.slice(ACC.length))?.label : bySlug.get(slugOf(selected!))?.name}
          </strong>
          <div class="pc__editbar-tools">
            <button type="button" onClick={() => resize(1 / 1.12)} aria-label="Réduire" title="Réduire">−</button>
            <button type="button" onClick={() => resize(1.12)} aria-label="Agrandir" title="Agrandir">+</button>
            <button type="button" onClick={() => edit(selected!, { z: Math.max(...zValues) + 1 })}>Devant</button>
            <button type="button" onClick={() => edit(selected!, { z: Math.max(1, Math.min(...zValues) - 1) })}>Derrière</button>
            <button type="button" onClick={() => edit(selected!, { flip: !sel.flip })} title="Retourner">↔ Miroir</button>
            <button
              type="button"
              onClick={() => (selected!.startsWith(ACC) ? toggleAccessory(selected!.slice(ACC.length)) : removeKey(selected!))}
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
      {(state.layout || Object.keys(state.accessories).length > 0) && (
        <button
          type="button"
          class="pc__editbar-reset"
          onClick={() => {
            // Copains ET accessoires reviennent à leur place de départ (taille, sens, ordre)
            const ids = Object.keys(state.accessories);
            update({
              layout: null,
              accessories: Object.fromEntries(ids.map((id, n) => [id, { ...placeAccessoire(n, id), z: 100 + n }])),
            });
            setSelected(undefined);
          }}
        >
          ↺ Réorganiser
        </button>
      )}
    </div>
  );

  return (
    <div class="pc">
      {retouche && (
        <div class="pc__retouche">
          <span>
            ✎ Retouche du modèle <strong>{retouche}</strong> : déplace, agrandis, retourne… puis
          </span>
          <button type="button" onClick={copierPourClaude}>
            {copie ? '✓ Copié ! Colle-le à Claude' : 'Copier pour Claude'}
          </button>
        </div>
      )}
      {modifier && (
        <p class="pc__modif">
          ✎ Tu modifies une affiche de ton panier : retouche-la, puis « Mettre à jour mon panier ».
        </p>
      )}
      {/* ── Aperçu ── */}
      <div class="pc__preview">
        <div class="pc__wall">
          {renderCanvas()}
          <button type="button" class="pc__zoom" onClick={openBig}>
            ⤢ Aperçu en grand
          </button>
        </div>

        {/* Barre d'édition seulement quand il y a quelque chose sur l'affiche (sinon un cadre vide) */}
        {!big && (state.selection.length > 0 || Object.keys(state.accessories).length > 0) && renderEditBar()}
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
                  {current.looks[currentLook].scene && decorOf(current.slug, currentLook) ? (
                    <div key={`${current.slug}-${currentLook}-decor`} class="pc__hero">
                      <img class="pc__hero-img pc__hero-img--scene anim-rebond" src={current.looks[currentLook].scene!.src} alt={`${current.name}, famille ${current.looks[currentLook].familyName}, avec le décor de sa carte`} />
                    </div>
                  ) : current.looks[currentLook].cutout ? (
                    <div key={`${current.slug}-${currentLook}`} class="pc__hero">
                      <Standee
                        src={current.looks[currentLook].cutout!}
                        alt={`${current.name}, famille ${current.looks[currentLook].familyName}`}
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
                    {current.looks[currentLook].scene && (
                      <label class="pc__decor">
                        <input type="checkbox" checked={decorOf(current.slug, currentLook)} onChange={() => toggleDecor(current.slug, currentLook)} />
                        Avec le décor de la carte
                      </label>
                    )}
                    {lookOnPoster(current.slug, currentLook) ? (
                      <button type="button" class="pc__toggle is-on" onClick={() => togglePoster(current.slug)}>
                        ✓ Sur l’affiche — retirer
                      </button>
                    ) : instances(current.slug).length ? (
                      <div class="pc__toggles">
                        {instances(current.slug).length === 1 && (
                          <button type="button" class="pc__toggle is-on" onClick={() => replaceLook(current.slug)}>
                            Remplacer sa tenue
                          </button>
                        )}
                        <button type="button" class="pc__toggle" onClick={() => addLook(current.slug, currentLook)} disabled={full}>
                          + Ajouter aussi
                        </button>
                      </div>
                    ) : (
                      <button type="button" class="pc__toggle" onClick={() => togglePoster(current.slug)} disabled={full}>
                        + Ajouter à l’affiche
                      </button>
                    )}
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
                        {idx >= 0 && <span class="pc__badge">{instances(r.slug).length > 1 ? `×${instances(r.slug).length}` : idx + 1}</span>}
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
                {BACKGROUNDS.map((b) => {
                  const bouton = (
                    <button
                      key={b.id}
                      type="button"
                      class={`pc__swatch pc__swatch--${b.id}`}
                      aria-pressed={state.background === b.id}
                      onClick={() => update({ background: b.id, couleur: undefined })}
                    >
                      <span class="pc__swatch-color" />
                      {b.label}
                    </button>
                  );
                  if (b.id !== 'ciel') return bouton;
                  // Clin d'œil de la bande : « Ciel » de Gims, qu'ils chantent à chaque soirée
                  return (
                    <span key={b.id} class="pc__ciel">
                      {bouton}
                      <span class="pc__ciel-note hand" aria-hidden="true">
                        <svg viewBox="0 0 50 44" width="34" height="30">
                          <path d="M40 40 C 30 36, 14 28, 10 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                          <path d="M3 14 L 10 4 L 18 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        Avoue, tu l'as chantée 🎶
                      </span>
                    </span>
                  );
                })}
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
                    placeholder="Ex. : Promo 2020, Les copains d'abord…"
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

        {sauve && (
          <div class="pc__added" role="status">
            <span>♡ Affiche sauvegardée</span>
            <a href={`${base}panier#sauvegardes`}>Mes affiches →</a>
            <button type="button" onClick={() => setSauve(false)} aria-label="Fermer">×</button>
          </div>
        )}
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
            {(stepIndex === STEPS.length - 1 || modifier) && (
              <button type="button" class="pc__check pc__sauver" onClick={sauvegarder} disabled={!state.selection.length}>
                ♡ Sauvegarder
              </button>
            )}
            {stepIndex < STEPS.length - 1 && !modifier ? (
              <button type="button" class="pc__cart" onClick={nextStep} disabled={!state.selection.length}>
                Étape suivante : {STEPS[stepIndex + 1].label} →
              </button>
            ) : (
              <button type="button" class="pc__cart" onClick={addToCart} disabled={!state.selection.length || !allSeen}>
                {modifier ? 'Mettre à jour mon panier' : 'Ajouter au panier'}
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
