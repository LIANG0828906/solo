import type { Palette } from '../types';
import { getContrastColor } from './colorUtils';

export function exportToCSS(palette: Palette): string {
  const variables = palette.colors
    .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
    .join('\n');

  return `:root {\n${variables}\n}`;
}

export function exportToSCSS(palette: Palette): string {
  return palette.colors
    .map((color, index) => `$color-${index + 1}: ${color.hex};`)
    .join('\n');
}

export function exportToSVG(
  palette: Palette,
  width: number = 500,
  height: number = 100
): string {
  const colorCount = palette.colors.length;
  const rectWidth = width / colorCount;

  const rects = palette.colors
    .map((color, index) => {
      const x = index * rectWidth;
      const contrastColor = getContrastColor(color.hex);
      return `  <rect x="${x}" y="0" width="${rectWidth}" height="${height}" fill="${color.hex}"/>
  <text x="${x + rectWidth / 2}" y="${height / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${contrastColor}">${color.hex.toUpperCase()}</text>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${rects}
</svg>`;
}
