export interface WrinkleData {
  intensity: number;
  x: number;
  y: number;
  normalized: number;
}

export interface WrinkleStats {
  averageIntensity: number;
  maxIntensity: number;
  maxRegionX: number;
  maxRegionY: number;
  gridWidth: number;
  gridHeight: number;
}

export interface AppState {
  capturedImage: string | null;
  sensitivity: number;
  wrinkleStats: WrinkleStats | null;
  isLoading: boolean;
  setCapturedImage: (image: string | null) => void;
  setSensitivity: (value: number) => void;
  setWrinkleStats: (stats: WrinkleStats | null) => void;
  setIsLoading: (loading: boolean) => void;
  resetAll: () => void;
}
