import { scaleLinear } from 'd3-scale';

export const windSpeedColorScale = scaleLinear<string>()
  .domain([20, 70, 120, 170, 215])
  .range(['#38bdf8', '#22d3ee', '#a3e635', '#f59e0b', '#ef4444'])
  .clamp(true);

export const pressureColorScale = scaleLinear<string>()
  .domain([870, 920, 970, 1020])
  .range(['#ef4444', '#f59e0b', '#22d3ee', '#38bdf8'])
  .clamp(true);

export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function categoryToColor(category: number): string {
  const colors: Record<number, string> = {
    1: '#4ade80',
    2: '#facc15',
    3: '#fb923c',
    4: '#f87171',
    5: '#ef4444',
  };
  return colors[category] || '#94a3b8';
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
