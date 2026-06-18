import type { GradientConfig, ColorStop } from '../types/gradient';

export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function generateGradientCSS(config: GradientConfig): string {
  const sortedStops = [...config.colorStops].sort((a, b) => a.position - b.position);
  const colorStops = sortedStops
    .map((stop) => `${hexToRgba(stop.color, stop.opacity)} ${stop.position}%`)
    .join(', ');
  return `linear-gradient(${config.direction}, ${colorStops})`;
}

export function generateGradientCanvas(
  ctx: CanvasRenderingContext2D,
  config: GradientConfig,
  width: number,
  height: number
): void {
  const { direction, colorStops } = config;
  const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);

  let x0 = 0,
    y0 = 0,
    x1 = 0,
    y1 = 0;

  switch (direction) {
    case 'to right':
      x0 = 0;
      x1 = width;
      break;
    case 'to left':
      x0 = width;
      x1 = 0;
      break;
    case 'to bottom':
      y0 = 0;
      y1 = height;
      break;
    case 'to top':
      y0 = height;
      y1 = 0;
      break;
    case 'to bottom right':
      x0 = 0;
      y0 = 0;
      x1 = width;
      y1 = height;
      break;
    case 'to bottom left':
      x0 = width;
      y0 = 0;
      x1 = 0;
      y1 = height;
      break;
    case 'to top right':
      x0 = 0;
      y0 = height;
      x1 = width;
      y1 = 0;
      break;
    case 'to top left':
      x0 = width;
      y0 = height;
      x1 = 0;
      y1 = 0;
      break;
  }

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  sortedStops.forEach((stop) => {
    gradient.addColorStop(stop.position / 100, hexToRgba(stop.color, stop.opacity));
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function generateGradientThumbnail(config: GradientConfig, size: number = 100): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  generateGradientCanvas(ctx, config, size, size);
  return canvas.toDataURL('image/png');
}

export function createDefaultColorStops(): ColorStop[] {
  return [
    { id: 'stop-1', color: '#FF6B6B', position: 0, opacity: 1 },
    { id: 'stop-2', color: '#4ECDC4', position: 100, opacity: 1 },
  ];
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
