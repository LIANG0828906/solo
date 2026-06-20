import { Particle, ThemeType } from './types';
import { THEMES } from './themes';

export class ParticleRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private theme: ThemeType = 'fire';
  private dpr = 1;

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = window.devicePixelRatio || 1;
    this.resize(canvas.width, canvas.height);
  }

  resize(width: number, height: number): void {
    if (!this.canvas || !this.ctx) return;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  setTheme(theme: ThemeType): void {
    this.theme = theme;
  }

  render(particles: Particle[], progress: number, width: number, height: number): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const themeConfig = THEMES[this.theme];

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.dpr, this.dpr);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (progress > 0) {
      this.drawBackgroundGradient(ctx, width, height, progress);
    }

    this.drawParticles(ctx, particles, progress);

    ctx.restore();
  }

  private drawBackgroundGradient(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number
  ): void {
    const themeConfig = THEMES[this.theme];
    const { start, end } = themeConfig.bgGradient;

    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );

    const alpha = Math.min(progress * 1.5, 1);
    const startColor = this.adjustAlpha(start, alpha);
    const endColor = this.adjustAlpha(end, alpha * 0.5);

    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private adjustAlpha(color: string, alpha: number): string {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const a = match[4] ? parseFloat(match[4]) * alpha : alpha;
      return `rgba(${r},${g},${b},${a})`;
    }
    return color;
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], progress: number): void {
    ctx.globalCompositeOperation = 'lighter';

    for (const p of particles) {
      if (p.opacity <= 0) continue;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      this.drawGlow(ctx, p);
      this.drawShape(ctx, p);

      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private drawGlow(ctx: CanvasRenderingContext2D, p: Particle): void {
    const glowSize = p.size * 2;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    const glowColor = THEMES[this.theme].glowColor;

    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawShape(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.fillStyle = p.color;

    switch (p.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        break;

      case 'ellipse':
        ctx.beginPath();
        const rx = p.size / 2;
        const ry = p.size / 3;
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'triangle':
        ctx.beginPath();
        const s = p.size / 2;
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.866, s * 0.5);
        ctx.lineTo(s * 0.866, s * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  captureFrame(width: number, height: number): ImageData | null {
    if (!this.ctx) return null;
    return this.ctx.getImageData(0, 0, width * this.dpr, height * this.dpr);
  }

  captureFrameDataURL(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    this.ctx = null;
    this.canvas = null;
  }
}
