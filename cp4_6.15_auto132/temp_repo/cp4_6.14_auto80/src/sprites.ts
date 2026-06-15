export interface FragmentData {
  id: number;
  shape: number;
  collected: boolean;
  collectedAt: number;
  animProgress: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

export interface SpriteParticleSystem {
  particles: Particle[];
  nextParticleId: number;
}

export interface FallingFragment {
  id: number;
  shape: number;
  x: number;
  y: number;
  startY: number;
  endY: number;
  progress: number;
  duration: number;
  elapsed: number;
}

export type SpriteEvent =
  | 'fragmentAnimComplete'
  | 'synthAnimComplete';

type EventCallback = (...args: any[]) => void;

const TOTAL_FRAGMENTS = 5;
const MAX_PARTICLES = 100;
const COLORS = ['#6366f1', '#a855f7', '#fbbf24', '#818cf8', '#c084fc'];
const SHAPE_COUNT = 5;

export class SpriteManager {
  public fragments: FragmentData[] = [];
  public particleSystem: SpriteParticleSystem = {
    particles: [],
    nextParticleId: 0,
  };
  public fallingFragments: FallingFragment[] = [];
  public spriteCompleted = false;
  public synthProgress = 0;
  public synthActive = false;
  public synthCenter: { x: number; y: number } = { x: 400, y: 300 };
  public synthStartTime = 0;

  private events: Map<SpriteEvent, Set<EventCallback>> = new Map();
  private nextFallingId = 0;

  constructor() {
    for (const ev of ['fragmentAnimComplete', 'synthAnimComplete'] as SpriteEvent[]) {
      this.events.set(ev, new Set());
    }
    this.initFragments();
  }

  on(event: SpriteEvent, cb: EventCallback): () => void {
    this.events.get(event)!.add(cb);
    return () => this.events.get(event)!.delete(cb);
  }

  private emit(event: SpriteEvent, ...args: any[]): void {
    this.events.get(event)!.forEach((cb) => cb(...args));
  }

  initFragments(): void {
    this.fragments = [];
    for (let i = 0; i < TOTAL_FRAGMENTS; i++) {
      this.fragments.push({
        id: i,
        shape: i % SHAPE_COUNT,
        collected: false,
        collectedAt: 0,
        animProgress: 0,
      });
    }
    this.spriteCompleted = false;
    this.synthProgress = 0;
    this.synthActive = false;
    this.particleSystem.particles = [];
    this.fallingFragments = [];
  }

  collectFragment(index: number, canvasW: number, canvasH: number): FallingFragment {
    if (index < 0 || index >= this.fragments.length) {
      throw new Error(`Fragment index out of range: ${index}`);
    }
    const frag = this.fragments[index];
    frag.collected = true;
    frag.collectedAt = performance.now();

    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const ff: FallingFragment = {
      id: this.nextFallingId++,
      shape: frag.shape,
      x: cx + (Math.random() * 80 - 40),
      y: cy,
      startY: cy + 80,
      endY: cy - 100 - (index * 35),
      progress: 0,
      duration: 0.5,
      elapsed: 0,
    };
    this.fallingFragments.push(ff);

    console.log(`[Fragment] Collected #${index + 1}, animating from center to y=${ff.endY.toFixed(0)}`);

    const allCollected = this.fragments.every((f) => f.collected);
    if (allCollected) {
      this.startSpriteSynth(canvasW, canvasH);
    }
    return ff;
  }

  startSpriteSynth(canvasW: number, canvasH: number): void {
    this.spriteCompleted = true;
    this.synthActive = true;
    this.synthProgress = 0;
    this.synthCenter = { x: canvasW / 2, y: canvasH / 2 };
    this.synthStartTime = performance.now();
    this.spawnExplosionParticles(this.synthCenter.x, this.synthCenter.y, 60);
    console.log('[SpriteSynth] Synthesis started! Particle explosion for 1 second.');
  }

  spawnExplosionParticles(cx: number, cy: number, count: number): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (this.synthActive && this.synthProgress < 1) {
          this.addParticle(cx, cy, true);
        }
      }, i * (1000 / count));
    }
  }

  private addParticle(cx: number, cy: number, isExplosion: boolean = false): void {
    const ps = this.particleSystem;
    if (ps.particles.length >= MAX_PARTICLES) {
      const removed = ps.particles.shift();
      console.debug(`[ParticlePool] Max ${MAX_PARTICLES} reached, removed oldest #${removed?.id}`);
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = isExplosion
      ? 120 + Math.random() * 320
      : 60 + Math.random() * 180;
    const maxLife = isExplosion
      ? 0.8 + Math.random() * 0.4
      : 0.5 + Math.random() * 0.4;
    const size = isExplosion
      ? 3 + Math.random() * 7
      : 2 + Math.random() * 4;

    ps.particles.push({
      id: ps.nextParticleId++,
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: maxLife,
      maxLife,
      size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() * 2 - 1) * 8,
    });
  }

  update(dt: number): void {
    for (let i = this.fallingFragments.length - 1; i >= 0; i--) {
      const ff = this.fallingFragments[i];
      ff.elapsed += dt;
      ff.progress = Math.min(1, ff.elapsed / ff.duration);
      if (ff.progress >= 1) {
        this.fallingFragments.splice(i, 1);
        this.emit('fragmentAnimComplete', ff);
      }
    }

    const ps = this.particleSystem;
    for (let i = ps.particles.length - 1; i >= 0; i--) {
      const p = ps.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        ps.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.vy += 40 * dt;
      p.rotation += p.rotationSpeed * dt;
    }

    if (this.synthActive) {
      this.synthProgress = Math.min(1, this.synthProgress + dt);
      if (this.synthProgress >= 1 && !this.particleSystem.particles.length) {
        this.synthActive = false;
        this.emit('synthAnimComplete');
      }
    }
  }

  drawParticles(ctx: CanvasRenderingContext2D): void {
    const ps = this.particleSystem;
    ctx.save();
    for (const p of ps.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10 * alpha;
      const s = p.size * (0.5 + alpha * 0.5);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const r = i % 2 === 0 ? s : s * 0.4;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  drawFallingFragments(ctx: CanvasRenderingContext2D): void {
    for (const ff of this.fallingFragments) {
      const p = ff.progress;
      const easedP = this.easeOutBack(p);
      const y = ff.startY + (ff.endY - ff.startY) * easedP;
      const scale = 0.3 + 0.9 * easedP;
      const alpha = 0.3 + 0.6 * p;
      const size = 64 * scale;
      this.drawFragmentShape(ctx, ff.x, y, size, ff.shape, alpha, p);

      if (p > 0.7 && p < 0.95 && Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const dist = size * 0.5 + Math.random() * 20;
        this.addParticle(
          ff.x + Math.cos(angle) * dist,
          y + Math.sin(angle) * dist
        );
      }
    }
  }

  drawFragmentShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    shape: number,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(progress * Math.PI * 0.5);
    ctx.globalAlpha = alpha;

    const gradient = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size * 0.6);
    gradient.addColorStop(0, `rgba(251, 191, 36, ${0.7 * alpha})`);
    gradient.addColorStop(0.5, `rgba(168, 85, 247, ${0.6 * alpha})`);
    gradient.addColorStop(1, `rgba(99, 102, 241, ${0.5 * alpha})`);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.8 * alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 15;

    const s = size / 2;
    ctx.beginPath();

    switch (shape % SHAPE_COUNT) {
      case 0:
        this.drawStar(ctx, 5, s, s * 0.45);
        break;
      case 1:
        this.drawDiamond(ctx, s);
        break;
      case 2:
        this.drawHexagon(ctx, s);
        break;
      case 3:
        this.drawPetal(ctx, s);
        break;
      case 4:
      default:
        this.drawCrystal(ctx, s);
        break;
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, points: number, outer: number, inner: number): void {
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }

  private drawDiamond(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.7, 0);
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, s: number): void {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * s;
      const py = Math.sin(a) * s;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }

  private drawPetal(ctx: CanvasRenderingContext2D, s: number): void {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const cx = Math.cos(a) * s * 0.4;
      const cy = Math.sin(a) * s * 0.4;
      const rx = s * 0.5;
      const ry = s * 0.3;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.restore();
    }
  }

  private drawCrystal(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.6, -s * 0.2);
    ctx.lineTo(s * 0.5, s);
    ctx.lineTo(-s * 0.5, s);
    ctx.lineTo(-s * 0.6, -s * 0.2);
  }

  drawCompletedSprite(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    progress: number
  ): void {
    const t = Math.min(1, progress / 1);
    const scale = this.easeOutElastic(t);
    const size = 120 * scale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * Math.PI * 2);

    const ringAlpha = 0.3 + 0.7 * t;
    for (let r = 0; r < 3; r++) {
      ctx.globalAlpha = ringAlpha * (0.4 - r * 0.1);
      const rs = size * (1 + r * 0.15);
      ctx.strokeStyle = r % 2 === 0 ? '#fbbf24' : '#a855f7';
      ctx.lineWidth = 3;
      ctx.shadowColor = r % 2 === 0 ? '#fbbf24' : '#a855f7';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, rs, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    this.drawFragmentShape(ctx, 0, 0, size, 0, 0.95, t);

    ctx.restore();

    if (t < 0.9) {
      if (Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const dist = size * (0.8 + Math.random() * 0.4);
        this.addParticle(
          cx + Math.cos(angle) * dist,
          cy + Math.sin(angle) * dist
        );
      }
    }
  }

  drawFragmentSlots(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    collectedCount: number
  ): void {
    const slotSize = 28;
    const gap = 8;
    for (let i = 0; i < TOTAL_FRAGMENTS; i++) {
      const sx = x + i * (slotSize + gap);
      const filled = i < collectedCount;
      ctx.save();
      ctx.globalAlpha = filled ? 1 : 0.35;

      const grad = ctx.createLinearGradient(sx, y, sx + slotSize, y + slotSize);
      if (filled) {
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0.5)');
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;
      } else {
        grad.addColorStop(0, 'rgba(30, 41, 59, 0.8)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
      }
      ctx.fillStyle = grad;
      ctx.strokeStyle = filled
        ? 'rgba(168, 85, 247, 0.6)'
        : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      this.roundRect(ctx, sx, y, slotSize, slotSize, 6);
      ctx.fill();
      ctx.stroke();

      if (filled) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.fillText('✦', sx + slotSize / 2, y + slotSize / 2 + 1);
      }
      ctx.restore();
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  getTotalFragments(): number {
    return TOTAL_FRAGMENTS;
  }

  getCollectedCount(): number {
    return this.fragments.filter((f) => f.collected).length;
  }
}
