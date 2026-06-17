import type { Stroke, Point, BlendMode, Viewport } from '../types';

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2000;
const BG_COLOR = '#1A1A2E';
const THUMBNAIL_WIDTH = 100;
const THUMBNAIL_HEIGHT = 80;

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private pendingStroke: Stroke | null = null;
  private savedStrokes: Stroke[] = [];
  private viewport: Viewport = { offsetX: 0, offsetY: 0 };
  private dirty = false;
  private saveDebounceTimer: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.renderLoop();
  }

  private renderLoop = (): void => {
    if (this.dirty) {
      this.render();
      this.dirty = false;
    }
    this.rafId = requestAnimationFrame(this.renderLoop);
  };

  private render(): void {
    const { ctx, canvas, savedStrokes, pendingStroke, viewport } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(viewport.offsetX, viewport.offsetY);

    const allStrokes = pendingStroke ? [...savedStrokes, pendingStroke] : savedStrokes;
    for (const stroke of allStrokes) {
      this.drawStroke(stroke);
    }
    ctx.restore();
  }

  private drawStroke(stroke: Stroke): void {
    if (stroke.points.length < 1) return;
    if (!this.isValidBlendMode(stroke.blendMode)) {
      stroke.blendMode = 'normal';
    }
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = this.mapBlendMode(stroke.blendMode);
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p = stroke.points[i];
      const next = stroke.points[i + 1];
      const midX = (p.x + next.x) / 2;
      const midY = (p.y + next.y) / 2;
      ctx.quadraticCurveTo(p.x, p.y, midX, midY);
    }
    const last = stroke.points[stroke.points.length - 1];
    const secondLast = stroke.points[stroke.points.length - 2];
    ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  private isValidBlendMode(mode: unknown): mode is BlendMode {
    return mode === 'normal' || mode === 'multiply' || mode === 'screen' || mode === 'overlay';
  }

  private mapBlendMode(mode: BlendMode): GlobalCompositeOperation {
    if (!this.isValidBlendMode(mode)) {
      return 'source-over';
    }
    switch (mode) {
      case 'normal': return 'source-over';
      case 'multiply': return 'multiply';
      case 'screen': return 'screen';
      case 'overlay': return 'overlay';
      default: return 'source-over';
    }
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
    this.scheduleRender();
  }

  setSavedStrokes(strokes: Stroke[]): void {
    this.savedStrokes = strokes;
    this.scheduleRender();
  }

  setPendingStroke(stroke: Stroke | null): void {
    this.pendingStroke = stroke;
    this.scheduleRender();
  }

  updatePendingStrokePoint(point: Point): void {
    if (!this.pendingStroke) return;
    this.pendingStroke.points.push(point);
    this.scheduleRender();
  }

  getPendingStroke(): Stroke | null {
    return this.pendingStroke;
  }

  finishPendingStroke(): Stroke | null {
    const stroke = this.pendingStroke;
    this.pendingStroke = null;
    this.scheduleRender();
    return stroke ? { ...stroke, points: [...stroke.points] } : null;
  }

  screenToCanvas(screenX: number, screenY: number, rect: DOMRect): Point {
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: screenX * scaleX - this.viewport.offsetX,
      y: screenY * scaleY - this.viewport.offsetY
    };
  }

  generateThumbnail(): string {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = THUMBNAIL_WIDTH;
    thumbCanvas.height = THUMBNAIL_HEIGHT;
    const tctx = thumbCanvas.getContext('2d');
    if (!tctx) return '';

    tctx.fillStyle = BG_COLOR;
    tctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

    const scaleX = THUMBNAIL_WIDTH / CANVAS_WIDTH;
    const scaleY = THUMBNAIL_HEIGHT / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (THUMBNAIL_WIDTH - CANVAS_WIDTH * scale) / 2;
    const offsetY = (THUMBNAIL_HEIGHT - CANVAS_HEIGHT * scale) / 2;

    tctx.save();
    tctx.translate(offsetX, offsetY);
    tctx.scale(scale, scale);
    for (const stroke of this.savedStrokes) {
      const validBlendMode = this.isValidBlendMode(stroke.blendMode) ? stroke.blendMode : 'normal';
      tctx.globalCompositeOperation = this.mapBlendMode(validBlendMode);
      tctx.strokeStyle = stroke.color;
      tctx.fillStyle = stroke.color;
      tctx.lineWidth = stroke.size;
      tctx.lineCap = 'round';
      tctx.lineJoin = 'round';
      if (stroke.points.length === 1) {
        const p = stroke.points[0];
        tctx.beginPath();
        tctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
        tctx.fill();
        continue;
      }
      if (stroke.points.length < 2) continue;
      tctx.beginPath();
      const first = stroke.points[0];
      tctx.moveTo(first.x, first.y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const p = stroke.points[i];
        const next = stroke.points[i + 1];
        tctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
      }
      const last = stroke.points[stroke.points.length - 1];
      const secondLast = stroke.points[stroke.points.length - 2];
      tctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
      tctx.stroke();
    }
    tctx.restore();

    return thumbCanvas.toDataURL('image/png');
  }

  generateThumbnailAsync(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.generateThumbnail());
      }, 0);
    });
  }

  exportPNG(): string {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;
    const ectx = exportCanvas.getContext('2d');
    if (!ectx) return '';
    ectx.fillStyle = BG_COLOR;
    ectx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (const stroke of this.savedStrokes) {
      const validBlendMode = this.isValidBlendMode(stroke.blendMode) ? stroke.blendMode : 'normal';
      ectx.globalCompositeOperation = this.mapBlendMode(validBlendMode);
      ectx.strokeStyle = stroke.color;
      ectx.fillStyle = stroke.color;
      ectx.lineWidth = stroke.size;
      ectx.lineCap = 'round';
      ectx.lineJoin = 'round';
      if (stroke.points.length === 1) {
        const p = stroke.points[0];
        ectx.beginPath();
        ectx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
        ectx.fill();
        continue;
      }
      if (stroke.points.length < 2) continue;
      ectx.beginPath();
      const first = stroke.points[0];
      ectx.moveTo(first.x, first.y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const p = stroke.points[i];
        const next = stroke.points[i + 1];
        ectx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
      }
      const last = stroke.points[stroke.points.length - 1];
      const secondLast = stroke.points[stroke.points.length - 2];
      ectx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
      ectx.stroke();
    }
    return exportCanvas.toDataURL('image/png');
  }

  private scheduleRender(): void {
    if (this.saveDebounceTimer !== null) return;
    this.saveDebounceTimer = window.setTimeout(() => {
      this.dirty = true;
      this.saveDebounceTimer = null;
    }, 0);
  }

  forceRender(): void {
    this.dirty = true;
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
  }

  static get CANVAS_WIDTH(): number {
    return CANVAS_WIDTH;
  }

  static get CANVAS_HEIGHT(): number {
    return CANVAS_HEIGHT;
  }
}
