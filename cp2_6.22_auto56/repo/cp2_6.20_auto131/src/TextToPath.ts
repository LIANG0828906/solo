import { TextConfig } from './types';

export interface Point {
  x: number;
  y: number;
}

export interface TextPathResult {
  points: Point[];
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

const estimateStrokeComplexity = (text: string): number => {
  let complexity = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x4e00 && code <= 0x9fff) {
      complexity += 8;
    } else if (/[A-Z]/.test(char)) {
      complexity += 4;
    } else if (/[a-z]/.test(char)) {
      complexity += 3;
    } else if (/\d/.test(char)) {
      complexity += 3;
    } else {
      complexity += 2;
    }
  }
  return Math.max(complexity, 1);
};

export const calculateParticleCount = (text: string): number => {
  const complexity = estimateStrokeComplexity(text);
  const baseCount = Math.min(complexity * 250, 5000);
  return Math.max(1000, Math.min(5000, baseCount));
};

export const textToPathPoints = (
  text: string,
  config: TextConfig,
  canvasWidth: number,
  canvasHeight: number
): TextPathResult => {
  const offscreenCanvas = document.createElement('canvas');
  const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { points: [], width: 0, height: 0, offsetX: 0, offsetY: 0 };
  }

  const { fontSize, fontWeight, fontStyle } = config;
  
  offscreenCanvas.width = canvasWidth;
  offscreenCanvas.height = canvasHeight;

  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize * 1.2;

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  ctx.fillText(text, centerX, centerY);

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const targetCount = calculateParticleCount(text);
  
  const points: Point[] = [];
  const tempPoints: Point[] = [];

  const stepX = Math.max(1, Math.floor(Math.sqrt((canvasWidth * canvasHeight) / (targetCount * 4))));
  const stepY = stepX;

  for (let y = 0; y < canvasHeight; y += stepY) {
    for (let x = 0; x < canvasWidth; x += stepX) {
      const index = (y * canvasWidth + x) * 4;
      const alpha = data[index + 3];
      if (alpha > 128) {
        tempPoints.push({ x, y });
      }
    }
  }

  if (tempPoints.length <= targetCount) {
    points.push(...tempPoints);
  } else {
    const interval = Math.ceil(tempPoints.length / targetCount);
    for (let i = 0; i < tempPoints.length && points.length < targetCount; i += interval) {
      points.push(tempPoints[i]);
    }
    while (points.length < targetCount) {
      const idx = Math.floor(Math.random() * tempPoints.length);
      points.push(tempPoints[idx]);
    }
  }

  for (const p of points) {
    p.x += (Math.random() - 0.5) * stepX;
    p.y += (Math.random() - 0.5) * stepY;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  return {
    points,
    width: textWidth,
    height: textHeight,
    offsetX: centerX - textWidth / 2,
    offsetY: centerY - textHeight / 2
  };
};
