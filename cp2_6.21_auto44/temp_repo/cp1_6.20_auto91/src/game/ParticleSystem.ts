export type ParticleType = 'explosion' | 'beamTrail' | 'damageText' | 'starBackground' | 'breathingGlow';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: ParticleType;
  alpha: number;
  rotation: number;
  scale: number;
  text?: string;
  phase?: number;
  baseSize?: number;
}

export interface ParticleSystemOptions {
  lowQuality?: boolean;
}

const MAX_PARTICLES_NORMAL = 200;
const MAX_PARTICLES_LOW = 100;
const LOW_FPS_THRESHOLD = 30;
const LOW_FPS_FRAMES = 60;

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private lowQuality: boolean;
  private maxParticles: number;
  private fpsHistory: number[] = [];
  private autoLowQualityTriggered = false;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, options: ParticleSystemOptions = {}) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lowQuality = options.lowQuality ?? false;
    this.maxParticles = this.lowQuality ? MAX_PARTICLES_LOW : MAX_PARTICLES_NORMAL;
  }

  setLowQuality(enabled: boolean): void {
    this.lowQuality = enabled;
    this.maxParticles = enabled ? MAX_PARTICLES_LOW : MAX_PARTICLES_NORMAL;
    while (this.particles.length > this.maxParticles) {
      this.particles.shift();
    }
  }

  spawnExplosion(x: number, y: number, color: string, count: number): void {
    const actualCount = this.lowQuality ? Math.ceil(count / 2) : count;
    for (let i = 0; i < actualCount; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = (Math.PI * 2 * i) / actualCount + Math.random() * 0.3;
      const speed = 1 + Math.random() * 3;
      const particle: Particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 20,
        size: 2 + Math.random() * 4,
        color,
        type: 'explosion',
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        scale: 1,
      };
      this.particles.push(particle);
    }
  }

  spawnBeamTrail(startX: number, startY: number, endX: number, endY: number, color: string): void {
    if (this.lowQuality) return;
    const distance = Math.hypot(endX - startX, endY - startY);
    const count = Math.min(Math.floor(distance / 8), 20);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const t = i / count;
      const jitter = (Math.random() - 0.5) * 4;
      const angle = Math.atan2(endY - startY, endX - startX);
      const perpX = -Math.sin(angle) * jitter;
      const perpY = Math.cos(angle) * jitter;
      const particle: Particle = {
        x: startX + (endX - startX) * t + perpX,
        y: startY + (endY - startY) * t + perpY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1,
        maxLife: 15 + Math.random() * 10,
        size: 2 + Math.random() * 2,
        color,
        type: 'beamTrail',
        alpha: 0.8,
        rotation: 0,
        scale: 1,
      };
      this.particles.push(particle);
    }
  }

  spawnDamageText(x: number, y: number, damage: number, isHeal: boolean = false): void {
    if (this.particles.length >= this.maxParticles) return;
    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -1.5,
      life: 1,
      maxLife: 60,
      size: 14,
      color: isHeal ? '#4ade80' : '#ef4444',
      type: 'damageText',
      alpha: 1,
      rotation: 0,
      scale: 1,
      text: isHeal ? `+${damage}` : `-${damage}`,
    };
    this.particles.push(particle);
  }

  spawnStar(): void {
    if (this.particles.length >= this.maxParticles) return;
    const particle: Particle = {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 300 + Math.random() * 300,
      size: 0.5 + Math.random() * 1.5,
      color: '#ffffff',
      type: 'starBackground',
      alpha: 0.3 + Math.random() * 0.7,
      rotation: 0,
      scale: 1,
      phase: Math.random() * Math.PI * 2,
    };
    this.particles.push(particle);
  }

  spawnBreathingGlow(x: number, y: number, baseColor: string): void {
    if (this.particles.length >= this.maxParticles) return;
    const particle: Particle = {
      x,
      y,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 120,
      size: 30,
      color: baseColor,
      type: 'breathingGlow',
      alpha: 0.3,
      rotation: 0,
      scale: 1,
      phase: 0,
      baseSize: 30,
    };
    this.particles.push(particle);
  }

  update(fps?: number): void {
    if (fps !== undefined) {
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > LOW_FPS_FRAMES) {
        this.fpsHistory.shift();
      }
      if (!this.lowQuality && !this.autoLowQualityTriggered && this.fpsHistory.length >= LOW_FPS_FRAMES) {
        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        if (avgFps < LOW_FPS_THRESHOLD) {
          this.setLowQuality(true);
          this.autoLowQualityTriggered = true;
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      switch (p.type) {
        case 'explosion':
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.alpha = p.life;
          p.rotation += 0.1;
          p.scale = 0.5 + p.life * 0.5;
          break;
        case 'beamTrail':
          p.alpha = p.life * 0.8;
          break;
        case 'damageText':
          p.alpha = Math.min(1, p.life * 2);
          p.scale = 0.8 + Math.sin((1 - p.life) * Math.PI) * 0.4;
          break;
        case 'starBackground':
          p.phase = (p.phase ?? 0) + 0.05;
          p.alpha = 0.3 + Math.sin(p.phase) * 0.4 * p.life;
          break;
        case 'breathingGlow':
          p.phase = (p.phase ?? 0) + 0.05;
          const breath = (Math.sin(p.phase) + 1) / 2;
          p.size = (p.baseSize ?? 30) * (0.8 + breath * 0.4);
          p.alpha = 0.15 + breath * 0.2;
          break;
      }
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.save();

    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;

      switch (p.type) {
        case 'explosion':
          this.renderExplosion(ctx, p);
          break;
        case 'beamTrail':
          this.renderBeamTrail(ctx, p);
          break;
        case 'damageText':
          this.renderDamageText(ctx, p);
          break;
        case 'starBackground':
          this.renderStar(ctx, p);
          break;
        case 'breathingGlow':
          this.renderBreathingGlow(ctx, p);
          break;
      }
    }

    ctx.restore();
  }

  private renderExplosion(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.scale(p.scale, p.scale);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  private renderBeamTrail(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderDamageText(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);
    ctx.font = `bold ${p.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = p.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    if (p.text) {
      ctx.strokeText(p.text, 0, 0);
      ctx.fillText(p.text, 0, 0);
    }
    ctx.restore();
  }

  private renderStar(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBreathingGlow(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles.length = 0;
  }
}
