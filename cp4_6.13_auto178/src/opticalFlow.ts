export interface MotionVector {
  x: number;
  y: number;
  vx: number;
  vy: number;
  magnitude: number;
}

interface FeaturePoint {
  x: number;
  y: number;
}

const WINDOW_SIZE = 15;
const PYR_LEVELS = 3;
const MAX_CORNERS = 500;
const QUALITY_LEVEL = 0.01;
const MIN_DISTANCE = 10;

export class OpticalFlow {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private prevGray: Float32Array | null = null;
  private prevFeatures: FeaturePoint[] = [];
  private width: number = 0;
  private height: number = 0;
  private processWidth: number = 320;
  private processHeight: number = 240;
  public sensitivity: number = 0.5;

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.canvas.width = this.processWidth;
    this.canvas.height = this.processHeight;
    this.width = this.processWidth;
    this.height = this.processHeight;
  }

  private rgbaToGray(imageData: ImageData): Float32Array {
    const gray = new Float32Array(this.width * this.height);
    const data = imageData.data;
    for (let i = 0; i < this.width * this.height; i++) {
      const j = i * 4;
      gray[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
    }
    return gray;
  }

  private sobelX(gray: Float32Array, x: number, y: number): number {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const px = Math.min(Math.max(x + i, 0), this.width - 1);
        const py = Math.min(Math.max(y + j, 0), this.height - 1);
        const kernel = i === -1 ? -1 : i === 0 ? 0 : 1;
        const weight = j === 0 ? 2 : 1;
        sum += gray[py * this.width + px] * kernel * weight;
      }
    }
    return sum;
  }

  private sobelY(gray: Float32Array, x: number, y: number): number {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const px = Math.min(Math.max(x + i, 0), this.width - 1);
        const py = Math.min(Math.max(y + j, 0), this.height - 1);
        const kernel = j === -1 ? -1 : j === 0 ? 0 : 1;
        const weight = i === 0 ? 2 : 1;
        sum += gray[py * this.width + px] * kernel * weight;
      }
    }
    return sum;
  }

  private harrisCornerResponse(gray: Float32Array, x: number, y: number): number {
    const windowSize = 3;
    let sumXX = 0, sumYY = 0, sumXY = 0;
    for (let j = -windowSize; j <= windowSize; j++) {
      for (let i = -windowSize; i <= windowSize; i++) {
        const px = Math.min(Math.max(x + i, 0), this.width - 1);
        const py = Math.min(Math.max(y + j, 0), this.height - 1);
        const ix = this.sobelX(gray, px, py);
        const iy = this.sobelY(gray, px, py);
        sumXX += ix * ix;
        sumYY += iy * iy;
        sumXY += ix * iy;
      }
    }
    const det = sumXX * sumYY - sumXY * sumXY;
    const trace = sumXX + sumYY;
    return det - 0.04 * trace * trace;
  }

  private detectGoodFeatures(gray: Float32Array): FeaturePoint[] {
    const responses: { x: number; y: number; r: number }[] = [];
    const step = 2;

    for (let y = MIN_DISTANCE; y < this.height - MIN_DISTANCE; y += step) {
      for (let x = MIN_DISTANCE; x < this.width - MIN_DISTANCE; x += step) {
        const r = this.harrisCornerResponse(gray, x, y);
        if (r > 0) {
          responses.push({ x, y, r });
        }
      }
    }

    responses.sort((a, b) => b.r - a.r);
    const threshold = responses.length > 0 ? responses[0].r * QUALITY_LEVEL : 0;
    const features: FeaturePoint[] = [];
    const grid = new Set<string>();

    for (const pt of responses) {
      if (pt.r < threshold) continue;
      if (features.length >= MAX_CORNERS) break;

      const gx = Math.floor(pt.x / MIN_DISTANCE);
      const gy = Math.floor(pt.y / MIN_DISTANCE);
      let overlap = false;
      for (let dy = -1; dy <= 1 && !overlap; dy++) {
        for (let dx = -1; dx <= 1 && !overlap; dx++) {
          if (grid.has(`${gx + dx},${gy + dy}`)) overlap = true;
        }
      }
      if (!overlap) {
        grid.add(`${gx},${gy}`);
        features.push({ x: pt.x, y: pt.y });
      }
    }

    return features;
  }

  private bilinearSample(gray: Float32Array, x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, this.width - 1);
    const y1 = Math.min(y0 + 1, this.height - 1);
    const fx = x - x0;
    const fy = y - y0;

    const i00 = gray[Math.max(0, y0) * this.width + Math.max(0, x0)];
    const i10 = gray[Math.max(0, y0) * this.width + x1];
    const i01 = gray[y1 * this.width + Math.max(0, x0)];
    const i11 = gray[y1 * this.width + x1];

    return i00 * (1 - fx) * (1 - fy) + i10 * fx * (1 - fy) + i01 * (1 - fx) * fy + i11 * fx * fy;
  }

  private lucasKanade(
    prevGray: Float32Array,
    currGray: Float32Array,
    point: FeaturePoint
  ): { vx: number; vy: number } {
    const halfWin = Math.floor(WINDOW_SIZE / 2);
    let vx = 0;
    let vy = 0;

    for (let iter = 0; iter < 5; iter++) {
      let sumXX = 0, sumYY = 0, sumXY = 0;
      let sumXT = 0, sumYT = 0;

      for (let j = -halfWin; j <= halfWin; j++) {
        for (let i = -halfWin; i <= halfWin; i++) {
          const px = point.x + i;
          const py = point.y + j;

          if (px < 1 || px >= this.width - 1 || py < 1 || py >= this.height - 1) continue;

          const qx = px + vx;
          const qy = py + vy;

          const iPrev = this.bilinearSample(prevGray, px, py);
          const iCurr = this.bilinearSample(currGray, qx, qy);

          const ix = (this.bilinearSample(prevGray, px + 1, py) - this.bilinearSample(prevGray, px - 1, py)) / 2;
          const iy = (this.bilinearSample(prevGray, px, py + 1) - this.bilinearSample(prevGray, px, py - 1)) / 2;
          const it = iCurr - iPrev;

          sumXX += ix * ix;
          sumYY += iy * iy;
          sumXY += ix * iy;
          sumXT += ix * it;
          sumYT += iy * it;
        }
      }

      const det = sumXX * sumYY - sumXY * sumXY;
      if (Math.abs(det) < 1e-6) break;

      const u = (sumYY * sumXT - sumXY * sumYT) / det;
      const v = (sumXX * sumYT - sumXY * sumXT) / det;

      vx -= u;
      vy -= v;

      if (u * u + v * v < 1e-4) break;
    }

    return { vx, vy };
  }

  public calculate(): MotionVector[] {
    if (this.video.readyState < 2) return [];

    this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const currGray = this.rgbaToGray(imageData);

    const vectors: MotionVector[] = [];

    if (this.prevGray === null) {
      this.prevGray = currGray;
      this.prevFeatures = this.detectGoodFeatures(currGray);
      return vectors;
    }

    const threshold = (1.1 - this.sensitivity) * 1.5;

    if (this.prevFeatures.length === 0) {
      this.prevFeatures = this.detectGoodFeatures(this.prevGray);
    }

    for (const pt of this.prevFeatures) {
      const { vx, vy } = this.lucasKanade(this.prevGray, currGray, pt);
      const magnitude = Math.sqrt(vx * vx + vy * vy);

      if (magnitude >= threshold) {
        vectors.push({
          x: (pt.x / this.width) * 2 - 1,
          y: -((pt.y / this.height) * 2 - 1),
          vx,
          vy,
          magnitude
        });
      }
    }

    this.prevGray = currGray;
    if (vectors.length === 0 || Math.random() < 0.02) {
      this.prevFeatures = this.detectGoodFeatures(currGray);
    } else {
      for (let i = 0; i < this.prevFeatures.length && i < vectors.length; i++) {
        this.prevFeatures[i].x = Math.min(Math.max(this.prevFeatures[i].x + vectors[i].vx, 0), this.width - 1);
        this.prevFeatures[i].y = Math.min(Math.max(this.prevFeatures[i].y + vectors[i].vy, 0), this.height - 1);
      }
    }

    return vectors;
  }

  public reset(): void {
    this.prevGray = null;
    this.prevFeatures = [];
  }
}
