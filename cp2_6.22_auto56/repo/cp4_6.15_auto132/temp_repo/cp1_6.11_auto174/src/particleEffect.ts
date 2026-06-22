import { ParticleParams } from './reactionEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  alpha: number;
  type: string;
  angle: number;
  angularSpeed: number;
  startX: number;
  startY: number;
}

export class ParticleEffect {
  private particles: Particle[] = [];
  private paused = false;
  private glow: { color: string; alpha: number; duration: number; elapsed: number } | null = null;
  private centerX = 0;
  private centerY = 0;
  private cauldronRadius = 160;
  private maxParticles = 200;

  public triggerReaction(params: ParticleParams, centerX: number, centerY: number, glowColor: string): void {
    this.centerX = centerX;
    this.centerY = centerY;

    this.glow = {
      color: glowColor,
      alpha: 0.8,
      duration: 1,
      elapsed: 0,
    };

    const count = Math.min(params.count, this.maxParticles - this.particles.length);
    const actualCount = Math.max(0, count);

    for (let i = 0; i < actualCount; i++) {
      this.particles.push(this.createParticle(params, centerX, centerY));
    }
  }

  private createParticle(params: ParticleParams, cx: number, cy: number): Particle {
    const color = params.colors[Math.floor(Math.random() * params.colors.length)];
    let vx = 0;
    let vy = 0;
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 120;

    switch (params.motionType) {
      case 'outward':
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        break;
      case 'upward':
        vx = (Math.random() - 0.5) * 60;
        vy = -(60 + Math.random() * 120);
        break;
      case 'spiral':
        vx = Math.cos(angle) * 30;
        vy = Math.sin(angle) * 30 - 20;
        break;
      case 'twinkle':
        vx = (Math.random() - 0.5) * 80;
        vy = (Math.random() - 0.5) * 80;
        break;
    }

    return {
      x: cx,
      y: cy,
      startX: cx,
      startY: cy,
      vx,
      vy,
      life: 0,
      maxLife: params.duration * (0.5 + Math.random() * 0.5),
      radius: this.getParticleRadius(params.particleType),
      color,
      alpha: 1,
      type: params.particleType,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 4,
    };
  }

  private getParticleRadius(type: string): number {
    switch (type) {
      case 'spark':
        return 1.5 + Math.random() * 2.5;
      case 'bubble':
        return 3 + Math.random() * 6;
      case 'smoke':
        return 6 + Math.random() * 14;
      case 'light':
        return 2 + Math.random() * 4;
      default:
        return 3;
    }
  }

  public update(deltaTime: number): void {
    if (this.paused) return;

    if (this.glow) {
      this.glow.elapsed += deltaTime;
      this.glow.alpha = Math.max(0, 0.8 * (1 - this.glow.elapsed / this.glow.duration));
      if (this.glow.elapsed >= this.glow.duration) {
        this.glow = null;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += deltaTime;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      p.alpha = 1 - progress;

      switch (p.type) {
        case 'spark':
          p.vy += 180 * deltaTime;
          p.x += p.vx * deltaTime;
          p.y += p.vy * deltaTime;
          break;
        case 'bubble':
          p.vy -= 40 * deltaTime;
          p.x += p.vx * deltaTime + Math.sin(p.life * 4) * 20 * deltaTime;
          p.y += p.vy * deltaTime;
          p.radius *= 1 + deltaTime * 0.3;
          break;
        case 'smoke':
          p.angle += p.angularSpeed * deltaTime;
          const spiralR = 20 + progress * 80;
          p.x = this.centerX + Math.cos(p.angle) * spiralR * (p.vx > 0 ? 1 : -1);
          p.y = this.centerY + Math.sin(p.angle) * spiralR * 0.6 - progress * 60;
          p.radius *= 1 + deltaTime * 0.8;
          break;
        case 'light':
          p.x += p.vx * deltaTime;
          p.y += p.vy * deltaTime;
          p.alpha *= 0.5 + 0.5 * Math.sin(p.life * 10);
          break;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.glow) {
      const gradient = ctx.createRadialGradient(
        this.centerX, this.centerY, this.cauldronRadius * 0.3,
        this.centerX, this.centerY, this.cauldronRadius * 1.5
      );
      gradient.addColorStop(0, this.hexToRgba(this.glow.color, this.glow.alpha * 0.6));
      gradient.addColorStop(0.5, this.hexToRgba(this.glow.color, this.glow.alpha * 0.3));
      gradient.addColorStop(1, this.hexToRgba(this.glow.color, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.cauldronRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;

      switch (p.type) {
        case 'spark':
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'bubble':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = this.hexToRgba(p.color, 0.2);
          ctx.fill();
          break;
        case 'smoke':
          const smokeGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          smokeGrad.addColorStop(0, this.hexToRgba(p.color, p.alpha * 0.6));
          smokeGrad.addColorStop(1, this.hexToRgba(p.color, 0));
          ctx.fillStyle = smokeGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'light':
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }
    ctx.restore();
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  public setCauldronCenter(x: number, y: number, radius: number): void {
    this.centerX = x;
    this.centerY = y;
    this.cauldronRadius = radius;
  }

  public clear(): void {
    this.particles = [];
    this.glow = null;
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
