export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface Color {
  id: string;
  hex: string;
  hsl: HSL;
  name?: string;
}

export interface Palette {
  colors: Color[];
  selectedColorId: string | null;
}

export type SchemeType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';

export interface Scheme {
  id: string;
  name: string;
  type: SchemeType;
  colors: Color[];
  baseColorId: string;
  createdAt: number;
}

export interface SavedScheme {
  id: string;
  name: string;
  type: SchemeType;
  colors: Color[];
  createdAt: number;
}

export type HueCategory = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'pink';

export interface FilterOptions {
  hueCategory: HueCategory | 'all';
  saturation: 'high' | 'low' | 'all';
  lightness: 'high' | 'low' | 'all';
}

export const HUE_CATEGORY_RANGES: Record<HueCategory, [number, number]> = {
  red: [0, 30],
  orange: [30, 60],
  yellow: [60, 90],
  green: [90, 150],
  cyan: [150, 190],
  blue: [190, 260],
  purple: [260, 330],
  pink: [330, 360],
};

export const SCHEME_TYPE_LABELS: Record<SchemeType, string> = {
  complementary: '互补',
  analogous: '类似',
  triadic: '三色',
  'split-complementary': '分裂互补',
};
