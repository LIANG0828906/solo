// ============================================================
// simulate.ts - 套色模拟模块
// 职责：接收design模块的版图层数据，在布料纹理上叠加绘制
// 数据流向：接收版图层+颜色+顺序+透明度 → 正片叠底渲染 → 输出画面
// 依赖：utils.ts, design.ts
// ============================================================

import {
  createClothTextureCanvas,
  calculateBlockPosition,
  easeInOutCubic,
  multiplyBlend,
  hexToRgb
} from './utils.js';
import type { BlockLayer } from './design.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from './design.js';

export const CLOTH_WIDTH = 1200;
export const CLOTH_HEIGHT = 800;

export interface SimulateRenderOptions {
  printOrder: number[];
  layerColors: Record<number, string>;
  layerOpacities: Record<number, number>;
  getColoredLayerCanvas: (layerId: number, color: string, opacity: number) => HTMLCanvasElement | null;
  getLayer: (layerId: number) => BlockLayer | undefined;
}

export interface ScrollAnimationOptions extends SimulateRenderOptions {
  perLayerDuration: number;
  interLayerGap: number;
  onProgress: (stage: string, layerIndex: number) => void;
  onComplete: () => void;
}

export class SimulateModule {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private clothTextureCanvas: HTMLCanvasElement;
  private animating: boolean = false;
  private rafId: number | null = null;
  private blockPos: { x: number; y: number; scale: number };
  private cachedColoredLayers: Map<string, HTMLCanvasElement> = new Map();

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);
    this.canvas = canvas;
    this.canvas.width = CLOTH_WIDTH;
    this.canvas.height = CLOTH_HEIGHT;
    this.ctx = canvas.getContext('2d')!;
    this.clothTextureCanvas = createClothTextureCanvas(CLOTH_WIDTH, CLOTH_HEIGHT);
    this.blockPos = calculateBlockPosition(CLOTH_WIDTH, CLOTH_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT);
    this.renderBlankCloth();
  }

  public renderBlankCloth(): void {
    this.ctx.drawImage(this.clothTextureCanvas, 0, 0);
  }

  public invalidateColoredLayerCache(layerId?: number): void {
    if (layerId === undefined) {
      this.cachedColoredLayers.clear();
    } else {
      const keys = Array.from(this.cachedColoredLayers.keys());
      for (const k of keys) {
        if (k.startsWith(`${layerId}:`)) this.cachedColoredLayers.delete(k);
      }
    }
  }

  private getCachedColoredLayer(
    layerId: number,
    color: string,
    opacity: number,
    factory: () => HTMLCanvasElement | null
  ): HTMLCanvasElement | null {
    const key = `${layerId}:${color}:${opacity.toFixed(3)}`;
    if (this.cachedColoredLayers.has(key)) {
      return this.cachedColoredLayers.get(key)!;
    }
    const result = factory();
    if (result) this.cachedColoredLayers.set(key, result);
    return result;
  }

  private drawBlockOnCloth(
    layerId: number,
    color: string,
    opacity: number,
    options: SimulateRenderOptions,
    clipRightX?: number
  ): void {
    if (opacity <= 0.001) return;
    const colorCanvas = this.getCachedColoredLayer(
      layerId,
      color,
      opacity,
      () => options.getColoredLayerCanvas(layerId, color, opacity)
    );
    if (!colorCanvas) return;

    const { x, y, scale } = this.blockPos;
    const drawW = BLOCK_WIDTH * scale;
    const drawH = BLOCK_HEIGHT * scale;

    this.ctx.save();
    if (clipRightX !== undefined && clipRightX < CLOTH_WIDTH) {
      this.ctx.beginPath();
      this.ctx.rect(0, 0, Math.max(0, clipRightX), CLOTH_HEIGHT);
      this.ctx.clip();
    }

    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.drawImage(colorCanvas, x, y, drawW, drawH);
    this.ctx.restore();

    this.ctx.save();
    if (clipRightX !== undefined && clipRightX < CLOTH_WIDTH) {
      this.ctx.beginPath();
      this.ctx.rect(0, 0, Math.max(0, clipRightX), CLOTH_HEIGHT);
      this.ctx.clip();
    }
    this.applyPenetrationEffect(x, y, drawW, drawH, color, opacity);
    this.ctx.restore();
  }

  private applyPenetrationEffect(
    x: number, y: number, w: number, h: number,
    colorHex: string, opacity: number
  ): void {
    const rgb = hexToRgb(colorHex);
    const sampleSize = 10;
    const sampleX = Math.floor(x + w / 2 - sampleSize / 2);
    const sampleY = Math.floor(y + h / 2 - sampleSize / 2);
    const sampleW = Math.min(sampleSize, CLOTH_WIDTH - sampleX);
    const sampleH = Math.min(sampleSize, CLOTH_HEIGHT - sampleY);
    if (sampleW <= 0 || sampleH <= 0) return;
    try {
      const data = this.ctx.getImageData(sampleX, sampleY, sampleW, sampleH).data;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) count++;
      }
      if (count / (data.length / 4) < 0.1) return;
    } catch { return; }

    this.ctx.globalCompositeOperation = 'source-over';
    const gradient = this.ctx.createRadialGradient(
      x + w / 2, y + h / 2, Math.min(w, h) * 0.25,
      x + w / 2, y + h / 2, Math.min(w, h) * 0.55
    );
    const a = opacity * 0.06;
    gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`);
    gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - w * 0.1, y - h * 0.1, w * 1.2, h * 1.2);
  }

  public renderStaticPreview(options: SimulateRenderOptions): void {
    if (this.animating) return;
    this.renderBlankCloth();
    for (const layerId of options.printOrder) {
      const layer = options.getLayer(layerId);
      if (!layer || !layer.hasContent) continue;
      const color = options.layerColors[layerId] ?? '#808080';
      const opacity = options.layerOpacities[layerId] ?? 0.8;
      this.drawBlockOnCloth(layerId, color, opacity, options);
    }
  }

  public isAnimating(): boolean {
    return this.animating;
  }

  public startScrollAnimation(options: ScrollAnimationOptions): void {
    if (this.animating) return;
    this.animating = true;
    this.renderBlankCloth();

    const { printOrder, perLayerDuration, interLayerGap, onProgress, onComplete } = options;
    const totalStages = printOrder.length;
    const totalDuration = totalStages * perLayerDuration + Math.max(0, totalStages - 1) * interLayerGap;
    const startTime = performance.now();

    const frame = (now: number) => {
      if (!this.animating) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / totalDuration);
      this.renderBlankCloth();

      const layerDurRatio = perLayerDuration / totalDuration;
      const gapDurRatio = interLayerGap / totalDuration;

      for (let stage = 0; stage < totalStages; stage++) {
        const layerId = printOrder[stage];
        const layer = options.getLayer(layerId);
        const stageStart = stage * (layerDurRatio + gapDurRatio);
        const stageEnd = stageStart + layerDurRatio;

        if (t < stageStart) break;

        const localT = Math.min(1, Math.max(0, (t - stageStart) / layerDurRatio));
        const easedT = easeInOutCubic(localT);
        const clipRight = (1 - easedT) * CLOTH_WIDTH;
        const clipX = CLOTH_WIDTH - clipRight;

        if (!layer || !layer.hasContent) {
          onProgress(`第${stage + 1}版 - 空白跳过`, stage);
          continue;
        }
        const color = options.layerColors[layerId] ?? '#808080';
        const opacity = options.layerOpacities[layerId] ?? 0.8;

        for (let i = 0; i < stage; i++) {
          const prevId = printOrder[i];
          const prevLayer = options.getLayer(prevId);
          if (!prevLayer || !prevLayer.hasContent) continue;
          const pc = options.layerColors[prevId] ?? '#808080';
          const po = options.layerOpacities[prevId] ?? 0.8;
          this.drawBlockOnCloth(prevId, pc, po, options);
        }

        this.drawBlockOnCloth(layerId, color, opacity, options, clipX);
        this.drawScrollEdge(clipX);
        onProgress(`正在印制第${stage + 1}版...`, stage);
      }

      if (t >= 1) {
        this.renderBlankCloth();
        for (const layerId of printOrder) {
          const layer = options.getLayer(layerId);
          if (!layer || !layer.hasContent) continue;
          const color = options.layerColors[layerId] ?? '#808080';
          const opacity = options.layerOpacities[layerId] ?? 0.8;
          this.drawBlockOnCloth(layerId, color, opacity, options);
        }
        this.animating = false;
        this.rafId = null;
        onProgress('套印完成！', totalStages - 1);
        onComplete();
        return;
      }

      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  private drawScrollEdge(clipX: number): void {
    if (clipX <= 0 || clipX >= CLOTH_WIDTH) return;
    this.ctx.save();
    const gradient = this.ctx.createLinearGradient(clipX - 20, 0, clipX + 20, 0);
    gradient.addColorStop(0, 'rgba(139, 90, 43, 0)');
    gradient.addColorStop(0.4, 'rgba(139, 90, 43, 0.45)');
    gradient.addColorStop(0.5, 'rgba(107, 66, 38, 0.85)');
    gradient.addColorStop(0.6, 'rgba(139, 90, 43, 0.45)');
    gradient.addColorStop(1, 'rgba(139, 90, 43, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(clipX - 20, 0, 40, CLOTH_HEIGHT);
    this.ctx.restore();
  }

  public cancelAnimation(): void {
    this.animating = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public getClothTexture(): HTMLCanvasElement {
    return this.clothTextureCanvas;
  }
}
