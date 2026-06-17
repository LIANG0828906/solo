export interface DiffPixel {
  x: number;
  y: number;
  diffValue: number;
}

export interface DiffResult {
  pixels: DiffPixel[];
  percentage: number;
  totalPixels: number;
}

const DIFF_THRESHOLD = 30;

export function calculatePixelDiff(
  leftData: ImageData,
  rightData: ImageData,
  onProgress?: (progress: number) => void
): DiffResult {
  const width = Math.max(leftData.width, rightData.width);
  const height = Math.max(leftData.height, rightData.height);
  const totalPixels = width * height;
  const diffPixels: DiffPixel[] = [];

  const getPixel = (data: ImageData, x: number, y: number): [number, number, number] => {
    if (x >= data.width || y >= data.height) return [0, 0, 0];
    const idx = (y * data.width + x) * 4;
    return [data.data[idx], data.data[idx + 1], data.data[idx + 2]];
  };

  const totalIterations = height;
  let lastProgressUpdate = Date.now();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r1, g1, b1] = getPixel(leftData, x, y);
      const [r2, g2, b2] = getPixel(rightData, x, y);

      const dr = Math.abs(r1 - r2);
      const dg = Math.abs(g1 - g2);
      const db = Math.abs(b1 - b2);

      const maxDiff = Math.max(dr, dg, db);
      const avgDiff = (dr + dg + db) / 3;

      if (maxDiff > DIFF_THRESHOLD) {
        diffPixels.push({ x, y, diffValue: avgDiff });
      }
    }

    if (onProgress && (Date.now() - lastProgressUpdate > 50 || y === height - 1)) {
      const progress = ((y + 1) / totalIterations) * 100;
      onProgress(progress);
      lastProgressUpdate = Date.now();
    }
  }

  const percentage = (diffPixels.length / totalPixels) * 100;

  return {
    pixels: diffPixels,
    percentage,
    totalPixels,
  };
}

export function createDiffMask(
  diffPixels: DiffPixel[],
  width: number,
  height: number
): ImageData {
  const maskData = new ImageData(width, height);
  const data = maskData.data;

  for (const pixel of diffPixels) {
    if (pixel.x >= width || pixel.y >= height) continue;
    const idx = (pixel.y * width + pixel.x) * 4;
    data[idx] = 255;
    data[idx + 1] = 0;
    data[idx + 2] = 0;
    data[idx + 3] = Math.round(255 * 0.4);
  }

  return maskData;
}

export function shouldUseWorker(width: number, height: number): boolean {
  return width > 500 && height > 500;
}
