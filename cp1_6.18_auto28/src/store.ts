import { create } from 'zustand';
import type { TerrainData, MarkerData, ColorTheme, PresetType } from './types';

const defaultColorTheme: ColorTheme = {
  id: 'default',
  name: '蓝红渐变',
  lowColor: '#3498DB',
  highColor: '#E74C3C',
};

const colorThemes: ColorTheme[] = [
  defaultColorTheme,
  {
    id: 'green',
    name: '绿黄渐变',
    lowColor: '#2ECC71',
    highColor: '#F1C40F',
  },
  {
    id: 'purple',
    name: '紫橙渐变',
    lowColor: '#9B59B6',
    highColor: '#E67E22',
  },
];

interface AppState {
  terrainData: TerrainData | null;
  selectedPreset: PresetType | null;
  colorTheme: ColorTheme;
  colorThemes: ColorTheme[];
  selectedMarker: MarkerData | null;
  isLoading: boolean;
  error: string | null;
  cameraResetTrigger: number;

  setTerrainData: (data: TerrainData | null) => void;
  setSelectedPreset: (preset: PresetType | null) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setSelectedMarker: (marker: MarkerData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  triggerCameraReset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  terrainData: null,
  selectedPreset: null,
  colorTheme: defaultColorTheme,
  colorThemes,
  selectedMarker: null,
  isLoading: false,
  error: null,
  cameraResetTrigger: 0,

  setTerrainData: (data) => set({ terrainData: data }),
  setSelectedPreset: (preset) => set({ selectedPreset: preset }),
  setColorTheme: (theme) => set({ colorTheme: theme }),
  setSelectedMarker: (marker) => set({ selectedMarker: marker }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),
}));
