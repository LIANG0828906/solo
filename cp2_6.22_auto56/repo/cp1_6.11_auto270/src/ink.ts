import type { BrushPoint } from './brush';

export type InkDensity = '焦' | '浓' | '重' | '淡' | '清';

const INK_LEVELS: Record<InkDensity, number> = {
  '焦': 1.0,
  '浓': 0.8,
  '重': 0.6,
  '淡': 0.3,
  '清': 0.1
};

export class InkSimulator {
  private width: number;
  private height: number;
  private inkCanvas: HTMLCanvasElement;
  private inkCtx: CanvasRenderingContext2D;
  private density: number = 0.8;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.inkCanvas = document.createElement('canvas');
    this.inkCanvas.width = width;
    this.inkCanvas.height = height;
    const ctx = this.inkCanvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.inkCtx = ctx;
    this.clear();
  }

  public clear(): void {
    this.inkCtx.clearRect(0, 0, this.width, this.height);
  }

  public setDensity(density: number): void {
    this.density = Math.max(0.05, Math.min(1, density));
  }

  public getDensity(): number {
    return this.density;
  }

  public getDensityLevel(): InkDensity {
    const d = this.density;
    if (d >= 0.9) return '焦';
    if (d >= 0.7) return '浓';
    if (d >= 0.45) return '重';
    if (d >= 0.2) return '淡';
    return '清';
  }

  public applyBrushPoints(points: BrushPoint[], textureNoise: (x: number, y: number) => number): void {
    for (const point of points) {
      this.drawInkPoint(point, textureNoise);
    }
  }

  private drawInkPoint(point: BrushPoint, textureNoise: (x: number, y: number) => number): void {
    const ctx = this.inkCtx;
    const { x, y, size, alpha, pressure } = point;

    const baseAlpha = alpha * this.density;
    const spreadAmount = 1 + (1 - pressure) * 2;
    const actualSize = size * spreadAmount;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, actualSize);

    const noise = textureNoise(x, y);
    const centerAlpha = Math.min(1, baseAlpha * (1 + noise * 0.3));

    gradient.addColorStop(0, `rgba(20, 18, 16, ${centerAlpha})`);
    gradient.addColorStop(0.4, `rgba(30, 28, 25, ${baseAlpha * 0.7})`);
    gradient.addColorStop(0.7, `rgba(50, 45, 40, ${baseAlpha * 0.3})`);
    gradient.addColorStop(1, 'rgba(80, 70, 60, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, actualSize, actualSize * 0.95, (point.angle * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();

    if (pressure > 0.5) {
      ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 3; i++) {
        const sx = x + (Math.random() - 0.5) * size * 0.8;
        const sy = y + (Math.random() - 0.5) * size * 0.8;
        const ss = size * (0.2 + Math.random() * 0.3);
        const sa = baseAlpha * (0.3 + Math.random() * 0.4);

        const spotGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, ss);
        spotGradient.addColorStop(0, `rgba(10, 8, 6, ${sa})`);
        spotGradient.addColorStop(1, 'rgba(10, 8, 6, 0)');

        ctx.fillStyle = spotGradient;
        ctx.beginPath();
        ctx.arc(sx, sy, ss, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  public applyDiffusion(textureNoise: (x: number, y: number) => number): void {
    const imageData = this.inkCtx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);

    const kernel = [
      [0.5, 1.0, 0.5],
      [1.0, 0.0, 1.0],
      [0.5, 1.0, 0.5]
    ];
    const kernelWeight = 6;

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const idx = (y * this.width + x) * 4;

        if (data[idx + 3] < 5) continue;

        const noise = textureNoise(x, y);
        const diffusionRate = 0.08 + noise * 0.05;

        let r = 0, g = 0, b = 0, a = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * this.width + (x + kx)) * 4;
            const kw = kernel[ky + 1][kx + 1];
            r += data[kidx] * kw;
            g += data[kidx + 1] * kw;
            b += data[kidx + 2] * kw;
            a += data[kidx + 3] * kw;
          }
        }

        r /= kernelWeight;
        g /= kernelWeight;
        b /= kernelWeight;
        a /= kernelWeight;

        const rate = diffusionRate * (data[idx + 3] / 255);
        tempData[idx] = data[idx] * (1 - rate) + r * rate;
        tempData[idx + 1] = data[idx + 1] * (1 - rate) + g * rate;
        tempData[idx + 2] = data[idx + 2] * (1 - rate) + b * rate;
        tempData[idx + 3] = data[idx + 3] * (1 - rate * 0.5) + a * rate * 0.5;
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = tempData[i];
    }

    this.inkCtx.putImageData(imageData, 0, 0);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.inkCanvas;
  }

  public getImageData(): ImageData {
    return this.inkCtx.getImageData(0, 0, this.width, this.height);
  }

  public putImageData(imageData: ImageData): void {
    this.inkCtx.putImageData(imageData, 0, 0);
  }

  public resize(width: number, height: number): void {
    const oldData = this.inkCtx.getImageData(0, 0, this.width, this.height);
    this.width = width;
    this.height = height;
    this.inkCanvas.width = width;
    this.inkCanvas.height = height;
    this.inkCtx.putImageData(oldData, 0, 0);
  }
}

export function densityToLevel(density: number): InkDensity {
  if (density >= 0.9) return '焦';
  if (density >= 0.7) return '浓';
  if (density >= 0.45) return '重';
  if (density >= 0.2) return '淡';
  return '清';
}

export { INK_LEVELS };
