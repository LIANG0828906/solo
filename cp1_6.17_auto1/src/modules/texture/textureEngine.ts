import type { GridPoint, TextureResult, WrinkleStats } from '../../types';
import { loadImage } from '../camera/cameraUtils';

const GRID_SPACING = 20;
const HIGH_COLOR = { r: 229, g: 57, b: 53 };
const LOW_COLOR = { r: 30, g: 136, b: 229 };

function getGrayscale(imageData: ImageData, x: number, y: number): number {
  const idx = (y * imageData.width + x) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function getLocalContrast(
  imageData: ImageData,
  x: number,
  y: number,
  radius: number
): number {
  const centerGray = getGrayscale(imageData, x, y);
  let sum = 0;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy += 2) {
    for (let dx = -radius; dx <= radius; dx += 2) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 &&
        nx < imageData.width &&
        ny >= 0 &&
        ny < imageData.height
      ) {
        sum += getGrayscale(imageData, nx, ny);
        count++;
      }
    }
  }

  const localAvg = count > 0 ? sum / count : centerGray;
  const diff = localAvg - centerGray;
  return Math.max(0, diff) / 255;
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

export function analyzeTexture(
  imageData: ImageData,
  sensitivity: number
): TextureResult {
  const points: GridPoint[] = [];
  const width = imageData.width;
  const height = imageData.height;

  let totalIntensity = 0;
  let maxIntensity = 0;
  let maxX = 0;
  let maxY = 0;

  for (let y = GRID_SPACING; y < height; y += GRID_SPACING) {
    for (let x = GRID_SPACING; x < width; x += GRID_SPACING) {
      const rawIntensity = getLocalContrast(imageData, x, y, 10);
      const intensity = applySensitivity(rawIntensity, sensitivity);
      const grayscale = getGrayscale(imageData, x, y);

      points.push({ x, y, intensity, grayscale });

      totalIntensity += intensity;
      if (intensity > maxIntensity) {
        maxIntensity = intensity;
        maxX = x;
        maxY = y;
      }
    }
  }

  const stats: WrinkleStats = {
    averageIntensity: points.length > 0 ? (totalIntensity / points.length) * 100 : 0,
    maxIntensity: maxIntensity * 100,
    maxLocation: { x: maxX, y: maxY },
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
  ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
  drawHeatmap(ctx, result.points, exportWidth, exportHeight);

  return canvas.toDataURL('image/png');
}
