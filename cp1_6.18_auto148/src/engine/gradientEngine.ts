import type { ColorStop, GradientResult } from '@/types';

export function generateGradient(colorStops: ColorStop[], angle: number): GradientResult {
  const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
  
  const stopsString = sortedStops
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');
  
  const cssString = `linear-gradient(${angle}deg, ${stopsString})`;
  
  const previewColors = sortedStops.map(stop => stop.color);
  
  return { cssString, previewColors };
}

export function validateColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
  return hexRegex.test(color) || rgbRegex.test(color) || rgbaRegex.test(color);
}

export function clampPosition(position: number): number {
  return Math.max(0, Math.min(100, position));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
