// ============================================================
// design.ts - 雕版设计与编辑模块
// 职责：管理各色版图层的绘制编辑，生成版图层对象
// 数据流向：接收鼠标/触摸绘制 → 更新版图层ImageData → 输出给simulate模块
// 依赖：utils.ts
// ============================================================

import {
  createEmptyBlockImageData,
  generateBlockThumbnail,
  isBlockEmpty,
  hexToRgb
} from './utils.js';

export interface BlockLayer {
  id: number;
  width: number;
  height: number;
  imageData: ImageData;
  hasContent: boolean;
}

export const BLOCK_WIDTH = 400;
export const BLOCK_HEIGHT = 600;

export interface DesignModuleOptions {
  canvasId: string;
  onLayerUpdate?: (layer: BlockLayer) => void;
}

export class DesignModule {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private brushSize: 2 | 5 | 8 = 5;
  private currentLayerId: number | null = null;
  private layers: Map<number, BlockLayer> = new Map();
  private pendingPath: { x: number; y: number }[] = [];
  private pendingDrawTimer: number | null = null;
  private onLayerUpdate?: (layer: BlockLayer) => void;
  private touchId: number | null = null;

  constructor(options: DesignModuleOptions) {
    const canvas = document.getElementById(options.canvasId) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`Canvas #${options.canvasId} not found`);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.onLayerUpdate = options.onLayerUpdate;
    this.canvas.width = BLOCK_WIDTH;
    this.canvas.height = BLOCK_HEIGHT;
    this.initializeLayers();
    this.bindEvents();
  }

  private initializeLayers(): void {
    for (let id = 0; id < 4; id++) {
      const imageData = createEmptyBlockImageData(BLOCK_WIDTH, BLOCK_HEIGHT);
      this.layers.set(id, {
        id,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        imageData,
        hasContent: false
      });
    }
  }

  private bindEvents(): void {
    const c = this.canvas;

    c.addEventListener('mousedown', (e) => this.handlePointerDown(e.offsetX, e.offsetY));
    c.addEventListener('mousemove', (e) => this.handlePointerMove(e.offsetX, e.offsetY));
    window.addEventListener('mouseup', () => this.handlePointerUp());
    c.addEventListener('mouseleave', () => { if (this.drawing) this.handlePointerUp(); });

    c.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.touchId = t.identifier;
      const rect = c.getBoundingClientRect();
      this.handlePointerDown(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    c.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = Array.from(e.changedTouches).find(x => x.identifier === this.touchId);
      if (!t) return;
      const rect = c.getBoundingClientRect();
      this.handlePointerMove(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    c.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = Array.from(e.changedTouches).find(x => x.identifier === this.touchId);
      if (t) { this.handlePointerUp(); this.touchId = null; }
    }, { passive: false });

    c.addEventListener('touchcancel', () => { this.handlePointerUp(); this.touchId = null; });
  }

  private handlePointerDown(x: number, y: number): void {
    if (this.currentLayerId === null) return;
    this.drawing = true;
    this.lastX = x;
    this.lastY = y;
    this.pendingPath = [{ x, y }];
    this.flushPendingDraw();
  }

  private handlePointerMove(x: number, y: number): void {
    if (!this.drawing) return;
    this.pendingPath.push({ x, y });
    if (this.pendingDrawTimer === null) {
      this.pendingDrawTimer = window.setTimeout(() => this.flushPendingDraw(), 16);
    }
  }

  private handlePointerUp(): void {
    if (!this.drawing) return;
    this.drawing = false;
    this.flushPendingDraw(true);
    this.updateCurrentLayerFromCanvas();
  }

  private flushPendingDraw(force: boolean = false): void {
    if (this.pendingDrawTimer !== null) {
      clearTimeout(this.pendingDrawTimer);
      this.pendingDrawTimer = null;
    }
    if (this.pendingPath.length === 0) return;

    const path = this.pendingPath;
    this.pendingPath = [];

    this.ctx.save();
    this.ctx.strokeStyle = '#0A0A0A';
    this.ctx.fillStyle = '#0A0A0A';
    this.ctx.lineWidth = this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y);
    }
    if (path.length === 1) {
      this.ctx.arc(path[0].x, path[0].y, this.brushSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }

    this.ctx.restore();
    this.lastX = path[path.length - 1].x;
    this.lastY = path[path.length - 1].y;

    if (force) this.updateCurrentLayerFromCanvas();
  }

  private updateCurrentLayerFromCanvas(): void {
    if (this.currentLayerId === null) return;
    const imageData = this.ctx.getImageData(0, 0, BLOCK_WIDTH, BLOCK_HEIGHT);
    const layer: BlockLayer = {
      id: this.currentLayerId,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      imageData,
      hasContent: !isBlockEmpty(imageData)
    };
    this.layers.set(this.currentLayerId, layer);
    if (this.onLayerUpdate) this.onLayerUpdate(layer);
  }

  public loadLayerForEditing(layerId: number): void {
    this.currentLayerId = layerId;
    const layer = this.layers.get(layerId);
    if (!layer) return;
    this.ctx.clearRect(0, 0, BLOCK_WIDTH, BLOCK_HEIGHT);
    this.ctx.putImageData(layer.imageData, 0, 0);
  }

  public clearEditing(): void {
    this.currentLayerId = null;
    this.pendingPath = [];
    if (this.pendingDrawTimer !== null) {
      clearTimeout(this.pendingDrawTimer);
      this.pendingDrawTimer = null;
    }
    this.drawing = false;
  }

  public setBrushSize(size: 2 | 5 | 8): void {
    this.brushSize = size;
  }

  public getBrushSize(): 2 | 5 | 8 {
    return this.brushSize;
  }

  public getLayer(layerId: number): BlockLayer | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): BlockLayer[] {
    return Array.from(this.layers.values());
  }

  public getThumbnailCanvas(layerId: number): HTMLCanvasElement | null {
    const layer = this.layers.get(layerId);
    if (!layer) return null;
    return generateBlockThumbnail(layer.imageData, 80, 120);
  }

  public resetAllLayers(): void {
    for (let id = 0; id < 4; id++) {
      const imageData = createEmptyBlockImageData(BLOCK_WIDTH, BLOCK_HEIGHT);
      this.layers.set(id, {
        id,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        imageData,
        hasContent: false
      });
    }
  }

  public createColoredLayerCanvas(
    layerId: number,
    colorHex: string,
    opacity: number
  ): HTMLCanvasElement | null {
    const layer = this.layers.get(layerId);
    if (!layer || !layer.hasContent) return null;

    const rgb = hexToRgb(colorHex);
    const canvas = document.createElement('canvas');
    canvas.width = BLOCK_WIDTH;
    canvas.height = BLOCK_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    const d = layer.imageData.data;
    const outData = ctx.createImageData(BLOCK_WIDTH, BLOCK_HEIGHT);
    const out = outData.data;

    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const factor = Math.max(0, (245 - lum) / 245);
      if (factor > 0.01) {
        const a = Math.round(Math.min(1, factor * 1.15) * opacity * 255);
        out[i]     = rgb.r;
        out[i + 1] = rgb.g;
        out[i + 2] = rgb.b;
        out[i + 3] = a;
      } else {
        out[i + 3] = 0;
      }
    }
    ctx.putImageData(outData, 0, 0);
    return canvas;
  }
}
