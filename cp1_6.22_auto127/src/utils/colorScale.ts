import * as d3 from 'd3';

const colorScale = d3.scaleLinear<string>()
  .domain([0, 1])
  .range(['#66CCCC', '#CC3300']);

export function getColor(density: number, minDensity: number, maxDensity: number): string {
  const t = (density - minDensity) / (maxDensity - minDensity);
  const clampedT = Math.max(0, Math.min(1, t));
  const color = colorScale(clampedT);
  return color || '#66CCCC';
}

export function getColorRGB(density: number, minDensity: number, maxDensity: number): [number, number, number] {
  const colorStr = getColor(density, minDensity, maxDensity);
  const rgbColor = d3.color(colorStr);
  if (rgbColor) {
    return [rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255];
  }
  return [0.4, 0.8, 0.8];
}

export function getColorScale(minDensity: number, maxDensity: number): d3.ScaleLinear<string, string> {
  return d3.scaleLinear<string>()
    .domain([minDensity, maxDensity])
    .range(['#66CCCC', '#CC3300']);
}

export function generateColorStops(minDensity: number, maxDensity: number, count: number = 20): Array<{ value: number; color: string }> {
  const stops: Array<{ value: number; color: string }> = [];
  const step = (maxDensity - minDensity) / (count - 1);
  const scale = getColorScale(minDensity, maxDensity);
  
  for (let i = 0; i < count; i++) {
    const value = minDensity + step * i;
    stops.push({ value, color: scale(value) });
  }
  
  return stops;
}
