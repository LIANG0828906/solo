export type ThemeType = 'gothic' | 'elf' | 'steampunk';

export interface ThemeConfig {
  floorColor: string;
  wallColor: string;
  tableColor: string;
  barColor: string;
  decorationColor: string;
  ambientColor: string;
  lightColor: string;
}

export const themeConfigs: Record<ThemeType, ThemeConfig> = {
  gothic: {
    floorColor: '#1a1228',
    wallColor: '#2d1b3d',
    tableColor: '#3d2a4f',
    barColor: '#4a1a6b',
    decorationColor: '#8b0000',
    ambientColor: '#1a0a2e',
    lightColor: '#ff4444'
  },
  elf: {
    floorColor: '#1a3d2e',
    wallColor: '#2d5a3d',
    tableColor: '#4a7c59',
    barColor: '#2e8b57',
    decorationColor: '#daa520',
    ambientColor: '#0a1f0a',
    lightColor: '#98fb98'
  },
  steampunk: {
    floorColor: '#3d2817',
    wallColor: '#5c3a1e',
    tableColor: '#8b6914',
    barColor: '#cd853f',
    decorationColor: '#b87333',
    ambientColor: '#2a1a0a',
    lightColor: '#ffa500'
  }
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const transitionTheme = (
  from: ThemeConfig,
  to: ThemeConfig,
  progress: number
): ThemeConfig => {
  const t = Math.max(0, Math.min(1, progress));
  const keys = Object.keys(from) as (keyof ThemeConfig)[];
  const result = {} as ThemeConfig;
  for (const key of keys) {
    const fromRgb = hexToRgb(from[key]);
    const toRgb = hexToRgb(to[key]);
    const r = fromRgb.r + (toRgb.r - fromRgb.r) * t;
    const g = fromRgb.g + (toRgb.g - fromRgb.g) * t;
    const b = fromRgb.b + (toRgb.b - fromRgb.b) * t;
    result[key] = rgbToHex(r, g, b);
  }
  return result;
};
