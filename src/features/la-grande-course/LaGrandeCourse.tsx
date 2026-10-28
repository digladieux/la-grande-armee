import { useEffect, useRef, useState } from 'preact/hooks';
import { Engine, loadSprite, type ActionMode, type Sprite } from './engine';
import type { CourseCharacter, CourseLook } from './types';
import './course.css';

interface Props {
  roster: CourseCharacter[];
}

type Phase = 'select' | 'loading' | 'ready' | 'playing' | 'over';

const RECORD_KEY = 'lgc-record';
/** Obstacles chargés au départ ; les autres arrivent en arrière-plan pendant la partie. */
const FIRST_BATCH = 8;

const readRecord = () => {
  try {
    return Number(localStorage.getItem(RECORD_KEY)) || 0;
  } catch {
    return 0;
  }
};
const saveRecord = (v: number) => {
  try {
    localStorage.setItem(RECORD_KEY, String(v));
  } catch {
    /* navigation privée : record non conservé */
  }
};
const pad = (n: number) => String(n).padStart(5, '0');
const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);
/** Tenues dessinées en marche / en course vers la gauche : le joueur avance vers la droite, on les retourne. */
const FACING_LEFT = new Set([
  'aubin/gochofacho',
  'aubin/botefragile',
  'coco/gaulois',
  'coco/gochofacho',
  'dim/botefragile',
  'guigui/beauf',
  'hugo/joystick',
  'laurent/branquignol',
  'laurent/joystick',
  'saby/gochofacho',
  'szabo/branquignol',
  'turquet/gaulois',
]);
/** Copains « en action » sur leur carte : ils bougent au lieu de rester plantés au sol. */
const ACTIONS: Record<string, ActionMode> = {
  'turquet/gaulois': 'fly', // le forgeron qui bondit
  'guigui/gaulois': 'fly', // Obélix qui fonce
  'merlot/gaulois': 'fly', // le salut romain en plein élan
  'dim/branquignol': 'hang', // pendu tête en bas
  'nael/gaulois': 'hop', // danse avec sa lyre
  'dauby/izikarate': 'hop', // kata
  'nael/izikarate': 'hop', // en garde
};

/** Tenues trop larges (voitures, lits…) : pas d'obstacle au sol, seulement leur tête. */
const groundOk = (l: CourseLook) => l.ratio <= 1.3 && !ACTIONS[l.key];
/** Le joueur : de préférence une tenue « debout ». */
const runnerOk = (l: CourseLook) => l.ratio <= 0.95;

