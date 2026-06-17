import { create } from 'zustand';
export interface ColorToken {
  name: string;
  label: string;
  hue: number;
  saturation: number;
  lightness: number;
}

export interface SpacingToken {
  name: string;
  label: string;
  value: number;
}

export interface BorderRadiusToken {
  name: string;
  label: string;
  value: number;
}

export interface ShadowToken {
  name: string;
  label: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface DesignTokenState {
  colors: Record<string, ColorToken>;
  spacing: Record<string, SpacingToken>;
  borderRadius: Record<string, BorderRadiusToken>;
  shadows: Record<string, ShadowToken>;
  updateColor: (key: string, updates: Partial<Pick<ColorToken, 'hue' | 'saturation' | 'lightness'>>) => void;
  updateSpacing: (key: string, value: number) => void;
  updateBorderRadius: (key: string, value: number) => void;
  updateShadow: (key: string, updates: Partial<Pick<ShadowToken, 'blur' | 'offsetX' | 'offsetY'>>) => void;
  applyPreset: (preset: PresetName) => void;
  resetAll: () => void;
}

export type PresetName = 'soft' | 'modern' | 'retro';

export function hslToCss(token: ColorToken): string {
  return `hsl(${token.hue}, ${token.saturation}%, ${token.lightness}%)`;
}

export function shadowToCss(token: ShadowToken): string {
  return `${token.offsetX}px ${token.offsetY}px ${token.blur}px rgba(0,0,0,0.15)`;
}

export function shadowToCssValue(blur: number, offsetX: number, offsetY: number): string {
  return `${offsetX}px ${offsetY}px ${blur}px rgba(0,0,0,0.15)`;
}

const DEFAULT_COLORS: Record<string, ColorToken> = {
  primary: { name: 'primary', label: '主色', hue: 230, saturation: 70, lightness: 55 },
  secondary: { name: 'secondary', label: '辅色', hue: 270, saturation: 50, lightness: 60 },
  success: { name: 'success', label: '成功色', hue: 145, saturation: 60, lightness: 45 },
  danger: { name: 'danger', label: '危险色', hue: 0, saturation: 70, lightness: 55 },
  gray1: { name: 'gray1', label: '灰色阶1', hue: 220, saturation: 10, lightness: 90 },
  gray2: { name: 'gray2', label: '灰色阶2', hue: 220, saturation: 10, lightness: 60 },
  gray3: { name: 'gray3', label: '灰色阶3', hue: 220, saturation: 10, lightness: 40 },
  background: { name: 'background', label: '背景色', hue: 220, saturation: 15, lightness: 98 },
};

const DEFAULT_SPACING: Record<string, SpacingToken> = {
  xs: { name: 'xs', label: 'XS', value: 4 },
  sm: { name: 'sm', label: 'SM', value: 8 },
  md: { name: 'md', label: 'MD', value: 16 },
  lg: { name: 'lg', label: 'LG', value: 24 },
};

const DEFAULT_BORDER_RADIUS: Record<string, BorderRadiusToken> = {
  sm: { name: 'sm', label: 'SM', value: 4 },
  md: { name: 'md', label: 'MD', value: 8 },
  lg: { name: 'lg', label: 'LG', value: 12 },
  pill: { name: 'pill', label: 'Pill', value: 9999 },
};

const DEFAULT_SHADOWS: Record<string, ShadowToken> = {
  sm: { name: 'sm', label: 'SM', blur: 4, offsetX: 0, offsetY: 1 },
  md: { name: 'md', label: 'MD', blur: 8, offsetX: 0, offsetY: 2 },
  lg: { name: 'lg', label: 'LG', blur: 16, offsetX: 0, offsetY: 4 },
  xl: { name: 'xl', label: 'XL', blur: 24, offsetX: 0, offsetY: 8 },
};

const PRESETS: Record<PresetName, {
  colors: Record<string, ColorToken>;
  spacing: Record<string, SpacingToken>;
  borderRadius: Record<string, BorderRadiusToken>;
  shadows: Record<string, ShadowToken>;
}> = {
  soft: {
    colors: {
      primary: { name: 'primary', label: '主色', hue: 200, saturation: 45, lightness: 65 },
      secondary: { name: 'secondary', label: '辅色', hue: 280, saturation: 35, lightness: 70 },
      success: { name: 'success', label: '成功色', hue: 160, saturation: 40, lightness: 55 },
      danger: { name: 'danger', label: '危险色', hue: 10, saturation: 50, lightness: 65 },
      gray1: { name: 'gray1', label: '灰色阶1', hue: 210, saturation: 8, lightness: 92 },
      gray2: { name: 'gray2', label: '灰色阶2', hue: 210, saturation: 8, lightness: 65 },
      gray3: { name: 'gray3', label: '灰色阶3', hue: 210, saturation: 8, lightness: 42 },
      background: { name: 'background', label: '背景色', hue: 210, saturation: 12, lightness: 97 },
    },
    spacing: {
      xs: { name: 'xs', label: 'XS', value: 6 },
      sm: { name: 'sm', label: 'SM', value: 12 },
      md: { name: 'md', label: 'MD', value: 20 },
      lg: { name: 'lg', label: 'LG', value: 32 },
    },
    borderRadius: {
      sm: { name: 'sm', label: 'SM', value: 8 },
      md: { name: 'md', label: 'MD', value: 14 },
      lg: { name: 'lg', label: 'LG', value: 20 },
      pill: { name: 'pill', label: 'Pill', value: 9999 },
    },
    shadows: {
      sm: { name: 'sm', label: 'SM', blur: 6, offsetX: 0, offsetY: 2 },
      md: { name: 'md', label: 'MD', blur: 12, offsetX: 0, offsetY: 4 },
      lg: { name: 'lg', label: 'LG', blur: 20, offsetX: 0, offsetY: 6 },
      xl: { name: 'xl', label: 'XL', blur: 28, offsetX: 0, offsetY: 10 },
    },
  },
  modern: {
    colors: {
      primary: { name: 'primary', label: '主色', hue: 260, saturation: 80, lightness: 55 },
      secondary: { name: 'secondary', label: '辅色', hue: 190, saturation: 70, lightness: 50 },
      success: { name: 'success', label: '成功色', hue: 155, saturation: 70, lightness: 42 },
      danger: { name: 'danger', label: '危险色', hue: 350, saturation: 80, lightness: 50 },
      gray1: { name: 'gray1', label: '灰色阶1', hue: 220, saturation: 12, lightness: 88 },
      gray2: { name: 'gray2', label: '灰色阶2', hue: 220, saturation: 12, lightness: 55 },
      gray3: { name: 'gray3', label: '灰色阶3', hue: 220, saturation: 12, lightness: 35 },
      background: { name: 'background', label: '背景色', hue: 230, saturation: 18, lightness: 97 },
    },
    spacing: {
      xs: { name: 'xs', label: 'XS', value: 4 },
      sm: { name: 'sm', label: 'SM', value: 8 },
      md: { name: 'md', label: 'MD', value: 16 },
      lg: { name: 'lg', label: 'LG', value: 28 },
    },
    borderRadius: {
      sm: { name: 'sm', label: 'SM', value: 4 },
      md: { name: 'md', label: 'MD', value: 8 },
      lg: { name: 'lg', label: 'LG', value: 12 },
      pill: { name: 'pill', label: 'Pill', value: 9999 },
    },
    shadows: {
      sm: { name: 'sm', label: 'SM', blur: 2, offsetX: 0, offsetY: 1 },
      md: { name: 'md', label: 'MD', blur: 6, offsetX: 0, offsetY: 2 },
      lg: { name: 'lg', label: 'LG', blur: 12, offsetX: 0, offsetY: 4 },
      xl: { name: 'xl', label: 'XL', blur: 20, offsetX: 0, offsetY: 6 },
    },
  },
  retro: {
    colors: {
      primary: { name: 'primary', label: '主色', hue: 30, saturation: 65, lightness: 50 },
      secondary: { name: 'secondary', label: '辅色', hue: 15, saturation: 55, lightness: 55 },
      success: { name: 'success', label: '成功色', hue: 80, saturation: 50, lightness: 42 },
      danger: { name: 'danger', label: '危险色', hue: 0, saturation: 55, lightness: 48 },
      gray1: { name: 'gray1', label: '灰色阶1', hue: 35, saturation: 10, lightness: 85 },
      gray2: { name: 'gray2', label: '灰色阶2', hue: 35, saturation: 10, lightness: 55 },
      gray3: { name: 'gray3', label: '灰色阶3', hue: 35, saturation: 10, lightness: 35 },
      background: { name: 'background', label: '背景色', hue: 40, saturation: 18, lightness: 95 },
    },
    spacing: {
      xs: { name: 'xs', label: 'XS', value: 4 },
      sm: { name: 'sm', label: 'SM', value: 10 },
      md: { name: 'md', label: 'MD', value: 18 },
      lg: { name: 'lg', label: 'LG', value: 26 },
    },
    borderRadius: {
      sm: { name: 'sm', label: 'SM', value: 2 },
      md: { name: 'md', label: 'MD', value: 4 },
      lg: { name: 'lg', label: 'LG', value: 6 },
      pill: { name: 'pill', label: 'Pill', value: 9999 },
    },
    shadows: {
      sm: { name: 'sm', label: 'SM', blur: 3, offsetX: 1, offsetY: 1 },
      md: { name: 'md', label: 'MD', blur: 6, offsetX: 2, offsetY: 2 },
      lg: { name: 'lg', label: 'LG', blur: 10, offsetX: 3, offsetY: 3 },
      xl: { name: 'xl', label: 'XL', blur: 16, offsetX: 4, offsetY: 4 },
    },
  },
};

export const useDesignTokenStore = create<DesignTokenState>((set) => ({
  colors: JSON.parse(JSON.stringify(DEFAULT_COLORS)),
  spacing: JSON.parse(JSON.stringify(DEFAULT_SPACING)),
  borderRadius: JSON.parse(JSON.stringify(DEFAULT_BORDER_RADIUS)),
  shadows: JSON.parse(JSON.stringify(DEFAULT_SHADOWS)),

  updateColor: (key, updates) =>
    set((state) => ({
      colors: {
        ...state.colors,
        [key]: { ...state.colors[key], ...updates },
      },
    })),

  updateSpacing: (key, value) =>
    set((state) => ({
      spacing: {
        ...state.spacing,
        [key]: { ...state.spacing[key], value },
      },
    })),

  updateBorderRadius: (key, value) =>
    set((state) => ({
      borderRadius: {
        ...state.borderRadius,
        [key]: { ...state.borderRadius[key], value },
      },
    })),

  updateShadow: (key, updates) =>
    set((state) => ({
      shadows: {
        ...state.shadows,
        [key]: { ...state.shadows[key], ...updates },
      },
    })),

  applyPreset: (preset) => {
    const p = PRESETS[preset];
    if (!p) return;
    set({
      colors: JSON.parse(JSON.stringify(p.colors)),
      spacing: JSON.parse(JSON.stringify(p.spacing)),
      borderRadius: JSON.parse(JSON.stringify(p.borderRadius)),
      shadows: JSON.parse(JSON.stringify(p.shadows)),
    });
  },

  resetAll: () =>
    set({
      colors: JSON.parse(JSON.stringify(DEFAULT_COLORS)),
      spacing: JSON.parse(JSON.stringify(DEFAULT_SPACING)),
      borderRadius: JSON.parse(JSON.stringify(DEFAULT_BORDER_RADIUS)),
      shadows: JSON.parse(JSON.stringify(DEFAULT_SHADOWS)),
    }),
}));

export { DEFAULT_COLORS, DEFAULT_SPACING, DEFAULT_BORDER_RADIUS, DEFAULT_SHADOWS };
