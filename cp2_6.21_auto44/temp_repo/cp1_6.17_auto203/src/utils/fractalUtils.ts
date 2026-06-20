export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function interpolateColor(colorStart: string, colorEnd: string, t: number): string {
  const start = hexToRgb(colorStart);
  const end = hexToRgb(colorEnd);
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgba(${r},${g},${b},0.7)`;
}

export function getPolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const angleOffset = (rotation * Math.PI) / 180;
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides + angleOffset - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push({ x, y });
  }
  return points;
}

export function generateSvgString(
  layers: number,
  rotation: number,
  scale: number,
  colorStart: string,
  colorEnd: string,
  size: number
): string {
  const cx = size / 2;
  const cy = size / 2;
  let paths = '';
  let currentRadius = size / 2 - 10;
  let currentRotation = 0;

  for (let i = 0; i < layers; i++) {
    const t = layers === 1 ? 0 : i / (layers - 1);
    const color = interpolateColor(colorStart, colorEnd, t);
    const points = getPolygonPoints(cx, cy, currentRadius, 6, currentRotation);
    
    const pathD = points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ') + 'Z';
    
    paths += `<path d="${pathD}" fill="${color}" />`;
    
    currentRadius *= scale;
    currentRotation += rotation;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="#000000" />
    ${paths}
  </svg>`;
}
