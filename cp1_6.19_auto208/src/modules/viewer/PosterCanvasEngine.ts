import type { PosterTemplate, PosterLayer, Particle, BehaviorParams } from '@/types';
import { shiftHue } from '@/utils/colorUtils';

const MAX_PARTICLES = 100;
const PARTICLE_LIFETIME = 3;

export interface EngineCallbacks {
  onParticleCountChange?: (count: number) => void;
  onParamsChange?: (params: BehaviorParams) => void;
}

export class PosterCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private template: PosterTemplate;
  private particles: Particle[] = [];
  private particleIdCounter = 0;
  private animFrameId: number | null = null;
  private renderFrameCounter = 0;
  private lastTime = 0;
  private hueDirection = 1;
  private smoothedHueShift = 0;
  private smoothedComposition = 1.0;
  private mouseVX = 0;
  private mouseVY = 0;
  private callbacks: EngineCallbacks;
  private isRunning = false;
  private exportScale = 2;

  public params: BehaviorParams = {
    dwellTime: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    hueShift: 0,
    compositionWeight: 1.0,
    particleCount: 0,
  };

  constructor(
    canvas: HTMLCanvasElement,
    template: PosterTemplate,
    callbacks: EngineCallbacks = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.template = template;
    this.callbacks = callbacks;
  }

  updateBehavior(params: Partial<BehaviorParams>): void {
    const prevX = this.params.mouseX;
    const prevY = this.params.mouseY;

    if (params.mouseX !== undefined && params.mouseY !== undefined) {
      this.mouseVX = params.mouseX - prevX;
      this.mouseVY = params.mouseY - prevY;
    }

    this.params = { ...this.params, ...params };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  setExportScale(scale: number): void {
    this.exportScale = scale;
  }

  getExportDataUrl(): string {
    const prevScale = this.exportScale;
    this.exportScale = 1;
    const prevW = this.canvas.width;
    const prevH = this.canvas.height;
    this.canvas.width = this.template.width;
    this.canvas.height = this.template.height;
    this.render(1);
    const dataUrl = this.canvas.toDataURL('image/png');
    this.canvas.width = prevW;
    this.canvas.height = prevH;
    this.exportScale = prevScale;
    return dataUrl;
  }

  private loop = (time: number): void => {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);

    this.renderFrameCounter++;
    if (this.renderFrameCounter % 2 === 0) {
      this.render(dt);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const p = this.params;

    if (p.dwellTime > 5) {
      const hueBase = p.mouseX * 60 - 30;
      this.smoothedHueShift += (hueBase - this.smoothedHueShift) * 0.08;

      this.smoothedHueShift += 0.5 * dt * this.hueDirection;
      if (this.smoothedHueShift > 30) {
        this.smoothedHueShift = 30;
        this.hueDirection = -1;
      }
      if (this.smoothedHueShift < -30) {
        this.smoothedHueShift = -30;
        this.hueDirection = 1;
      }

      const compTarget = 0.6 + p.mouseY * 0.4;
      this.smoothedComposition += (compTarget - this.smoothedComposition) * 0.08;

      this.spawnParticles(dt);
    } else {
      this.smoothedHueShift += (0 - this.smoothedHueShift) * 0.05;
      this.smoothedComposition += (1.0 - this.smoothedComposition) * 0.05;
    }

    this.updateParticles(dt);

    const newParams: BehaviorParams = {
      ...p,
      hueShift: Math.round(this.smoothedHueShift * 10) / 10,
      compositionWeight: Math.round(this.smoothedComposition * 100) / 100,
      particleCount: this.particles.length,
    };
    this.params = newParams;
    this.callbacks.onParamsChange?.(newParams);
  }

  private spawnParticles(dt: number): void {
    const spawnChance = 0.8 * dt * 60;
    const spawnCount = Math.random() < spawnChance ? Math.ceil(Math.random() * 3) : 0;

    for (let i = 0; i < spawnCount; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      const offsetX = (Math.random() - 0.5) * this.canvas.width * 0.3;
      const offsetY = (Math.random() - 0.5) * this.canvas.height * 0.3;

      const speedBase = 60 + Math.random() * 80;
      const angleJitter = (Math.random() - 0.5) * Math.PI * 0.6;
      const moveAngle = Math.atan2(this.mouseVY, this.mouseVX) + angleJitter;
      const hasMove = Math.abs(this.mouseVX) + Math.abs(this.mouseVY) > 0.0001;

      const finalAngle = hasMove
        ? moveAngle
        : Math.random() * Math.PI * 2;

      const palette = this.template.palette;
      const color = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        id: ++this.particleIdCounter,
        x: cx + offsetX,
        y: cy + offsetY,
        vx: Math.cos(finalAngle) * speedBase,
        vy: Math.sin(finalAngle) * speedBase,
        radius: 2 + Math.random() * 4,
        color,
        life: PARTICLE_LIFETIME,
        maxLife: PARTICLE_LIFETIME,
      });
    }

    this.callbacks.onParticleCountChange?.(this.particles.length);
  }

  private updateParticles(dt: number): void {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      return p.life > 0;
    });
  }

  private render(dt: number): void {
    const { ctx, canvas, template } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = this.applyHue(template.bgColor);
    ctx.fillRect(0, 0, w, h);

    const scaleX = w / template.width;
    const scaleY = h / template.height;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (w - template.width * scale) / 2;
    const offsetY = (h - template.height * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const sortedLayers = [...template.layers].sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of sortedLayers) {
      this.renderLayer(layer, dt);
    }

    this.renderParticlesInTemplateSpace(scale);

    ctx.restore();
  }

  private renderLayer(layer: PosterLayer, _dt: number): void {
    const { ctx } = this;
    const effectiveOpacity = layer.opacity * this.smoothedComposition;
    const effectiveColor = this.applyHue(layer.color);

    ctx.save();
    ctx.globalAlpha = effectiveOpacity;
    ctx.fillStyle = effectiveColor;

    if (layer.rotation) {
      const cx = layer.x + layer.w / 2;
      const cy = layer.y + layer.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    switch (layer.type) {
      case 'rect':
        ctx.fillRect(layer.x, layer.y, layer.w, layer.h);
        break;
      case 'circle': {
        const r = Math.min(layer.w, layer.h) / 2;
        ctx.beginPath();
        ctx.arc(layer.x + layer.w / 2, layer.y + layer.h / 2, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'text': {
        ctx.fillStyle = effectiveColor;
        const font = `${layer.fontSize || 32}px ${layer.fontFamily || 'sans-serif'}`;
        ctx.font = font;
        ctx.textBaseline = 'top';
        if (layer.content) {
          ctx.fillText(layer.content, layer.x, layer.y);
        }
        break;
      }
    }

    ctx.restore();
  }

  private renderParticlesInTemplateSpace(scale: number): void {
    const { ctx, template } = this;
    const invScale = 1 / scale;

    for (const p of this.particles) {
      const alpha = Math.max(0, (p.life / p.maxLife) * 0.75);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.applyHue(p.color);
      ctx.beginPath();
      ctx.arc(
        p.x * invScale * (template.width / this.canvas.width),
        p.y * invScale * (template.height / this.canvas.height),
        p.radius * invScale * (template.width / this.canvas.width),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  private applyHue(color: string): string {
    if (Math.abs(this.smoothedHueShift) < 0.1) return color;
    return shiftHue(color, this.smoothedHueShift);
  }

  destroy(): void {
    this.stop();
    this.particles = [];
  }
}
