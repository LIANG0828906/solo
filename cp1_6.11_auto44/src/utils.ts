export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateNoiseTexture(size: number, baseColor: string, variation: number): number[][] {
  const texture: number[][] = [];
  const baseValue = parseInt(baseColor.replace('#', ''), 16);
  const baseR = (baseValue >> 16) & 255;
  const baseG = (baseValue >> 8) & 255;
  const baseB = baseValue & 255;

  for (let y = 0; y < size; y++) {
    texture[y] = [];
    for (let x = 0; x < size; x++) {
      const noise = randomInt(-variation, variation);
      const r = clamp(baseR + noise, 0, 255);
      const g = clamp(baseG + noise, 0, 255);
      const b = clamp(baseB + noise, 0, 255);
      texture[y][x] = (r << 16) | (g << 8) | b;
    }
  }
  return texture;
}

export function formatTime(seconds: number): string {
  return seconds.toFixed(1);
}

export function colorToRgb(color: string): string {
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
}

export function intToRgb(value: number): string {
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgb(${r}, ${g}, ${b})`;
}
