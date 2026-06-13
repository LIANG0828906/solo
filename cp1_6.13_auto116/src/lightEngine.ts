import {
  Particle,
  EffectType,
  renderGlowEffect,
  renderStarEffect,
  renderStripeEffect
} from './effects';

const MAX_PARTICLES = 500;
const PARTICLE_LIFETIME = 2000;
const BG_TRANSITION_DURATION = 1000;

export interface BgGradient {
  colors: string[];
  angle: number;
}

export const BG_PRESETS: Record<string, BgGradient> = {
  night: { colors: ['#0c0c1e', '#1a1a3e', '#2d1b4e'], angle: 135 },
  sunset: { colors: ['#ff6b6b', '#feca57', '#ff9ff3'], angle: 135 },
  ocean: { colors: ['#0f3460', '#16213e', '#0077b6'], angle: 135 },
  aurora: { colors: ['#00b894', '#00cec9', '#55efc4'], angle: 135 }
};

export interface LightEngineCallbacks {
  onParticlesChange?: (count: number) => void;
  onBgUpdate?: (gradient: string) => void;
}

export class LightEngine {
  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private currentColor: string = '#ff3355';
  private currentEffect: EffectType = 'glow';
  private lastParticleTime: number = 0;
  private animationFrameId: number | null = null;
  private baseSize: number = 8;
  private particleIdCounter: number = 0;
  private callbacks: LightEngineCallbacks;

  private currentBg: BgGradient = BG_PRESETS.night;
  private targetBg: BgGradient = BG_PRESETS.night;
  private bgTransitionStart: number = 0;
  private isBgTransitioning: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: LightEngineCallbacks = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.resizeCanvas();
    this.attachEventListeners();
    this.notifyBgUpdate(this.currentBg);
    this.startRenderLoop();
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private attachEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }

  private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.isDrawing = true;
    const coords = this.getCanvasCoords(e.clientX, e.clientY);
    this.lastX = coords.x;
    this.lastY = coords.y;
    this.spawnParticle(coords.x, coords.y, 0);
  }

  private handleMouseMove(e: MouseEvent): void {
    const coords = this.getCanvasCoords(e.clientX, e.clientY);

    if (this.isDrawing) {
      const now = performance.now();
      if (now - this.lastParticleTime >= 16) {
        const dx = coords.x - this.lastX;
        const dy = coords.y - this.lastY;
        const velocity = Math.sqrt(dx * dx + dy * dy);
        this.spawnParticle(coords.x, coords.y, velocity);
        this.lastParticleTime = now;
        this.lastX = coords.x;
        this.lastY = coords.y;
      }
    } else {
      this.lastX = coords.x;
      this.lastY = coords.y;
    }
  }

  private handleMouseUp(): void {
    this.isDrawing = false;
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.isDrawing = true;
      const coords = this.getCanvasCoords(touch.clientX, touch.clientY);
      this.lastX = coords.x;
      this.lastY = coords.y;
      this.spawnParticle(coords.x, coords.y, 0);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (this.isDrawing && e.touches.length > 0) {
      const touch = e.touches[0];
      const coords = this.getCanvasCoords(touch.clientX, touch.clientY);
      const now = performance.now();
      if (now - this.lastParticleTime >= 16) {
        const dx = coords.x - this.lastX;
        const dy = coords.y - this.lastY;
        const velocity = Math.sqrt(dx * dx + dy * dy);
        this.spawnParticle(coords.x, coords.y, velocity);
        this.lastParticleTime = now;
        this.lastX = coords.x;
        this.lastY = coords.y;
      }
    }
  }

  private handleTouchEnd(): void {
    this.isDrawing = false;
  }

  private spawnParticle(x: number, y: number, velocity: number): void {
    const halos = this.generateHalos(x, y);

    const sizeMultiplier = 1 + Math.min(velocity * 0.02, 1.5);
    const alphaMultiplier = 0.7 + Math.min(velocity * 0.003, 0.3);

    const particle: Particle = {
      x,
      y,
      prevX: this.lastX,
      prevY: this.lastY,
      color: this.currentColor,
      size: this.baseSize * sizeMultiplier,
      alpha: alphaMultiplier,
      birthTime: performance.now(),
      velocity,
      halos
    };

    this.particles.push(particle);

    if (this.particles.length > MAX_PARTICLES) {
      const excess = this.particles.length - MAX_PARTICLES;
      this.particles.splice(0, excess);
    }

    this.callbacks.onParticlesChange?.(this.particles.length);
  }

  private generateHalos(
    centerX: number,
    centerY: number
  ): Particle['halos'] {
    const halos: Particle['halos'] = [];
    const haloCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < haloCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 20;
      const radius = 3 + Math.random() * 5;
      const alpha = 0.3 + Math.random() * 0.3;

      halos.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        radius,
        alpha
      });
    }

    return halos;
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  private render(): void {
    const now = performance.now();
    const rect = this.canvas.getBoundingClientRect();

    this.ctx.clearRect(0, 0, rect.width, rect.height);

    this.ctx.globalCompositeOperation = 'lighter';

    this.particles = this.particles.filter(p => {
      return now - p.birthTime < PARTICLE_LIFETIME;
    });

    for (const particle of this.particles) {
      const timeAlive = now - particle.birthTime;

      switch (this.currentEffect) {
        case 'glow':
          renderGlowEffect(particle, this.ctx, timeAlive);
          break;
        case 'star':
          renderStarEffect(particle, this.ctx, timeAlive);
          break;
        case 'stripe':
          renderStripeEffect(particle, this.ctx, timeAlive);
          break;
      }
    }

    this.ctx.globalCompositeOperation = 'source-over';

    this.callbacks.onParticlesChange?.(this.particles.length);
  }

  public setColor(color: string): void {
    this.currentColor = color;
  }

  public getColor(): string {
    return this.currentColor;
  }

  public setEffect(effect: EffectType): void {
    this.currentEffect = effect;
  }

  public getEffect(): EffectType {
    return this.currentEffect;
  }

  public clear(): void {
    this.particles = [];
    this.callbacks.onParticlesChange?.(0);
  }

  public saveAsPNG(filename: string = 'pulseframe-artwork.png'): void {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    const wrapperStyle = window.getComputedStyle(wrapper);
    const bgMatch = wrapperStyle.background.match(/#[0-9a-fA-F]{6}/g);
    let bgColor1 = '#0c0c1e';
    let bgColor2 = '#2d1b4e';
    if (bgMatch && bgMatch.length >= 2) {
      bgColor1 = bgMatch[0];
      bgColor2 = bgMatch[bgMatch.length - 1];
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    tempCanvas.width = rect.width * dpr;
    tempCanvas.height = rect.height * dpr;

    const gradient = tempCtx.createLinearGradient(0, 0, tempCanvas.width, tempCanvas.height);
    gradient.addColorStop(0, bgColor1);
    gradient.addColorStop(1, bgColor2);
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(this.canvas, 0, 0);

    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  public getParticleCount(): number {
    return this.particles.length;
  }
}
