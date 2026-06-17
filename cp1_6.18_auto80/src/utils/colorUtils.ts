export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  direction: 'to right' | 'to bottom' | 'to bottom right' | 'radial';
  color1: string;
  color2: string;
}

export interface ShadowConfig {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  opacity: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const hslToRgb = (h: number, s: number, l: number): RGB => {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; b = 0; }
  else if (hue < 120) { r = x; g = c; b = 0; }
  else if (hue < 180) { r = 0; g = c; b = x; }
  else if (hue < 240) { r = 0; g = x; b = c; }
  else if (hue < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => clamp(n, 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
};

const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
      case gn: h = ((bn - rn) / d + 2); break;
      case bn: h = ((rn - gn) / d + 4); break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hexToHsl = (hex: string): HSL | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

export const isValidHex = (hex: string): boolean => {
  return /^#?([a-f\d]{6}|[a-f\d]{3})$/i.test(hex.trim());
};

export const normalizeHex = (hex: string): string => {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return `#${h.toUpperCase()}`;
};

export const generateGradientColors = (baseHex: string, count: number): string[] => {
  const hsl = hexToHsl(baseHex);
  if (!hsl || count <= 1) return [baseHex];

  const colors: string[] = [];
  const step = 80 / (count - 1);
  for (let i = 0; i < count; i++) {
    const l = clamp(10 + i * step, 10, 90);
    colors.push(hslToHex(hsl.h, hsl.s, l));
  }
  return colors;
};

export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#121220' : '#FFFFFF';
};

export const generateGradientCSS = (config: GradientConfig): string => {
  if (config.type === 'radial') {
    return `background: radial-gradient(circle, ${config.color1}, ${config.color2});`;
  }
  return `background: linear-gradient(${config.direction}, ${config.color1}, ${config.color2});`;
};

export const generateShadowCSS = (config: ShadowConfig, colorHex: string = '#000000'): string => {
  const rgb = hexToRgb(colorHex);
  const alpha = clamp(config.opacity, 0, 1).toFixed(1);
  if (rgb) {
    return `box-shadow: ${config.offsetX}px ${config.offsetY}px ${config.blurRadius}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha});`;
  }
  return `box-shadow: ${config.offsetX}px ${config.offsetY}px ${config.blurRadius}px rgba(0, 0, 0, ${alpha});`;
};

export const getComplementaryColor = (hex: string): string => {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
};

export const getAnalogousColors = (hex: string): string[] => {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex, hex, hex];
  return [
    hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
    hex,
    hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
  ];
};
