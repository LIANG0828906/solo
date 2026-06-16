import type { GridPoint, TextureResult, WrinkleStats } from '../../types';
import { loadImage } from '../camera/cameraUtils';

const GRID_SPACING = 20;
const HIGH_COLOR = { r: 229, g: 57, b: 53 };
const LOW_COLOR = { r: 30, g: 136, b: 229 };
const BATCH_SIZE = 40;
const SOBEL_GX = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];
const SOBEL_GY = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

function getGrayscale(imageData: ImageData, x: number, y: number): number {
  const idx = (y * imageData.width + x) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function buildGrayscaleCache(imageData: ImageData): Float32Array {
  const { width, height } = imageData;
  const cache = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cache[y * width + x] = getGrayscale(imageData, x, y);
    }
  }
  return cache;
}

function getCachedGrayscale(
  cache: Float32Array,
  width: number,
  x: number,
  y: number
): number {
  return cache[y * width + x];
}

interface SobelResult {
  gx: number;
  gy: number;
  magnitude: number;
  angle: number;
}

function getSobelGradient(
  cache: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number
): SobelResult {
  let gx = 0;
  let gy = 0;

  for (let ky = -1; ky <= 1; ky++) {
    for (let kx = -1; kx <= 1; kx++) {
      const px = x + kx;
      const py = y + ky;
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const gray = getCachedGrayscale(cache, width, px, py);
        gx += gray * SOBEL_GX[ky + 1][kx + 1];
        gy += gray * SOBEL_GY[ky + 1][kx + 1];
      }
    }
  }

  const magnitude = Math.sqrt(gx * gx + gy * gy);
  const angleRad = Math.atan2(gy, gx);
  let angleDeg = (angleRad * 180) / Math.PI;
  if (angleDeg < 0) {
    angleDeg += 360;
  }

  return { gx, gy, magnitude, angle: angleDeg };
}

function getLocalStdDev(
  cache: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number
): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy += 2) {
    for (let dx = -radius; dx <= radius; dx += 2) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const gray = getCachedGrayscale(cache, width, nx, ny);
        sum += gray;
        sumSq += gray * gray;
        count++;
      }
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.sqrt(Math.max(0, variance));
}

function getWrinkleIntensity(
  cache: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number
): { intensity: number; angle: number } {
  const sobel = getSobelGradient(cache, width, height, x, y);
  const normalizedGradient = Math.min(1, sobel.magnitude / 1020);

  const stdDev = getLocalStdDev(cache, width, height, x, y, radius);
  const normalizedStdDev = Math.min(1, stdDev / 128);

  const intensity = 0.6 * normalizedGradient + 0.4 * normalizedStdDev;

  return { intensity, angle: sobel.angle };
}

function applySensitivity(rawIntensity: number, sensitivity: number): number {
  const factor = sensitivity / 50;
  const adjusted = rawIntensity * factor;
  return Math.min(1, Math.max(0, adjusted));
}

function interpolateColor(
  low: { r: number; g: number; b: number },
  high: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(low.r + (high.r - low.r) * t),
    g: Math.round(low.g + (high.g - low.g) * t),
    b: Math.round(low.b + (high.b - low.b) * t),
  };
}

function collectGridPoints(
  width: number,
  height: number
): { x: number; y: number }[] {
  const coords: { x: number; y: number }[] = [];
  for (let y = GRID_SPACING; y < height; y += GRID_SPACING) {
    for (let x = GRID_SPACING; x < width; x += GRID_SPACING) {
      coords.push({ x, y });
    }
  }
  return coords;
}

