import { create } from 'zustand';
import type { BuildingData, CityConfig, NoiseType, TooltipData } from '@/types';
import { defaultCityConfig } from '@/data/uiConfig';

interface AppState {
  cityConfig: CityConfig;
  buildings: BuildingData[];
  fps: number;
  visibleBuildings: number;
  selectedBuildingId: number | null;
  hoveredBuildingId: number | null;
  tooltipData: TooltipData | null;
  animationKey: number;
  isAnimating: boolean;

  setNoiseType: (t: NoiseType) => void;
  setDensity: (v: number) => void;
  setHeightScale: (v: number) => void;
  setColorContrast: (v: number) => void;
  setBuildings: (buildings: BuildingData[]) => void;
  updateFPS: (v: number) => void;
  updateVisibleBuildings: (v: number) => void;
  selectBuilding: (id: number | null) => void;
  hoverBuilding: (id: number | null, tooltip?: TooltipData | null) => void;
  setAnimating: (animating: boolean) => void;
  triggerRegeneration: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  cityConfig: { ...defaultCityConfig },
  buildings: [],
  fps: 60,
  visibleBuildings: 0,
  selectedBuildingId: null,
  hoveredBuildingId: null,
  tooltipData: null,
  animationKey: 0,
  isAnimating: false,

  setNoiseType: (t) => {
    const prev = get().cityConfig.noiseType;
    if (prev !== t) {
      set({
        cityConfig: { ...get().cityConfig, noiseType: t },
        animationKey: get().animationKey + 1,
        isAnimating: true,
      });
    }
  },

  setDensity: (v) => {
    set({
      cityConfig: { ...get().cityConfig, density: v },
      animationKey: get().animationKey + 1,
    });
  },

  setHeightScale: (v) => {
    set({
      cityConfig: { ...get().cityConfig, heightScale: v },
      animationKey: get().animationKey + 1,
    });
  },

  setColorContrast: (v) => {
    set({
      cityConfig: { ...get().cityConfig, colorContrast: v },
    });
  },

  setBuildings: (buildings) => set({ buildings }),

  updateFPS: (v) => set({ fps: v }),

  updateVisibleBuildings: (v) => set({ visibleBuildings: v }),

  selectBuilding: (id) => {
    const currentId = get().selectedBuildingId;
    const newId = currentId === id ? null : id;

    set({
      selectedBuildingId: newId,
      buildings: get().buildings.map(b => ({
        ...b,
        selected: b.id === newId,
        color: b.id === newId ? '#FF6B6B' : b.baseColor,
        position: [
          b.position[0],
          b.id === newId ? 0.5 : 0,
          b.position[2],
        ],
      })),
    });
  },

  hoverBuilding: (id, tooltip) => {
    set({
      hoveredBuildingId: id,
      tooltipData: tooltip ?? null,
      buildings: get().buildings.map(b => ({
        ...b,
        hovered: b.id === id,
      })),
    });
  },

  setAnimating: (animating) => set({ isAnimating: animating }),

  triggerRegeneration: () => set({ animationKey: get().animationKey + 1 }),
}));

export default useAppStore;
