import type { ColorSwatch } from '../../types';

interface WorkerMessage {
  type: 'analyze';
  pixelData: Uint8ClampedArray;
  width: number;
  height: number;
  samplePoints: number;
  kClusters: number;
  topColors: number;
}

interface WorkerResponse {
  type: 'result' | 'error';
  payload: any;
}

const SAMPLE_POINTS = 2000;
const TOP_COLORS = 5;
const K_CLUSTERS = 12;

let workerPool: Worker[] = [];
const MAX_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 6);

function getOrCreateWorker(): Worker {
  for (const worker of workerPool) {
    if ((worker as any)._busy === false) {
      (worker as any)._busy = true;
      return worker;
    }
  }

  if (workerPool.length < MAX_WORKERS) {
    const worker = new Worker(
      new URL('./colorAnalyzer.worker.ts', import.meta.url),
      { type: 'module' }
    );
    (worker as any)._busy = true;
    workerPool.push(worker);
    return worker;
  }

  return workerPool[Math.floor(Math.random() * workerPool.length)];
}

function releaseWorker(worker: Worker) {
  (worker as any)._busy = false;
}

export class ColorAnalyzer {
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

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private static rgbToXyz(rgb: { r: number; g: number; b: number }): { X: number; Y: number; Z: number } {
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

  private static rgbToLab(rgb: { r: number; g: number; b: number }): { L: number; a: number; b: number } {
    const xyz = this.rgbToXyz(rgb);
    const refX = 95.047;
    const refY = 100.0;
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

  private static getImageData(imageUrl: string): Promise<{
    imageData: ImageData;
    naturalWidth: number;
    naturalHeight: number;
  }> {
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

        const maxDim = 500;
        let { naturalWidth: width, naturalHeight: height } = img;
        let scaledWidth = width;
        let scaledHeight = height;

        if (width > height) {
          if (width > maxDim) {
            scaledHeight = (height * maxDim) / width;
            scaledWidth = maxDim;
          }
        } else {
          if (height > maxDim) {
            scaledWidth = (width * maxDim) / height;
            scaledHeight = maxDim;
          }
        }

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        try {
          const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
          resolve({
            imageData,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          });
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = imageUrl;
    });
  }

  public static async analyze(imageUrl: string): Promise<{
    colors: ColorSwatch[];
    width: number;
    height: number;
  }> {
    const { imageData, naturalWidth, naturalHeight } = await this.getImageData(imageUrl);
    const { data, width, height } = imageData;

    const pixelData = new Uint8ClampedArray(data);

    return new Promise((resolve, reject) => {
      const worker = getOrCreateWorker();

      const handleMessage = (e: MessageEvent<WorkerResponse>) => {
        releaseWorker(worker);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);

        if (e.data.type === 'result') {
          resolve({
            colors: e.data.payload,
            width: naturalWidth,
            height: naturalHeight,
          });
        } else {
          reject(new Error(e.data.payload));
        }
      };

      const handleError = (err: ErrorEvent) => {
        releaseWorker(worker);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(new Error(err.message));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      const message: WorkerMessage = {
        type: 'analyze',
        pixelData,
        width,
        height,
        samplePoints: SAMPLE_POINTS,
        kClusters: K_CLUSTERS,
        topColors: TOP_COLORS,
      };

      worker.postMessage(message, [pixelData.buffer]);
    });
  }

  public static terminateAllWorkers() {
    for (const worker of workerPool) {
      worker.terminate();
    }
    workerPool = [];
  }
}
