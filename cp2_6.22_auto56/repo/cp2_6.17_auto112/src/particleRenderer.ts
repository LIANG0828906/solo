import {
  WeatherType,
  WeatherData,
  onWeatherUpdate,
  onSettingsChange,
  SettingsPayload
} from './weatherEngine';

interface ParticleConfig {
  baseCount: number;
  minSize: number;
  maxSize: number;
}

const PARTICLE_CONFIGS: Record<WeatherType, ParticleConfig> = {
  sunny: { baseCount: 500, minSize: 2, maxSize: 6 },
  cloudy: { baseCount: 300, minSize: 2, maxSize: 6 },
  rainy: { baseCount: 800, minSize: 2, maxSize: 6 },
  snowy: { baseCount: 600, minSize: 2, maxSize: 6 }
};

const DENSITY_MULTIPLIERS: Record<'low' | 'medium' | 'high', number> = {
  low: 0.6,
  medium: 1,
  high: 1.6
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  life: number;
  maxLife: number;
  phase: number;
}

export class ParticleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private currentType: WeatherType = 'sunny';
  private density: 'low' | 'medium' | 'high' = 'medium';
  private animationFrameId: number | null = null;
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;
  private targetParticles: number = 0;
  private unsubscribers: Array<() => void> = [];
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    this.bindEvents();
  }

  public start(): void {
    this.loop();
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    this.particles = [];
  }

  public setWeather(type: WeatherType): void {
    if (this.currentType === type && this.particles.length > 0) return;
    this.currentType = type;
    this.rebuildParticles(true);
  }

  public setDensity(d: 'low' | 'medium' | 'high'): void {
    this.density = d;
    this.rebuildParticles(false);
  }

  public resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private bindEvents(): void {
    const weatherUnsub = onWeatherUpdate((data: WeatherData) => {
      this.setWeather(data.type);
    });
    const settingsUnsub = onSettingsChange((p: SettingsPayload) => {
      this.setDensity(p.particleDensity);
    });
    this.unsubscribers.push(weatherUnsub, settingsUnsub);
  }

  private calculateTargetCount(): number {
    const cfg = PARTICLE_CONFIGS[this.currentType];
    const mult = DENSITY_MULTIPLIERS[this.density];
    const areaFactor = (this.width * this.height) / (1920 * 1080);
    return Math.max(50, Math.floor(cfg.baseCount * mult * Math.max(0.5, areaFactor)));
  }

  private rebuildParticles(clearAll: boolean): void {
    this.targetParticles = this.calculateTargetCount();
    if (clearAll) {
      this.particles = [];
    }
    while (this.particles.length < this.targetParticles) {
      this.particles.push(this.createParticle(true));
    }
    if (this.particles.length > this.targetParticles) {
      this.particles.length = this.targetParticles;
    }
  }

  private createParticle(randomPos: boolean): Particle {
    const cfg = PARTICLE_CONFIGS[this.currentType];
    const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
    const colors = this.getColorsForWeather();
    const color = colors[Math.floor(Math.random() * colors.length)];
    const base = this.getBaseVelocity();
    const jitter = this.getVelocityJitter();
    const x = randomPos ? Math.random() * this.width : Math.random() * this.width;
    const y = randomPos
      ? Math.random() * this.height
      : this.getInitialYOffscreen();

    return {
      x,
      y,
      vx: base.vx + (Math.random() - 0.5) * jitter.vx,
      vy: base.vy + (Math.random() - 0.5) * jitter.vy,
      size,
      opacity: 0.3 + Math.random() * 0.7,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      color,
      life: 0,
      maxLife: 400 + Math.random() * 800,
      phase: Math.random() * Math.PI * 2
    };
  }

  private getInitialYOffscreen(): number {
    switch (this.currentType) {
      case 'rainy':
        return -20 - Math.random() * 200;
      case 'snowy':
        return -20 - Math.random() * 100;
      default:
        return Math.random() * this.height;
    }
  }

  private getColorsForWeather(): string[] {
    switch (this.currentType) {
      case 'sunny':
        return ['#FFD700', '#FFC107', '#FFEB3B', '#FFF176', '#FFE082'];
      case 'cloudy':
        return ['#FFFFFF', '#E0E0E0', '#BDBDBD', '#F5F5F5', '#EEEEEE'];
      case 'rainy':
        return ['#5DADE2', '#3498DB', '#85C1E9', '#AED6F1', '#2E86C1'];
      case 'snowy':
        return ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#FCFCFC'];
    }
  }

  private getBaseVelocity(): { vx: number; vy: number } {
    switch (this.currentType) {
      case 'sunny':
        return { vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 };
      case 'cloudy':
        return { vx: 0.4 + Math.random() * 0.4, vy: (Math.random() - 0.5) * 0.15 };
      case 'rainy':
        return { vx: -0.5, vy: 8 + Math.random() * 4 };
      case 'snowy':
        return { vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 0.8 };
    }
  }

  private getVelocityJitter(): { vx: number; vy: number } {
    switch (this.currentType) {
      case 'sunny':
        return { vx: 0.4, vy: 0.4 };
      case 'cloudy':
        return { vx: 0.4, vy: 0.2 };
      case 'rainy':
        return { vx: 1, vy: 3 };
      case 'snowy':
        return { vx: 1.2, vy: 0.6 };
    }
  }

  private loop = (): void => {
    this.time += 0.016;
    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    const target = this.calculateTargetCount();
    if (Math.abs(target - this.particles.length) > 10) {
      this.targetParticles = target;
      if (this.particles.length < this.targetParticles) {
        while (this.particles.length < this.targetParticles) {
          this.particles.push(this.createParticle(false));
        }
      } else {
        this.particles.length = this.targetParticles;
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.updateParticle(p);
      if (this.isOffscreenOrDead(p)) {
        this.particles[i] = this.createParticle(false);
      }
    }
  }

  private updateParticle(p: Particle): void {
    switch (this.currentType) {
      case 'sunny': {
        const wiggle = Math.sin(this.time * 1.5 + p.phase) * 0.3;
        p.x += p.vx + wiggle * 0.3;
        p.y += p.vy + Math.cos(this.time + p.phase) * 0.15;
        p.rotation += p.rotationSpeed;
        p.life++;
        break;
      }
      case 'cloudy': {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        break;
      }
      case 'rainy': {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        break;
      }
      case 'snowy': {
        const drift = Math.sin(this.time * 2 + p.phase) * 0.8;
        p.x += p.vx + drift;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life++;
        break;
      }
    }
  }

  private isOffscreenOrDead(p: Particle): boolean {
    const margin = 50;
    if (p.life > p.maxLife) return true;
    switch (this.currentType) {
      case 'rainy':
        return p.y > this.height + margin;
      case 'snowy':
        return p.y > this.height + margin;
      case 'cloudy':
        return p.x > this.width + margin;
      default:
        return (
          p.x < -margin ||
          p.x > this.width + margin ||
          p.y < -margin ||
          p.y > this.height + margin
        );
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    switch (this.currentType) {
      case 'sunny':
        this.renderSunny(ctx);
        break;
      case 'cloudy':
        this.renderCloudy(ctx);
        break;
      case 'rainy':
        this.renderRainy(ctx);
        break;
      case 'snowy':
        this.renderSnowy(ctx);
        break;
    }
  }

  private renderSunny(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const twinkle = 0.6 + 0.4 * Math.sin(this.time * 3 + p.phase);
      ctx.globalAlpha = p.opacity * twinkle;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      if (p.size > 4) {
        ctx.globalAlpha = p.opacity * twinkle * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private renderCloudy(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const pulse = 0.7 + 0.3 * Math.sin(this.time * 0.8 + p.phase);
      ctx.globalAlpha = p.opacity * 0.5 * pulse;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderRainy(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'round';
    for (const p of this.particles) {
      const lineLen = p.size * 4 + 6;
      ctx.globalAlpha = p.opacity;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size * 0.35);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.6, p.y - lineLen);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private renderSnowy(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      this.drawHexagon(ctx, 0, 0, p.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
