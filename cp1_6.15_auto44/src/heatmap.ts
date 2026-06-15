import * as THREE from 'three';
import { WeatherDataType, WeatherHourData } from './weatherData';

export const HEATMAP_WIDTH = 512;
export const HEATMAP_HEIGHT = 256;

export interface HeatmapRenderResult {
  texture: THREE.CanvasTexture;
  opacity: number;
}

interface ColorLUT {
  r: Uint8ClampedArray;
  g: Uint8ClampedArray;
  b: Uint8ClampedArray;
}

interface DataTypeRange {
  min: number;
  max: number;
}

const DATA_RANGES: Record<WeatherDataType, DataTypeRange> = {
  temperature: { min: -40, max: 50 },
  humidity: { min: 0, max: 100 },
  windSpeed: { min: 0, max: 150 }
};

export class HeatmapManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private colorLUT: ColorLUT;

  private currentType: WeatherDataType = 'temperature';
  private nextType: WeatherDataType = 'temperature';
  private transitionAlpha: number = 1;
  private isTransitioning: boolean = false;
  private pulsePhase: number = 0;

  private lastDataHash: string = '';
  private cachedDataTexture: ImageData | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = HEATMAP_WIDTH;
    this.canvas.height = HEATMAP_HEIGHT;
    this.ctx = this.canvas.getContext('2d')!;
    this.colorLUT = this.buildColorLUT();

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;
  }

  private buildColorLUT(): ColorLUT {
    const size = 256;
    const r = new Uint8ClampedArray(size);
    const g = new Uint8ClampedArray(size);
    const b = new Uint8ClampedArray(size);

    for (let i = 0; i < size; i++) {
      const t = i / (size - 1);

      if (t < 0.25) {
        const s = t / 0.25;
        r[i] = Math.floor(0 + s * 0);
        g[i] = Math.floor(50 + s * 100);
        b[i] = Math.floor(180 + s * 75);
      } else if (t < 0.5) {
        const s = (t - 0.25) / 0.25;
        r[i] = Math.floor(0 + s * 80);
        g[i] = Math.floor(150 + s * 80);
        b[i] = Math.floor(255 - s * 155);
      } else if (t < 0.75) {
        const s = (t - 0.5) / 0.25;
        r[i] = Math.floor(80 + s * 140);
        g[i] = Math.floor(230 - s * 80);
        b[i] = Math.floor(100 - s * 70);
      } else {
        const s = (t - 0.75) / 0.25;
        r[i] = Math.floor(220 + s * 35);
        g[i] = Math.floor(150 - s * 100);
        b[i] = Math.floor(30 - s * 20);
      }
    }
    return { r, g, b };
  }

  private valueToColor(value: number, type: WeatherDataType): string {
    const range = DATA_RANGES[type];
    const normalized = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
    const idx = Math.floor(normalized * 255);
    const r = this.colorLUT.r[idx];
    const g = this.colorLUT.g[idx];
    const b = this.colorLUT.b[idx];
    return `rgb(${r},${g},${b})`;
  }

  private valueToRGBA(value: number, type: WeatherDataType, alpha: number): [number, number, number, number] {
    const range = DATA_RANGES[type];
    const normalized = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
    const idx = Math.floor(normalized * 255);
    return [this.colorLUT.r[idx], this.colorLUT.g[idx], this.colorLUT.b[idx], alpha];
  }

  public setDataType(type: WeatherDataType): void {
    if (type === this.currentType && !this.isTransitioning) return;
    if (type === this.nextType && this.isTransitioning) return;

    this.nextType = type;
    if (type !== this.currentType) {
      this.transitionAlpha = 1;
      this.isTransitioning = true;
    }
  }

  public getDataType(): WeatherDataType {
    return this.transitionAlpha > 0.5 ? this.currentType : this.nextType;
  }

  private renderDataToTexture(data: WeatherHourData, type: WeatherDataType): void {
    const ctx = this.ctx;
    const W = HEATMAP_WIDTH;
    const H = HEATMAP_HEIGHT;

    ctx.clearRect(0, 0, W, H);

    const arr = data[type] as number[][];
    if (!arr || arr.length === 0) return;

    const rows = arr.length;
    const cols = arr[0].length;

    this.pulsePhase += 0.02;
    const pulseBase = 1 + 0.15 * Math.sin(this.pulsePhase);

    const cellW = W / cols;
    const cellH = H / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const value = arr[r][c];
        if (value === undefined || value === null) continue;

        const range = DATA_RANGES[type];
        const norm = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));

        const cx = c * cellW + cellW / 2;
        const cy = r * cellH + cellH / 2;

        const localPhase = this.pulsePhase + r * 0.3 + c * 0.2;
        const pulseScale = pulseBase * (0.85 + 0.3 * Math.sin(localPhase));
        const baseRadius = Math.max(2.5, Math.min(7.5, (cellW + cellH) * 0.22));
        const radius = baseRadius * pulseScale * (0.7 + norm * 0.8);

        const pulseAlpha = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(localPhase * 1.4));
        const valueAlpha = 0.25 + norm * 0.7;
        const alpha = Math.min(0.85, pulseAlpha * 0.55 + valueAlpha * 0.45);

        const [cr, cg, cb] = this.valueToRGBA(value, type, 255);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
        grad.addColorStop(0.45, `rgba(${cr},${cg},${cb},${alpha * 0.55})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const value = arr[r][c];
        if (value === undefined || value === null) continue;

        const range = DATA_RANGES[type];
        const norm = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
        if (norm < 0.72) continue;

        const cx = c * cellW + cellW / 2;
        const cy = r * cellH + cellH / 2;
        const [cr, cg, cb] = this.valueToRGBA(value, type, 255);
        const coreAlpha = 0.15 + (norm - 0.72) * 0.9;
        const coreR = Math.min(radius * 0.45, 3 + (norm - 0.72) * 8);

        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        coreGrad.addColorStop(0, `rgba(${Math.min(255, cr + 40)},${Math.min(255, cg + 40)},${cb},${coreAlpha})`);
        coreGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  public update(dt: number, data: WeatherHourData): HeatmapRenderResult {
    const ctx = this.ctx;
    const W = HEATMAP_WIDTH;
    const H = HEATMAP_HEIGHT;

    const TRANSITION_DURATION = 1.0;

    if (this.isTransitioning && this.transitionAlpha > 0) {
      this.transitionAlpha = Math.max(0, this.transitionAlpha - dt / TRANSITION_DURATION);

      const off1 = document.createElement('canvas');
      off1.width = W;
      off1.height = H;
      const ctx1 = off1.getContext('2d')!;

      const off2 = document.createElement('canvas');
      off2.width = W;
      off2.height = H;
      const ctx2 = off2.getContext('2d')!;

      const origCtx = this.ctx;
      this.ctx = ctx1;
      this.renderDataToTexture(data, this.currentType);
      this.ctx = ctx2;
      this.renderDataToTexture(data, this.nextType);
      this.ctx = origCtx;

      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = this.transitionAlpha;
      ctx.drawImage(off1, 0, 0);
      ctx.globalAlpha = 1 - this.transitionAlpha;
      ctx.drawImage(off2, 0, 0);
      ctx.globalAlpha = 1;

      if (this.transitionAlpha <= 0) {
        this.currentType = this.nextType;
        this.isTransitioning = false;
        this.transitionAlpha = 1;
      }
    } else {
      this.renderDataToTexture(data, this.currentType);
    }

    this.texture.needsUpdate = true;

    const displayAlpha = this.isTransitioning
      ? 0.55 + 0.15 * Math.sin(this.pulsePhase)
      : 0.6 + 0.12 * (0.5 + 0.5 * Math.sin(this.pulsePhase));

    return {
      texture: this.texture,
      opacity: Math.min(0.72, displayAlpha)
    };
  }

  public getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  public dispose(): void {
    this.texture.dispose();
  }
}
