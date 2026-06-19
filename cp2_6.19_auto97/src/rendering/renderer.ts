import { Enemy, EnemyType } from '../entities/enemy';
import { RuneDefinition, RuneType, Point } from '../entities/rune-system';
import { TrajectoryPoint, TrajectorySegment } from '../input/gesture-recognizer';

export type ParticleType = 'ambient' | 'trail' | 'death' | 'coin' | 'spark';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
  targetX?: number;
  targetY?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface CardFlash {
  runeId: RuneType;
  life: number;
  maxLife: number;
}

export interface ScoreBounce {
  life: number;
  maxLife: number;
}

export interface FlyingCoin {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  t: number;
  rotation: number;
}

export interface RuneCardState {
  rune: RuneDefinition;
  cooldownPercent: number;
  isActive: boolean;
}

const MAX_PARTICLES = 500;
const AMBIENT_COUNT = 40;
const FADE_TIME = 1500;
const CARD_WIDTH = 100;
const CARD_HEIGHT = 130;
const CARD_SPACING = 16;
const CARD_START_Y = 100;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function quadraticBezier(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;

  private width: number = 0;
  private height: number = 0;
  private circleX: number = 0;
  private circleY: number = 0;
  private circleR: number = 0;

  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private cardFlashes: CardFlash[] = [];
  private scoreBounce: ScoreBounce | null = null;
  private flyingCoins: FlyingCoin[] = [];
  private ambientParticles: Particle[] = [];

  private audioCtx: AudioContext | null = null;
  private bgPatternCanvas: OffscreenCanvas | null = null;
  private scorePosition: { x: number; y: number } = { x: 0, y: 0 };

  private lastTrailParticleTime: number = 0;
  private lastTrailParticlePoint: { x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context');
    }
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;

    this.particles = [];
    this.shockwaves = [];
    this.cardFlashes = [];
    this.flyingCoins = [];
    this.ambientParticles = [];

    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }

    this.createBgPattern();
    this.resize(window.innerWidth, window.innerHeight);
    this.initAmbientParticles();
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.circleX = w / 2;
    this.circleY = h / 2;
    this.circleR = Math.min(w, h) * 0.3;

    this.scorePosition = { x: w - 30, y: 30 };
  }

  update(deltaTime: number): void {
    const dt = deltaTime / 1000;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotationSpeed !== undefined) {
        p.rotation = (p.rotation || 0) + p.rotationSpeed * dt;
      }

      if (p.type === 'coin' && p.targetX !== undefined && p.targetY !== undefined) {
        const progress = 1 - p.life / p.maxLife;
        const eased = easeOutQuad(progress);
        const cx = (p.x + p.targetX) / 2;
        const cy = Math.min(p.y, p.targetY) - 150;
        p.x = quadraticBezier(p.x, cx, p.targetX, eased);
        p.y = quadraticBezier(p.y, cy, p.targetY, eased);
      }

      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
      const p = this.ambientParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      p.life -= deltaTime;
      if (p.life <= 0) {
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.life = p.maxLife;
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= deltaTime;
      const progress = 1 - s.life / s.maxLife;
      s.radius = progress * s.maxRadius;
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.cardFlashes.length - 1; i >= 0; i--) {
      const cf = this.cardFlashes[i];
      cf.life -= deltaTime;
      if (cf.life <= 0) {
        this.cardFlashes.splice(i, 1);
      }
    }

    if (this.scoreBounce) {
      this.scoreBounce.life += deltaTime;
      if (this.scoreBounce.life >= this.scoreBounce.maxLife) {
        this.scoreBounce = null;
      }
    }

    for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
      const fc = this.flyingCoins[i];
      fc.t += dt * 1.2;
      fc.rotation += dt * 8;
      if (fc.t >= 1) {
        this.flyingCoins.splice(i, 1);
      }
    }

    while (this.particles.length > MAX_PARTICLES) {
      let minLife = Infinity;
      let minIdx = -1;
      for (let i = 0; i < this.particles.length; i++) {
        if (this.particles[i].life < minLife) {
          minLife = this.particles[i].life;
          minIdx = i;
        }
      }
      if (minIdx >= 0) {
        this.particles.splice(minIdx, 1);
      }
    }
  }

  render(
    segments: TrajectorySegment[],
    enemies: Enemy[],
    runeCards: RuneCardState[],
    score: number,
    mana: number,
    maxMana: number,
    combo: number,
    currentTrajectory: TrajectoryPoint[],
    currentElement: 'fire' | 'ice' | 'lightning'
  ): void {
    this.drawBackground();
    this.drawAmbientParticles();
    this.drawShockwaves();
    this.drawEnemies(enemies);
    this.drawCircleArea();
    this.drawTrajectories(segments, currentTrajectory, currentElement);
    this.drawFlyingCoins();
    this.drawParticles();
    this.drawManaBar(mana, maxMana);
    this.drawScore(score);
    this.drawCombo(combo);
    this.drawRuneCards(runeCards);
    this.drawCardFlashes();
  }

  private createBgPattern(): void {
    try {
      this.bgPatternCanvas = new OffscreenCanvas(200, 200);
      const pctx = this.bgPatternCanvas.getContext('2d');
      if (!pctx) return;

      pctx.fillStyle = '#2d1f0f';
      pctx.fillRect(0, 0, 200, 200);

      const imgData = pctx.getImageData(0, 0, 200, 200);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = clamp(data[i] + noise, 0, 255);
        data[i + 1] = clamp(data[i + 1] + noise * 0.7, 0, 255);
        data[i + 2] = clamp(data[i + 2] + noise * 0.4, 0, 255);
      }
      pctx.putImageData(imgData, 0, 0);

      const glow1 = pctx.createRadialGradient(50, 50, 0, 50, 50, 120);
      glow1.addColorStop(0, 'rgba(212, 168, 75, 0.08)');
      glow1.addColorStop(1, 'rgba(212, 168, 75, 0)');
      pctx.fillStyle = glow1;
      pctx.fillRect(0, 0, 200, 200);

      const glow2 = pctx.createRadialGradient(150, 150, 0, 150, 150, 100);
      glow2.addColorStop(0, 'rgba(180, 130, 50, 0.06)');
      glow2.addColorStop(1, 'rgba(180, 130, 50, 0)');
      pctx.fillStyle = glow2;
      pctx.fillRect(0, 0, 200, 200);
    } catch (e) {
      this.bgPatternCanvas = null;
    }
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    ctx.save();

    if (this.bgPatternCanvas) {
      try {
        const pattern = ctx.createPattern(this.bgPatternCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, this.width, this.height);
        } else {
          ctx.fillStyle = '#2d1f0f';
          ctx.fillRect(0, 0, this.width, this.height);
        }
      } catch (e) {
        ctx.fillStyle = '#2d1f0f';
        ctx.fillRect(0, 0, this.width, this.height);
      }
    } else {
      ctx.fillStyle = '#2d1f0f';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const vignette = ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.2,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  private initAmbientParticles(): void {
    const colors = ['#d4a84b', '#c9a96e', '#e8c67a', '#b8923a', '#f0d08a'];
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      this.ambientParticles.push({
        x: Math.random() * (this.width || 800),
        y: Math.random() * (this.height || 600),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 5000 + Math.random() * 10000,
        maxLife: 15000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1 + Math.random() * 1.5,
        type: 'ambient',
      });
    }
  }

  private drawAmbientParticles(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.ambientParticles) {
      const alpha = Math.min(1, p.life / 2000) * (1 - (p.maxLife - p.life) / 3000);
      ctx.globalAlpha = clamp(alpha * 0.6, 0.1, 0.6);
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCircleArea(): void {
    if (this.circleR <= 0) return;
    const ctx = this.ctx;
    ctx.save();

    const cr = Math.max(1, this.circleR);
    const innerR = Math.max(1, cr - 8);

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#d4a84b';

    const fillGrad = ctx.createRadialGradient(
      this.circleX, this.circleY, 0,
      this.circleX, this.circleY, cr
    );
    fillGrad.addColorStop(0, 'rgba(212, 168, 75, 0.05)');
    fillGrad.addColorStop(0.8, 'rgba(212, 168, 75, 0.02)');
    fillGrad.addColorStop(1, 'rgba(212, 168, 75, 0)');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.arc(this.circleX, this.circleY, cr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d4a84b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.circleX, this.circleY, cr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(212, 168, 75, 0.5)';
    ctx.strokeStyle = 'rgba(212, 168, 75, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.circleX, this.circleY, innerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private getElementColor(element: 'fire' | 'ice' | 'lightning'): string {
    switch (element) {
      case 'fire': return '#ff4500';
      case 'ice': return '#00bfff';
      case 'lightning': return '#ffd700';
    }
  }

  private drawTrajectories(
    segments: TrajectorySegment[],
    current: TrajectoryPoint[],
    element: 'fire' | 'ice' | 'lightning'
  ): void {
    const ctx = this.ctx;
    const now = Date.now();
    const color = this.getElementColor(element);

    const allSegments: TrajectorySegment[] = segments.slice();
    if (current.length > 0) {
      allSegments.push({ points: current, createdAt: now });
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const seg of allSegments) {
      const age = now - seg.createdAt;
      const alpha = clamp(1 - age / FADE_TIME, 0, 1);
      if (alpha <= 0) continue;

      const points = seg.points;
      if (points.length < 2) continue;

      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);

        if (pass === 0) {
          ctx.globalAlpha = alpha * 0.4;
          ctx.strokeStyle = color;
          ctx.lineWidth = 10;
          ctx.shadowBlur = 25;
          ctx.shadowColor = color;
        } else {
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
        }
        ctx.stroke();
      }

      if (seg === allSegments[allSegments.length - 1] && current.length > 0) {
        const now2 = performance.now();
        if (now2 - this.lastTrailParticleTime > 30) {
          const lastPt = points[points.length - 1];
          if (!this.lastTrailParticlePoint ||
              Math.hypot(lastPt.x - this.lastTrailParticlePoint.x, lastPt.y - this.lastTrailParticlePoint.y) > 8) {
            this.addTrailParticles(lastPt, color);
            this.lastTrailParticlePoint = { x: lastPt.x, y: lastPt.y };
            this.lastTrailParticleTime = now2;
          }
        }
      }
    }

    ctx.restore();
  }

  private addTrailParticles(pt: TrajectoryPoint, color: string): void {
    if (this.particles.length >= MAX_PARTICLES - 5) return;

    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 20;
      this.particles.push({
        x: pt.x,
        y: pt.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color: color,
        size: 1 + Math.random() * 2,
        type: 'trail',
      });
    }
  }

  private drawShockwaves(): void {
    const ctx = this.ctx;
    ctx.save();

    for (const s of this.shockwaves) {
      const progress = 1 - s.life / s.maxLife;
      const alpha = 1 - progress;
      const lineWidth = 8 * (1 - progress);

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = 30;
      ctx.shadowColor = s.color;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  addShockwave(x: number, y: number, color: string): void {
    this.shockwaves.push({
      x,
      y,
      radius: 0,
      maxRadius: this.circleR * 2.2,
      life: 600,
      maxLife: 600,
      color,
    });
  }

  private drawEnemies(enemies: Enemy[]): void {
    const ctx = this.ctx;
    const now = performance.now();

    for (const enemy of enemies) {
      ctx.save();

      const bob = Math.sin(now * 0.003 * enemy.bobSpeed + enemy.id) * 3;
      const drawY = enemy.y + bob;

      if (!enemy.alive && enemy.deathAnimation > 0) {
        ctx.globalAlpha = 1 - enemy.deathAnimation;
        const scale = 1 + enemy.deathAnimation * 0.3;
        ctx.translate(enemy.x, drawY);
        ctx.scale(scale, scale);
        ctx.translate(-enemy.x, -drawY);
      }

      ctx.save();
      ctx.globalAlpha *= 0.3;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + enemy.size * 0.8, enemy.size * 0.6, enemy.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      switch (enemy.type) {
        case 'skeleton':
          this.drawSkeleton(enemy, drawY);
          break;
        case 'fire_elemental':
          this.drawFireElemental(enemy, drawY, now);
          break;
        case 'ice_elemental':
          this.drawIceElemental(enemy, drawY);
          break;
        case 'shadow':
          this.drawShadow(enemy, drawY, now);
          break;
      }

      if (enemy.hitFlashTimer > 0) {
        const isOdd = enemy.hitFlashCount % 2 === 1;
        if (isOdd) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(enemy.x, drawY, enemy.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

      this.drawEnemyHealthBar(enemy, drawY);
    }
  }

  private drawSkeleton(enemy: Enemy, drawY: number): void {
    const ctx = this.ctx;
    const s = enemy.size;
    const x = enemy.x;
    const y = drawY;

    ctx.save();
    ctx.strokeStyle = '#e8e4d9';
    ctx.fillStyle = '#d8d4c9';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, y - s * 0.3, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x - s * 0.12, y - s * 0.35, s * 0.07, 0, Math.PI * 2);
    ctx.arc(x + s * 0.12, y - s * 0.35, s * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e8e4d9';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const ry = y + s * 0.05 + i * s * 0.12;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.3, ry);
      ctx.lineTo(x + s * 0.3, ry);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.05);
    ctx.lineTo(x, y + s * 0.45);
    ctx.stroke();

    ctx.restore();
  }

  private drawFireElemental(enemy: Enemy, drawY: number, now: number): void {
    const ctx = this.ctx;
    const s = enemy.size;
    const x = enemy.x;
    const y = drawY;

    ctx.save();
    const grad = ctx.createRadialGradient(x, y, s * 0.1, x, y, s * 0.8);
    grad.addColorStop(0, '#fff2a8');
    grad.addColorStop(0.3, '#ff8c00');
    grad.addColorStop(0.7, '#ff4500');
    grad.addColorStop(1, 'rgba(178, 34, 34, 0)');
    ctx.fillStyle = grad;

    const wobble = Math.sin(now * 0.01 + enemy.id) * s * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.8 + wobble);
    ctx.quadraticCurveTo(x + s * 0.6 + wobble, y - s * 0.3, x + s * 0.4, y + s * 0.4);
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.2, x + s * 0.2, y + s * 0.5);
    ctx.quadraticCurveTo(x, y + s * 0.7, x - s * 0.2, y + s * 0.5);
    ctx.quadraticCurveTo(x - s * 0.5, y + s * 0.2, x - s * 0.4, y + s * 0.4);
    ctx.quadraticCurveTo(x - s * 0.6 - wobble, y - s * 0.3, x, y - s * 0.8 + wobble);
    ctx.fill();

    ctx.fillStyle = '#ffe680';
    ctx.beginPath();
    ctx.arc(x, y, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawIceElemental(enemy: Enemy, drawY: number): void {
    const ctx = this.ctx;
    const s = enemy.size;
    const x = enemy.x;
    const y = drawY;

    ctx.save();

    const grad = ctx.createRadialGradient(x, y - s * 0.1, s * 0.1, x, y, s * 0.8);
    grad.addColorStop(0, '#e0ffff');
    grad.addColorStop(0.4, '#00bfff');
    grad.addColorStop(1, '#0066cc');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#87ceeb';
    ctx.lineWidth = 2;

    const sides = 6;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides;
      const r = i % 2 === 0 ? s * 0.7 : s * 0.5;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.6);
    ctx.lineTo(x, y + s * 0.5);
    ctx.moveTo(x - s * 0.5, y - s * 0.1);
    ctx.lineTo(x + s * 0.5, y + s * 0.3);
    ctx.moveTo(x + s * 0.5, y - s * 0.1);
    ctx.lineTo(x - s * 0.5, y + s * 0.3);
    ctx.stroke();

    ctx.restore();
  }

  private drawShadow(enemy: Enemy, drawY: number, now: number): void {
    const ctx = this.ctx;
    const s = enemy.size;
    const x = enemy.x;
    const y = drawY;

    ctx.save();
    ctx.globalAlpha *= 0.85;

    const wobble = Math.sin(now * 0.005 + enemy.id) * s * 0.08;

    const grad = ctx.createRadialGradient(x, y, s * 0.1, x, y, s * 0.9);
    grad.addColorStop(0, '#6b4a8a');
    grad.addColorStop(0.6, '#3d1f5c');
    grad.addColorStop(1, 'rgba(30, 10, 50, 0)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(x - s * 0.4 + wobble, y - s * 0.5);
    ctx.quadraticCurveTo(x, y - s * 0.8 - wobble, x + s * 0.4 - wobble, y - s * 0.4);
    ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.1, x + s * 0.5, y + s * 0.2);
    ctx.quadraticCurveTo(x + s * 0.6 + wobble, y + s * 0.5, x + s * 0.3, y + s * 0.6);
    ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.55 - wobble, x, y + s * 0.65);
    ctx.quadraticCurveTo(x - s * 0.1, y + s * 0.55 + wobble, x - s * 0.3, y + s * 0.6);
    ctx.quadraticCurveTo(x - s * 0.6 - wobble, y + s * 0.5, x - s * 0.5, y + s * 0.2);
    ctx.quadraticCurveTo(x - s * 0.6, y - s * 0.1, x - s * 0.4 + wobble, y - s * 0.5);
    ctx.fill();

    ctx.fillStyle = '#ff0066';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0066';
    ctx.beginPath();
    ctx.arc(x - s * 0.15, y - s * 0.15, s * 0.08, 0, Math.PI * 2);
    ctx.arc(x + s * 0.15, y - s * 0.15, s * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawEnemyHealthBar(enemy: Enemy, drawY: number): void {
    const ctx = this.ctx;
    const barWidth = enemy.size * 1.2;
    const barHeight = 4;
    const barX = enemy.x - barWidth / 2;
    const barY = drawY - enemy.size - 12;

    const hpPercent = clamp(enemy.displayHp / enemy.maxHp, 0, 1);

    ctx.save();
    ctx.fillStyle = '#330000';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    grad.addColorStop(0, '#ff4444');
    grad.addColorStop(1, '#88ff44');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.restore();
  }

  private drawRuneCards(cards: RuneCardState[]): void {
    const ctx = this.ctx;
    const x = this.width - CARD_WIDTH - 20;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const y = CARD_START_Y + i * (CARD_HEIGHT + CARD_SPACING);

      ctx.save();

      ctx.fillStyle = 'rgba(45, 31, 15, 0.85)';
      ctx.beginPath();
      this.roundRect(ctx, x, y, CARD_WIDTH, CARD_HEIGHT, 8);
      ctx.fill();

      if (card.isActive && card.cooldownPercent >= 1) {
        ctx.strokeStyle = '#d4a84b';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#d4a84b';
      } else {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
      }
      ctx.beginPath();
      this.roundRect(ctx, x, y, CARD_WIDTH, CARD_HEIGHT, 8);
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.fillStyle = card.rune.color;
      ctx.beginPath();
      ctx.arc(x + 12, y + 12, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = card.isActive && card.cooldownPercent >= 1 ? '#f5e6c8' : '#888';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.rune.icon, x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2 - 10);

      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.fillText(card.rune.name, x + CARD_WIDTH / 2, y + CARD_HEIGHT - 28);

      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = card.isActive && card.cooldownPercent >= 1 ? '#c9a96e' : '#666';
      ctx.fillText(`${card.rune.manaCost} 法力`, x + CARD_WIDTH / 2, y + CARD_HEIGHT - 12);

      if (card.cooldownPercent < 1) {
        const maskHeight = (1 - card.cooldownPercent) * CARD_HEIGHT;
        ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
        ctx.fillRect(x, y, CARD_WIDTH, maskHeight);

        ctx.save();
        const chainRotation = Math.sin(Date.now() * 0.003) * 0.2;
        ctx.translate(x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
        ctx.rotate(chainRotation);
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-12, -12);
        ctx.lineTo(12, 12);
        ctx.moveTo(-12, 12);
        ctx.lineTo(12, -12);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawCardFlashes(): void {
    const ctx = this.ctx;
    const x = this.width - CARD_WIDTH - 20;

    const runeOrder: RuneType[] = ['triangle', 'square', 'pentagram', 'spiral', 'lightning', 'crescent'];

    for (const cf of this.cardFlashes) {
      const idx = runeOrder.indexOf(cf.runeId);
      if (idx < 0) continue;

      const y = CARD_START_Y + idx * (CARD_HEIGHT + CARD_SPACING);
      const progress = 1 - cf.life / cf.maxLife;
      const alpha = 1 - progress;
      const expand = progress * 20;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffdd66';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 40 * (1 - progress);
      ctx.shadowColor = '#ffdd66';

      ctx.beginPath();
      this.roundRect(
        ctx,
        x - expand,
        y - expand,
        CARD_WIDTH + expand * 2,
        CARD_HEIGHT + expand * 2,
        12
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  triggerCardFlash(runeId: RuneType): void {
    this.cardFlashes.push({
      runeId,
      life: 500,
      maxLife: 500,
    });
  }

  private drawScore(score: number): void {
    const ctx = this.ctx;
    const { x, y } = this.scorePosition;

    ctx.save();

    let scale = 1;
    if (this.scoreBounce) {
      const progress = this.scoreBounce.life / this.scoreBounce.maxLife;
      scale = 1 + Math.sin(progress * Math.PI) * 0.3;
    }

    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);

    const coinRotation = Date.now() * 0.001;
    ctx.save();
    ctx.translate(x - 50, y);
    const scaleX = Math.abs(Math.cos(coinRotation));
    ctx.scale(scaleX, 1);

    const coinGrad = ctx.createRadialGradient(-6, -4, 2, 0, 0, 14);
    coinGrad.addColorStop(0, '#fff6c2');
    coinGrad.addColorStop(0.5, '#ffd700');
    coinGrad.addColorStop(1, '#b8860b');
    ctx.fillStyle = coinGrad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8b6914';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000';
    ctx.fillText(score.toString(), x, y);

    ctx.restore();
  }

  triggerScoreBounce(): void {
    this.scoreBounce = { life: 0, maxLife: 400 };
  }

  private drawManaBar(mana: number, maxMana: number): void {
    const ctx = this.ctx;
    const barX = 20;
    const barY = 20;
    const barW = 200;
    const barH = 16;
    const percent = clamp(mana / maxMana, 0, 1);

    ctx.save();

    ctx.fillStyle = '#1a1a2e';
    this.roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    const grad = ctx.createLinearGradient(barX, barY, barX + barW * percent, barY);
    grad.addColorStop(0, '#1e90ff');
    grad.addColorStop(1, '#00bfff');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00bfff';
    this.roundRect(ctx, barX, barY, barW * percent, barH, 4);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#4a6fa5';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.stroke();

    ctx.fillStyle = '#e0e8ff';
    ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`法力 ${Math.ceil(mana)} / ${maxMana}`, barX + 8, barY + barH + 4);

    ctx.restore();
  }

  private drawCombo(combo: number): void {
    if (combo < 2) return;

    const ctx = this.ctx;
    const x = this.circleX;
    const y = this.circleY - this.circleR - 40;

    ctx.save();

    const scale = 1 + Math.sin(Date.now() * 0.008) * 0.08;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff8c00';

    ctx.fillText(`x${combo} COMBO`, x, y);

    ctx.fillStyle = '#fff6c2';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.shadowBlur = 10;
    ctx.fillText(`x${combo} COMBO`, x, y);

    ctx.restore();
  }

  private drawFlyingCoins(): void {
    const ctx = this.ctx;

    for (const fc of this.flyingCoins) {
      const t = clamp(fc.t, 0, 1);
      const eased = easeInOutQuad(t);

      const controlY = Math.min(fc.startY, fc.targetY) - 150;
      const px = quadraticBezier(fc.startX, (fc.startX + fc.targetX) / 2, fc.targetX, eased);
      const py = quadraticBezier(fc.startY, controlY, fc.targetY, eased);

      const fadeIn = clamp(t * 5, 0, 1);
      const fadeOut = clamp((1 - t) * 3, 0, 1);
      const alpha = Math.min(fadeIn, fadeOut);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py);
      const spinScale = Math.abs(Math.cos(fc.rotation));
      ctx.scale(spinScale, 1);

      const coinGrad = ctx.createRadialGradient(-3, -2, 1, 0, 0, 10);
      coinGrad.addColorStop(0, '#fff6c2');
      coinGrad.addColorStop(0.5, '#ffd700');
      coinGrad.addColorStop(1, '#b8860b');
      ctx.fillStyle = coinGrad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  addFlyingCoin(fromX: number, fromY: number): void {
    this.flyingCoins.push({
      x: fromX,
      y: fromY,
      startX: fromX,
      startY: fromY,
      targetX: this.scorePosition.x - 40,
      targetY: this.scorePosition.y,
      t: 0,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  addDeathParticles(x: number, y: number, enemyType: EnemyType): void {
    const count = 15 + Math.floor(Math.random() * 11);
    let color1: string, color2: string;

    switch (enemyType) {
      case 'skeleton':
        color1 = '#d8d4c9';
        color2 = '#a8a499';
        break;
      case 'fire_elemental':
        color1 = '#ff4500';
        color2 = '#ff8c00';
        break;
      case 'ice_elemental':
        color1 = '#00bfff';
        color2 = '#87ceeb';
        break;
      case 'shadow':
        color1 = '#8b5cf6';
        color2 = '#6b4a8a';
        break;
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 600 + Math.random() * 400,
        maxLife: 1000,
        color: Math.random() < 0.5 ? color1 : color2,
        size: 2 + Math.random() * 3,
        type: 'death',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  addSparkParticles(x: number, y: number, color: string, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 250 + Math.random() * 250,
        maxLife: 500,
        color,
        size: 1.5 + Math.random() * 1.5,
        type: 'spark',
      });
    }
  }

  private drawParticles(): void {
    const ctx = this.ctx;

    const groups: Record<ParticleType, Particle[]> = {
      ambient: [],
      trail: [],
      death: [],
      coin: [],
      spark: [],
    };

    for (const p of this.particles) {
      groups[p.type].push(p);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowTypes: ParticleType[] = ['trail', 'death', 'spark'];
    for (const type of glowTypes) {
      for (const p of groups[type]) {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        if (p.rotation !== undefined) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    if (groups.coin.length > 0) {
      ctx.save();
      for (const p of groups.coin) {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = alpha;

        const coinGrad = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.size + 2);
        coinGrad.addColorStop(0, '#fff6c2');
        coinGrad.addColorStop(0.5, p.color);
        coinGrad.addColorStop(1, '#b8860b');
        ctx.fillStyle = coinGrad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  playWandStrikeSound(): void {
    if (!this.audioCtx) return;

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.connect(ctx.destination);

      const bufferSize = ctx.sampleRate * 0.15;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(2000, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.15);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.8, now + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.15);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.6, now + 0.005);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
    }
  }

  getCircleParams(): { x: number; y: number; r: number } {
    return { x: this.circleX, y: this.circleY, r: this.circleR };
  }

  getScorePosition(): { x: number; y: number } {
    return { ...this.scorePosition };
  }

  triggerSpellEffect(runeId: RuneType, color: string): void {
    this.triggerCardFlash(runeId);

    const circleParams = this.getCircleParams();
    this.addShockwave(circleParams.x, circleParams.y, color);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const dist = circleParams.r * 0.5;
      const px = circleParams.x + Math.cos(angle) * dist;
      const py = circleParams.y + Math.sin(angle) * dist;
      this.addSparkParticles(px, py, color, 6);
    }

    this.playWandStrikeSound();
  }
}
