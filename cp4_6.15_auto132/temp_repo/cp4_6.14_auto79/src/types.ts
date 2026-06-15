export interface Gradient {
  startColor: string;
  endColor: string;
  angle: number;
}

export interface PaletteItem {
  id: string;
  gradient: Gradient;
  createdAt: number;
}

export interface GradientStore {
  currentGradient: Gradient;
  palettes: PaletteItem[];
  setStartColor: (color: string) => void;
  setEndColor: (color: string) => void;
  setAngle: (angle: number) => void;
  setCurrentGradient: (g: Partial<Gradient>) => void;
  saveToPalette: () => void;
  deletePalette: (id: string) => void;
  reorderPalettes: (fromIndex: number, toIndex: number) => void;
}
