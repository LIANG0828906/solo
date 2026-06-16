import { PALETTE, PaletteColor } from '../types';

export function getRandomPaletteColor(): PaletteColor {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function normalizeRect(startX: number, startY: number, endX: number, endY: number): DrawRect {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function fitImageToCanvas(
  imgWidth: number,
  imgHeight: number,
  maxCanvasWidth: number,
  maxCanvasHeight: number
): { width: number; height: number; scale: number } {
  const scaleW = maxCanvasWidth / imgWidth;
  const scaleH = maxCanvasHeight / imgHeight;
  const scale = Math.min(scaleW, scaleH, 1);
  return {
    width: Math.round(imgWidth * scale),
    height: Math.round(imgHeight * scale),
    scale,
  };
}

export function isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

export function getImageCanvasCoords(
  clientX: number,
  clientY: number,
  canvasEl: HTMLCanvasElement,
  imgOffsetX: number,
  imgOffsetY: number,
  imgDisplayWidth: number,
  imgDisplayHeight: number
): { x: number; y: number } | null {
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = canvasEl.width / rect.width;
  const scaleY = canvasEl.height / rect.height;
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  const relX = canvasX - imgOffsetX;
  const relY = canvasY - imgOffsetY;
  if (relX < 0 || relY < 0 || relX > imgDisplayWidth || relY > imgDisplayHeight) {
    return null;
  }
  return { x: relX, y: relY };
}
