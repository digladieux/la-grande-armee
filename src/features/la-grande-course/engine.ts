/**
 * Moteur de « La Grande Course » (canvas 2D) : façon jeu du dino de Chrome.
 * Le copain court, saute (espace / ↑ / tap) et se baisse (↓ / bouton) pour éviter
 * les autres copains (au sol) et leurs têtes (en vol).
 *
 * Unités : tout est exprimé en P = hauteur du joueur debout, puis converti en pixels.
 */
import type { CourseLook } from './types';

export interface Sprite {
  img: HTMLImageElement;
  /** Masque alpha réduit (1 = opaque), pour des collisions au pixel près. */
  mask: Uint8Array;
  mw: number;
  mh: number;
  /** Dessin retourné (personnage tourné vers la gauche sur sa carte) : le masque l'est déjà. */
  flip?: boolean;
}

/**
 * Façon dont un copain-obstacle bouge :
 * - hop  : sautille sur place, petits bonds (à sauter au bon moment) ;
 * - fly  : fonce en l'air à hauteur de tête, plus vite que le décor (se baisser) ;
 * - hang : pend du haut de l'écran, tête en bas (se baisser).
 */
export type ActionMode = 'hop' | 'fly' | 'hang';

/** Accessoires provisoires dessinés en vectoriel (à remplacer par les dessins définitifs). */
export type PropName = 'biere' | 'panneau' | 'tracteur';

type Pool = { look: CourseLook; sprite: Sprite }[];
export type ActionPool = { look: CourseLook; sprite: Sprite; mode: ActionMode }[];

interface Obstacle {
  kind: 'ground' | 'head' | ActionMode | 'prop';
  look?: CourseLook;
  sprite?: Sprite;
  prop?: PropName;
  x: number;
  y: number;
  w: number;
  h: number;
  spin: number;
  /** Sol de référence pour le sautillement. */
  baseY?: number;
  /** Vitesse propre vers le joueur (en P/s), en plus du défilement. */
  vx?: number;
  /** Dessin retourné pour faire face au joueur. */
  flip?: boolean;
}

/** Zones de collision des accessoires (fractions du cadre x, y, largeur, hauteur). */
const PROP_BOXES: Record<PropName, [number, number, number, number][]> = {
  biere: [[0.08, 0.08, 0.84, 0.92]],
  panneau: [[0, 0, 1, 0.52], [0.42, 0.5, 0.16, 0.5]],
  tracteur: [[0.02, 0.42, 0.96, 0.58], [0.4, 0.02, 0.4, 0.45]],
};
const PROP_LABEL: Record<PropName, string> = {
  biere: 'une bière',
  panneau: 'un panneau',
  tracteur: 'un tracteur',
};

export interface EngineEvents {
  onScore: (score: number) => void;
  /** `hitBy` : prénom du copain ou nom de l'accessoire percuté. */
  onGameOver: (score: number, hitBy: string) => void;
}

const INK = '#161412';
const PAPER = '#fffcf4';
const STRIPES = ['#c9e6c7', '#fbd2c6', '#fdf8e3', '#e3d1f9', '#fcefbe', '#fcdab4', '#d4e9f8'];

// Physique (en P et secondes) : saut de ~1,1 P qui dure ~0,95 s, assez long pour franchir
// un obstacle même quand le décor défile lentement au début
const JUMP_V = 4.7;
const GRAVITY = 10;
const FAST_FALL = 3;
// Vitesse (P/s) : départ tranquille, puis accélération douce qui tend vers MAX_SPEED
// (≈ 4,5 après 30 s, ≈ 6 après 1 min, ≈ 8,5 après 2 min, ≈ 10,5 après 3 min)
const START_SPEED = 3;
const MAX_SPEED = 13;
const ACCEL_TIME = 110;
const DUCK_SY = 0.6;
const DUCK_SX = 1.12;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export function loadSprite(src: string, flip = false): Promise<Sprite> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const mw = Math.max(1, Math.round(img.naturalWidth / 4));
      const mh = Math.max(1, Math.round(img.naturalHeight / 4));
      const c = document.createElement('canvas');
      c.width = mw;
      c.height = mh;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      if (flip) {
        ctx.translate(mw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, 0, 0, mw, mh);
      const data = ctx.getImageData(0, 0, mw, mh).data;
      const mask = new Uint8Array(mw * mh);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 110 ? 1 : 0;
      resolve({ img, mask, mw, mh, flip });
    };
    img.onerror = reject;
    img.src = src;
  });
}

