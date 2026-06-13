export interface StylePreset {
  id: string;
  name: string;
  wallColor: string;
  floorColor: string;
  furnitureColor: string;
  shadowIntensity: number;
  gradientAngle: number;
  gradientSpread: number;
  previewColor: string;
}

const STYLE_LIBRARY: StylePreset[] = [
  {
    id: 'nordic',
    name: '北欧简约',
    wallColor: '#f5f0eb',
    floorColor: '#c4a67a',
    furnitureColor: '#9b8b72',
    shadowIntensity: 0.15,
    gradientAngle: 315,
    gradientSpread: 0.5,
    previewColor: '#f5f0eb'
  },
  {
    id: 'pastoral',
    name: '暖意田园',
    wallColor: '#f5e6c8',
    floorColor: '#b8a070',
    furnitureColor: '#c89060',
    shadowIntensity: 0.2,
    gradientAngle: 315,
    gradientSpread: 0.55,
    previewColor: '#f5e6c8'
  },
  {
    id: 'industrial',
    name: '现代工业',
    wallColor: '#4a4a4a',
    floorColor: '#2c2c2c',
    furnitureColor: '#8a8a8a',
    shadowIntensity: 0.45,
    gradientAngle: 315,
    gradientSpread: 0.85,
    previewColor: '#4a4a4a'
  },
  {
    id: 'mediterranean',
    name: '地中海蓝',
    wallColor: '#f0f4f8',
    floorColor: '#c4785a',
    furnitureColor: '#4a90c4',
    shadowIntensity: 0.25,
    gradientAngle: 315,
    gradientSpread: 0.6,
    previewColor: '#4a90c4'
  },
  {
    id: 'chinese',
    name: '新中式',
    wallColor: '#d8d0c0',
    floorColor: '#8b6b3a',
    furnitureColor: '#8b2500',
    shadowIntensity: 0.3,
    gradientAngle: 315,
    gradientSpread: 0.65,
    previewColor: '#8b2500'
  }
];

export function getStyleById(id: string): StylePreset | undefined {
  return STYLE_LIBRARY.find(s => s.id === id);
}

export function getAllStyles(): StylePreset[] {
  return [...STYLE_LIBRARY];
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function interpolateColorHSL(
  fromHex: string,
  toHex: string,
  t: number
): string {
  const from = hexToHSL(fromHex);
  const to = hexToHSL(toHex);
  let dh = to.h - from.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = from.h + dh * t;
  const s = from.s + (to.s - from.s) * t;
  const l = from.l + (to.l - from.l) * t;
  return hslToHex(h < 0 ? h + 360 : h % 360, s, l);
}
