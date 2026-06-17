import { soundEngine, NoteType } from './soundEngine';

const BG_COLOR = '#0A0E27';
const SHIP_COLOR = '#00FFFF';
const SHIP_SIZE = 24;
const SHIP_SPEED = 150;
const PLANET_RADIUS = 18;
const PLANET_MIN_SPEED = 60;
const PLANET_MAX_SPEED = 100;
const SPAWN_MIN = 2;
const SPAWN_MAX = 3;
const GAME_DURATION = 60;
const PARTICLE_COUNT_MIN = 8;
const PARTICLE_COUNT_MAX = 12;
const PARTICLE_RADIUS = 50;
const PARTICLE_LIFE = 0.5;
const COMBO_TRIGGER = 3;
const COMBO_TEXT_DURATION = 1.5;

const PLANET_COLORS: Record<NoteType, { main: string; bright: string; r: number; g: number; b: number }> = {
  do: { main: '#FF4444', bright: '#FF7777', r: 255, g: 68, b: 68 },
  re: { main: '#4488FF', bright: '#77AAFF', r: 68, g: 136, b: 255 },
  mi: { main: '#44FF44', bright: '#77FF77', r: 68, g: 255, b: 68 },
  fa: { main: '#FFFF44', bright: '#FFFF77', r: 255, g: 255, b: 68 },
};

const NOTE_TYPES: NoteType[] = ['do', 're', 'mi', 'fa'];

interface Star {
  x: number;
  y: number;
  size: number;
  baseBright: number;
  phase: number;
  period: number;
}

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

interface Ship {
  x: number;
  y: number;
  flashTimer: number;
  trail: TrailPoint[];
}

interface Planet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: NoteType;
  ringAngle: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  r: number;
  g: number;
  b: number;
  life: number;
  maxLife: number;
}

interface ComboFx {
  active: boolean;
  timer: number;
  count: number;
  y: number;
}

export interface EngineCallbacks {
  onScore: (points: number) => void;
  onCombo: (count: number) => void;
  onCollectNote: () => void;
  onEndGame: () => void;
  onPhaseChange: (phase: string) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private stars: Star[] = [];
  private ship: Ship = { x: 0, y: 0, flashTimer: 0, trail: [] };
  private planets: Planet[] = [];
  private particles: Particle[] = [];
  private comboFx: ComboFx = { active: false, timer: 0, count: 0, y: 0 };
  private keys = new Set<string>();
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private paused = false;
  private gameTime = 0;
  private spawnTimer = 0;
  private nextSpawn = 2;
  private comboCount = 0;
  private lastType: NoteType | null = null;
  private blinkMul = 1;
  private cb: EngineCallbacks;
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cb = callbacks;
    this.resize();
    this.initStars();
    this.initShip();

