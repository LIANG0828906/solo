import type { Frame, FrameData, PixelColor } from '../types';
import { GRID_SIZE } from './palette';

export function createEmptyFrame(): Frame {
  const data: FrameData = Array.from({ length: GRID_SIZE }, () => {
    const row: PixelColor[] = Array.from({ length: GRID_SIZE }, () => null as PixelColor);
    return row;
  });
  return {
    id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data
  };
}

export function cloneFrame(frame: Frame): Frame {
  return {
    id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data: frame.data.map(row => [...row]),
    editorId: undefined
  };
}

export function drawFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  data: FrameData,
  size: number,
  pixelSize: number
): void {
  ctx.clearRect(0, 0, size, size);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const color = data[y][x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      } else {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? '#3A3A5C' : '#2D2D44';
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

export function frameToDataUrl(data: FrameData, size: number = GRID_SIZE * 4): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const pixelSize = size / GRID_SIZE;
  drawFrameToCanvas(ctx, data, size, pixelSize);
  return canvas.toDataURL('image/png');
}

export function frameToImageData(data: FrameData, size: number = GRID_SIZE * 4): ImageData | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const pixelSize = size / GRID_SIZE;
  drawFrameToCanvas(ctx, data, size, pixelSize);
  return ctx.getImageData(0, 0, size, size);
}

export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 55%)`;
}

export function generateRandomName(): string {
  const adjectives = ['快乐', '敏捷', '聪明', '勇敢', '创意', '热情', '专注', '酷炫'];
  const nouns = ['像素侠', '画师', '动画师', '精灵', '创造者', '艺术家', '设计师', '玩家'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}
