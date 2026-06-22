export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorScheme {
  id: string;
  colors: [string, string, string];
  name: string;
}

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
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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

export function hslToRgb(h: number, s: number, l: number): RGB {
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

export function averageColors(colors: string[]): string {
  if (colors.length === 0) return '#3E2723';
  const rgbs = colors.map(hexToRgb);
  const avg = rgbs.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
    { r: 0, g: 0, b: 0 }
  );
  return rgbToHex(avg.r / rgbs.length, avg.g / rgbs.length, avg.b / rgbs.length);
}

export function complementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const comp = hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
  return rgbToHex(comp.r, comp.g, comp.b);
}

export function analogousColors(hex: string): [string, string, string] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const c1 = hslToRgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l);
  const c2 = rgb;
  const c3 = hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l);
  return [rgbToHex(c1.r, c1.g, c1.b), rgbToHex(c2.r, c2.g, c2.b), rgbToHex(c3.r, c3.g, c3.b)];
}

export function triadicColors(hex: string): [string, string, string] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const c1 = hslToRgb(hsl.h, hsl.s, hsl.l);
  const c2 = hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l);
  const c3 = hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l);
  return [rgbToHex(c1.r, c1.g, c1.b), rgbToHex(c2.r, c2.g, c2.b), rgbToHex(c3.r, c3.g, c3.b)];
}

export function splitComplementary(hex: string): [string, string, string] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const c1 = rgb;
  const c2 = hslToRgb((hsl.h + 150) % 360, hsl.s, hsl.l);
  const c3 = hslToRgb((hsl.h + 210) % 360, hsl.s, hsl.l);
  return [rgbToHex(c1.r, c1.g, c1.b), rgbToHex(c2.r, c2.g, c2.b), rgbToHex(c3.r, c3.g, c3.b)];
}

export function tetradicColors(hex: string): [string, string, string] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const c1 = rgb;
  const c2 = hslToRgb((hsl.h + 90) % 360, hsl.s, hsl.l);
  const c3 = hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
  return [rgbToHex(c1.r, c1.g, c1.b), rgbToHex(c2.r, c2.g, c2.b), rgbToHex(c3.r, c3.g, c3.b)];
}

export function getAverageColorFromCanvas(
  canvasEl: HTMLCanvasElement | null,
  edgeWidth: number = 10
): string {
  if (!canvasEl) return '#3E2723';
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return '#3E2723';

  const w = canvasEl.width;
  const h = canvasEl.height;

  try {
    const top = ctx.getImageData(0, 0, w, edgeWidth).data;
    const bottom = ctx.getImageData(0, h - edgeWidth, w, edgeWidth).data;
    const left = ctx.getImageData(0, 0, edgeWidth, h).data;
    const right = ctx.getImageData(w - edgeWidth, 0, edgeWidth, h).data;

    const all = [top, bottom, left, right];
    let r = 0, g = 0, b = 0, count = 0;

    for (const data of all) {
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
    return rgbToHex(r / count, g / count, b / count);
  } catch {
    return '#3E2723';
  }
}

export function generateColorSchemes(baseHexColors: string[]): ColorScheme[] {
  const avg = averageColors(baseHexColors.length > 0 ? baseHexColors : ['#3E2723']);
  const compAvg = complementaryColor(avg);
  const analog = analogousColors(avg);
  const triadic = triadicColors(avg);
  const split = splitComplementary(avg);
  const tetrad = tetradicColors(avg);

  return [
    {
      id: 'scheme-1',
      name: '邻近色',
      colors: analog,
    },
    {
      id: 'scheme-2',
      name: '主色+补色',
      colors: [avg, compAvg, averageColors([avg, compAvg])],
    },
    {
      id: 'scheme-3',
      name: '三色组',
      colors: triadic,
    },
    {
      id: 'scheme-4',
      name: '分裂补色',
      colors: split,
    },
    {
      id: 'scheme-5',
      name: '四色组',
      colors: tetrad,
    },
  ];
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function pickTextColor(bg: string): string {
  return getLuminance(bg) > 0.5 ? '#1A1A1A' : '#E8D5B7';
}
