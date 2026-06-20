import type { BakingParams } from '@/types/recipe';

function perlin2(x: number, y: number, seed: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const A = hash(X, seed) + Y;
  const AA = hash(A, seed);
  const AB = hash(A + 1, seed);
  const B = hash(X + 1, seed) + Y;
  const BA = hash(B, seed);
  const BB = hash(B + 1, seed);
  return (lerp(v, lerp(u, grad(hash(AA, seed), x, y), grad(hash(BA, seed), x - 1, y)), lerp(u, grad(hash(AB, seed), x, y - 1), grad(hash(BB, seed), x - 1, y - 1))) + 1) / 2;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

function hash(n: number, seed: number): number {
  const h = Math.sin(n + seed) * 43758.5453123;
  return Math.floor((h - Math.floor(h)) * 256);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export class TextureRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private seed: number;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 520;
    this.canvas.height = 520;
    this.canvas.style.background = '#1E1E2E';
    this.canvas.style.borderRadius = '16px';
    this.ctx = this.canvas.getContext('2d')!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 256;
    this.offscreenCanvas.height = 256;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    this.seed = Math.random() * 10000;
    container.appendChild(this.canvas);
  }

  private generateNoiseMap(width: number, height: number, scale: number): ImageData {
    const imageData = this.offscreenCtx.createImageData(width, height);
    const data = imageData.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = perlin2(x / scale, y / scale, this.seed);
        data[idx] = Math.floor(value * 255);
        data[idx + 1] = Math.floor(value * 255);
        data[idx + 2] = Math.floor(value * 255);
        data[idx + 3] = 255;
      }
    }
    return imageData;
  }

  private drawHeatmap(params: BakingParams, x: number, y: number, size: number): void {
    const noiseData = this.generateNoiseMap(256, 256, 32);
    const imageData = this.ctx.createImageData(size, size);
    const data = imageData.data;
    const noise = noiseData.data;
    const humidity = Math.max(30, Math.min(80, params.humidity));
    const t = (humidity - 30) / 50;
    const r1 = 30, g1 = 64, b1 = 175;
    const r2 = 220, g2 = 38, b2 = 38;
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const idx = (py * size + px) * 4;
        const noiseVal = noise[idx] / 255;
        const localT = Math.max(0, Math.min(1, t * 0.6 + noiseVal * 0.4));
        data[idx] = Math.floor(r1 + (r2 - r1) * localT);
        data[idx + 1] = Math.floor(g1 + (g2 - g1) * localT);
        data[idx + 2] = Math.floor(b1 + (b2 - b1) * localT);
        data[idx + 3] = 255;
      }
    }
    this.ctx.putImageData(imageData, x, y);
  }

  private drawCrossSection(params: BakingParams, x: number, y: number, size: number): void {
    const gradient = this.ctx.createLinearGradient(x, y, x, y + size);
    gradient.addColorStop(0, '#FFFACD');
    gradient.addColorStop(1, '#8B4513');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, size, size);
    const humidity = Math.max(30, Math.min(80, params.humidity));
    const sugarButterRatio = Math.max(0.3, Math.min(2.5, params.sugarButterRatio));
    const poreCount = Math.floor(20 + (humidity - 30) / 50 * 60);
    const minSize = 2 + (sugarButterRatio - 0.3) / 2.2 * 4;
    const maxSize = 12 - (2.5 - sugarButterRatio) / 2.2 * 4;
    this.ctx.fillStyle = '#2D1810';
    for (let i = 0; i < poreCount; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      const radius = minSize + Math.random() * (maxSize - minSize);
      this.ctx.beginPath();
      this.ctx.arc(px, py, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  public render(params: BakingParams): void {
    this.ctx.clearRect(0, 0, 520, 520);
    this.drawHeatmap(params, 20, 20, 256);
    this.drawCrossSection(params, 244, 20, 256);
    this.ctx.fillStyle = '#E2E8F0';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('热力图', 148, 300);
    this.ctx.fillText('剖面图', 372, 300);
  }

  public destroy(): void {
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
