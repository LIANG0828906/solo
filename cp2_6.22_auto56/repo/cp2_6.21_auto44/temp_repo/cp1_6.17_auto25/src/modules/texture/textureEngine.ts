import { WrinkleStats, WrinkleData } from '../../types';

const GRID_SPACING = 20;

export interface HeatmapResult {
  stats: WrinkleStats;
  gridData: WrinkleData[][];
}

export function analyzeImageGrayscale(
  imageData: ImageData,
  sensitivity: number = 50
): HeatmapResult {
  const { width, height, data } = imageData;

  const cols = Math.floor(width / GRID_SPACING);
  const rows = Math.floor(height / GRID_SPACING);

  const gridData: WrinkleData[][] = [];
  let totalIntensity = 0;
  let count = 0;
  let maxIntensity = 0;
  let maxRegionX = 0;
  let maxRegionY = 0;

  const sensitivityFactor = 0.5 + (sensitivity / 100) * 1.5;

  for (let row = 0; row < rows; row++) {
    gridData[row] = [];
    for (let col = 0; col < cols; col++) {
      const centerX = Math.floor(col * GRID_SPACING + GRID_SPACING / 2);
      const centerY = Math.floor(row * GRID_SPACING + GRID_SPACING / 2);

      const sampleSize = Math.floor(GRID_SPACING * 0.6);
      let sumGray = 0;
      let sampleCount = 0;

      const startX = Math.max(0, centerX - sampleSize / 2);
      const endX = Math.min(width - 1, centerX + sampleSize / 2);
      const startY = Math.max(0, centerY - sampleSize / 2);
      const endY = Math.min(height - 1, centerY + sampleSize / 2);

      for (let y = Math.floor(startY); y <= Math.floor(endY); y += 2) {
        for (let x = Math.floor(startX); x <= Math.floor(endX); x += 2) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          sumGray += gray;
          sampleCount++;
        }
      }

      const avgGray = sampleCount > 0 ? sumGray / sampleCount : 128;

      const normalized = (255 - avgGray) / 255;
      const boosted = Math.min(1, Math.pow(normalized, 1 / sensitivityFactor));
      const intensity = boosted;

      totalIntensity += intensity;
      count++;

      if (intensity > maxIntensity) {
        maxIntensity = intensity;
        maxRegionX = col;
        maxRegionY = row;
      }

      gridData[row][col] = {
        intensity,
        x: col * GRID_SPACING,
        y: row * GRID_SPACING,
        normalized,
      };
    }
  }

  const stats: WrinkleStats = {
    averageIntensity: count > 0 ? totalIntensity / count : 0,
    maxIntensity,
    maxRegionX,
    maxRegionY,
    gridWidth: cols,
    gridHeight: rows,
  };

  return { stats, gridData };
}

export function interpolateColor(
  intensity: number
): { r: number; g: number; b: number; a: number } {
  if (intensity <= 0.2) {
    return { r: 30, g: 136, b: 229, a: 0.2 };
  }

  const normalized = Math.min(1, (intensity - 0.2) / 0.8);

  const r = Math.round(30 + (229 - 30) * normalized);
  const g = Math.round(136 + (57 - 136) * normalized);
  const b = Math.round(229 + (53 - 229) * normalized);
  const a = 0.2 + (0.8 - 0.2) * normalized;

  return { r, g, b, a };
}

export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  result: HeatmapResult,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);

  const imageAspect = image.width / image.height;
  const canvasAspect = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageAspect > canvasAspect) {
    drawHeight = width / imageAspect;
    offsetY = (height - drawHeight) / 2;
  } else {
    drawWidth = height * imageAspect;
    offsetX = (width - drawWidth) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const scaleX = drawWidth / image.width;
  const scaleY = drawHeight / image.height;

  const { gridData } = result;

  const cellW = GRID_SPACING * scaleX;
  const cellH = GRID_SPACING * scaleY;

  for (let row = 0; row < gridData.length; row++) {
    for (let col = 0; col < gridData[row].length; col++) {
      const cell = gridData[row][col];
      const { r, g, b, a } = interpolateColor(cell.intensity);

      const x = offsetX + cell.x * scaleX;
      const y = offsetY + cell.y * scaleY;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(x, y, cellW, cellH);
    }
  }

  ctx.strokeStyle = 'rgba(229, 57, 53, 0.3)';
  ctx.lineWidth = 0.5;

  for (let col = 0; col <= result.stats.gridWidth; col++) {
    const x = offsetX + col * cellW;
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + drawHeight);
    ctx.stroke();
  }

  for (let row = 0; row <= result.stats.gridHeight; row++) {
    const y = offsetY + row * cellH;
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + drawWidth, y);
    ctx.stroke();
  }

  if (result.stats.maxIntensity > 0.4) {
    const maxCell = gridData[result.stats.maxRegionY]?.[result.stats.maxRegionX];
    if (maxCell) {
      const centerX = offsetX + maxCell.x * scaleX + cellW / 2;
      const centerY = offsetY + maxCell.y * scaleY + cellH / 2;
      const radius = Math.max(cellW, cellH) * 0.8;

      ctx.save();
      ctx.strokeStyle = '#E53935';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function getImageData(
  image: HTMLImageElement,
  targetWidth: number = 640,
  targetHeight: number = 480
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}
