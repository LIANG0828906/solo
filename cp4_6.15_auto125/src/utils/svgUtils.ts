import type { CanvasElement } from '@/types';
import { getMaterialById } from '@/data/materialData';

export const generateSVGString = (
  elements: CanvasElement[],
  canvasWidth: number = 1200,
  canvasHeight: number = 800
): string => {
  const elementsContent = elements
    .map((el) => {
      const material = getMaterialById(el.materialId);
      if (!material) return '';

      return `  <g transform="translate(${el.x}, ${el.y}) rotate(${el.rotation}) scale(${el.scale})">
    <g transform="translate(-50, -50)">
      <path d="${material.svgPath}" fill="${el.color}" stroke="${el.color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
  </g>`;
    })
    .filter(Boolean)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="#ffffff"/>
  <g id="collage-elements">
${elementsContent}
  </g>
</svg>`;
};

export const downloadSVG = (svgString: string, filename?: string): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalFilename = filename || `Collage_${timestamp}.svg`;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

export const snapToGrid = (value: number, gridSize: number = 20): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const snapToNeighbor = (
  x: number,
  y: number,
  elements: CanvasElement[],
  currentId: string,
  threshold: number = 15
): { x: number; y: number; snapped: boolean } => {
  let snappedX = x;
  let snappedY = y;
  let snapped = false;

  for (const el of elements) {
    if (el.id === currentId) continue;

    if (Math.abs(el.x - x) < threshold) {
      snappedX = el.x;
      snapped = true;
    }
    if (Math.abs(el.y - y) < threshold) {
      snappedY = el.y;
      snapped = true;
    }
    if (Math.abs(el.x + 100 - x) < threshold) {
      snappedX = el.x + 100;
      snapped = true;
    }
    if (Math.abs(el.y + 100 - y) < threshold) {
      snappedY = el.y + 100;
      snapped = true;
    }
  }

  return { x: snappedX, y: snappedY, snapped };
};

export const clampToBounds = (
  value: number,
  min: number,
  max: number,
  padding: number = 0
): number => {
  return Math.max(min + padding, Math.min(max - padding, value));
};

export const canvasToScreen = (
  canvasX: number,
  canvasY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
): { x: number; y: number } => {
  return {
    x: canvasX * zoom + offsetX,
    y: canvasY * zoom + offsetY,
  };
};

export const screenToCanvas = (
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
): { x: number; y: number } => {
  return {
    x: (screenX - offsetX) / zoom,
    y: (screenY - offsetY) / zoom,
  };
};
