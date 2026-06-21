import { Particle } from './particle';

export class Trail {
  particles: Particle[];
  color: string;
  baseSize: number;

  constructor(color: string, baseSize: number) {
    this.particles = [];
    this.color = color;
    this.baseSize = baseSize;
  }

  addParticle(x: number, y: number, vx: number, vy: number): void {
    const particle = new Particle(x, y, vx, vy, this.color, this.baseSize);
    this.particles.push(particle);
  }

  update(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
    this.particles = this.particles.filter((particle) => particle.isAlive());
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clearWithFade(): void {
    for (const particle of this.particles) {
      particle.maxLife = 0.8;
      particle.life = 0.8;
    }
  }
}
