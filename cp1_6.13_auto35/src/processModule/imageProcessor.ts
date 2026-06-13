export interface Point2D {
  x: number;
  y: number;
}

export interface ImageFeatures {
  colors: string[];
  contours: Point2D[];
}

interface ColorRange {
  rmin: number; rmax: number;
  gmin: number; gmax: number;
  bmin: number; bmax: number;
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private static readonly LOAD_TIMEOUT = 10000;
  private static readonly SUPPORTED_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/bmp'
  ];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  public async processImage(file: File): Promise<ImageFeatures> {
    try {
      const imageData = await this.loadImage(file);
      const colors = this.extractColors(imageData);
      const contours = this.extractContourPoints(imageData);
      return { colors, contours };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('图片处理失败：发生未知错误');
    }
  }

  private loadImage(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      try {
        if (!ImageProcessor.SUPPORTED_TYPES.includes(file.type)) {
          reject(new Error(`不支持的图片格式：${file.type || '未知格式'}，请使用 PNG、JPEG、WebP、GIF 或 BMP 格式的图片`));
          return;
        }

        const img = new Image();
        let timeoutId: number | null = null;
        let objectUrl: string | null = null;
        let settled = false;

        const cleanup = (): void => {
          if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
            timeoutId = null;
          }
          if (objectUrl !== null) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
        };

        timeoutId = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error('图片加载超时：请检查网络连接或尝试使用更小的图片'));
        }, ImageProcessor.LOAD_TIMEOUT);

        img.onload = (): void => {
          if (settled) return;
          settled = true;
          try {
            const maxSize = 200;
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            const w = Math.floor(img.width * scale);
            const h = Math.floor(img.height * scale);

            this.canvas.width = w;
            this.canvas.height = h;
            this.ctx.drawImage(img, 0, 0, w, h);

            const data = this.ctx.getImageData(0, 0, w, h);
            cleanup();
            resolve(data);
          } catch (err) {
            cleanup();
            if (err instanceof DOMException && err.name === 'SecurityError') {
              reject(new Error('图片跨域错误：无法读取跨域图片的像素数据，请确保图片来源合法'));
            } else {
              reject(new Error('图片加载失败：读取图片像素数据时出错'));
            }
          }
        };

        img.onerror = (): void => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error('图片加载失败：图片文件可能已损坏或格式不正确'));
        };

        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (error) {
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error('图片加载失败：发生未知错误'));
        }
      }
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
    return this.medianCutRecursive(pixels, numColors);
  }

  private medianCutRecursive(pixels: number[][], numColors: number): number[][] {
    if (numColors <= 1 || pixels.length < 2) {
      return [this.getAverageColor(pixels)];
    }

    const range = this.getColorRange(pixels);
    const axis = this.getLongestAxis(range);

    const sorted = pixels.slice().sort((a, b) => a[axis] - b[axis]);
    const median = Math.floor(sorted.length / 2);

    const leftCount = Math.ceil(numColors / 2);
    const rightCount = numColors - leftCount;

    const leftColors = this.medianCutRecursive(sorted.slice(0, median), leftCount);
    const rightColors = this.medianCutRecursive(sorted.slice(median), rightCount);

    return [...leftColors, ...rightColors];
  }

  private getColorRange(pixels: number[][]): ColorRange {
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

    return { rmin, rmax, gmin, gmax, bmin, bmax };
  }

  private getLongestAxis(range: ColorRange): number {
    const rRange = range.rmax - range.rmin;
    const gRange = range.gmax - range.gmin;
    const bRange = range.bmax - range.bmin;

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
