export interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  speed: number;
}

export class Particle {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public size: number = 2;
  public color: string = '#00FF88';
  public life: number = 1;
  public active: boolean = false;
  public prevX: number = 0;
  public prevY: number = 0;

  private static colorCache = new Map<number, string>();

  public init(x: number, y: number, vx: number, vy: number, size: number): void {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.life = 1;
    this.active = true;
    this.updateColor();
  }

  public reset(): void {
    this.active = false;
  }

  public get speed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  public update(dt: number, width: number, height: number, boundaryElasticity: number): void {
    if (!this.active) return;

    this.prevX = this.x;
    this.prevY = this.y;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x - this.size < 0) {
      this.x = this.size;
      this.vx = -this.vx * boundaryElasticity;
    } else if (this.x + this.size > width) {
      this.x = width - this.size;
      this.vx = -this.vx * boundaryElasticity;
    }

    if (this.y - this.size < 0) {
      this.y = this.size;
      this.vy = -this.vy * boundaryElasticity;
    } else if (this.y + this.size > height) {
      this.y = height - this.size;
      this.vy = -this.vy * boundaryElasticity;
    }

    this.updateColor();
  }

  public collideWith(other: Particle): void {
    if (!this.active || !other.active) return;

    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const minDist = this.size + other.size;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      const overlap = (minDist - dist) / 2;
      this.x -= nx * overlap;
      this.y -= ny * overlap;
      other.x += nx * overlap;
      other.y += ny * overlap;

      const dvx = this.vx - other.vx;
      const dvy = this.vy - other.vy;
      const dvDotN = dvx * nx + dvy * ny;

      if (dvDotN > 0) {
        const m1 = this.size * this.size;
        const m2 = other.size * other.size;
        const massSum = m1 + m2;
        const impulse = (2 * dvDotN) / massSum;

        this.vx -= impulse * m2 * nx;
        this.vy -= impulse * m2 * ny;
        other.vx += impulse * m1 * nx;
        other.vy += impulse * m1 * ny;

        this.updateColor();
        other.updateColor();
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  public drawTrailSegment(ctx: CanvasRenderingContext2D, alpha: number): void {
    if (!this.active) return;
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = this.size * 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private updateColor(): void {
    const speed = this.speed;
    this.color = Particle.getColorForSpeed(speed);
  }

  public static getColorForSpeed(speed: number): string {
    const cached = Particle.colorCache.get(speed);
    if (cached) return cached;

    let color: string;
    if (speed <= 0.5) {
      color = '#00FF88';
    } else if (speed <= 1.5) {
      const t = (speed - 0.5) / 1.0;
      color = Particle.lerpColor('#00FF88', '#00DDFF', t);
    } else {
      const t = Math.min((speed - 1.5) / 2.0, 1);
      color = Particle.lerpColor('#00DDFF', '#FF44AA', t);
    }

    Particle.colorCache.set(speed, color);
    return color;
  }

  private static lerpColor(color1: string, color2: string, t: number): string {
    const c1 = Particle.hexToRgb(color1);
    const c2 = Particle.hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 255, b: 136 };
  }
}

export class ParticlePool {
  private pool: Particle[] = [];
  public activeParticles: Particle[] = [];
  private maxSize: number = 5000;

  constructor(maxSize: number = 5000) {
    this.maxSize = maxSize;
    this.pool = new Array(maxSize);
    for (let i = 0; i < maxSize; i++) {
      this.pool[i] = new Particle();
    }
  }

  public acquire(): Particle | null {
    for (let i = 0; i < this.maxSize; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null;
  }

  public getActiveCount(): number {
    return this.activeParticles.length;
  }

  public rebuildActiveList(): void {
    this.activeParticles = this.pool.filter(p => p.active);
  }

  public release(count: number): number {
    let released = 0;
    for (let i = this.pool.length - 1; i >= 0 && released < count; i--) {
      if (this.pool[i].active) {
        this.pool[i].reset();
        released++;
      }
    }
    if (released > 0) {
      this.rebuildActiveList();
    }
    return released;
  }

  public reset(): void {
    for (const p of this.pool) {
      p.reset();
    }
    this.activeParticles.length = 0;
  }

  public getAll(): Particle[] {
    return this.activeParticles;
  }

  public getPool(): Particle[] {
    return this.pool;
  }
}
