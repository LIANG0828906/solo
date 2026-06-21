export interface ColorScheme {
  id: string;
  name: string;
  type: 'complementary' | 'analogous';
  colors: string[];
  colorMap: Record<string, string>;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
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

function rgbToHsl(r: number, g: number, b: number): HSL {
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

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
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

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

function normalizeHex(color: string): string {
  let c = color.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  return '#' + c.toLowerCase();
}

function generateSchemeId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createComplementaryScheme(
  colors: string[],
  variant: number
): { colors: string[]; colorMap: Record<string, string> } {
  const newColors: string[] = [];
  const colorMap: Record<string, string> = {};

  for (const color of colors) {
    const { r, g, b } = hexToRgb(color);
    const { h, s, l } = rgbToHsl(r, g, b);

    let newH = (h + 180) % 360;
    let newS = s;
    let newL = l;

    switch (variant) {
      case 0:
        newS = Math.min(s * 1.1, 100);
        newL = l;
        break;
      case 1:
        newS = Math.max(s * 0.85, 10);
        newL = Math.min(l * 1.15, 90);
        break;
      case 2:
        newS = Math.min(s * 1.2, 100);
        newL = Math.max(l * 0.85, 10);
        break;
    }

    const newColor = hslToHex(newH, newS, newL);
    const normColor = normalizeHex(color);
    newColors.push(newColor);
    colorMap[normColor] = newColor;
  }

  return { colors: newColors, colorMap };
}

function createAnalogousScheme(
  colors: string[],
  variant: number
): { colors: string[]; colorMap: Record<string, string> } {
  const newColors: string[] = [];
  const colorMap: Record<string, string> = {};

  const offsets = [30, -30, 45];
  const offset = offsets[variant] || 30;

  for (const color of colors) {
    const { r, g, b } = hexToRgb(color);
    const { h, s, l } = rgbToHsl(r, g, b);

    let newH = (h + offset + 360) % 360;
    let newS = s;
    let newL = l;

    if (variant === 2) {
      newS = Math.max(s * 0.9, 5);
      newL = Math.min(l * 1.1, 95);
    }

    const newColor = hslToHex(newH, newS, newL);
    const normColor = normalizeHex(color);
    newColors.push(newColor);
    colorMap[normColor] = newColor;
  }

  return { colors: newColors, colorMap };
}

const complementaryNames = ['暖阳互补', '柔和互补', '深邃互补'];
const analogousNames = ['暖调类似', '冷调类似', '明亮类似'];

export function generateColorSchemes(usedColors: string[]): ColorScheme[] {
  if (usedColors.length === 0) {
    return [];
  }

  const schemes: ColorScheme[] = [];

  for (let i = 0; i < 3; i++) {
    const result = createComplementaryScheme(usedColors, i);
    schemes.push({
      id: generateSchemeId(),
      name: complementaryNames[i],
      type: 'complementary',
      colors: result.colors,
      colorMap: result.colorMap
    });
  }

  for (let i = 0; i < 3; i++) {
    const result = createAnalogousScheme(usedColors, i);
    schemes.push({
      id: generateSchemeId(),
      name: analogousNames[i],
      type: 'analogous',
      colors: result.colors,
      colorMap: result.colorMap
    });
  }

  return schemes;
}

export function generateGradientString(colors: string[]): string {
  if (colors.length === 0) return '';
  if (colors.length === 1) return colors[0];

  const stops = colors.map((color, index) => {
    const percent = (index / (colors.length - 1)) * 100;
    return `${color} ${percent.toFixed(1)}%`;
  });

  return `linear-gradient(to right, ${stops.join(', ')})`;
}
