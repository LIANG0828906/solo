import type { GradientConfig } from './parser';
import { extractGradientColors, interpolateColor, createCanvasGradient } from './parser';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  alphaPhase: number;
  alphaSpeed: number;
}

export interface ParticleConfig {
  count: number;
  speed: number;
  size: number;
  alpha: number;
}

interface SnapshotParticle {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gradient: GradientConfig;
  private particles: Particle[] = [];
  private snapshotParticles: SnapshotParticle[] = [];
  private config: ParticleConfig;
  private running = false;
  private locked = false;
  private animationId: number | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private colors: string[] = [];
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private fps = 60;
  private onFpsUpdate?: ((fps: number) => void);

  constructor(
    canvas: HTMLCanvasElement,
    gradient: GradientConfig,
    config: ParticleConfig,
    onFpsUpdate?: (fps: number) => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    this.gradient = gradient;
    this.config = config;
    this.onFpsUpdate = onFpsUpdate;
    this.dpr = window.devicePixelRatio || 1;

    this.colors = extractGradientColors(gradient);
    this.resize();
    this.initParticles();
    this.createOffscreenCanvas();
  }

  private createOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    this.updateOffscreenGradient();
  }

  private updateOffscreenGradient(): void {
    if (!this.offscreenCanvas || !this.offscreenCtx) return;

    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;

    const gradient = createCanvasGradient(
      this.offscreenCtx,
      this.gradient,
      this.width,
      this.height
    );

    this.offscreenCtx.fillStyle = gradient;
    this.offscreenCtx.fillRect(0, 0, this.width, this.height);
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    if (this.offscreenCanvas) {
      this.updateOffscreenGradient();
    }

    if (this.particles.length > 0) {
      this.particles.forEach(p => {
        p.x = Math.min(p.x, this.width - p.radius);
        p.y = Math.min(p.y, this.height - p.radius);
      });
    }
  }

  private initParticles(): void {
    this.particles = [];
    const { count, speed, size, alpha } = this.config;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedMultiplier = 0.3 + Math.random() * 0.9;
      const particleSpeed = speed * speedMultiplier;

      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.cos(angle) * particleSpeed,
        vy: Math.sin(angle) * particleSpeed,
        radius: Math.max(2, size - 2 + Math.random() * (size + 2)),
        baseRadius: Math.max(2, size - 2 + Math.random() * (size + 2)),
        color: interpolateColor(this.colors, Math.random()),
        alpha: alpha * (0.3 + Math.random() * 0.4),
        baseAlpha: alpha * (0.3 + Math.random() * 0.4),
        alphaPhase: Math.random() * Math.PI * 2,
        alphaSpeed: 0.01 + Math.random() * 0.02
      });
    }
  }

  setConfig(config: Partial<ParticleConfig>): void {
    const oldCount = this.config.count;
    this.config = { ...this.config, ...config };

    if (config.count !== undefined && config.count !== oldCount) {
      this.adjustParticleCount(config.count);
    }

    if (config.size !== undefined) {
      this.particles.forEach(p => {
        p.baseRadius = Math.max(2, config.size! - 2 + Math.random() * (config.size! + 2));
        p.radius = p.baseRadius;
      });
    }

    if (config.speed !== undefined) {
      this.particles.forEach(p => {
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > 0) {
          const ratio = (config.speed! * (0.3 + Math.random() * 0.9)) / currentSpeed;
          p.vx *= ratio;
          p.vy *= ratio;
        }
      });
    }

    if (config.alpha !== undefined) {
      this.particles.forEach(p => {
        p.baseAlpha = config.alpha! * (0.3 + Math.random() * 0.4);
      });
    }
  }

  private adjustParticleCount(newCount: number): void {
    if (newCount > this.particles.length) {
      const { speed, size, alpha } = this.config;
      for (let i = this.particles.length; i < newCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speedMultiplier = 0.3 + Math.random() * 0.9;
        const particleSpeed = speed * speedMultiplier;

        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: Math.cos(angle) * particleSpeed,
          vy: Math.sin(angle) * particleSpeed,
          radius: Math.max(2, size - 2 + Math.random() * (size + 2)),
          baseRadius: Math.max(2, size - 2 + Math.random() * (size + 2)),
          color: interpolateColor(this.colors, Math.random()),
          alpha: alpha * (0.3 + Math.random() * 0.4),
          baseAlpha: alpha * (0.3 + Math.random() * 0.4),
          alphaPhase: Math.random() * Math.PI * 2,
          alphaSpeed: 0.01 + Math.random() * 0.02
        });
      }
    } else if (newCount < this.particles.length) {
      this.particles = this.particles.slice(0, newCount);
    }
  }

  setGradient(gradient: GradientConfig): void {
    this.gradient = gradient;
    this.colors = extractGradientColors(gradient);
    this.updateOffscreenGradient();

    this.particles.forEach(p => {
      p.color = interpolateColor(this.colors, Math.random());
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.animate();
  }

  stop(): void {
    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  toggleLock(): boolean {
    this.locked = !this.locked;
    if (this.locked) {
      this.takeSnapshot();
    }
    return this.locked;
  }

  isLocked(): boolean {
    return this.locked;
  }

  private takeSnapshot(): void {
    this.snapshotParticles = this.particles.map(p => ({
      x: p.x,
      y: p.y,
      radius: p.radius,
      color: p.color,
      alpha: p.alpha
    }));
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getSnapshotParticles(): SnapshotParticle[] {
    return this.locked ? this.snapshotParticles : this.particles.map(p => ({
      x: p.x,
      y: p.y,
      radius: p.radius,
      color: p.color,
      alpha: p.alpha
    }));
  }

  getGradient(): GradientConfig {
    return this.gradient;
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  private animate(): void {
    if (!this.running) return;

    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      if (this.onFpsUpdate) {
        this.onFpsUpdate(this.fps);
      }
    }

    this.renderFrame();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  renderFrame(): void {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    } else {
      const gradient = createCanvasGradient(this.ctx, this.gradient, this.width, this.height);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.locked) {
      this.renderSnapshot();
    } else {
      this.updateAndRenderParticles();
    }
  }

  private renderSnapshot(): void {
    this.ctx.beginPath();
    for (const p of this.snapshotParticles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.moveTo(p.x + p.radius, p.y);
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    }
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private updateAndRenderParticles(): void {
    this.ctx.beginPath();

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      let bounced = false;

      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx = Math.abs(p.vx);
        bounced = true;
      } else if (p.x + p.radius > this.width) {
        p.x = this.width - p.radius;
        p.vx = -Math.abs(p.vx);
        bounced = true;
      }

      if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy = Math.abs(p.vy);
        bounced = true;
      } else if (p.y + p.radius > this.height) {
        p.y = this.height - p.radius;
        p.vy = -Math.abs(p.vy);
        bounced = true;
      }

      if (bounced) {
        const currentAngle = Math.atan2(p.vy, p.vx);
        const angleChange = (Math.random() - 0.5) * Math.PI / 9;
        const newAngle = currentAngle + angleChange;
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        p.vx = Math.cos(newAngle) * currentSpeed;
        p.vy = Math.sin(newAngle) * currentSpeed;

        p.baseRadius = Math.max(2, Math.min(10, p.baseRadius + (Math.random() - 0.5) * 2));
      }

      p.radius = p.baseRadius * (0.85 + Math.sin(performance.now() * 0.001 + p.alphaPhase) * 0.15);

      p.alphaPhase += p.alphaSpeed;
      p.alpha = p.baseAlpha * (0.7 + Math.sin(p.alphaPhase) * 0.3);

      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.moveTo(p.x + p.radius, p.y);
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    }

    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  getFps(): number {
    return this.fps;
  }
}
