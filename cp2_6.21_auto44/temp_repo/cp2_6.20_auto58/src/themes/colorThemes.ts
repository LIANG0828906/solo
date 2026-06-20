export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  trail: string;
  bgColor: string;
}

export const colorThemes: Record<string, ColorTheme> = {
  aurora: {
    name: '极光绿蓝',
    primary: '#00FFA3',
    secondary: '#00D4FF',
    accent: '#7B61FF',
    trail: '#00FF88',
    bgColor: '#0A1628',
  },
  sunset: {
    name: '日落橙紫',
    primary: '#FF6B35',
    secondary: '#F7931E',
    accent: '#9B59B6',
    trail: '#FF8C42',
    bgColor: '#1A0A2E',
  },
  ocean: {
    name: '深海蓝青',
    primary: '#0077B6',
    secondary: '#00B4D8',
    accent: '#00F5D4',
    trail: '#48CAE4',
    bgColor: '#03071E',
  },
  flame: {
    name: '烈焰红金',
    primary: '#FF2E00',
    secondary: '#FF6D00',
    accent: '#FFD60A',
    trail: '#FF9E00',
    bgColor: '#1A0000',
  },
  moonlight: {
    name: '月光银灰',
    primary: '#C9D6FF',
    secondary: '#A8B5D9',
    accent: '#8892B0',
    trail: '#E0E6FF',
    bgColor: '#0D1117',
  },
  candy: {
    name: '糖果粉彩',
    primary: '#FF69B4',
    secondary: '#87CEEB',
    accent: '#98FB98',
    trail: '#DDA0DD',
    bgColor: '#1A1A2E',
  },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

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

export function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: r * 255, g: g * 255, b: b * 255 };
}

export function lerpHsl(
  color1: string,
  color2: string,
  t: number
): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
  const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);

  let hDiff = hsl2.h - hsl1.h;
  if (hDiff > 180) hDiff -= 360;
  if (hDiff < -180) hDiff += 360;

  const h = (hsl1.h + hDiff * t + 360) % 360;
  const s = hsl1.s + (hsl2.s - hsl1.s) * t;
  const l = hsl1.l + (hsl2.l - hsl1.l) * t;

  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function complementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const complementaryH = (hsl.h + 180) % 360;
  const result = hslToRgb(complementaryH, hsl.s, hsl.l);
  return rgbToHex(result.r, result.g, result.b);
}
