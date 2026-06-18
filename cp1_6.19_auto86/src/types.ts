export interface ColorSwatch {
  id: string;
  hex: string;
}

export interface Palette {
  id: string;
  name: string;
  colors: ColorSwatch[];
  tags: string[];
  rating: number;
  createdAt: number;
  updatedAt: number;
}

export type SceneType = 'poster' | 'ui' | 'illustration';

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;
  if (sn === 0) {
    const val = Math.round(ln * 255);
    return rgbToHex(val, val, val);
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return rgbToHex(
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255)
  );
};

export const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const getContrastColor = (hex: string): string => {
  const hsl = hexToHsl(hex);
  const contrastH = (hsl.h + 180) % 360;
  return hslToHex(contrastH, hsl.s, hsl.l);
};

export const getDominantColor = (colors: ColorSwatch[]): string => {
  if (colors.length === 0) return '#CCCCCC';
  const freqMap = new Map<string, number>();
  colors.forEach((c) => {
    const h = c.hex.toUpperCase();
    freqMap.set(h, (freqMap.get(h) || 0) + 1);
  });
  let maxColor = colors[0].hex;
  let maxFreq = -1;
  freqMap.forEach((freq, color) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      maxColor = color;
    }
  });
  return maxColor;
};

export const isValidHex = (hex: string): boolean =>
  /^#?[0-9A-Fa-f]{6}$/.test(hex);

export const normalizeHex = (hex: string): string => {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return `#${h.toUpperCase()}`;
};
