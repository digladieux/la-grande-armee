/**
 * Figurine en carton : le personnage détouré, qu'on attrape et fait tourner.
 * - Recto : l'illustration détourée (PNG transparent).
 * - Tranche : quelques couches de carton empilées en Z, découpées à la silhouette.
 * - Verso : dos en carton kraft à la forme de la silhouette.
 *
 * Interaction : glisser = rotation libre (avec inertie), clic / Entrée = demi-tour,
 * flèches du clavier = ±30°. Au repos, la figurine se recale de face ou de dos.
 */
import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  src: string;
  alt: string;
  walk?: boolean;
}

const THICKNESS = 6; // épaisseur du carton, en px

export default function Standee({ src, alt, walk }: Props) {
  const [angle, setAngle] = useState(0);
  const [animating, setAnimating] = useState(false);
  const drag = useRef<{ x: number; start: number; moved: boolean; lastX: number; lastT: number; v: number } | null>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  // Nouveau personnage / nouvelle tenue → de face
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    setAnimating(false);
    setAngle(0);
  }, [src]);

  const snap = (a: number) => {
    setAnimating(true);
    setAngle(Math.round(a / 180) * 180);
  };

  const onPointerDown = (e: PointerEvent) => {
    cancelAnimationFrame(raf.current);
    setAnimating(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: angle, moved: false, lastX: e.clientX, lastT: performance.now(), v: 0 };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    const now = performance.now();
    d.v = ((e.clientX - d.lastX) * 0.7) / Math.max(now - d.lastT, 1); // degrés / ms
    d.lastX = e.clientX;
    d.lastT = now;
    setAngle(d.start + dx * 0.7);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) return snap(angle + 180); // simple clic : demi-tour

    // Inertie puis recalage
    let v = d.v * 16; // degrés / frame
    let a = angle;
    const step = () => {
      v *= 0.94;
      a += v;
      setAngle(a);
      if (Math.abs(v) > 0.3) raf.current = requestAnimationFrame(step);
      else snap(a);
    };
    raf.current = requestAnimationFrame(step);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setAngle((a) => a - 30);
    else if (e.key === 'ArrowRight') setAngle((a) => a + 30);
    else if (e.key === 'Enter' || e.key === ' ') snap(angle + 180);
    else return;
    e.preventDefault();
    setAnimating(true);
  };

  const mask = { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` };
  const layers = Array.from({ length: THICKNESS - 1 }, (_, i) => i + 1);

  return (
    <div class="standee">
      <div class={walk ? 'standee__walk anim-walk' : 'standee__walk'}>
        <div
          class={`standee__body ${animating ? 'is-animating' : ''}`}
          style={{ transform: `perspective(1000px) rotateY(${angle}deg)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onTransitionEnd={() => setAnimating(false)}
          role="img"
          tabIndex={0}
          aria-label={`${alt} — figurine à faire tourner (glisser, ou flèches du clavier)`}
        >
          <img class="standee__front" src={src} alt="" draggable={false} />
          {layers.map((i) => (
            <div key={i} class="standee__edge" style={{ ...mask, transform: `translateZ(${-i}px)` }} />
          ))}
          <div
            class="standee__back"
            style={{ ...mask, transform: `translateZ(${-THICKNESS}px) rotateY(180deg) scaleX(-1)` }}
          />
        </div>
      </div>
    </div>
  );
}
