export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface Color {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  frequency: number;
}

export type PaletteType = 'extracted' | 'monochromatic' | 'complementary' | 'triadic';

export type GeneratedPaletteType = 'monochromatic' | 'complementary' | 'triadic';

export interface SavedPalette {
  id: string;
  name: string;
  tags: string[];
  colors: Color[];
  type: PaletteType;
  createdAt: number;
}

export type Palette = SavedPalette;

export type ThemeMode = 'light' | 'dark';

export interface CurrentPalettes {
  monochromatic: Color[];
  complementary: Color[];
  triadic: Color[];
  lockedIndices: {
    monochromatic: number | null;
    complementary: number | null;
    triadic: number | null;
  };
}

export type Palettes = {
  extracted: Color[];
  monochromatic: Color[];
  complementary: Color[];
  triadic: Color[];
};

export type GeneratedPalettes = {
  monochromatic: Color[];
  complementary: Color[];
  triadic: Color[];
};

export type LockedIndices = {
  monochromatic: number | null;
  complementary: number | null;
  triadic: number | null;
};
