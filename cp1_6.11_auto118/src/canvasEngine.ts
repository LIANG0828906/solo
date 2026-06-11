export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface StyleParams {
  lineWidth: number;
  distortion: number;
  jitterFrequency: number;
  fadeAmount: number;
}

export interface Stroke {
  points: Point[];
  style: StyleParams;
}

const DEFAULT_STYLE: StyleParams = {
  lineWidth: 4,
  distortion: 0,
  jitterFrequency: 1,
  fadeAmount: 0,
};

const PAPER_BG = '#F9F6EE';
const GRID_COLOR = '#E0D5C1';
const INK_COLOR = '#2B1B0E';
const FADE_TARGET = '#AAAAAA';
const GLOW_DURATION = 300;

interface GlowPoint {
  point: Point;
  startTime: number;
  style: StyleParams;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  height: number = 0;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private style: StyleParams = { ...DEFAULT_STYLE };
  private glowPoints: GlowPoint[] = [];
  private rafId: number | null = null;
  private lastJitterTime = 0;
  private jitterSeed = 0;
  private onChangeCallback: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.resize();
    this.startAnimationLoop();
  }

  setOnChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, 800);
    const dpr = window.devicePixelRatio || 1;

    this.width = size;
    this.height = size;

    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  setStyle(params: Partial<StyleParams>): void {
    this.style = { ...this.style, ...params };
    this.render();
  }

  getStyle(): StyleParams {
    return { ...this.style };
  }

  startStroke(point: Point): void {
    this.currentStroke = {
      points: [{ ...point }],
      style: { ...this.style },
    };
    this.addGlowPoint(point);
    this.render();
  }

  drawSegment(_from: Point, to: Point): void {
    if (!this.currentStroke) return;
    this.currentStroke.points.push({ ...to });
    this.addGlowPoint(to);
    this.render();
  }

  endStroke(): void {
    if (this.currentStroke && this.currentStroke.points.length >= 2) {
      this.strokes.push(this.currentStroke);
      if (this.onChangeCallback) this.onChangeCallback();
    }
    this.currentStroke = null;
    this.render();
  }

  private addGlowPoint(point: Point): void {
    this.glowPoints.push({
      point: { ...point },
      startTime: performance.now(),
      style: { ...this.style },
    });
  }

  clear(withFade = false): Promise<void> {
    return new Promise((resolve) => {
      if (withFade) {
        const container = this.canvas.parentElement;
        if (container) {
          container.classList.add('fading');
          setTimeout(() => {
            container.classList.remove('fading');
          }, 500);
        }
      }
      setTimeout(() => {
        this.strokes = [];
        this.currentStroke = null;
        this.glowPoints = [];
        this.render();
        if (this.onChangeCallback) this.onChangeCallback();
        resolve();
      }, withFade ? 250 : 0);
    });
  }

  getStrokes(): Stroke[] {
    return JSON.parse(JSON.stringify(this.strokes));
  }

  restoreStrokes(strokes: Stroke[]): void {
    this.strokes = JSON.parse(JSON.stringify(strokes));
    this.render();
    if (this.onChangeCallback) this.onChangeCallback();
  }

  canUndo(): boolean {
    return this.strokes.length > 0;
  }

  private startAnimationLoop(): void {
    const loop = (): void => {
      this.updateGlow();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private updateGlow(): void {
    const now = performance.now();
    const before = this.glowPoints.length;
    this.glowPoints = this.glowPoints.filter(
      (g) => now - g.startTime < GLOW_DURATION
    );
    if (this.glowPoints.length !== before || this.glowPoints.length > 0) {
      this.render();
    }
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = PAPER_BG;
    ctx.fillRect(0, 0, w, h);

    this.drawGrid();

    for (const stroke of this.strokes) {
      this.drawStrokePath(stroke);
    }

    if (this.currentStroke) {
      this.drawStrokePath(this.currentStroke);
    }

    this.drawGlowEffects();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const pos = (w / 4) * i;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, h);
    }
    for (let i = 1; i < 4; i++) {
      const pos = (h / 4) * i;
      ctx.moveTo(0, pos);
      ctx.lineTo(w, pos);
    }
    ctx.stroke();

    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  private interpolateColor(fadeAmount: number): string {
    const t = fadeAmount / 100;
    const r1 = parseInt(INK_COLOR.slice(1, 3), 16);
    const g1 = parseInt(INK_COLOR.slice(3, 5), 16);
    const b1 = parseInt(INK_COLOR.slice(5, 7), 16);
    const r2 = parseInt(FADE_TARGET.slice(1, 3), 16);
    const g2 = parseInt(FADE_TARGET.slice(3, 5), 16);
    const b2 = parseInt(FADE_TARGET.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private getJitterOffset(style: StyleParams): { dx: number; dy: number } {
    const now = performance.now();
    const interval = 1000 / (style.jitterFrequency * 30);
    if (now - this.lastJitterTime > interval) {
      this.jitterSeed = Math.random() * 10000;
      this.lastJitterTime = now;
    }
    const angle = this.jitterSeed * Math.PI * 2;
    const magnitude = style.distortion;
    return {
      dx: Math.cos(angle) * magnitude,
      dy: Math.sin(angle * 1.3) * magnitude,
    };
  }

  private drawStrokePath(stroke: Stroke): void {
    if (stroke.points.length < 2) return;

    const ctx = this.ctx;
    const style = stroke.style;

    ctx.save();
    ctx.strokeStyle = this.interpolateColor(style.fadeAmount);
    ctx.lineWidth = style.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    const first = stroke.points[0];
    const offset0 = style.distortion > 0 ? this.getJitterOffset(style) : { dx: 0, dy: 0 };
    ctx.moveTo(first.x + offset0.dx, first.y + offset0.dy);

    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      const offset = style.distortion > 0 ? this.getJitterOffset(style) : { dx: 0, dy: 0 };
      const x = p.x + offset.dx;
      const y = p.y + offset.dy;

      ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.restore();
  }

  private drawGlowEffects(): void {
    this.glowPoints.forEach((glow) => {
      const age = performance.now() - glow.startTime;
      if (age >= GLOW_DURATION) return;

      const alpha = 1 - age / GLOW_DURATION;
      const ctx = this.ctx;
      const style = glow.style;
      const color = this.interpolateColor(style.fadeAmount);

      ctx.save();
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(glow.point.x, glow.point.y, style.lineWidth * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  toSVG(): string {
    const w = this.width;
    const h = this.height;
    const paths: string[] = [];

    for (const stroke of this.strokes) {
      if (stroke.points.length < 2) continue;
      const d = this.strokeToSVGPath(stroke);
      if (d) paths.push(d);
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${PAPER_BG}"/>
  ${this.gridToSVG()}
  <g stroke-linecap="round" stroke-linejoin="round">
    ${paths.join('\n    ')}
  </g>
</svg>`;

    return svg;
  }

  private gridToSVG(): string {
    const w = this.width;
    const h = this.height;
    const lines: string[] = [];

    for (let i = 1; i < 4; i++) {
      const pos = (w / 4) * i;
      lines.push(`<line x1="${pos}" y1="0" x2="${pos}" y2="${h}" stroke="${GRID_COLOR}" stroke-width="0.5"/>`);
    }
    for (let i = 1; i < 4; i++) {
      const pos = (h / 4) * i;
      lines.push(`<line x1="0" y1="${pos}" x2="${w}" y2="${pos}" stroke="${GRID_COLOR}" stroke-width="0.5"/>`);
    }
    lines.push(`<line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke="${GRID_COLOR}" stroke-width="0.5" stroke-dasharray="6,6"/>`);
    lines.push(`<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${GRID_COLOR}" stroke-width="0.5" stroke-dasharray="6,6"/>`);

    return `<g opacity="0.8">
    ${lines.join('\n    ')}
  </g>
  `;
  }

  private strokeToSVGPath(stroke: Stroke): string | null {
    if (stroke.points.length < 2) return null;

    const style = stroke.style;
    const color = this.interpolateColor(style.fadeAmount);
    let d = `M ${stroke.points[0].x.toFixed(2)} ${stroke.points[0].y.toFixed(2)}`;

    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      d = `${d} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }

    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${style.lineWidth}"/>`;
  }
}
