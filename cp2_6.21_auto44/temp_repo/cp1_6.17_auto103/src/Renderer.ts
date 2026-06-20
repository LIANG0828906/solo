import { WatercolorBrush } from './WatercolorBrush';
import { ParticleEffect } from './ParticleEffect';

const MAX_BRUSHES = 50;

const THEME_COLORS: Record<string, string[]> = {
  '#FF7F7F': ['#FF7F7F', '#FF9E9E', '#E86C6C', '#FFB5B5'],
  '#7EC8E3': ['#7EC8E3', '#9DD5EA', '#5CB4D4', '#B8E2F0'],
  '#7CB342': ['#7CB342', '#8FC556', '#6A9E36', '#A8D470'],
  '#FFD54F': ['#FFD54F', '#FFE082', '#FFC107', '#FFF176'],
};

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  brushes: WatercolorBrush[];
  particles: ParticleEffect[];
  currentTheme: string;
  lastTime: number;
  rafId: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d')!;
    this.ctx = ctx;
    this.brushes = [];
    this.particles = [];
    this.currentTheme = '#FF7F7F';
    this.lastTime = 0;
    this.rafId = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setTheme(color: string): void {
    this.currentTheme = color;
  }

  addBrushAt(x: number, y: number): void {
    const colors = THEME_COLORS[this.currentTheme] || THEME_COLORS['#FF7F7F'];
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      const brush = new WatercolorBrush({
        cx: x + offsetX,
        cy: y + offsetY,
        color: colors[Math.floor(Math.random() * colors.length)],
        themeColors: colors,
      });
      this.brushes.push(brush);
    }

    while (this.brushes.length > MAX_BRUSHES) {
      this.brushes.shift();
    }

    this.particles.push(
      new ParticleEffect({
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    );
  }

  clear(): void {
    this.brushes = [];
    this.particles = [];
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private loop = (now: number): void => {
    const dt = Math.min(now - this.lastTime, 32);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    for (const brush of this.brushes) {
      brush.update(dt);
      brush.drift();
    }

    for (const particle of this.particles) {
      particle.update(dt);
    }

    this.particles = this.particles.filter((p) => !p.finished);
  }

  private render(): void {
    const { ctx, canvas } = this;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#F5F0E8';
    ctx.fillRect(0, 0, w, h);

    for (const brush of this.brushes) {
      brush.draw(ctx);
    }

    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
}
