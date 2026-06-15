import { FlowField, Vector2 } from './flowField';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  isFading: boolean;
  fadeStartTime: number;
  fadeDuration: number;
  size: number;
  baseR: number;
  baseG: number;
  baseB: number;
  startA: number;
  endA: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private width: number;
  private height: number;
  private flowField: FlowField;
  private particleSize: number = 2;
  private targetCount: number = 1000;

  constructor(width: number, height: number, flowField: FlowField) {
    this.width = width;
    this.height = height;
    this.flowField = flowField;
    this.initParticles(this.targetCount);
  }

  setParticleCount(count: number): void {
    this.targetCount = count;
    if (this.particles.length < count) {
      const addCount = count - this.particles.length;
      for (let i = 0; i < addCount; i++) {
        this.particles.push(this.createParticle());
      }
    } else if (this.particles.length > count) {
      this.particles.length = count;
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  setParticleSize(size: number): void {
    this.particleSize = size;
  }

  getParticleSize(): number {
    return this.particleSize;
  }

  private initParticles(count: number): void {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(x?: number, y?: number): Particle {
    const lifeRatio = Math.random();
    return {
      x: x !== undefined ? x : Math.random() * this.width,
      y: y !== undefined ? y : Math.random() * this.height,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 1,
      isFading: false,
      fadeStartTime: 0,
      fadeDuration: 300,
      size: this.particleSize,
      baseR: 0,
      baseG: Math.floor(255 * lifeRatio),
      baseB: 255,
      startA: 0.8,
      endA: 0.3
    };
  }

  update(): void {
    const now = Date.now();
    const lifeDecay = 1 / 600;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.isFading) {
        const fadeElapsed = now - p.fadeStartTime;
        if (fadeElapsed >= p.fadeDuration) {
          this.resetParticle(p);
        }
        continue;
      }

      const velocity: Vector2 = this.flowField.getVelocityAt(p.x, p.y);
      p.vx = velocity.x;
      p.vy = velocity.y;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      p.life -= lifeDecay;

      if (p.life <= 0) {
        p.isFading = true;
        p.fadeStartTime = now;
      }
    }

    if (this.particles.length < this.targetCount) {
      const addCount = Math.min(10, this.targetCount - this.particles.length);
      for (let i = 0; i < addCount; i++) {
        this.particles.push(this.createParticle());
      }
    }
  }

  private resetParticle(p: Particle): void {
    const lifeRatio = Math.random();
    p.x = Math.random() * this.width;
    p.y = Math.random() * this.height;
    p.vx = 0;
    p.vy = 0;
    p.life = 1;
    p.isFading = false;
    p.fadeStartTime = 0;
    p.baseR = 0;
    p.baseG = Math.floor(255 * lifeRatio);
    p.baseB = 255;
    p.startA = 0.8;
    p.endA = 0.3;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      let alpha: number;

      if (p.isFading) {
        const fadeElapsed = now - p.fadeStartTime;
        const fadeProgress = fadeElapsed / p.fadeDuration;
        const currentBaseAlpha = p.startA + (p.endA - p.startA) * (1 - p.life);
        alpha = currentBaseAlpha * (1 - fadeProgress);
      } else {
        alpha = p.startA + (p.endA - p.startA) * (1 - p.life);
      }

      if (alpha <= 0) continue;

      const lifeRatio = 1 - p.life;
      const g = Math.floor(255 * (1 - lifeRatio));
      const b = 255;

      ctx.fillStyle = `rgba(0, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
