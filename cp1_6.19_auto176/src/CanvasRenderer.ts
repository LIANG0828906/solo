import type {
  NeonSegment,
  Point,
  BezierControlPoint,
  ColorRGB
} from './types';
import { eventBus, EVENTS } from './eventBus';

function hexToRgb(hex: string): ColorRGB {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToString(rgb: ColorRGB): string {
  return `rgb(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)})`;
}

function rgbaToString(rgb: ColorRGB, a: number): string {
  return `rgba(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)},${a})`;
}

function lerpColor(a: ColorRGB, b: ColorRGB, t: number): ColorRGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t
  };
}

export function computeBezierControls(points: Point[]): BezierControlPoint[] {
  const controls: BezierControlPoint[] = [];
  const n = points.length - 1;
  if (n < 1) return controls;

  for (let i = 0; i < n; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const tension = 0.3;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    controls.push({ cp1x, cp1y, cp2x, cp2y });
  }
  return controls;
}

export function createSegment(points: Point[], color: string): NeonSegment {
  if (points.length < 2) {
    throw new Error('Need at least 2 points to create a segment');
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const rgb = hexToRgb(color);

  return {
    id: Math.random().toString(36).slice(2, 11),
    points: [...points],
    bezierControlPoints: computeBezierControls(points),
    color,
    targetColor: color,
    colorRGB: { ...rgb },
    targetColorRGB: { ...rgb },
    colorProgress: 1,
    colorDuration: 0,
    opacity: 1,
    targetOpacity: 1,
    opacityDuration: 0,
    scale: 1,
    targetScale: 1,
    scaleDuration: 0,
    centerX,
    centerY
  };
}

const LINE_WIDTH = 6;
const GLOW_OUTER_BLUR = 25;
const GLOW_INNER_BLUR = 10;

export class NeonCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private glowCanvas: HTMLCanvasElement;
  private glowCtx: CanvasRenderingContext2D;
  private gridPattern: CanvasPattern | null = null;
  private segments: NeonSegment[] = [];
  private brightnessFactors: number[] = [];
  private backgroundAlpha: number = 1;
  private targetBackgroundAlpha: number = 1;
  private currentBgColor: ColorRGB = hexToRgb('#1A1A1A');
  private targetBgColor: ColorRGB = hexToRgb('#1A1A1A');
  private bgTransitionProgress: number = 1;
  private bgTransitionDuration: number = 0;
  private rafId: number | null = null;
  private lastTime: number = 0;
  private onFrameUpdateHandler: ((payload?: unknown) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2D context');
    this.ctx = ctx;

    this.glowCanvas = document.createElement('canvas');
    this.glowCanvas.width = canvas.width;
    this.glowCanvas.height = canvas.height;
    const glowCtx = this.glowCanvas.getContext('2d');
    if (!glowCtx) throw new Error('Failed to get glow canvas context');
    this.glowCtx = glowCtx;

    this.buildGridPattern();
    this.bindEvents();
    this.startRenderLoop();
  }

  private bindEvents(): void {
    this.onFrameUpdateHandler = (payload) => {
      if (Array.isArray(payload)) {
        this.brightnessFactors = payload as number[];
      }
    };
    eventBus.on(EVENTS.FRAME_UPDATE, this.onFrameUpdateHandler);
  }

  private buildGridPattern(): void {
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 40;
    gridCanvas.height = 40;
    const gctx = gridCanvas.getContext('2d');
    if (!gctx) return;

    gctx.strokeStyle = 'rgba(255,255,255,0.04)';
    gctx.lineWidth = 1;
    gctx.beginPath();
    gctx.moveTo(40, 0);
    gctx.lineTo(0, 0);
    gctx.lineTo(0, 40);
    gctx.stroke();
    gctx.beginPath();
    gctx.moveTo(40, 20);
    gctx.lineTo(0, 20);
    gctx.moveTo(20, 0);
    gctx.lineTo(20, 40);
    gctx.strokeStyle = 'rgba(255,255,255,0.02)';
    gctx.stroke();

    this.gridPattern = this.ctx.createPattern(gridCanvas, 'repeat');
  }

  setSegments(segments: NeonSegment[]): void {
    this.segments = segments;
    this.ensureBrightnessFactors();
  }

  getSegments(): NeonSegment[] {
    return this.segments;
  }

  setBackgroundColor(hex: string, durationSec: number = 0.2): void {
    this.currentBgColor = { ...this.targetBgColor };
    this.targetBgColor = hexToRgb(hex);
    this.bgTransitionProgress = 0;
    this.bgTransitionDuration = durationSec;
  }

  setAllSegmentsColor(hex: string, durationSec: number = 0.6): void {
    const targetRgb = hexToRgb(hex);
    for (const seg of this.segments) {
      seg.colorRGB = {
        r: seg.colorRGB.r + (seg.targetColorRGB.r - seg.colorRGB.r) * seg.colorProgress,
        g: seg.colorRGB.g + (seg.targetColorRGB.g - seg.colorRGB.g) * seg.colorProgress,
        b: seg.colorRGB.b + (seg.targetColorRGB.b - seg.colorRGB.b) * seg.colorProgress
      };
      seg.targetColorRGB = { ...targetRgb };
      seg.targetColor = hex;
      seg.colorProgress = 0;
      seg.colorDuration = durationSec;
    }
  }

  setThemeColors(primary: string, durationSec: number = 0.8): void {
    this.setAllSegmentsColor(primary, durationSec);
  }

  fadeOutLastSegment(onComplete?: () => void): void {
    if (this.segments.length === 0) {
      onComplete?.();
      return;
    }
    const last = this.segments[this.segments.length - 1];
    last.targetOpacity = 0;
    last.opacityDuration = 0.3;
    const check = setInterval(() => {
      if (last.opacity <= 0.01 && last.targetOpacity === 0) {
        clearInterval(check);
        this.segments.pop();
        this.ensureBrightnessFactors();
        onComplete?.();
      }
    }, 30);
  }

  collapseAll(onComplete?: () => void): void {
    for (const seg of this.segments) {
      seg.targetScale = 0;
      seg.targetOpacity = 0;
      seg.scaleDuration = 0.8;
      seg.opacityDuration = 0.8;
    }
    const check = setInterval(() => {
      const done = this.segments.every(s => s.scale <= 0.01 && s.targetScale === 0);
      if (done) {
        clearInterval(check);
        this.segments = [];
        this.brightnessFactors = [];
        onComplete?.();
      }
    }, 30);
  }

  private ensureBrightnessFactors(): void {
    if (this.brightnessFactors.length !== this.segments.length) {
      this.brightnessFactors = new Array(this.segments.length).fill(1);
    }
  }

  private startRenderLoop(): void {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const delta = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.update(delta);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    for (const seg of this.segments) {
      if (seg.colorProgress < 1 && seg.colorDuration > 0) {
        seg.colorProgress = Math.min(1, seg.colorProgress + dt / seg.colorDuration);
        if (seg.colorProgress >= 1) {
          seg.color = seg.targetColor;
          seg.colorRGB = { ...seg.targetColorRGB };
        }
      }

      if (Math.abs(seg.opacity - seg.targetOpacity) > 0.001 && seg.opacityDuration > 0) {
        const step = dt / seg.opacityDuration;
        if (seg.targetOpacity > seg.opacity) {
          seg.opacity = Math.min(seg.targetOpacity, seg.opacity + step);
        } else {
          seg.opacity = Math.max(seg.targetOpacity, seg.opacity - step);
        }
      }

      if (Math.abs(seg.scale - seg.targetScale) > 0.001 && seg.scaleDuration > 0) {
        const step = dt / seg.scaleDuration;
        if (seg.targetScale > seg.scale) {
          seg.scale = Math.min(seg.targetScale, seg.scale + step);
        } else {
          seg.scale = Math.max(seg.targetScale, seg.scale - step);
        }
      }
    }

    if (this.bgTransitionProgress < 1 && this.bgTransitionDuration > 0) {
      this.bgTransitionProgress = Math.min(1, this.bgTransitionProgress + dt / this.bgTransitionDuration);
    }

    if (Math.abs(this.backgroundAlpha - this.targetBackgroundAlpha) > 0.001) {
      const step = dt * 5;
      if (this.targetBackgroundAlpha > this.backgroundAlpha) {
        this.backgroundAlpha = Math.min(this.targetBackgroundAlpha, this.backgroundAlpha + step);
      } else {
        this.backgroundAlpha = Math.max(this.targetBackgroundAlpha, this.backgroundAlpha - step);
      }
    }
  }

  private render(): void {
    const { width, height } = this.canvas;

    this.ctx.clearRect(0, 0, width, height);

    const bgT = this.bgTransitionProgress;
    const bg = lerpColor(this.currentBgColor, this.targetBgColor, bgT);
    this.ctx.fillStyle = rgbToString(bg);
    this.ctx.fillRect(0, 0, width, height);

    if (this.gridPattern) {
      this.ctx.save();
      this.ctx.globalAlpha = this.backgroundAlpha;
      this.ctx.fillStyle = this.gridPattern;
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.restore();
    }

    this.glowCtx.clearRect(0, 0, width, height);

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const brightness = this.brightnessFactors[i] ?? 1;
      if (seg.opacity <= 0.001) continue;

      const colorT = seg.colorProgress;
      const color = lerpColor(seg.colorRGB, seg.targetColorRGB, colorT);

      this.glowCtx.save();
      this.glowCtx.translate(seg.centerX, seg.centerY);
      this.glowCtx.scale(seg.scale, seg.scale);
      this.glowCtx.translate(-seg.centerX, -seg.centerY);
      this.glowCtx.globalAlpha = seg.opacity * brightness;
      this.drawSegmentPath(this.glowCtx, seg);
      this.glowCtx.lineCap = 'round';
      this.glowCtx.lineJoin = 'round';

      this.glowCtx.shadowColor = rgbaToString(color, 0.9);
      this.glowCtx.shadowBlur = GLOW_OUTER_BLUR;
      this.glowCtx.lineWidth = LINE_WIDTH;
      this.glowCtx.strokeStyle = rgbaToString(color, 0.7);
      this.glowCtx.stroke();

      this.glowCtx.shadowBlur = GLOW_INNER_BLUR;
      this.glowCtx.lineWidth = LINE_WIDTH * 0.8;
      this.glowCtx.strokeStyle = rgbaToString(color, 0.9);
      this.glowCtx.stroke();

      this.glowCtx.restore();
    }

    this.ctx.drawImage(this.glowCanvas, 0, 0);

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const brightness = this.brightnessFactors[i] ?? 1;
      if (seg.opacity <= 0.001) continue;

      const colorT = seg.colorProgress;
      const color = lerpColor(seg.colorRGB, seg.targetColorRGB, colorT);

      this.ctx.save();
      this.ctx.translate(seg.centerX, seg.centerY);
      this.ctx.scale(seg.scale, seg.scale);
      this.ctx.translate(-seg.centerX, -seg.centerY);
      this.ctx.globalAlpha = seg.opacity * brightness;
      this.drawSegmentPath(this.ctx, seg);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.shadowColor = rgbToString(color);
      this.ctx.shadowBlur = 4;
      this.ctx.lineWidth = LINE_WIDTH * 0.5;
      this.ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      this.ctx.stroke();

      this.ctx.shadowBlur = 0;
      this.ctx.lineWidth = LINE_WIDTH * 0.3;
      this.ctx.strokeStyle = rgbaToString(color, 1);
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  private drawSegmentPath(ctx: CanvasRenderingContext2D, seg: NeonSegment): void {
    const pts = seg.points;
    const ctrls = seg.bezierControlPoints;

    ctx.beginPath();
    if (pts.length === 0) return;
    ctx.moveTo(pts[0].x, pts[0].y);

    if (pts.length === 1) {
      ctx.lineTo(pts[0].x + 0.01, pts[0].y);
      return;
    }

    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
      return;
    }

    for (let i = 0; i < ctrls.length; i++) {
      const { cp1x, cp1y, cp2x, cp2y } = ctrls[i];
      const p2 = pts[i + 1];
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  drawStatic(brightnessFactors?: number[]): void {
    if (brightnessFactors) {
      this.brightnessFactors = brightnessFactors;
    } else {
      this.brightnessFactors = new Array(this.segments.length).fill(1);
    }
  }

  drawAnimated(brightnessFactors: number[]): void {
    this.brightnessFactors = brightnessFactors;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.glowCanvas.width = width;
    this.glowCanvas.height = height;
    this.buildGridPattern();
  }

  dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.onFrameUpdateHandler) {
      eventBus.off(EVENTS.FRAME_UPDATE, this.onFrameUpdateHandler);
      this.onFrameUpdateHandler = null;
    }
  }
}
