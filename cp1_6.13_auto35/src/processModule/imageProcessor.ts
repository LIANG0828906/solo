export interface Point2D {
  x: number;
  y: number;
}

export interface ImageFeatures {
  colors: string[];
  contours: Point2D[];
}

interface ColorBucket {
  rmin: number; rmax: number;
  gmin: number; gmax: number;
  bmin: number; bmax: number;
  pixels: number[][];
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  public async processImage(file: File): Promise<ImageFeatures> {
    const imageData = await this.loadImage(file);
    const colors = this.extractColors(imageData);
    const contours = this.extractContourPoints(imageData);
    return { colors, contours };
  }

  private loadImage(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);
        
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.drawImage(img, 0, 0, w, h);
        
        const data = this.ctx.getImageData(0, 0, w, h);
        resolve(data);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  public extractColors(imageData: ImageData): string[] {
    const data = imageData.data;
    const pixels: number[][] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a > 128) {
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length === 0) {
      return ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'];
    }

    const colors = this.medianCut(pixels, 5);
    return colors.map(c => this.rgbToHex(c[0], c[1], c[2]));
  }

  private medianCut(pixels: number[][], numColors: number): number[][] {
    let buckets: ColorBucket[] = [this.createBucket(pixels)];
    
    while (buckets.length < numColors) {
      buckets.sort((a, b) => this.getBucketRange(b) - this.getBucketRange(a));
      
      const bucket = buckets.shift()!;
      if (bucket.pixels.length < 2) {
        buckets.push(bucket);
        continue;
      }

      const axis = this.getLongestAxis(bucket);
      bucket.pixels.sort((a, b) => a[axis] - b[axis]);
      
      const median = Math.floor(bucket.pixels.length / 2);
      const leftPixels = bucket.pixels.slice(0, median);
      const rightPixels = bucket.pixels.slice(median);
      
      if (leftPixels.length > 0) buckets.push(this.createBucket(leftPixels));
      if (rightPixels.length > 0) buckets.push(this.createBucket(rightPixels));
    }

    return buckets.map(bucket => this.getAverageColor(bucket.pixels));
  }

  private createBucket(pixels: number[][]): ColorBucket {
    let rmin = 255, rmax = 0;
    let gmin = 255, gmax = 0;
    let bmin = 255, bmax = 0;

    for (const pixel of pixels) {
      rmin = Math.min(rmin, pixel[0]);
      rmax = Math.max(rmax, pixel[0]);
      gmin = Math.min(gmin, pixel[1]);
      gmax = Math.max(gmax, pixel[1]);
      bmin = Math.min(bmin, pixel[2]);
      bmax = Math.max(bmax, pixel[2]);
    }

    return { rmin, rmax, gmin, gmax, bmin, bmax, pixels };
  }

  private getBucketRange(bucket: ColorBucket): number {
    const rRange = bucket.rmax - bucket.rmin;
    const gRange = bucket.gmax - bucket.gmin;
    const bRange = bucket.bmax - bucket.bmin;
    return Math.max(rRange, gRange, bRange);
  }

  private getLongestAxis(bucket: ColorBucket): number {
    const rRange = bucket.rmax - bucket.rmin;
    const gRange = bucket.gmax - bucket.gmin;
    const bRange = bucket.bmax - bucket.bmin;
    
    if (rRange >= gRange && rRange >= bRange) return 0;
    if (gRange >= rRange && gRange >= bRange) return 1;
    return 2;
  }

  private getAverageColor(pixels: number[][]): number[] {
    let r = 0, g = 0, b = 0;
    for (const pixel of pixels) {
      r += pixel[0];
      g += pixel[1];
      b += pixel[2];
    }
    const n = pixels.length;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  public extractContourPoints(imageData: ImageData): Point2D[] {
    const { width, height, data } = imageData;
    const gray: number[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      gray.push(Math.round(0.299 * r + 0.587 * g + 0.114 * b));
    }

    const edges: boolean[] = new Array(width * height).fill(false);
    const threshold = 30;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        const gx = gray[idx - width - 1] + 2 * gray[idx - 1] + gray[idx + width - 1]
                 - gray[idx - width + 1] - 2 * gray[idx + 1] - gray[idx + width + 1];
        
        const gy = gray[idx - width - 1] + 2 * gray[idx - width] + gray[idx - width + 1]
                 - gray[idx + width - 1] - 2 * gray[idx + width] - gray[idx + width + 1];
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[idx] = magnitude > threshold;
      }
    }

    const edgePoints: Point2D[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x]) {
          edgePoints.push({ x, y });
        }
      }
    }

    const sampleCount = Math.min(50, edgePoints.length);
    const sampled: Point2D[] = [];
    
    if (edgePoints.length > 0) {
      for (let i = 0; i < sampleCount; i++) {
        const idx = Math.floor(Math.random() * edgePoints.length);
        sampled.push({
          x: (edgePoints[idx].x / width) * 2 - 1,
          y: (edgePoints[idx].y / height) * 2 - 1
        });
      }
    } else {
      for (let i = 0; i < sampleCount; i++) {
        const angle = (i / sampleCount) * Math.PI * 2;
        const radius = 0.5 + Math.random() * 0.3;
        sampled.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
    }

    return sampled;
  }
}
