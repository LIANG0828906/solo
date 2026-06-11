import { SealPlacement, drawSeal, drawSignature } from './seal.js';

export interface ExportLayers {
  paperCanvas: HTMLCanvasElement;
  strokeCanvas: HTMLCanvasElement;
  seals: SealPlacement[];
  width: number;
  height: number;
}

export function composeForExport(layers: ExportLayers): HTMLCanvasElement {
  const { paperCanvas, strokeCanvas, seals, width, height } = layers;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(paperCanvas, 0, 0, width, height);

  ctx.drawImage(strokeCanvas, 0, 0, width, height);

  for (const seal of seals) {
    drawSeal(ctx, seal.type, seal.x, seal.y, seal.size);
  }

  if (seals.length > 0) {
    const lastSeal = seals[seals.length - 1];
    const sigX = lastSeal.x - 35;
    const sigY = lastSeal.y + lastSeal.size / 2 + 8;
    drawSignature(ctx, sigX, sigY);
  }

  return exportCanvas;
}

export function downloadPNG(canvas: HTMLCanvasElement, filename?: string): void {
  const name = filename || generateFilename();
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    'image/png',
    1.0
  );
}

export function generateFilename(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const se = String(now.getSeconds()).padStart(2, '0');
  return `作品_${y}${mo}${d}${h}${mi}${se}.png`;
}

export function addPNGMetadata(canvas: HTMLCanvasElement): HTMLCanvasElement {
  return canvas;
}
