export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export type HarmonyType = 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic';

export interface Palette {
  id: string;
  name: string;
  type: HarmonyType;
  colors: HSLColor[];
  locked: boolean[];
  createdAt: number;
}

export interface FavoriteItem {
  id: string;
  name: string;
  palette: Palette;
  createdAt: number;
}

export interface HoverInfo {
  x: number;
  y: number;
  color: HSLColor;
  visible: boolean;
}

export const HARMONY_NAMES: Record<HarmonyType, string> = {
  monochromatic: '单色',
  complementary: '互补',
  analogous: '邻近',
  triadic: '三分相',
  tetradic: '四分相',
};

export const HARMONY_DESCRIPTIONS: Record<HarmonyType, string> = {
  monochromatic: '同一色相的不同明暗变化',
  complementary: '色环上180度对立的颜色',
  analogous: '色环上相邻的3-5种颜色',
  triadic: '色环上等距120度的三种颜色',
  tetradic: '色环上等距90度的四种颜色',
};
