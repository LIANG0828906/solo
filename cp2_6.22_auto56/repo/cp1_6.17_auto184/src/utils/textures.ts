import { TextureType } from '@/types';

const textureCache: Map<string, CanvasPattern> = new Map();

export function getTexturePattern(
  ctx: CanvasRenderingContext2D,
  type: TextureType,
  color: string,
  size: number = 16
): CanvasPattern | null {
  if (type === 'none') return null;

  const cacheKey = `${type}-${color}-${size}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const patternCtx = canvas.getContext('2d');
  if (!patternCtx) return null;

  patternCtx.fillStyle = color;

  switch (type) {
    case 'noise':
      generateNoiseTexture(patternCtx, size);
      break;
    case 'stripes':
      generateStripesTexture(patternCtx, size);
      break;
    case 'waves':
      generateWavesTexture(patternCtx, size);
      break;
    case 'dots':
      generateDotsTexture(patternCtx, size);
      break;
  }

  const pattern = ctx.createPattern(canvas, 'repeat');
  if (pattern) {
    textureCache.set(cacheKey, pattern);
  }

  return pattern;
}

function generateNoiseTexture(ctx: CanvasRenderingContext2D, size: number): void {
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.random() > 0.5 ? 255 : 0;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = value > 0 ? 80 : 0;
  }
  ctx.putImageData(imageData, 0, 0);
}

function generateStripesTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < size; i += 4) {
    ctx.fillRect(0, i, size, 2);
  }
}

function generateWavesTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= size; x++) {
    const y = size / 2 + Math.sin((x / size) * Math.PI * 2) * (size / 4);
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function generateDotsTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const dotSize = 2;
  const spacing = 4;
  for (let x = 0; x < size; x += spacing) {
    for (let y = 0; y < size; y += spacing) {
      ctx.beginPath();
      ctx.arc(x + spacing / 2, y + spacing / 2, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function applyTextureToShape(
  ctx: CanvasRenderingContext2D,
  type: TextureType,
  color: string,
  x: number,
  y: number,
  size: number
): void {
  if (type === 'none') return;

  const pattern = getTexturePattern(ctx, type, color, 16);
  if (!pattern) return;

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = pattern;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.restore();
}