export default function LaGrandeCourse({ roster }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [chosen, setChosen] = useState<CourseCharacter | null>(null);
  const [look, setLook] = useState<CourseLook | null>(null);
  const [score, setScore] = useState(0);
  const [record, setRecord] = useState(0);
  const [hitBy, setHitBy] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const phaseRef = useRef<Phase>('select');
  phaseRef.current = phase;

  useEffect(() => setRecord(readRecord()), []);

  /** Choix d'un copain : tenue tirée au hasard, chargement du joueur + premiers obstacles. */
  const choose = async (c: CourseCharacter) => {
    engineRef.current?.stop();
    setChosen(c);
    setPhase('loading');
    wrapRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const runners = c.looks.filter(runnerOk);
    const myLook = shuffle(runners.length ? runners : c.looks)[0];
    setLook(myLook);

    const others = shuffle(roster.filter((r) => r.slug !== c.slug).flatMap((r) => r.looks));
    const ground = others.filter(groundOk);
    const load = (l: CourseLook, kind: 'sprite' | 'head') =>
      loadSprite(kind === 'sprite' ? l.sprite : l.head)
        .then((sprite) => ({ look: l, sprite }))
        .catch(() => null);
    const keep = <T,>(list: (T | null)[]) => list.filter((x): x is T => !!x);

    const actionLooks = others.filter((l) => ACTIONS[l.key]);
    const [player, firstGround, firstHeads, actions] = await Promise.all([
      loadSprite(myLook.sprite, FACING_LEFT.has(myLook.key)),
      Promise.all(ground.slice(0, FIRST_BATCH).map((l) => load(l, 'sprite'))).then(keep),
      Promise.all(others.slice(0, 4).map((l) => load(l, 'head'))).then(keep),
      Promise.all(actionLooks.map((l) => load(l, 'sprite'))).then((list) => keep(list).map((a) => ({ ...a, mode: ACTIONS[a.look.key] }))),
    ]);

    const engine = new Engine(canvasRef.current!, firstGround, firstHeads, actions, {
      onScore: setScore,
      onGameOver: (s, by) => {
        setHitBy(by);
        const best = readRecord();
        setNewRecord(s > best);
        if (s > best) {
          saveRecord(s);
          setRecord(s);
        }
        setPhase('over');
      },
    });
    engine.setPlayer(player as Sprite);
    // Dessin définitif de la bière (en arrière-plan : la chope vectorielle sert en attendant)
    loadSprite(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}images/accessoires/biere.png`)
      .then((sprite) => engine.setPropSprite('biere', sprite))
      .catch(() => {});
    engineRef.current = engine;
    // Accès de test en local (console : __lgc)
    if (import.meta.env.DEV) (window as unknown as { __lgc: Engine }).__lgc = engine;
    const r = wrapRef.current!.getBoundingClientRect();
    engine.resize(r.width, r.height);
    engine.reset();
    setPhase('ready');

    // Le reste de la bande arrive en arrière-plan
    const restGround = ground.slice(FIRST_BATCH);
    const restHeads = others.slice(4);
    for (let i = 0; i < Math.max(restGround.length, restHeads.length); i += 6) {
      const [g, h] = await Promise.all([
        Promise.all(restGround.slice(i, i + 6).map((l) => load(l, 'sprite'))).then(keep),
        Promise.all(restHeads.slice(i, i + 6).map((l) => load(l, 'head'))).then(keep),
      ]);
      if (engineRef.current !== engine) return;
      engine.addObstacles(g, h);
    }
  };

  const play = () => {
    const e = engineRef.current;
    if (!e) return;
    if (phaseRef.current === 'over') e.reset();
    setHitBy(null);
    setPhase('playing');
    e.start();
    e.jump();
  };

  const jump = () => {
    const p = phaseRef.current;
    if (p === 'ready' || p === 'over') play();
    else if (p === 'playing') engineRef.current?.jump();
  };
  const duck = (on: boolean) => engineRef.current?.duck(on);

  // Clavier : espace / ↑ = sauter, ↓ = se baisser
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (phaseRef.current === 'select' || phaseRef.current === 'loading') return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!e.repeat) jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        duck(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') duck(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Taille du canvas = taille de la scène
  useEffect(() => {
    const wrap = wrapRef.current!;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      engineRef.current?.resize(width, height);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Onglet masqué : pause (la partie reprend au prochain saut)
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && phaseRef.current === 'playing') {
        engineRef.current?.stop();
        setPhase('ready');
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      engineRef.current?.stop();
    };
  }, []);

  // Tap sur la scène = sauter ; glisser vers le bas = se baisser (tant que le doigt reste posé)
  const touch = useRef<{ y: number; ducked: boolean } | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    if (phase === 'select' || phase === 'loading') return;
    touch.current = { y: e.clientY, ducked: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    const t = touch.current;
    if (t && !t.ducked && e.clientY - t.y > 24) {
      t.ducked = true;
      duck(true);
    }
  };
  const onPointerUp = () => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    if (t.ducked) duck(false);
    else jump();
  };

  const hold = (on: boolean) => (e: PointerEvent) => {
    e.preventDefault();
    duck(on);
  };

  return (
    <div class="lgc">
      <div class="lgc__hud" aria-live="polite">
        <span class="lgc__record">Record {pad(record)}</span>
        <span class="lgc__score">{pad(score)}</span>
      </div>

      <div
        class="lgc__stage"
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} class="lgc__canvas" aria-label="La Grande Course : le jeu" />

        {phase === 'select' && (
          <div class="lgc__overlay lgc__overlay--select">
            <p class="lgc__title">Choisis ton copain</p>
            <p class="lgc__hint hand">Sa tenue est tirée au sort à chaque partie !</p>
            <ul class="lgc__roster">
              {roster.map((c) => (
                <li key={c.slug}>
                  <button type="button" class="lgc__pick" onClick={() => choose(c)} style={`--c: ${c.portraitBg}`}>
                    <span class="lgc__pick-art">
                      <img src={c.portrait} alt="" style={`transform: ${c.portraitTransform}`} loading="lazy" draggable={false} />
                    </span>
                    <span class="lgc__pick-name">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === 'loading' && (
          <div class="lgc__overlay">
            <p class="lgc__title">{chosen?.name} s'échauffe…</p>
          </div>
        )}

        {phase === 'ready' && (
          <div class="lgc__overlay lgc__overlay--soft">
            <p class="lgc__title">{chosen?.name}</p>
            {look && <p class="lgc__badge" style={`--c: ${look.bg}`}>Famille {look.familyName}</p>}
            <button type="button" class="lgc__btn" onClick={(e) => { e.stopPropagation(); play(); }} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
              C'est parti !
            </button>
            <p class="lgc__hint hand">Espace ou tap pour sauter · ↓ ou glisser vers le bas pour se baisser</p>
          </div>
        )}

        {phase === 'over' && (
          <div class="lgc__overlay lgc__overlay--soft" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
            <p class="lgc__title">Aïe !</p>
            {hitBy && <p class="lgc__hint hand">Tu t'es pris {hitBy} en pleine tête…</p>}
            <p class="lgc__final">
              {pad(score)} {newRecord && <span class="lgc__badge" style="--c: var(--yellow)">Nouveau record !</span>}
            </p>
            <div class="lgc__actions">
              <button type="button" class="lgc__btn" onClick={play}>Rejouer</button>
              <button type="button" class="lgc__btn lgc__btn--ghost" onClick={() => { engineRef.current?.stop(); setPhase('select'); }}>
                Changer de copain
              </button>
            </div>
          </div>
        )}
      </div>

      {(phase === 'ready' || phase === 'playing') && (
        <div class="lgc__pads">
          <button type="button" class="lgc__pad" onPointerDown={(e) => { e.preventDefault(); jump(); }}>
            <span aria-hidden="true">↑</span> Sauter
          </button>
          <button type="button" class="lgc__pad" onPointerDown={hold(true)} onPointerUp={hold(false)} onPointerLeave={hold(false)} onPointerCancel={hold(false)}>
            <span aria-hidden="true">↓</span> Se baisser
          </button>
        </div>
      )}
    </div>
  );
}
