import type { EmotionValues, HSL } from '../utils/colorMapper';
import { getGradientColors, mixEmotionColors, hslToString, hslToRgb, hslToHex } from '../utils/colorMapper';

export interface ParticleConfig {
  count: number;
  minSize: number;
  maxSize: number;
  speed: number;
}

export interface CanvasRendererOptions {
  particleConfig?: Partial<ParticleConfig>;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  baseY: number;
  phase: number;
  frequency: number;
  amplitude: number;
  color: string;
  alpha: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private emotions: EmotionValues;
  private particles: Particle[] = [];
  private particleConfig: ParticleConfig;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private mouseX: number = -1000;
  private mouseY: number = -1000;
  private isMouseInCanvas: boolean = false;
  private onFpsChange?: (fps: number) => void;
  private onColorChange?: (hex: string) => void;
  private mixedColor: HSL = { h: 0, s: 0, l: 75 };

  constructor(canvas: HTMLCanvasElement, options: CanvasRendererOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not supported');
    this.ctx = ctx;
    
    this.emotions = { happy: 0.5, sad: 0.3, angry: 0.2, calm: 0.4 };
    this.particleConfig = {
      count: 50,
      minSize: 2,
      maxSize: 6,
      speed: 0.5,
      ...options.particleConfig,
    };
    
    this.resize();
    this.initParticles();
  }

  setOnFpsChange(callback: (fps: number) => void): void {
    this.onFpsChange = callback;
    callback(this.fps);
  }

  setOnColorChange(callback: (hex: string) => void): void {
    this.onColorChange = callback;
  }

  setEmotions(emotions: EmotionValues): void {
    this.emotions = emotions;
    this.mixedColor = mixEmotionColors(emotions);
    if (this.onColorChange) {
      this.onColorChange(hslToHex(this.mixedColor));
    }
    this.updateParticleColors();
  }

  setParticleCount(count: number): void {
    const newCount = Math.max(0, Math.floor(count));
    if (newCount === this.particles.length) return;
    
    if (newCount > this.particles.length) {
      for (let i = this.particles.length; i < newCount; i++) {
        this.particles.push(this.createParticle());
      }
    } else {
      this.particles = this.particles.slice(0, newCount);
    }
    this.particleConfig.count = newCount;
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  setMouseInCanvas(isIn: boolean): void {
    this.isMouseInCanvas = isIn;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.particleConfig.count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const rect = this.canvas.getBoundingClientRect();
    const size = this.particleConfig.minSize + Math.random() * (this.particleConfig.maxSize - this.particleConfig.minSize);
    const color = this.getParticleColor();
    return {
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size,
      speedX: (Math.random() - 0.5) * this.particleConfig.speed,
      speedY: 0,
      baseY: Math.random() * rect.height,
      phase: Math.random() * Math.PI * 2,
      frequency: 0.001 + Math.random() * 0.003,
      amplitude: 15 + Math.random() * 35,
      color,
      alpha: 0.4 + Math.random() * 0.6,
    };
  }

  private getParticleColor(): string {
    const colors = getGradientColors(this.emotions);
    if (colors.length === 0) return 'rgba(255, 255, 255, 0.8)';
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rgb = hslToRgb(color);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, `;
  }

  private updateParticleColors(): void {
    for (const particle of this.particles) {
      const colors = getGradientColors(this.emotions);
      if (colors.length === 0) {
        particle.color = 'rgba(255, 255, 255, ';
        continue;
      }
      const color = colors[Math.floor(Math.random() * colors.length)];
      const rgb = hslToRgb(color);
      particle.color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, `;
    }
  }

  private updateParticles(deltaTime: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const attractRadius = 150;
    const attractStrength = 0.08;

    for (const p of this.particles) {
      p.phase += p.frequency * deltaTime;
      p.x += p.speedX * deltaTime * 0.06;
      p.y = p.baseY + Math.sin(p.phase) * p.amplitude;
      p.baseY += (Math.random() - 0.5) * 0.3;

      if (p.x < -p.size) p.x = rect.width + p.size;
      if (p.x > rect.width + p.size) p.x = -p.size;
      if (p.baseY < 0) p.baseY = 0;
      if (p.baseY > rect.height) p.baseY = rect.height;

      if (this.isMouseInCanvas) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < attractRadius && dist > 0) {
          const force = (1 - dist / attractRadius) * attractStrength;
          p.x += dx / dist * force * deltaTime * 0.5;
          p.baseY += dy / dist * force * deltaTime * 0.5;
        }
      }
    }
  }

  private drawBackground(): void {
    const rect = this.canvas.getBoundingClientRect();
    const colors = getGradientColors(this.emotions);
    
    const gradient = this.ctx.createLinearGradient(0, 0, rect.width, 0);
    
    if (colors.length === 0) {
      gradient.addColorStop(0, '#e0e0e0');
      gradient.addColorStop(1, '#f5f5f5');
    } else if (colors.length === 1) {
      gradient.addColorStop(0, hslToString(colors[0]));
      gradient.addColorStop(1, hslToString({ ...colors[0], l: Math.min(95, colors[0].l + 20) }));
    } else {
      const step = 1 / (colors.length - 1);
      colors.forEach((color, i) => {
        gradient.addColorStop(i * step, hslToString(color));
      });
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      const glowSize = p.size * 3;
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      gradient.addColorStop(0, p.color + p.alpha * 0.9 + ')');
      gradient.addColorStop(0.4, p.color + p.alpha * 0.4 + ')');
      gradient.addColorStop(1, p.color + '0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = p.color + p.alpha + ')';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawStarEffect(): void {
    if (!this.isMouseInCanvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const gradient = this.ctx.createRadialGradient(
      this.mouseX, this.mouseY, 0,
      this.mouseX, this.mouseY, 80
    );
    const rgb = hslToRgb(this.mixedColor);
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.mouseX, this.mouseY, 80, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private render = (timestamp: number): void => {
    if (this.lastTime === 0) this.lastTime = timestamp;
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.frameCount++;
    if (timestamp - this.fpsUpdateTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (timestamp - this.fpsUpdateTime));
      this.frameCount = 0;
      this.fpsUpdateTime = timestamp;
      
      if (this.onFpsChange) {
        this.onFpsChange(this.fps);
      }
      
      if (this.fps < 30 && this.particles.length > 10) {
        this.setParticleCount(this.particles.length - 10);
      }
    }

    this.updateParticles(deltaTime);
    this.drawBackground();
    this.drawParticles();
    this.drawStarEffect();

    this.animationId = requestAnimationFrame(this.render);
  };

  start(): void {
    if (this.animationId !== null) return;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = performance.now();
    this.animationId = requestAnimationFrame(this.render);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getFps(): number {
    return this.fps;
  }

  getMixedColor(): HSL {
    return this.mixedColor;
  }

  getCanvasDataUrl(): string {
    return this.canvas.toDataURL('image/png');
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  destroy(): void {
    this.stop();
  }
}
