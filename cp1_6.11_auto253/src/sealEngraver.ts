export interface CarvingPoint {
  x: number;
  y: number;
  width: number;
}

export interface CarvingPath {
  points: CarvingPoint[];
  brush: 'round' | 'square';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const CANVAS_SIZE: number = 400;
const MAX_PARTICLES: number = 20;
const PARTICLE_LIFETIME: number = 500;
const MIN_WIDTH: number = 1;
const MAX_WIDTH: number = 4;
const MAX_SPEED: number = 3;

export class SealEngraver {
  private ctx: CanvasRenderingContext2D;
  private paths: CarvingPath[] = [];
  private currentPath: CarvingPath | null = null;
  private brushType: 'round' | 'square' = 'round';
  private isCarving: boolean = false;
  private particles: Particle[] = [];
  private lastX: number = 0;
  private lastY: number = 0;
  private lastTime: number = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  setBrushType(type: 'round' | 'square'): void {
    this.brushType = type;
  }

  getBrushType(): 'round' | 'square' {
    return this.brushType;
  }

  startCarving(x: number, y: number): void {
    this.isCarving = true;
    this.lastX = x;
    this.lastY = y;
    this.lastTime = performance.now();
    this.currentPath = {
      points: [{ x, y, width: MAX_WIDTH }],
      brush: this.brushType
    };
  }

  carve(x: number, y: number): void {
    if (!this.isCarving || !this.currentPath) return;

    const now = performance.now();
    const dt = now - this.lastTime;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    const speed = dt > 0 ? dist / dt : 0;
    const t = Math.min(speed / MAX_SPEED, 1);
    const width = MAX_WIDTH - (MAX_WIDTH - MIN_WIDTH) * t;

    this.currentPath.points.push({ x, y, width });

    if (Math.random() < 0.4) {
      this.spawnParticles(x, y, dx, dy);
    }

    this.lastX = x;
    this.lastY = y;
    this.lastTime = now;
  }

  stopCarving(): void {
    if (this.currentPath && this.currentPath.points.length > 1) {
      this.paths.push(this.currentPath);
    }
    this.currentPath = null;
    this.isCarving = false;
  }

  clearCarvings(): void {
    this.paths = [];
    this.currentPath = null;
    this.particles = [];
  }

  getPaths(): CarvingPath[] {
    return this.paths.map(p => ({
      ...p,
      points: [...p.points]
    }));
  }

  isCurrentlyCarving(): boolean {
    return this.isCarving;
  }

  private spawnParticles(x: number, y: number, dx: number, dy: number): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }

    const baseAngle = Math.atan2(dy, dx);
    const angle = baseAngle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2 + (Math.random() - 0.5) * 0.8);
    const speed = 0.3 + Math.random() * 1.2;

    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
      size: 0.8 + Math.random() * 1.5
    });
  }

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (const path of this.paths) {
      this.drawPath(ctx, path);
    }

    if (this.currentPath) {
      this.drawPath(ctx, this.currentPath);
    }

    for (const p of this.particles) {
      const alpha = (p.life / p.maxLife) * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#B0A898';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPath(ctx: CanvasRenderingContext2D, path: CarvingPath): void {
    const points = path.points;
    if (points.length < 2) return;

    ctx.save();

    if (path.brush === 'round') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const w = (prev.width + curr.width) / 2;

      ctx.beginPath();
      ctx.strokeStyle = '#6B5340';
      ctx.lineWidth = w;
      ctx.moveTo(prev.x, prev.y);

      if (i < points.length - 1) {
        const next = points[i + 1];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      } else {
        ctx.lineTo(curr.x, curr.y);
      }
      ctx.stroke();
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const w = ((prev.width + curr.width) / 2) * 0.45;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(210, 185, 155, 0.55)';
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.moveTo(prev.x - 0.5, prev.y - 0.5);
      ctx.lineTo(curr.x - 0.5, curr.y - 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  getCarvingImageData(): ImageData {
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_SIZE;
    offscreen.height = CANVAS_SIZE;
    const octx = offscreen.getContext('2d')!;

    for (const path of this.paths) {
      this.drawPath(octx, path);
    }
    if (this.currentPath) {
      this.drawPath(octx, this.currentPath);
    }

    return octx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}
