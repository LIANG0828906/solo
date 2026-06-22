import type { HSV, RGB, GeneratedScheme, SchemeType } from '../types';

export function hexToRgb(hex: string): RGB {
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

export function rgbToHsv(r: number, g: number, b: number): HSV {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  if (d !== 0) {
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

  return { h: h * 360, s, v };
}

export function hsvToRgb(h: number, s: number, v: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  v = Math.max(0, Math.min(1, v));

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hexToHsv(hex: string): HSV {
  const rgb = hexToRgb(hex);
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHex(h: number, s: number, v: number): string {
  const rgb = hsvToRgb(h, s, v);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function generateComplementary(hsv: HSV): string[] {
  const colors: string[] = [];
  colors.push(hsvToHex(hsv.h, hsv.s, hsv.v));
  colors.push(hsvToHex((hsv.h + 180) % 360, hsv.s, hsv.v));
  colors.push(hsvToHex(hsv.h, hsv.s * 0.7, hsv.v * 0.9));
  colors.push(hsvToHex((hsv.h + 180) % 360, hsv.s * 0.7, hsv.v * 0.9));
  colors.push(hsvToHex(hsv.h, hsv.s * 0.5, hsv.v * 1.1 > 1 ? 1 : hsv.v * 1.1));
  return colors;
}

function generateAnalogous(hsv: HSV): string[] {
  const colors: string[] = [];
  colors.push(hsvToHex((hsv.h - 30 + 360) % 360, hsv.s, hsv.v));
  colors.push(hsvToHex((hsv.h - 15 + 360) % 360, hsv.s, hsv.v * 0.95));
  colors.push(hsvToHex(hsv.h, hsv.s, hsv.v));
  colors.push(hsvToHex((hsv.h + 15) % 360, hsv.s, hsv.v * 0.95));
  colors.push(hsvToHex((hsv.h + 30) % 360, hsv.s, hsv.v));
  return colors;
}

function generateTriadic(hsv: HSV): string[] {
  const colors: string[] = [];
  colors.push(hsvToHex(hsv.h, hsv.s, hsv.v));
  colors.push(hsvToHex((hsv.h + 120) % 360, hsv.s, hsv.v));
  colors.push(hsvToHex((hsv.h + 240) % 360, hsv.s, hsv.v));
  colors.push(hsvToHex(hsv.h, hsv.s * 0.6, hsv.v * 0.85));
  colors.push(hsvToHex((hsv.h + 120) % 360, hsv.s * 0.6, hsv.v * 0.85));
  return colors;
}

function generateSplitComplementary(hsv: HSV): string[] {
  const colors: string[] = [];
  colors.push(hsvToHex(hsv.h, hsv.s, hsv.v));
  colors.push(hsvToHex((hsv.h + 150) % 360, hsv.s, hsv.v));
  colors.push(hsvToHex((hsv.h + 210) % 360, hsv.s, hsv.v));
  colors.push(hsvToHex(hsv.h, hsv.s * 0.7, hsv.v * 0.9));
  colors.push(hsvToHex((hsv.h + 150) % 360, hsv.s * 0.7, hsv.v * 0.9));
  return colors;
}

function generateMonochromatic(hsv: HSV): string[] {
  const colors: string[] = [];
  colors.push(hsvToHex(hsv.h, hsv.s, hsv.v * 0.3));
  colors.push(hsvToHex(hsv.h, hsv.s, hsv.v * 0.55));
  colors.push(hsvToHex(hsv.h, hsv.s, hsv.v));
  colors.push(hsvToHex(hsv.h, hsv.s * 0.6, hsv.v));
  colors.push(hsvToHex(hsv.h, hsv.s * 0.3, hsv.v));
  return colors;
}

const schemeGenerators: Record<SchemeType, (hsv: HSV) => string[]> = {
  complementary: generateComplementary,
  analogous: generateAnalogous,
  triadic: generateTriadic,
  splitComplementary: generateSplitComplementary,
  monochromatic: generateMonochromatic,
};

const schemeNames: Record<SchemeType, string> = {
  complementary: '互补色',
  analogous: '相似色',
  triadic: '三色',
  splitComplementary: '分裂互补',
  monochromatic: '单色',
};

export function generateColorSchemes(primaryHex: string): GeneratedScheme[] {
  const hsv = hexToHsv(primaryHex);
  const schemes: GeneratedScheme[] = [];

  (Object.keys(schemeGenerators) as SchemeType[]).forEach((type) => {
    schemes.push({
      type,
      name: schemeNames[type],
      colors: schemeGenerators[type](hsv),
    });
  });

  return schemes;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadJson(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateCssVariables(colors: string[]): string {
  const names = ['primary', 'secondary', 'accent', 'neutral', 'highlight'];
  return colors
    .map((color, i) => `--color-${names[i]}: ${color};`)
    .join('\n');
}
