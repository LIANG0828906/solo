import { create } from 'zustand';
import { BuildingParams } from '../utils/shadowSolver';

interface BuildingState {
  buildings: BuildingParams[];
  selectedBuildingId: string | null;
  sunAltitude: number;
  sunAzimuth: number;
  shadowEnabled: boolean;
  renderInfo: { fps: number; frame: number };

  selectBuilding: (id: string | null) => void;
  updateBuildingHeight: (id: string, height: number) => void;
  updateBuildingPosition: (id: string, x: number, z: number) => void;
  setSunAltitude: (deg: number) => void;
  setSunAzimuth: (deg: number) => void;
  toggleShadow: (enabled: boolean) => void;
  setRenderInfo: (fps: number, frame: number) => void;
}

function generateDefaultBuildings(): BuildingParams[] {
  const buildings: BuildingParams[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const id = `bld-${i}-${j}`;
      buildings.push({
        id,
        x: (i - 1) * 40,
        z: (j - 1) * 40,
        width: 20,
        depth: 20,
        height: Math.floor(20 + Math.random() * 60),
      });
    }
  }
  return buildings;
}

export const useBuildingStore = create<BuildingState>((set) => ({
  buildings: generateDefaultBuildings(),
  selectedBuildingId: null,
  sunAltitude: 45,
  sunAzimuth: 180,
  shadowEnabled: true,
  renderInfo: { fps: 0, frame: 0 },

  selectBuilding: (id) => set({ selectedBuildingId: id }),

  updateBuildingHeight: (id, height) =>
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, height: Math.max(10, Math.min(100, height)) } : b
      ),
    })),

  updateBuildingPosition: (id, x, z) =>
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, x, z } : b
      ),
    })),

  setSunAltitude: (deg) => set({ sunAltitude: Math.max(15, Math.min(75, deg)) }),
  setSunAzimuth: (deg) => set({ sunAzimuth: ((deg % 360) + 360) % 360 }),
  toggleShadow: (enabled) => set({ shadowEnabled: enabled }),
  setRenderInfo: (fps, frame) => set({ renderInfo: { fps, frame } }),
}));
