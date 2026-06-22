export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0];
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

export function hexToCMYK(hex: string): [number, number, number, number] {
  const [r, g, b] = hexToRgb(hex);

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  if (k === 1) {
    return [0, 0, 0, 100];
  }

  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return [
    Math.round(c * 1000) / 10,
    Math.round(m * 1000) / 10,
    Math.round(y * 1000) / 10,
    Math.round(k * 1000) / 10
  ];
}

export function isWarmColor(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  const diff = r - b;

  if (diff > 20) return true;
  if (diff < -20) return false;

  return (r + g) / 2 > b;
}

export function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastColor(hex: string): string {
  return getLuminance(hex) > 0.5 ? '#000000' : '#FFFFFF';
}

export function generateGradient(fromHex: string, toHex: string): string {
  return `linear-gradient(135deg, ${fromHex} 0%, ${toHex} 100%)`;
}

export function getReadableTextColor(backgroundHex: string): string {
  const luminance = getLuminance(backgroundHex);
  if (luminance > 0.6) return '#333333';
  if (luminance > 0.3) return '#FFFFFF';
  return '#FFFFFF';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
