export interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class Enemy {
  public x: number;
  public y: number;
  public alive: boolean = true;
  public isDying: boolean = false;
  public deathProgress: number = 0;
  public explosionParticles: ExplosionParticle[] = [];
  public pulsePhase: number = 0;
  public size: number = 16;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(deltaTime: number): void {
    this.pulsePhase += 0.08 * (deltaTime / 16.67);

    if (this.isDying) {
      this.deathProgress += deltaTime / 1500;

      if (this.deathProgress < 0.4 && this.explosionParticles.length === 0) {
        this.spawnExplosionParticles();
      }

      for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
        const p = this.explosionParticles[i];
        p.x += p.vx * (deltaTime / 16.67);
        p.y += p.vy * (deltaTime / 16.67);
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= (deltaTime / 16.67);
        if (p.life <= 0) {
          this.explosionParticles.splice(i, 1);
        }
      }

      if (this.deathProgress >= 1 && this.explosionParticles.length === 0) {
        this.alive = false;
      }
    }
  }

  private spawnExplosionParticles(): void {
    const particleCount = 60;
    const colors = ['#FF4444', '#FF6600', '#FFAA00', '#FFDD00', '#FFFFFF'];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1 + Math.random() * 5;
      this.explosionParticles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 40,
        maxLife: 80,
        size: 2 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  public triggerDeath(): void {
    if (!this.isDying) {
      this.isDying = true;
      this.deathProgress = 0;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.alive && !this.isDying) {
      const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.08;
      const s = this.size * pulseScale;

      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.beginPath();
      ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.5);
      glowGradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
      glowGradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fill();

      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.6, s * 0.7);
      ctx.lineTo(-s * 0.3, 0);
      ctx.lineTo(-s * 0.6, -s * 0.7);
      ctx.closePath();

      ctx.fillStyle = '#FF4444';
      ctx.fill();
      ctx.strokeStyle = '#FF8888';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s * 0.2, 0);
      ctx.lineTo(-s * 0.2, s * 0.25);
      ctx.lineTo(-s * 0.2, -s * 0.25);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 200, 200, 0.6)';
      ctx.fill();

      ctx.restore();
    }

    for (const p of this.explosionParticles) {
      const alpha = Math.min(1, p.life / (p.maxLife * 0.5));
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * alpha);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.6, p.color);
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    }
  }
}