function processPointsBatch(
  cache: Float32Array,
  width: number,
  height: number,
  coords: { x: number; y: number }[],
  start: number,
  end: number,
  sensitivity: number,
  points: GridPoint[],
  statsAccum: { totalIntensity: number; maxIntensity: number; maxX: number; maxY: number }
): void {
  for (let i = start; i < end; i++) {
    const { x, y } = coords[i];
    const { intensity: rawIntensity, angle } = getWrinkleIntensity(
      cache,
      width,
      height,
      x,
      y,
      10
    );
    const intensity = applySensitivity(rawIntensity, sensitivity);
    const grayscale = getCachedGrayscale(cache, width, x, y);

    points.push({ x, y, intensity, grayscale, angle });

    statsAccum.totalIntensity += intensity;
    if (intensity > statsAccum.maxIntensity) {
      statsAccum.maxIntensity = intensity;
      statsAccum.maxX = x;
      statsAccum.maxY = y;
    }
  }
}

export function analyzeTexture(
  imageData: ImageData,
  sensitivity: number
): TextureResult {
  const points: GridPoint[] = [];
  const width = imageData.width;
  const height = imageData.height;
  const cache = buildGrayscaleCache(imageData);
  const coords = collectGridPoints(width, height);

  const statsAccum = {
    totalIntensity: 0,
    maxIntensity: 0,
    maxX: 0,
    maxY: 0,
  };

  processPointsBatch(
    cache,
    width,
    height,
    coords,
    0,
    coords.length,
    sensitivity,
    points,
    statsAccum
  );

  const stats: WrinkleStats = {
    averageIntensity: points.length > 0 ? (statsAccum.totalIntensity / points.length) * 100 : 0,
    maxIntensity: statsAccum.maxIntensity * 100,
    maxLocation: { x: statsAccum.maxX, y: statsAccum.maxY },
  };

  return { points, stats };
}

export interface AnalyzeProgress {
  processed: number;
  total: number;
}

export async function analyzeTextureAsync(
  imageData: ImageData,
  sensitivity: number,
  onProgress?: (progress: AnalyzeProgress) => void
): Promise<TextureResult> {
  const points: GridPoint[] = [];
  const width = imageData.width;
  const height = imageData.height;
  const cache = buildGrayscaleCache(imageData);
  const coords = collectGridPoints(width, height);
  const total = coords.length;

  const statsAccum = {
    totalIntensity: 0,
    maxIntensity: 0,
    maxX: 0,
    maxY: 0,
  };

  for (let start = 0; start < total; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, total);
    processPointsBatch(
      cache,
      width,
      height,
      coords,
      start,
      end,
      sensitivity,
      points,
      statsAccum
    );

    if (onProgress) {
      onProgress({ processed: end, total });
    }

    await Promise.resolve();
  }

  const stats: WrinkleStats = {
    averageIntensity: points.length > 0 ? (statsAccum.totalIntensity / points.length) * 100 : 0,
    maxIntensity: statsAccum.maxIntensity * 100,
    maxLocation: { x: statsAccum.maxX, y: statsAccum.maxY },
  };

  return { points, stats };
}

export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  points: GridPoint[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;

  for (let x = GRID_SPACING; x < width; x += GRID_SPACING) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = GRID_SPACING; y < height; y += GRID_SPACING) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (const point of points) {
    const { r, g, b } = interpolateColor(LOW_COLOR, HIGH_COLOR, point.intensity);
    const alpha = 0.2 + point.intensity * 0.6;
    const radius = 4 + point.intensity * 8;

    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      radius
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export async function processImage(
  imageSrc: string,
  sensitivity: number,
  targetWidth: number,
  targetHeight: number
): Promise<{
  imageData: ImageData;
  result: TextureResult;
}> {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const result = analyzeTexture(imageData, sensitivity);

  return { imageData, result };
}

export async function exportTextureImage(
  imageSrc: string,
  sensitivity: number,
  exportWidth: number,
  exportHeight: number
): Promise<string> {
  const { result } = await processImage(
    imageSrc,
    sensitivity,
    exportWidth,
    exportHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const img = await loadImage(imageSrc);
  // 先绘制原始照片作为底层
  ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
  // 再叠加纹理热力图
  drawHeatmap(ctx, result.points, exportWidth, exportHeight);

  return canvas.toDataURL('image/png');
}
