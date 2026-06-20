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

export interface Palette {
  id: string;
  name: string;
  colors: Color[];
  type: 'extracted' | 'monochromatic' | 'complementary' | 'triadic';
  createdAt: number;
}
