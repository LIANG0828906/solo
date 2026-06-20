export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decayRate: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

export interface FlyingParticle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  duration: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  maxParticles = 200;
  windDirection = 1;
  windSpeed = 0;
  private windTimer = 0;
  private windInterval = 3000;
  emitRate = 3;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.randomizeWind();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  private randomizeWind(): void {
    this.windDirection = Math.random() > 0.5 ? 1 : -1;
    this.windSpeed = Math.random() * 2;
  }

  updateWind(dt: number): void {
    this.windTimer += dt;
    if (this.windTimer >= this.windInterval) {
      this.windTimer = 0;
      this.randomizeWind();
    } else {
      const t = this.windTimer / this.windInterval;
      const smooth = 0.5 - Math.cos(t * Math.PI * 2) * 0.5;
      this.windSpeed = 0.3 + smooth * 1.7;
    }
  }

  addParticle(
    x: number,
    y: number,
    color: string,
    decayRate: number
  ): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    const angle = (Math.random() - 0.5) * Math.PI * 0.6 - Math.PI / 2;
    const speed = 0.5 + Math.random() * 1.5;
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 4,
      color,
      alpha: 0.9,
      decayRate: decayRate * (0.7 + Math.random() * 0.6),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03
    });
  }

  update(dt: number): void {
    const buoyancy = 0.015;
    const bounce = 0.5;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.wobblePhase += p.wobbleSpeed * dt * 0.06;
      p.vx += Math.sin(p.wobblePhase) * 0.02;
      p.vx += this.windDirection * this.windSpeed * 0.008;
      p.vy -= buoyancy;
      p.vx *= 0.99;
      p.vy *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx = -p.vx * bounce;
      } else if (p.x + p.radius > this.width) {
        p.x = this.width - p.radius;
        p.vx = -p.vx * bounce;
      }
      if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy = -p.vy * bounce;
      }
      p.alpha -= p.decayRate * dt * 0.06;
      if (p.alpha <= 0.2 || p.y < -p.radius * 2) {
        this.particles.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.particles.length = 0;
  }
}

export class FlyingParticleSystem {
  particles: FlyingParticle[] = [];

  spawn(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    count: number
  ): void {
    for (let i = 0; i < count; i++) {
      const jitterX = (Math.random() - 0.5) * 20;
      const jitterY = (Math.random() - 0.5) * 10;
      this.particles.push({
        x: startX + (Math.random() - 0.5) * 15,
        y: startY + (Math.random() - 0.5) * 10,
        startX: startX + (Math.random() - 0.5) * 15,
        startY: startY + (Math.random() - 0.5) * 10,
        endX: endX + jitterX,
        endY: endY + jitterY,
        progress: 0,
        duration: 350 + Math.random() * 200,
        color,
        size: 6 + Math.random() * 3
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.progress += dt / p.duration;
      if (p.progress >= 1) {
        this.particles.splice(i, 1);
        continue;
      }
      const t = p.progress;
      const arcHeight = -80;
      const mt = 1 - t;
      p.x = mt * p.startX + t * p.endX;
      p.y = mt * p.startY + t * p.endY + arcHeight * 4 * t * mt;
    }
  }

  clear(): void {
    this.particles.length = 0;
  }
}

export function calculateIntensity(
  items: { perfumeId: string; grams: number }[],
  getVolatileRate: (id: string) => number,
  elapsed: number
): number {
  if (items.length === 0) return 0;
  const tau = 30000;
  let base = 0;
  let totalG = 0;
  for (const it of items) {
    if (it.grams <= 0) continue;
    const v = getVolatileRate(it.perfumeId);
    base += it.grams * v;
    totalG += it.grams;
  }
  if (totalG === 0) return 0;
  const decay = Math.exp(-elapsed / tau);
  const baseMax = 15 * 0.85;
  let normalized = (base / baseMax) * 100 * decay;
  const noise = 1 + Math.sin(elapsed * 0.0013) * 0.03 + Math.sin(elapsed * 0.0037) * 0.02;
  normalized *= noise;
  return Math.max(0, Math.min(100, normalized));
}
