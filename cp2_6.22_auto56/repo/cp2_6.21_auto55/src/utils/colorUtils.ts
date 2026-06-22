import { hsl, rgb, lab, LabColor, HSLColor, RGBColor } from 'd3-color';

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export type ProductPart = 'body' | 'trim' | 'lining' | 'stitching';

export interface ColorConfig {
  body: string;
  trim: string;
  lining: string;
  stitching: string;
}

export type ProductType = 'shoe' | 'headphone' | 'backpack';

export const PART_LABELS: Record<ProductPart, string> = {
  body: '主体',
  trim: '饰边',
  lining: '内衬',
  stitching: '缝线'
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  shoe: '运动鞋',
  headphone: '耳机',
  backpack: '背包'
};

export const DEFAULT_COLORS: Record<ProductType, ColorConfig> = {
  shoe: {
    body: '#2563eb',
    trim: '#1e40af',
    lining: '#fbbf24',
    stitching: '#ffffff'
  },
  headphone: {
    body: '#1f2937',
    trim: '#4b5563',
    lining: '#10b981',
    stitching: '#f3f4f6'
  },
  backpack: {
    body: '#7c3aed',
    trim: '#5b21b6',
    lining: '#f97316',
    stitching: '#ffffff'
  }
};

const hexToRgb = (hex: string): RGBColor | null => {
  const c = rgb(hex);
  return c || null;
};

const rgbToLab = (r: number, g: number, b: number): LabColor => {
  return lab(rgb(r, g, b));
};

export const hexToLab = (hex: string): LabColor | null => {
  const rgbColor = hexToRgb(hex);
  if (!rgbColor) return null;
  return rgbToLab(rgbColor.r, rgbColor.g, rgbColor.b);
};

export const calculateDeltaE = (color1: string, color2: string): number => {
  const lab1 = hexToLab(color1);
  const lab2 = hexToLab(color2);
  
  if (!lab1 || !lab2) return 100;
  
  const dL = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  
  return Math.sqrt(dL * dL + da * da + db * db);
};

export const getDifferenceLevel = (deltaE: number): string => {
  if (deltaE <= 1) return '几乎不可察觉';
  if (deltaE <= 2) return '微小差异';
  if (deltaE <= 3.5) return '可察觉差异';
  if (deltaE <= 5) return '明显差异';
  return '较大差异';
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const color = hsl(h, s / 100, l / 100);
  return color.formatHex();
};

export const hexToHsl = (hex: string): HSL => {
  const color = hsl(hex);
  return {
    h: Math.round(color.h),
    s: Math.round(color.s * 100),
    l: Math.round(color.l * 100)
  };
};

export const isValidHex = (hex: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};

export const getHeatmapColor = (deltaE: number, maxDeltaE: number = 30): string => {
  const normalized = Math.min(deltaE / maxDeltaE, 1);
  
  if (normalized < 0.25) {
    const t = normalized / 0.25;
    return `rgb(0, 0, ${Math.round(128 + t * 127)})`;
  } else if (normalized < 0.5) {
    const t = (normalized - 0.25) / 0.25;
    return `rgb(0, ${Math.round(t * 255)}, 255)`;
  } else if (normalized < 0.75) {
    const t = (normalized - 0.5) / 0.25;
    return `rgb(${Math.round(t * 255)}, 255, ${Math.round(255 - t * 255)})`;
  } else {
    const t = (normalized - 0.75) / 0.25;
    return `rgb(255, ${Math.round(255 - t * 255)}, 0)`;
  }
};

export const calculateColorDifferences = (
  configA: ColorConfig,
  configB: ColorConfig
): Record<ProductPart, number> => {
  return {
    body: calculateDeltaE(configA.body, configB.body),
    trim: calculateDeltaE(configA.trim, configB.trim),
    lining: calculateDeltaE(configA.lining, configB.lining),
    stitching: calculateDeltaE(configA.stitching, configB.stitching)
  };
};

export const getAverageDeltaE = (differences: Record<ProductPart, number>): number => {
  const values = Object.values(differences);
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

export const generateColorPalette = (baseColor: string, count: number = 8): string[] => {
  const colors: string[] = [];
  const hslColor = hsl(baseColor);
  
  for (let i = 0; i < count; i++) {
    const hue = (hslColor.h + (i - count / 2) * 30 + 360) % 360;
    colors.push(hsl(hue, hslColor.s, hslColor.l).formatHex());
  }
  
  return colors;
};

export const PRESET_COLORS: string[] = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#1f2937', '#4b5563', '#6b7280', '#9ca3af',
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db'
];
