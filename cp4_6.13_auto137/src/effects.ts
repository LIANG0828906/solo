import { lerp, easeOutQuad } from './utils';

export interface ScreenEffect {
  type: 'flash' | 'glow' | 'burst';
  startTime: number;
  duration: number;
  color?: string;
  intensity?: number;
}

export class EffectsManager {
  private effects: ScreenEffect[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  addFlash(color: string = '#ff4444', duration: number = 300, intensity: number = 0.5): void {
    this.effects.push({
      type: 'flash',
      startTime: performance.now(),
      duration,
      color,
      intensity
    });
  }

  addGlow(color: string = '#ff66ff', duration: number = 2000, intensity: number = 0.3): void {
    this.effects.push({
      type: 'glow',
      startTime: performance.now(),
      duration,
      color,
      intensity
    });
  }

  addBurst(color: string = '#ffffff', duration: number = 500): void {
    this.effects.push({
      type: 'burst',
      startTime: performance.now(),
      duration,
      color
    });
  }

  update(): void {
    const now = performance.now();
    this.effects = this.effects.filter(e => now - e.startTime < e.duration);
  }

  render(): void {
    const now = performance.now();

    for (const effect of this.effects) {
      const elapsed = now - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1);

      switch (effect.type) {
        case 'flash':
          this.renderFlash(progress, effect.color!, effect.intensity!);
          break;
        case 'glow':
          this.renderGlow(progress, effect.color!, effect.intensity!);
          break;
        case 'burst':
          this.renderBurst(progress, effect.color!);
          break;
      }
    }
  }

  private renderFlash(progress: number, color: string, intensity: number): void {
    const alpha = intensity * (1 - easeOutQuad(progress));
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  private renderGlow(progress: number, color: string, intensity: number): void {
    const { width, height } = this.canvas;
    const alpha = intensity * Math.sin(progress * Math.PI);
    const gradientSize = Math.min(width, height) * 0.4;

    const gradient = this.ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, gradientSize
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.7, this.hexToRgba(color, alpha * 0.3));
    gradient.addColorStop(1, this.hexToRgba(color, alpha));

    const rectGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    rectGradient.addColorStop(0, this.hexToRgba(color, alpha));
    rectGradient.addColorStop(0.1, 'transparent');
    rectGradient.addColorStop(0.9, 'transparent');
    rectGradient.addColorStop(1, this.hexToRgba(color, alpha));

    this.ctx.save();
    this.ctx.fillStyle = rectGradient;
    this.ctx.fillRect(0, 0, width, height);

    const rectGradient2 = this.ctx.createLinearGradient(0, 0, width, 0);
    rectGradient2.addColorStop(0, this.hexToRgba(color, alpha));
    rectGradient2.addColorStop(0.1, 'transparent');
    rectGradient2.addColorStop(0.9, 'transparent');
    rectGradient2.addColorStop(1, this.hexToRgba(color, alpha));

    this.ctx.fillStyle = rectGradient2;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();
  }

  private renderBurst(progress: number, color: string): void {
    const { width, height } = this.canvas;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.max(width, height) * 0.8;
    const radius = lerp(10, maxRadius, easeOutQuad(progress));
    const alpha = (1 - progress) * 0.6;

    this.ctx.save();
    this.ctx.strokeStyle = this.hexToRgba(color, alpha);
    this.ctx.lineWidth = 3 * (1 - progress * 0.5);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    const gradient = this.ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, this.hexToRgba(color, alpha * 0.3));
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  clear(): void {
    this.effects = [];
  }
}
