export interface PresetColor {
  name: string;
  hex: string;
}

export interface AddColor {
  id: string;
  color: PresetColor;
}

export interface Recipe {
  id: string;
  name: string;
  baseColor: PresetColor;
  addColors: AddColor[];
  ratios: number[];
  mixedColor: string;
  isFavorite: boolean;
  createdAt: number;
}

export interface PaletteState {
  baseColor: PresetColor;
  addColors: AddColor[];
  ratios: number[];
  recipes: Recipe[];
  searchKeyword: string;
  toast: string | null;
}
