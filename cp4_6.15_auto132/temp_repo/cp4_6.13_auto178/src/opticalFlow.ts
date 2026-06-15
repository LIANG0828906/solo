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
  quality: number;
}

const WINDOW_SIZE = 15;
const MAX_CORNERS = 500;
const QUALITY_LEVEL = 0.01;
const MIN_DISTANCE = 10;
const MIN_FEATURE_RATIO = 0.2;
const REDETECT_INTERVAL = 30;
const GRID_COLS = 4;
const GRID_ROWS = 4;
const MIN_PER_CELL = 2;

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
  private frameCount: number = 0;
  private lastRedetectFrame: number = 0;
  private sobelCache: Float32Array | null = null;
  private sobelCacheKey: string = '';

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.canvas.width = this.processWidth;
    this.canvas.height = this.processHeight;
    this.width = this.processWidth;
    this.height = this.processHeight;
    console.log('[OpticalFlow] 初始化完成, 处理分辨率: 320x240');
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

  private computeSobel(gray: Float32Array): Float32Array {
    const key = (gray as any)._key || '';
    if (this.sobelCache && this.sobelCacheKey === key) return this.sobelCache;

    const out = new Float32Array(this.width * this.height * 2);
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const idx = y * this.width + x;
        const gx =
          -gray[(y - 1) * this.width + (x - 1)] + gray[(y - 1) * this.width + (x + 1)]
          - 2 * gray[y * this.width + (x - 1)] + 2 * gray[y * this.width + (x + 1)]
          - gray[(y + 1) * this.width + (x - 1)] + gray[(y + 1) * this.width + (x + 1)];
        const gy =
          -gray[(y - 1) * this.width + (x - 1)] - 2 * gray[(y - 1) * this.width + x] - gray[(y - 1) * this.width + (x + 1)]
          + gray[(y + 1) * this.width + (x - 1)] + 2 * gray[(y + 1) * this.width + x] + gray[(y + 1) * this.width + (x + 1)];
        out[idx * 2] = gx;
        out[idx * 2 + 1] = gy;
      }
    }
    this.sobelCache = out;
    this.sobelCacheKey = key;
    return out;
  }

  private harrisCornerResponse(sobel: Float32Array, x: number, y: number): number {
    const windowSize = 3;
    let sumXX = 0, sumYY = 0, sumXY = 0;
    for (let j = -windowSize; j <= windowSize; j++) {
      for (let i = -windowSize; i <= windowSize; i++) {
        const px = Math.min(Math.max(x + i, 0), this.width - 1);
        const py = Math.min(Math.max(y + j, 0), this.height - 1);
        const idx = py * this.width + px;
        const ix = sobel[idx * 2];
        const iy = sobel[idx * 2 + 1];
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
    const sobel = this.computeSobel(gray);
    const responses: { x: number; y: number; r: number }[] = [];
    const step = 2;

    for (let y = MIN_DISTANCE; y < this.height - MIN_DISTANCE; y += step) {
      for (let x = MIN_DISTANCE; x < this.width - MIN_DISTANCE; x += step) {
        const r = this.harrisCornerResponse(sobel, x, y);
        if (r > 0) {
          responses.push({ x, y, r });
        }
      }
    }

    responses.sort((a, b) => b.r - a.r);
    const threshold = responses.length > 0 ? responses[0].r * QUALITY_LEVEL : 0;

    const gridCounts: number[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      gridCounts[r] = [];
      for (let c = 0; c < GRID_COLS; c++) gridCounts[r][c] = 0;
    }
    const cellW = this.width / GRID_COLS;
    const cellH = this.height / GRID_ROWS;

    const features: FeaturePoint[] = [];
    const localGrid = new Set<string>();

    for (const pt of responses) {
      if (pt.r < threshold) continue;
      if (features.length >= MAX_CORNERS) break;

      const gc = Math.min(Math.floor(pt.x / cellW), GRID_COLS - 1);
      const gr = Math.min(Math.floor(pt.y / cellH), GRID_ROWS - 1);

      const gx = Math.floor(pt.x / MIN_DISTANCE);
      const gy = Math.floor(pt.y / MIN_DISTANCE);
      let overlap = false;
      for (let dy = -1; dy <= 1 && !overlap; dy++) {
        for (let dx = -1; dx <= 1 && !overlap; dx++) {
          if (localGrid.has(`${gx + dx},${gy + dy}`)) overlap = true;
        }
      }
      if (overlap) continue;

      const emptyCells = this.countEmptyCells(gridCounts);
      const remainingSlots = MAX_CORNERS - features.length;
      const cellQuota = (gridCounts[gr][gc] < MIN_PER_CELL) ? 1 : 0;

      if (emptyCells > 0 && remainingSlots > emptyCells * MIN_PER_CELL + 10) {
        if (gridCounts[gr][gc] >= MIN_PER_CELL && cellQuota === 0) {
          continue;
        }
      }

      localGrid.add(`${gx},${gy}`);
      gridCounts[gr][gc]++;
      features.push({ x: pt.x, y: pt.y, quality: pt.r });
    }

    if (features.length > 0) {
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (gridCounts[r][c] < MIN_PER_CELL) {
            const backup = this.findFallbackInCell(gray, sobel, c, r, cellW, cellH, MIN_PER_CELL - gridCounts[r][c]);
            for (const bp of backup) {
              if (features.length >= MAX_CORNERS) break;
              features.push(bp);
              gridCounts[r][c]++;
            }
          }
        }
      }
    }

    if (this.frameCount % 120 === 0) {
      const dist = gridCounts.map(r => r.join(',')).join(' | ');
      console.log(`[OpticalFlow] 特征点检测: ${features.length}个, 网格分布: ${dist}`);
    }

    return features;
  }

  private countEmptyCells(gridCounts: number[][]): number {
    let count = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (gridCounts[r][c] < MIN_PER_CELL) count++;
      }
    }
    return count;
  }

  private findFallbackInCell(
    gray: Float32Array,
    sobel: Float32Array,
    col: number,
    row: number,
    cellW: number,
    cellH: number,
    needed: number
  ): FeaturePoint[] {
    const result: FeaturePoint[] = [];
    const startX = Math.max(MIN_DISTANCE, Math.floor(col * cellW));
    const endX = Math.min(this.width - MIN_DISTANCE, Math.ceil((col + 1) * cellW));
    const startY = Math.max(MIN_DISTANCE, Math.floor(row * cellH));
    const endY = Math.min(this.height - MIN_DISTANCE, Math.ceil((row + 1) * cellH));

    const candidates: { x: number; y: number; r: number }[] = [];
    const step = 4;

    for (let y = startY; y < endY; y += step) {
      for (let x = startX; x < endX; x += step) {
        const r = this.harrisCornerResponse(sobel, x, y);
        if (r > 0) candidates.push({ x, y, r });
      }
    }

    candidates.sort((a, b) => b.r - a.r);
    for (let i = 0; i < Math.min(needed, candidates.length); i++) {
      result.push({ x: candidates[i].x, y: candidates[i].y, quality: candidates[i].r });
    }

    return result;
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
  ): { vx: number; vy: number; valid: boolean } {
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

          if (qx < 0 || qx >= this.width - 1 || qy < 0 || qy >= this.height - 1) {
            return { vx: 0, vy: 0, valid: false };
          }

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
      if (Math.abs(det) < 1e-6) return { vx: 0, vy: 0, valid: false };

      const u = (sumYY * sumXT - sumXY * sumYT) / det;
      const v = (sumXX * sumYT - sumXY * sumXT) / det;

      vx -= u;
      vy -= v;

      if (vx * vx + vy * vy > 100) return { vx: 0, vy: 0, valid: false };

      if (u * u + v * v < 1e-4) break;
    }

    return { vx, vy, valid: true };
  }

  private evaluateFeatureQuality(point: FeaturePoint, gray: Float32Array): number {
    const px = Math.round(point.x);
    const py = Math.round(point.y);
    if (px < 2 || px >= this.width - 2 || py < 2 || py >= this.height - 2) return 0;

    let gradSum = 0;
    const step = 2;
    for (let j = -step; j <= step; j++) {
      for (let i = -step; i <= step; i++) {
        const gx = gray[(py + j) * this.width + (px + i + 1)] - gray[(py + j) * this.width + (px + i - 1)];
        const gy = gray[(py + j + 1) * this.width + (px + i)] - gray[(py + j - 1) * this.width + (px + i)];
        gradSum += gx * gx + gy * gy;
      }
    }
    return gradSum;
  }

  private needsRedetection(): boolean {
    if (this.prevFeatures.length === 0) return true;
    if (this.prevFeatures.length < MAX_CORNERS * MIN_FEATURE_RATIO) return true;
    if (this.frameCount - this.lastRedetectFrame >= REDETECT_INTERVAL) return true;

    let lowQualityCount = 0;
    if (this.prevGray) {
      for (const f of this.prevFeatures) {
        const q = this.evaluateFeatureQuality(f, this.prevGray);
        if (q < 100) lowQualityCount++;
      }
      if (lowQualityCount / this.prevFeatures.length > 0.5) return true;
    }

    return false;
  }

  public calculate(): MotionVector[] {
    if (this.video.readyState < 2) return [];

    this.frameCount++;

    this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const currGray = this.rgbaToGray(imageData);
    (currGray as any)._key = `f${this.frameCount}`;

    const vectors: MotionVector[] = [];

    if (this.prevGray === null) {
      this.prevGray = currGray;
      this.prevFeatures = this.detectGoodFeatures(currGray);
      this.lastRedetectFrame = this.frameCount;
      return vectors;
    }

    const threshold = (1.1 - this.sensitivity) * 1.5;

    if (this.needsRedetection()) {
      this.prevFeatures = this.detectGoodFeatures(currGray);
      this.lastRedetectFrame = this.frameCount;
      this.prevGray = currGray;
      return vectors;
    }

    const validFeatures: FeaturePoint[] = [];

    for (const pt of this.prevFeatures) {
      const result = this.lucasKanade(this.prevGray, currGray, pt);
      if (!result.valid) continue;

      const magnitude = Math.sqrt(result.vx * result.vx + result.vy * result.vy);
      const newPt: FeaturePoint = {
        x: Math.min(Math.max(pt.x + result.vx, 0), this.width - 1),
        y: Math.min(Math.max(pt.y + result.vy, 0), this.height - 1),
        quality: pt.quality
      };
      validFeatures.push(newPt);

      if (magnitude >= threshold) {
        vectors.push({
          x: (pt.x / this.width) * 2 - 1,
          y: -((pt.y / this.height) * 2 - 1),
          vx: result.vx,
          vy: result.vy,
          magnitude
        });
      }
    }

    this.prevFeatures = validFeatures;
    this.prevGray = currGray;

    if (this.frameCount % 60 === 0) {
      console.log(`[OpticalFlow] 帧#${this.frameCount}, 特征点: ${this.prevFeatures.length}, 运动向量: ${vectors.length}`);
    }

    return vectors;
  }

  public reset(): void {
    this.prevGray = null;
    this.prevFeatures = [];
    this.sobelCache = null;
    this.sobelCacheKey = '';
    this.frameCount = 0;
    this.lastRedetectFrame = 0;
    console.log('[OpticalFlow] 已重置');
  }
}
