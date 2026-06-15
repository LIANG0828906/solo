import { ParticleData, ParticleType, MAX_PARTICLES, COLORS } from './types';

export class Particle implements ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  color: string;
  size: number;

  constructor(data: ParticleData) {
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx;
    this.vy = data.vy;
    this.life = data.life;
    this.maxLife = data.maxLife;
    this.type = data.type;
    this.color = data.color;
    this.size = data.size;
  }

  update(deltaTime: number): boolean {
    this.x += this.vx * deltaTime / 16.67;
    this.y += this.vy * deltaTime / 16.67;
    this.life -= deltaTime;
    
    if (this.type === 'debris') {
      this.vy += 0.1 * deltaTime / 16.67;
    }
    
    return this.life > 0;
  }

  getAlpha(): number {
    return Math.max(0, this.life / this.maxLife);
  }

  static createSpark(x: number, y: number, angle: number): Particle {
    const speed = 2 + Math.random() * 3;
    const spread = (Math.random() - 0.5) * 0.8;
    return new Particle({
      x,
      y,
      vx: Math.cos(angle + spread) * speed,
      vy: Math.sin(angle + spread) * speed,
      life: 300,
      maxLife: 300,
      type: 'spark',
      color: Math.random() > 0.5 ? '#FFFF00' : '#FFFFFF',
      size: 3
    });
  }

  static createExplosion(x: number, y: number, color: string): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 400,
        maxLife: 400,
        type: 'explosion',
        color,
        size: 4
      }));
    }
    return particles;
  }

  static createDebris(x: number, y: number, color: string): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 200,
        maxLife: 200,
        type: 'debris',
        color,
        size: 5
      }));
    }
    return particles;
  }

  static createMuzzleFlash(x: number, y: number, angle: number): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 0.6;
      const speed = 3 + Math.random() * 3;
      particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        life: 150,
        maxLife: 150,
        type: 'spark',
        color: COLORS.GOLD,
        size: 3
      }));
    }
    return particles;
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];

  add(particle: Particle): void;
  add(particles: Particle[]): void;
  add(particleOrParticles: Particle | Particle[]): void {
    if (Array.isArray(particleOrParticles)) {
      for (const p of particleOrParticles) {
        this.addSingle(p);
      }
    } else {
      this.addSingle(particleOrParticles);
    }
  }

  private addSingle(particle: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    this.particles.push(particle);
  }

  update(deltaTime: number): void {
    this.particles = this.particles.filter(p => p.update(deltaTime));
  }

  getAll(): Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }

  getCount(): number {
    return this.particles.length;
  }
}
