export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getGradientColor(position: [number, number, number]): string {
  const [x, y, z] = position;
  const t = (Math.abs(x) + Math.abs(y) + Math.abs(z)) / 15;
  const normalizedT = Math.min(1, Math.max(0, t));

  const startColor = hexToRgb('#0f3460');
  const endColor = hexToRgb('#16c79a');

  const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * normalizedT);
  const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * normalizedT);
  const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * normalizedT);

  return rgbToHex(r, g, b);
}

export function getDistance(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const rainbowColors = [
  '#ff0000',
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#ffff00',
  '#9acd32',
  '#00ff00',
  '#00ced1',
  '#1e90ff',
  '#4169e1',
  '#9932cc',
  '#ff1493',
];
