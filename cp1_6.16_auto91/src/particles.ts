import { Particle, CONFIG } from './types';

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = CONFIG.MAX_PARTICLES;

  addTrailParticle(x: number, y: number): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }

    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 3 + 1,
      size: Math.random() * 4 + 4,
      maxSize: 8,
      color: '#00BFFF',
      alpha: 0.8,
      decay: 0.02 + Math.random() * 0.02,
      type: 'trail'
    };

    this.particles.push(particle);
  }

  addHaloParticles(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = (Math.PI * 2 * i) / 20;
      const speed = 2 + Math.random() * 2;
      
      const particle: Particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 40,
        maxSize: 40,
        color: '#FFFFFF',
        alpha: 0.8,
        decay: 0.03,
        type: 'halo'
      };

      this.particles.push(particle);
    }
  }

  update(deltaTime: number): void {
    const dt = deltaTime / 16.67;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      
      if (p.type === 'trail') {
        p.size *= (1 - 0.02 * dt);
      } else if (p.type === 'halo') {
        p.size *= (1 - 0.015 * dt);
      }
      
      if (p.alpha <= 0 || p.size <= 0.5) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): readonly Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }
}
