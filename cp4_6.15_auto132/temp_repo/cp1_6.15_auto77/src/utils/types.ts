export interface HSV {
  h: number;
  s: number;
  v: number;
}

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

export type PaletteType = 'complementary' | 'analogous' | 'triadic' | 'monochromatic';

export interface Palette {
  type: PaletteType;
  name: string;
  colors: string[];
}

export interface HistoryItem {
  id: string;
  primaryColor: string;
  palette: Palette;
  timestamp: number;
}