    this.keyDownHandler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
      this.keys.add(k);
    };
    this.keyUpHandler = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start(): void {
    this.running = true;
    this.paused = false;
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.nextSpawn = 2;
    this.comboCount = 0;
    this.lastType = null;
    this.planets = [];
    this.particles = [];
    this.comboFx = { active: false, timer: 0, count: 0, y: 0 };
    this.blinkMul = 1;
    this.initShip();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.lastTime = performance.now();
  }

  reset(): void {
    this.stop();
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.comboCount = 0;
    this.lastType = null;
    this.planets = [];
    this.particles = [];
    this.comboFx = { active: false, timer: 0, count: 0, y: 0 };
    this.blinkMul = 1;
    this.initShip();
    this.drawFrame();
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
  }

  getTimeLeft(): number {
    return Math.max(0, GAME_DURATION - this.gameTime);
  }

  getBlinkMul(): number {
    return this.blinkMul;
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 300; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        size: 2 + Math.random() * 2,
        baseBright: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        period: 2 + Math.random() * 2,
      });
    }
  }

  private initShip(): void {
    this.ship = {
      x: this.w / 2,
      y: this.h / 2,
      flashTimer: 0,
      trail: [],
    };
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    if (!this.paused) {
      this.update(dt);
    }
    this.drawFrame();
  };

  private update(dt: number): void {
    this.gameTime += dt;
    if (this.gameTime >= GAME_DURATION) {
      this.running = false;
      this.cb.onEndGame();
      return;
    }

    this.updateShip(dt);
    this.updateSpawning(dt);
    this.updatePlanets(dt);
    this.checkCollisions();
    this.updateParticles(dt);
    this.updateComboFx(dt);
    this.blinkMul = 1 + this.comboCount * 0.3;
  }

  private updateShip(dt: number): void {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    this.ship.x += dx * SHIP_SPEED * dt;
    this.ship.y += dy * SHIP_SPEED * dt;

    const margin = SHIP_SIZE / 2;
    this.ship.x = Math.max(margin, Math.min(this.w - margin, this.ship.x));
    this.ship.y = Math.max(margin, Math.min(this.h - margin, this.ship.y));

    if (this.ship.trail.length === 0 || this.ship.trail.length < 16) {
      this.ship.trail.push({ x: this.ship.x, y: this.ship.y, alpha: 1 });
    }
    for (const t of this.ship.trail) {
      t.alpha -= dt * 3;
    }
    this.ship.trail = this.ship.trail.filter((t) => t.alpha > 0);

    if (this.ship.flashTimer > 0) {
      this.ship.flashTimer -= dt;
    }
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0;
      this.nextSpawn = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      this.spawnPlanet();
    }
  }

  private spawnPlanet(): void {
    const type = NOTE_TYPES[Math.floor(Math.random() * NOTE_TYPES.length)];
    const speed = PLANET_MIN_SPEED + Math.random() * (PLANET_MAX_SPEED - PLANET_MIN_SPEED);
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number, vx: number, vy: number;

    switch (edge) {
      case 0:
        x = Math.random() * this.w;
        y = -PLANET_RADIUS;
        vx = (Math.random() - 0.5) * speed * 0.5;
        vy = speed;
        break;
      case 1:
        x = Math.random() * this.w;
        y = this.h + PLANET_RADIUS;
        vx = (Math.random() - 0.5) * speed * 0.5;
        vy = -speed;
        break;
      case 2:
        x = -PLANET_RADIUS;
        y = Math.random() * this.h;
        vx = speed;
        vy = (Math.random() - 0.5) * speed * 0.5;
        break;
      default:
        x = this.w + PLANET_RADIUS;
        y = Math.random() * this.h;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed * 0.5;
        break;
    }

    this.planets.push({ x, y, vx, vy, type, ringAngle: Math.random() * Math.PI * 2, alive: true });
  }

  private updatePlanets(dt: number): void {
    for (const p of this.planets) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.ringAngle += (Math.PI * 2 / 2) * dt;
    }
    this.planets = this.planets.filter((p) => {
      if (!p.alive) return false;
      const margin = PLANET_RADIUS + 60;
      return p.x > -margin && p.x < this.w + margin && p.y > -margin && p.y < this.h + margin;
    });
  }

  private checkCollisions(): void {
    const sx = this.ship.x;
    const sy = this.ship.y;
    const sr = SHIP_SIZE / 2;

    for (const p of this.planets) {
      if (!p.alive) continue;
      const dx = sx - p.x;
      const dy = sy - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < sr + PLANET_RADIUS) {
        this.handleHit(p);
      }
    }
  }

  private handleHit(planet: Planet): void {
    planet.alive = false;
    this.ship.flashTimer = 0.15;

    const col = PLANET_COLORS[planet.type];
    const count = PARTICLE_COUNT_MIN + Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = PARTICLE_RADIUS / PARTICLE_LIFE * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x: planet.x,
        y: planet.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 2,
        r: col.r,
        g: col.g,
        b: col.b,
        life: PARTICLE_LIFE,
        maxLife: PARTICLE_LIFE,
      });
    }

    soundEngine.playNote(planet.type);

    if (this.lastType === planet.type) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastType = planet.type;
    this.cb.onCombo(this.comboCount);

    const baseScore = 100;
    const comboBonus = this.comboCount >= COMBO_TRIGGER ? this.comboCount * 50 : 0;
    const total = baseScore + comboBonus;
    this.cb.onScore(total);
    this.cb.onCollectNote();

    if (this.comboCount >= COMBO_TRIGGER) {
      this.comboFx = {
        active: true,
        timer: COMBO_TEXT_DURATION,
        count: this.comboCount,
        y: 60,
      };
      soundEngine.playComboMelody();
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private updateComboFx(dt: number): void {
    if (!this.comboFx.active) return;
    this.comboFx.timer -= dt;
    this.comboFx.y += 30 * dt;
    if (this.comboFx.timer <= 0) {
      this.comboFx.active = false;
    }
  }

  private drawFrame(): void {
    const ctx = this.ctx;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.w, this.h);

    this.drawStars();
    this.drawPlanets();
    this.drawParticles();
    this.drawShip();
    this.drawComboFx();
  }

  private drawStars(): void {
    const ctx = this.ctx;
    const t = this.gameTime;
    for (const s of this.stars) {
      const brightness = s.baseBright * (0.5 + 0.5 * Math.sin((2 * Math.PI * (t * this.blinkMul + s.phase)) / s.period));
      const alpha = Math.max(0.1, brightness);
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.round(s.size), Math.round(s.size));
    }
  }

  private drawPlanets(): void {
    const ctx = this.ctx;
    for (const p of this.planets) {
      if (!p.alive) continue;
      const col = PLANET_COLORS[p.type];

      ctx.save();
      ctx.shadowColor = col.main;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLANET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = col.main;
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.beginPath();
      ctx.arc(p.x, p.y, PLANET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = col.main;
      ctx.fill();

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ringAngle);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, PLANET_RADIUS + 6, 0, Math.PI * 2);
      ctx.strokeStyle = col.bright;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      const labelSize = 8;
      ctx.font = `${labelSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type.toUpperCase(), p.x, p.y);
    }
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha.toFixed(2)})`;
      ctx.fillRect(
        Math.round(p.x - p.size / 2),
        Math.round(p.y - p.size / 2),
        Math.round(p.size),
        Math.round(p.size)
      );
    }
  }

  private drawShip(): void {
    const ctx = this.ctx;
    const s = this.ship;

    if (s.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(s.trail[0].x, s.trail[0].y);
      for (let i = 1; i < s.trail.length; i++) {
        ctx.lineTo(s.trail[i].x, s.trail[i].y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const flashing = s.flashTimer > 0;
    const color = flashing ? '#FFFFFF' : SHIP_COLOR;
    const half = SHIP_SIZE / 2;

    ctx.save();
    ctx.translate(s.x, s.y);

    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(-half * 0.866, half * 0.5);
    ctx.lineTo(half * 0.866, half * 0.5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    if (!flashing) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawComboFx(): void {
    if (!this.comboFx.active) return;
    const ctx = this.ctx;
    const fx = this.comboFx;
    const progress = 1 - fx.timer / COMBO_TEXT_DURATION;
    const alpha = Math.max(0, 1 - progress);

    const r = Math.round(255 * (1 - progress));
    const g = Math.round(255 * (1 - progress * 0.16));
    const b = Math.round(255 * (1 - progress));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    const text = `COMBO x${fx.count}`;
    ctx.fillText(text, this.w / 2, fx.y);
    ctx.restore();
  }
}
