export interface ColorSwatch {
  hex: string;
  rgb: { r: number; g: number; b: number };
  ratio: number;
}

export interface ImageItem {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  colors: ColorSwatch[];
  uploadedAt: number;
  progress: number;
}

export type ViewMode = 'gallery' | 'compare';
