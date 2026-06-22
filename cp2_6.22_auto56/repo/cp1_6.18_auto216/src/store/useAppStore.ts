import { create } from 'zustand';
import type { Building, SchemeType, SolarResult } from '@/data/buildingModel';
import { BUILDING_SCHEMES } from '@/data/buildingModel';

interface AppState {
  buildings: Building[];
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  currentHour: number;
  currentScheme: SchemeType;
  isTransitioning: boolean;
  solarResults: SolarResult[];
  cameraPreset: 'default' | 'top' | 'side';
  setSelectedBuilding: (id: string | null) => void;
  setHoveredBuilding: (id: string | null) => void;
  setCurrentHour: (hour: number) => void;
  switchScheme: (scheme: SchemeType) => void;
  updateSolarResults: (results: SolarResult[]) => void;
  setTransitioning: (val: boolean) => void;
  setCameraPreset: (preset: 'default' | 'top' | 'side') => void;
}

export const useAppStore = create<AppState>((set) => ({
  buildings: BUILDING_SCHEMES.box.buildings,
  selectedBuildingId: null,
  hoveredBuildingId: null,
  currentHour: 12,
  currentScheme: 'box',
  isTransitioning: false,
  solarResults: [],
  cameraPreset: 'default',
  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setHoveredBuilding: (id) => set({ hoveredBuildingId: id }),
  setCurrentHour: (hour) => set({ currentHour: hour }),
  switchScheme: (scheme) => {
    const newBuildings = BUILDING_SCHEMES[scheme].buildings;
    set({ currentScheme: scheme, isTransitioning: true, buildings: newBuildings, selectedBuildingId: null, hoveredBuildingId: null });
    setTimeout(() => set({ isTransitioning: false }), 2000);
  },
  updateSolarResults: (results) => set({ solarResults: results }),
  setTransitioning: (val) => set({ isTransitioning: val }),
  setCameraPreset: (preset) => set({ cameraPreset: preset }),
}));
