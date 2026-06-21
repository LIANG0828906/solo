import { create } from 'zustand';

export interface ColorInfo {
  rgb: number[];
  hsl: number[];
  hex: string;
  name: string;
}

export interface ColorPosition {
  angle: number;
  x: number;
  y: number;
  name: string;
  rgb: number[];
  hex: string;
}

export interface Recommendation {
  colors: number[][];
  colors_info: ColorInfo[];
  reason: string;
}

export interface HarmonyResult {
  score: number;
  harmonyType: string;
  description: string;
  colorPositions: ColorPosition[];
  recommendations: Recommendation[];
}

interface StoreState {
  currentImage: string | null;
  primaryColors: ColorInfo[];
  secondaryColors: ColorInfo[];
  harmonyResult: HarmonyResult | null;
  selectedRecommendation: number | null;
  isAnalyzing: boolean;
  isExtracting: boolean;
}

interface StoreActions {
  setImage: (img: string | null) => void;
  setPrimaryColors: (colors: ColorInfo[]) => void;
  setSecondaryColors: (colors: ColorInfo[]) => void;
  setHarmonyResult: (result: HarmonyResult | null) => void;
  setSelectedRecommendation: (index: number | null) => void;
  setIsAnalyzing: (val: boolean) => void;
  setIsExtracting: (val: boolean) => void;
  reset: () => void;
}

const initialState: StoreState = {
  currentImage: null,
  primaryColors: [],
  secondaryColors: [],
  harmonyResult: null,
  selectedRecommendation: null,
  isAnalyzing: false,
  isExtracting: false,
};

export const useStore = create<StoreState & StoreActions>()((set) => ({
  ...initialState,
  setImage: (img) => set({ currentImage: img }),
  setPrimaryColors: (colors) => set({ primaryColors: colors }),
  setSecondaryColors: (colors) => set({ secondaryColors: colors }),
  setHarmonyResult: (result) => set({ harmonyResult: result }),
  setSelectedRecommendation: (index) => set({ selectedRecommendation: index }),
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  setIsExtracting: (val) => set({ isExtracting: val }),
  reset: () => set(initialState),
}));
