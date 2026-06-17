import { v4 as uuidv4 } from 'uuid';
import { Particle, Vector2 } from './types';

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 200;

  getParticles(): Particle[] {
    return this.particles;
  }

  emitExplosion(x: number, y: number, color: string, count: number = 20, minSize: number = 2, maxSize: number = 6, life: number = 0.5): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      const size = minSize + Math.random() * (maxSize - minSize);
      
      this.particles.push({
        id: uuidv4(),
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size,
        color,
        life,
        maxLife: life,
        alpha: 1,
      });
    }
  }

  emitTrail(x: number, y: number, color: string, velocityY: number = 0): void {
    if (this.particles.length >= this.maxParticles) return;
    
    this.particles.push({
      id: uuidv4(),
      x: x + (Math.random() - 0.5) * 4,
      y,
      velocityX: (Math.random() - 0.5) * 20,
      velocityY: 30 + velocityY * 0.3,
      size: 2 + Math.random() * 3,
      color,
      life: 0.3,
      maxLife: 0.3,
      alpha: 0.8,
    });
  }

  emitBossExplosion(x: number, y: number): void {
    for (let i = 0; i < 50; i++) {
      if (this.particles.length >= this.maxParticles) break;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const size = 2 + Math.random() * 8;
      const color = Math.random() > 0.5 ? '#FFFFFF' : '#FFD700';
      
      this.particles.push({
        id: uuidv4(),
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size,
        color,
        life: 1,
        maxLife: 1,
        alpha: 1,
      });
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.velocityX * deltaTime;
      p.y += p.velocityY * deltaTime;
      p.life -= deltaTime;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.velocityX *= 0.98;
      p.velocityY *= 0.98;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear(): void {
    this.particles = [];
  }
}
