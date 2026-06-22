import { Particle, TILE_SIZE } from './types';

const MAX_PARTICLES = 100;

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        color: 0xffffff,
        size: 2
      });
    }
  }

  spawnDust(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      particle.x = x + (Math.random() - 0.5) * TILE_SIZE * 0.5;
      particle.y = y + TILE_SIZE * 0.8;
      particle.vx = (Math.random() - 0.5) * 20;
      particle.vy = -Math.random() * 15 - 5;
      particle.life = 0.4 + Math.random() * 0.2;
      particle.maxLife = particle.life;
      particle.color = 0x8b7355;
      particle.size = 2 + Math.random() * 2;
    }
  }

  spawnCrystalCollect(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = (Math.PI * 2 * i) / 8;
      const speed = 30 + Math.random() * 20;

      particle.x = x + TILE_SIZE / 2;
      particle.y = y + TILE_SIZE / 2;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 0.5 + Math.random() * 0.3;
      particle.maxLife = particle.life;
      particle.color = 0x00ffff;
      particle.size = 3;
    }
  }

  spawnOreCollect(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = (Math.PI * 2 * i) / 8;
      const speed = 25 + Math.random() * 15;

      particle.x = x + TILE_SIZE / 2;
      particle.y = y + TILE_SIZE / 2;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 0.6 + Math.random() * 0.3;
      particle.maxLife = particle.life;
      particle.color = 0xffaa00;
      particle.size = 3;
    }
  }

  spawnTrapEffect(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 55;

      particle.x = x + TILE_SIZE / 2;
      particle.y = y + TILE_SIZE / 2;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - 20;
      particle.life = 0.5 + Math.random() * 0.5;
      particle.maxLife = particle.life;
      particle.color = 0xff2222;
      particle.size = 3 + Math.random() * 3;
    }
  }

  spawnTrapDebris(x: number, y: number): void {
    const debrisColors = [0x1a1a2e, 0x22223a, 0x2a2a44, 0x333350];
    for (let i = 0; i < 14; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85;
      const speed = 55 + Math.random() * 140;

      particle.x = x + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE * 0.65;
      particle.y = y + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE * 0.3;
      particle.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 35;
      particle.vy = Math.sin(angle) * speed - Math.random() * 35;
      particle.life = 0.75 + Math.random() * 0.6;
      particle.maxLife = particle.life;
      particle.color = debrisColors[Math.floor(Math.random() * debrisColors.length)];
      particle.size = 2 + Math.random() * 4;
    }
  }

  spawnMenuParticle(canvasWidth: number, canvasHeight: number): void {
    const particle = this.getParticle();
    if (!particle) return;

    particle.x = Math.random() * canvasWidth;
    particle.y = canvasHeight + 10;
    particle.vx = (Math.random() - 0.5) * 10;
    particle.vy = -10 - Math.random() * 20;
    particle.life = 3 + Math.random() * 2;
    particle.maxLife = particle.life;
    particle.color = 0x3a4a5c;
    particle.size = 2 + Math.random() * 3;
  }

  private getParticle(): Particle | null {
    if (this.particles.length >= MAX_PARTICLES) {
      const oldest = this.particles.shift();
      if (oldest) {
        return oldest;
      }
    }

    if (this.pool.length > 0) {
      const particle = this.pool.pop()!;
      this.particles.push(particle);
      return particle;
    }

    return null;
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life -= deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 50 * deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        this.pool.push(p);
      }
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  clear(): void {
    while (this.particles.length > 0) {
      const p = this.particles.pop()!;
      this.pool.push(p);
    }
  }

  getCount(): number {
    return this.particles.length;
  }
}
