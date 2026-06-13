import type { ColorSwatch } from '../../types';

interface RGB {
  r: number;
  g: number;
  b: number;
}

const SAMPLE_POINTS = 2000;
const TOP_COLORS = 5;
const K_CLUSTERS = 8;

export class ColorAnalyzer {
  private static getImageData(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取Canvas上下文'));
          return;
        }
        const maxDim = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          resolve(imageData);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = imageUrl;
    });
  }

  private static samplePixels(imageData: ImageData): RGB[] {
    const { data, width, height } = imageData;
    const totalPixels = width * height;
    const pixels: RGB[] = [];
    const step = Math.max(1, Math.floor(totalPixels / SAMPLE_POINTS));

    for (let i = 0; i < totalPixels; i += step) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a > 128) {
        pixels.push({ r, g, b });
      }
    }
    return pixels;
  }

  private static kMeansClustering(pixels: RGB[], k: number): { centers: RGB[]; counts: number[] } {
    if (pixels.length === 0) {
      return { centers: [], counts: [] };
    }

    const actualK = Math.min(k, pixels.length);
    const centers: RGB[] = [];
    const usedIndices = new Set<number>();
    for (let i = 0; i < actualK; i++) {
      let idx: number;
      let attempts = 0;
      do {
        idx = Math.floor(Math.random() * pixels.length);
        attempts++;
      } while (usedIndices.has(idx) && attempts < 100);
      usedIndices.add(idx);
      centers.push({ ...pixels[idx] });
    }

    const assignments = new Array(pixels.length).fill(0);
    const maxIterations = 12;

    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false;
      for (let i = 0; i < pixels.length; i++) {
        let minDist = Infinity;
        let bestCluster = 0;
        for (let j = 0; j < centers.length; j++) {
          const dist = this.euclideanDistance(pixels[i], centers[j]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = j;
          }
        }
        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      const sums = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
      for (let i = 0; i < pixels.length; i++) {
        const c = assignments[i];
        sums[c].r += pixels[i].r;
        sums[c].g += pixels[i].g;
        sums[c].b += pixels[i].b;
        sums[c].count++;
      }

      for (let j = 0; j < centers.length; j++) {
        if (sums[j].count > 0) {
          centers[j].r = Math.round(sums[j].r / sums[j].count);
          centers[j].g = Math.round(sums[j].g / sums[j].count);
          centers[j].b = Math.round(sums[j].b / sums[j].count);
        }
      }

      if (!changed) break;
    }

    const counts = new Array(centers.length).fill(0);
    for (let i = 0; i < assignments.length; i++) {
      counts[assignments[i]]++;
    }

    return { centers, counts };
  }

  private static euclideanDistance(a: RGB, b: RGB): number {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => {
      const hex = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

  public static cie76DeltaE(hex1: string, hex2: string): number {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    if (!rgb1 || !rgb2) return Infinity;

    const lab1 = this.rgbToLab(rgb1);
    const lab2 = this.rgbToLab(rgb2);

    const dL = lab1.L - lab2.L;
    const dA = lab1.a - lab2.a;
    const dB = lab1.b - lab2.b;

    return Math.sqrt(dL * dL + dA * dA + dB * dB);
  }

  private static hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }

  private static rgbToXyz(rgb: RGB): { X: number; Y: number; Z: number } {
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    r *= 100;
    g *= 100;
    b *= 100;

    return {
      X: r * 0.4124 + g * 0.3576 + b * 0.1805,
      Y: r * 0.2126 + g * 0.7152 + b * 0.0722,
      Z: r * 0.0193 + g * 0.1192 + b * 0.9505,
    };
  }

  private static rgbToLab(rgb: RGB): { L: number; a: number; b: number } {
    const xyz = this.rgbToXyz(rgb);
    const refX = 95.047;
    const refY = 100.000;
    const refZ = 108.883;

    let x = xyz.X / refX;
    let y = xyz.Y / refY;
    let z = xyz.Z / refZ;

    const epsilon = 0.008856;
    const kappa = 903.3;

    x = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
    y = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
    z = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

    return {
      L: 116 * y - 16,
      a: 500 * (x - y),
      b: 200 * (y - z),
    };
  }

  private static areColorsSimilar(c1: RGB, c2: RGB, threshold = 30): boolean {
    return this.euclideanDistance(c1, c2) < threshold;
  }

  public static async analyze(imageUrl: string): Promise<ColorSwatch[]> {
    const startTime = performance.now();
    try {
      const imageData = await this.getImageData(imageUrl);
      const pixels = this.samplePixels(imageData);

      if (pixels.length === 0) {
        return [];
      }

      const { centers, counts } = this.kMeansClustering(pixels, K_CLUSTERS);

      const validClusters: { center: RGB; count: number }[] = [];
      for (let i = 0; i < centers.length; i++) {
        if (counts[i] > 0) {
          validClusters.push({ center: centers[i], count: counts[i] });
        }
      }

      const merged: { center: RGB; count: number }[] = [];
      for (const cluster of validClusters) {
        let mergedInto = false;
        for (const existing of merged) {
          if (this.areColorsSimilar(cluster.center, existing.center, 45)) {
            const totalCount = existing.count + cluster.count;
            existing.center.r = Math.round(
              (existing.center.r * existing.count + cluster.center.r * cluster.count) / totalCount
            );
            existing.center.g = Math.round(
              (existing.center.g * existing.count + cluster.center.g * cluster.count) / totalCount
            );
            existing.center.b = Math.round(
              (existing.center.b * existing.count + cluster.center.b * cluster.count) / totalCount
            );
            existing.count = totalCount;
            mergedInto = true;
            break;
          }
        }
        if (!mergedInto) {
          merged.push({ center: { ...cluster.center }, count: cluster.count });
        }
      }

      merged.sort((a, b) => b.count - a.count);
      const topClusters = merged.slice(0, TOP_COLORS);
      const totalCount = topClusters.reduce((sum, c) => sum + c.count, 0);

      const elapsed = performance.now() - startTime;
      if (elapsed < 50) {
        await new Promise(r => setTimeout(r, 50 - elapsed));
      }

      return topClusters.map(c => ({
        hex: this.rgbToHex(c.center.r, c.center.g, c.center.b),
        rgb: { r: c.center.r, g: c.center.g, b: c.center.b },
        ratio: totalCount > 0 ? Math.round((c.count / totalCount) * 1000) / 10 : 0,
      }));
    } catch (error) {
      console.error('颜色分析失败:', error);
      return [];
    }
  }
}