export class Engine {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private P = 100;
  private G = 0;
  private raf = 0;
  private last = 0;
  private running = false;

  private player!: Sprite;
  private py = 0; // hauteur au-dessus du sol (P)
  private vy = 0;
  private ducking = false;
  private wantDuck = false;

  private speed = START_SPEED;
  private elapsed = 0;
  private distance = 0; // en P
  private score = 0;
  private nextSpawn = 0;
  private obstacles: Obstacle[] = [];
  private scroll = 0;
  private clouds: { x: number; y: number; s: number }[] = [];
  private pebbles: { x: number; w: number; y: number }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private ground: Pool,
    private heads: Pool,
    private actions: ActionPool,
    private events: EngineEvents,
  ) {
    this.ctx = canvas.getContext('2d')!;
  }

  setPlayer(sprite: Sprite) {
    this.player = sprite;
  }

  /** Ajoute des obstacles au fil du chargement (les images arrivent en arrière-plan). */
  addObstacles(ground: Pool, heads: Pool) {
    this.ground.push(...ground);
    this.heads.push(...heads);
  }

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = w;
    this.H = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.P = Math.min(h * 0.42, w * 0.34);
    this.G = h * 0.86;
    if (!this.clouds.length) {
      this.clouds = Array.from({ length: 4 }, (_, i) => ({ x: (i + rand(0, 0.6)) * (w / 3), y: rand(0.1, 0.32) * h, s: rand(0.7, 1.2) }));
      this.pebbles = Array.from({ length: 14 }, () => ({ x: rand(0, w), w: rand(3, 14), y: rand(6, 22) }));
    }
    if (!this.running) this.draw();
  }

  reset() {
    this.py = 0;
    this.vy = 0;
    this.ducking = this.wantDuck = false;
    this.speed = START_SPEED;
    this.elapsed = this.distance = this.score = 0;
    this.obstacles = [];
    this.nextSpawn = 9;
    this.events.onScore(0);
    this.draw();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.last) / 1000);
      this.last = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  get isRunning() {
    return this.running;
  }

  jump() {
    if (this.py === 0 && !this.ducking) this.vy = JUMP_V;
  }

  duck(on: boolean) {
    this.wantDuck = on;
  }

  // ── Logique ──
  private update(dt: number) {
    this.elapsed += dt;
    this.speed = START_SPEED + (MAX_SPEED - START_SPEED) * (1 - Math.exp(-this.elapsed / ACCEL_TIME));
    const step = this.speed * dt;
    this.distance += step;
    this.scroll += step * this.P;

    // Saut / chute (se baisser en l'air = chute rapide)
    if (this.py > 0 || this.vy > 0) {
      this.vy -= GRAVITY * (this.wantDuck ? FAST_FALL : 1) * dt;
      this.py = Math.max(0, this.py + this.vy * dt);
      if (this.py === 0) this.vy = 0;
    }
    this.ducking = this.wantDuck && this.py === 0;

    // Obstacles
    for (const o of this.obstacles) {
      o.x -= (step + (o.vx ?? 0) * dt) * this.P;
      o.spin += dt * 4;
      if (o.kind === 'hop') o.y = o.baseY! - Math.abs(Math.sin(o.spin * 0.7)) * 0.3 * this.P;
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -20);
    if (this.distance >= this.nextSpawn) this.spawn();

    // Score
    const score = Math.floor(this.distance * 2);
    if (score !== this.score) {
      this.score = score;
      this.events.onScore(score);
    }

    // Collision
    const pr = this.playerRect();
    for (const o of this.obstacles) {
      if (this.hits(pr, o)) {
        this.stop();
        this.draw();
        this.events.onGameOver(this.score, o.prop ? PROP_LABEL[o.prop] : o.look!.name);
        return;
      }
    }
  }

  private spawn() {
    const P = this.P;
    const G = this.G;
    const x = this.W + 10;
    const r = Math.random();
    if (this.score > 250 && this.heads.length && r < 0.2) {
      const h = pick(this.heads);
      const size = 0.4 * P;
      // Assez haut pour passer dessous en se baissant, assez bas pour toucher debout
      this.obstacles.push({ kind: 'head', look: h.look, sprite: h.sprite, x, y: G - 0.86 * P - size / 2, w: size, h: size, spin: 0 });
    } else if (this.score > 120 && this.actions.length && r < 0.4) {
      const a = pick(this.actions);
      const ratio = a.look.ratio;
      if (a.mode === 'hop') {
        const h = 0.55 * P;
        const w = Math.min(h * ratio, 0.75 * P);
        this.obstacles.push({ kind: 'hop', look: a.look, sprite: a.sprite, x, y: G - h, baseY: G - h, w, h, spin: rand(0, 3) });
      } else if (a.mode === 'fly') {
        const h = 0.5 * P;
        const w = h * ratio;
        this.obstacles.push({ kind: 'fly', look: a.look, sprite: a.sprite, x, y: G - 0.68 * P - h, w, h, spin: 0, vx: 1.6, flip: true });
      } else {
        // Pendu : la tête (en bas du dessin) s'arrête juste au-dessus d'un joueur baissé
        const h = Math.max(G - 0.68 * P, 0.9 * P);
        const w = h * ratio;
        this.obstacles.push({ kind: 'hang', look: a.look, sprite: a.sprite, x, y: G - 0.68 * P - h, w, h, spin: 0 });
      }
    } else if (r < 0.62) {
      const choices: PropName[] = this.score > 300 ? ['biere', 'panneau', 'tracteur'] : ['biere', 'biere', 'panneau'];
      const prop = pick(choices);
      const [w, h] = prop === 'biere' ? [0.22, 0.3] : prop === 'panneau' ? [0.55, 0.66] : [1.1, 0.56];
      this.obstacles.push({ kind: 'prop', prop, x, y: G - h * P, w: w * P, h: h * P, spin: 0 });
    } else if (this.ground.length) {
      const count = this.score > 500 && Math.random() < 0.25 ? 2 : 1;
      let gx = x;
      for (let i = 0; i < count; i++) {
        const g = pick(this.ground);
        // Taille lisible : jamais plus petit que 0,62 P de haut, les silhouettes larges restent entières
        let h = rand(0.62, count === 2 ? 0.7 : 0.82) * P;
        let w = h * g.look.ratio;
        // Toujours franchissable d'un saut : largeur limitée (la hauteur suit, sans descendre sous 0,5 P)
        if (w > 0.85 * P) {
          w = 0.85 * P;
          h = Math.max(0.5 * P, w / g.look.ratio);
          w = h * g.look.ratio;
        }
        this.obstacles.push({ kind: 'ground', look: g.look, sprite: g.sprite, x: gx, y: G - h, w, h, spin: 0 });
        gx += w + 0.15 * P;
      }
    }
    // Écart suivant : de quoi réagir, de plus en plus serré avec la vitesse
    this.nextSpawn = this.distance + this.speed * rand(1, 1.8) + 1.2;
  }

  private playerRect() {
    const P = this.P;
    const ratio = this.player.img.naturalWidth / this.player.img.naturalHeight;
    let h = P;
    let w = P * ratio;
    if (this.ducking) {
      h *= DUCK_SY;
      w *= DUCK_SX;
    }
    const bob = this.py === 0 && !this.ducking && this.running ? Math.abs(Math.sin(this.elapsed * 14)) * 0.035 * P : 0;
    const x = Math.max(16, this.W * 0.1);
    return { x, y: this.G - h - this.py * P - bob, w, h };
  }

  /** Collision au pixel près : les deux masques doivent être opaques au même endroit. */
  private hits(p: { x: number; y: number; w: number; h: number }, o: Obstacle) {
    const x0 = Math.max(p.x, o.x);
    const x1 = Math.min(p.x + p.w, o.x + o.w);
    const y0 = Math.max(p.y, o.y);
    const y1 = Math.min(p.y + p.h, o.y + o.h);
    if (x0 >= x1 || y0 >= y1) return false;
    const s = Math.max(2, this.P / 45);
    const pm = this.player;
    for (let y = y0; y < y1; y += s) {
      for (let x = x0; x < x1; x += s) {
        const pu = Math.floor(((x - p.x) / p.w) * pm.mw);
        const pv = Math.floor(((y - p.y) / p.h) * pm.mh);
        if (!pm.mask[pv * pm.mw + pu]) continue;
        if (o.kind === 'head') {
          const r = o.w / 2;
          const dx = x - (o.x + r);
          const dy = y - (o.y + r);
          if (dx * dx + dy * dy < r * r * 0.8) return true;
        } else if (o.kind === 'prop') {
          const fx = (x - o.x) / o.w;
          const fy = (y - o.y) / o.h;
          if (PROP_BOXES[o.prop!].some(([bx, by, bw, bh]) => fx >= bx && fx <= bx + bw && fy >= by && fy <= by + bh)) return true;
        } else {
          const om = o.sprite!;
          const fx = (x - o.x) / o.w;
          const ou = Math.floor((o.flip ? 1 - fx : fx) * om.mw);
          const ov = Math.floor(((y - o.y) / o.h) * om.mh);
          if (om.mask[ov * om.mw + ou]) return true;
        }
      }
    }
    return false;
  }

  // ── Dessin ──
  draw() {
    const { ctx, W, H, G, P } = this;
    if (!W) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    // Ciel : bandes pastel du site, qui défilent lentement
    ctx.save();
    ctx.globalAlpha = 0.55;
    const band = Math.max(46, W / 14);
    const off = (this.scroll * 0.12) % (band * STRIPES.length);
    ctx.translate(-off, 0);
    for (let i = -2, x = -H; x < W + H + band * STRIPES.length; i++, x += band) {
      ctx.fillStyle = STRIPES[((i % STRIPES.length) + STRIPES.length) % STRIPES.length];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + band, 0);
      ctx.lineTo(x + band - H * 0.84, H);
      ctx.lineTo(x - H * 0.84, H);
      ctx.fill();
    }
    ctx.restore();

    // Nuages (contour encre, comme les doodles du site)
    for (const c of this.clouds) {
      const x = ((((c.x - this.scroll * 0.25) % (W + 200)) + W + 200) % (W + 200)) - 100;
      this.cloud(x, c.y, c.s * P * 0.5);
    }

    // Sol : trait encre légèrement ondulé + cailloux
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = G + Math.sin((x + this.scroll) / 90) * 1.6;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 2;
    for (const p of this.pebbles) {
      const x = (((p.x - this.scroll) % W) + W) % W;
      ctx.beginPath();
      ctx.moveTo(x, G + p.y);
      ctx.lineTo(x + p.w, G + p.y);
      ctx.stroke();
    }

    // Obstacles
    for (const o of this.obstacles) {
      if (o.kind === 'head') this.headBadge(o);
      else if (o.kind === 'prop') {
        this.shadow(o.x + o.w / 2, o.w * 0.5);
        this.drawProp(o);
      } else if (o.kind === 'hang') {
        // Corde jusqu'en haut de l'écran
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, 0);
        ctx.lineTo(o.x + o.w / 2, Math.max(0, o.y + o.h * 0.05));
        ctx.stroke();
        ctx.drawImage(o.sprite!.img, o.x, o.y, o.w, o.h);
      } else {
        if (o.kind !== 'fly') this.shadow(o.x + o.w / 2, (o.w * 0.45) / (1 + ((o.baseY ?? o.y) - o.y) / this.P));
        if (o.kind === 'fly') this.speedLines(o);
        ctx.save();
        if (o.flip) {
          ctx.translate(o.x + o.w, o.y);
          ctx.scale(-1, 1);
          ctx.drawImage(o.sprite!.img, 0, 0, o.w, o.h);
        } else ctx.drawImage(o.sprite!.img, o.x, o.y, o.w, o.h);
        ctx.restore();
      }
    }

    // Joueur
    if (this.player) {
      const r = this.playerRect();
      this.shadow(r.x + r.w / 2, (r.w * 0.45) / (1 + this.py));
      ctx.save();
      const tilt = this.py > 0 ? -0.06 : this.running && !this.ducking ? Math.sin(this.elapsed * 14) * 0.03 : 0;
      ctx.translate(r.x + r.w / 2, r.y + r.h);
      ctx.rotate(tilt);
      if (this.player.flip) ctx.scale(-1, 1);
      ctx.drawImage(this.player.img, -r.w / 2, -r.h, r.w, r.h);
      ctx.restore();
    }
  }

  private speedLines(o: Obstacle) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const y = o.y + o.h * (0.3 + i * 0.2);
      const x = o.x + o.w + 6 + (i % 2) * 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + o.w * 0.35, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Accessoires provisoires, dessinés à l'encre comme les doodles du site. */
  private drawProp(o: Obstacle) {
    const { ctx } = this;
    const { x, y, w, h } = o;
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const shape = (fill: string, path: () => void) => {
      ctx.beginPath();
      path();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();
    };
    if (o.prop === 'biere') {
      // Chope : verre, bière, mousse, anse
      shape('#ffffff', () => ctx.roundRect(x + w * 0.62, y + h * 0.35, w * 0.32, h * 0.38, w * 0.12));
      shape('#f8c94c', () => ctx.roundRect(x + w * 0.08, y + h * 0.18, w * 0.62, h * 0.82, w * 0.08));
      shape('#ffffff', () => {
        ctx.moveTo(x + w * 0.04, y + h * 0.3);
        ctx.bezierCurveTo(x - w * 0.04, y + h * 0.05, x + w * 0.25, y - h * 0.08, x + w * 0.38, y + h * 0.06);
        ctx.bezierCurveTo(x + w * 0.5, y - h * 0.06, x + w * 0.8, y + h * 0.02, x + w * 0.74, y + h * 0.3);
        ctx.closePath();
      });
      ctx.beginPath();
      ctx.moveTo(x + w * 0.28, y + h * 0.45);
      ctx.lineTo(x + w * 0.28, y + h * 0.85);
      ctx.moveTo(x + w * 0.48, y + h * 0.45);
      ctx.lineTo(x + w * 0.48, y + h * 0.85);
      ctx.stroke();
    } else if (o.prop === 'panneau') {
      // Pancarte de manif plantée au sol
      shape('#c9935a', () => ctx.rect(x + w * 0.45, y + h * 0.45, w * 0.1, h * 0.55));
      ctx.save();
      ctx.translate(x + w / 2, y + h * 0.25);
      ctx.rotate(-0.06);
      shape('#ffffff', () => ctx.rect(-w / 2, -h * 0.25, w, h * 0.5));
      ctx.fillStyle = INK;
      ctx.font = `${Math.round(h * 0.13)}px Anton, Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ENGAGEZ-', 0, -h * 0.07);
      ctx.fillText('VOUS !', 0, h * 0.09);
      ctx.restore();
    } else {
      // Tracteur : capot, cabine, roues, pot d'échappement
      shape('#93cd8f', () => ctx.roundRect(x + w * 0.04, y + h * 0.42, w * 0.92, h * 0.3, h * 0.06));
      shape('#d4e9f8', () => ctx.roundRect(x + w * 0.42, y + h * 0.04, w * 0.36, h * 0.42, h * 0.05));
      shape(INK, () => ctx.rect(x + w * 0.16, y + h * 0.12, w * 0.05, h * 0.3));
      const wheel = (cx: number, r: number) => {
        shape('#4a4540', () => ctx.arc(cx, y + h - r, r, 0, Math.PI * 2));
        shape('#f8df7e', () => ctx.arc(cx, y + h - r, r * 0.45, 0, Math.PI * 2));
      };
      wheel(x + w * 0.72, h * 0.34);
      wheel(x + w * 0.2, h * 0.2);
    }
    ctx.restore();
  }

  private shadow(cx: number, rx: number) {
    const { ctx, G } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(22, 20, 18, 0.13)';
    ctx.beginPath();
    ctx.ellipse(cx, G + 2, Math.max(4, rx), Math.max(2, rx * 0.12), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private headBadge(o: Obstacle) {
    const { ctx } = this;
    const r = o.w / 2;
    const cx = o.x + r;
    const cy = o.y + r;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(o.spin) * 0.25);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = o.look!.bg;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.drawImage(o.sprite!.img, -r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // Traits de vitesse
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(r * 1.25, i * r * 0.45);
      ctx.lineTo(r * 1.25 + r * (0.5 - Math.abs(i) * 0.15), i * r * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  private cloud(x: number, y: number, s: number) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.1, y - s * 0.05, x + s * 0.25, y - s * 0.2, x + s * 0.4, y - s * 0.02);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.35, x + s * 0.95, y - s * 0.3, x + s, y);
    ctx.bezierCurveTo(x + s * 1.3, y - s * 0.02, x + s * 1.35, y + s * 0.3, x + s * 1.15, y + s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
