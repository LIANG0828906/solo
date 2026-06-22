import { scaleLinear } from 'd3-scale';
import type { DataType } from '@/utils/dataLoader';

export function getDataRange(type: DataType): [number, number] {
  switch (type) {
    case 'temperature':
      return [-40, 45];
    case 'precipitation':
      return [0, 2000];
    case 'wind':
      return [0, 120];
  }
}

export function getColorStops(type: DataType): string[] {
  switch (type) {
    case 'temperature':
      return ['#1e40af', '#3b82f6', '#60a5fa', '#fef08a', '#f97316', '#dc2626'];
    case 'precipitation':
      return ['#052e16', '#14532d', '#166534', '#22c55e', '#86efac'];
    case 'wind':
      return ['#fde047', '#facc15', '#a855f7', '#7e22ce', '#581c87'];
  }
}

export function getColorScale(type: DataType): (value: number) => string {
  const [min, max] = getDataRange(type);
  const colorStops = getColorStops(type);

  const domain = colorStops.map((_, i) => min + (i / (colorStops.length - 1)) * (max - min));

  return scaleLinear<string>()
    .domain(domain)
    .range(colorStops);
}

export function getValueColor(type: DataType, value: number): string {
  const colorScale = getColorScale(type);
  return colorScale(value);
}
