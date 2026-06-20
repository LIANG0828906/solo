import { Particle } from '../game/PuzzleState';

const MAX_PARTICLES = 200;

export class ParticleSystem {
  private particles: Particle[] = [];

  addParticles(particles: Particle[]): void {
    this.particles.push(...particles);
    
    while (this.particles.length > MAX_PARTICLES) {
      this.particles.shift();
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      
      if (p.maxLife > 0) {
        p.opacity = Math.max(0, p.life / p.maxLife);
      }

      if (p.type === 'merge') {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.opacity;

      switch (p.type) {
        case 'merge':
          this.renderMergeParticle(ctx, p);
          break;
        case 'rain':
          this.renderRainParticle(ctx, p);
          break;
        case 'trail':
          this.renderTrailParticle(ctx, p);
          break;
        case 'singularity':
          this.renderSingularityParticle(ctx, p);
          break;
      }

      ctx.restore();
    }
  }

  private renderMergeParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderRainParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const angle = p.angle || (15 * Math.PI) / 180;
    const length = p.length || 10;
    
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(
      p.x + Math.sin(angle) * length,
      p.y + Math.cos(angle) * length
    );
    ctx.stroke();
  }

  private renderTrailParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderSingularityParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(0.5, p.color + '88');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  clear(): void {
    this.particles = [];
  }

  getParticles(): Particle[] {
    return this.particles;
  }
}
