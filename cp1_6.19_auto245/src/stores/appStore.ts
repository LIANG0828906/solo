import { create } from 'zustand';
import * as THREE from 'three';
import type { ParticleSnapshot } from '../modules/particleSystem';
import type { BuildingData } from '../modules/modelManager';

export interface ParticleMetrics {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number;
  life: number;
  active: boolean;
}

export interface BuildingPressure {
  buildingId: string;
  windward: number;
  leeward: number;
  difference: number;
}

export interface VentilationMetrics {
  averageWindSpeed: number;
  turbulenceIntensity: number;
  calmZoneRatio: number;
  calmZoneParticleIndices: number[];
  topPressureDiffBuildings: BuildingPressure[];
}

interface AppState {
  buildings: BuildingData[];
  currentSnapshot: ParticleSnapshot | null;
  buildingPressures: Map<string, BuildingPressure>;
  metrics: VentilationMetrics;
  selectedBuildingId: string | null;
  isEmitting: boolean;
  setBuildings: (buildings: BuildingData[]) => void;
  setCurrentSnapshot: (snapshot: ParticleSnapshot) => void;
  setBuildingPressure: (buildingId: string, pressure: Omit<BuildingPressure, 'buildingId'>) => void;
  setMetrics: (metrics: Partial<VentilationMetrics>) => void;
  selectBuilding: (id: string | null) => void;
  setIsEmitting: (emitting: boolean) => void;
  addBuilding: (building: Omit<BuildingData, 'id'>) => void;
  deleteBuilding: (id: string) => void;
  updateBuilding: (id: string, updates: Partial<BuildingData>) => void;
}

const initialMetrics: VentilationMetrics = {
  averageWindSpeed: 0,
  turbulenceIntensity: 0,
  calmZoneRatio: 0,
  calmZoneParticleIndices: [],
  topPressureDiffBuildings: [],
};

export const useAppStore = create<AppState>((set) => ({
  buildings: [],
  currentSnapshot: null,
  buildingPressures: new Map(),
  metrics: initialMetrics,
  selectedBuildingId: null,
  isEmitting: false,

  setBuildings: (buildings) => set({ buildings }),

  setCurrentSnapshot: (snapshot) => set({ currentSnapshot: snapshot }),

  setBuildingPressure: (buildingId, pressure) =>
    set((state) => {
      const newPressures = new Map(state.buildingPressures);
      newPressures.set(buildingId, { buildingId, ...pressure });
      return { buildingPressures: newPressures };
    }),

  setMetrics: (metrics) =>
    set((state) => ({
      metrics: { ...state.metrics, ...metrics },
    })),

  selectBuilding: (id) => set({ selectedBuildingId: id }),

  setIsEmitting: (emitting) => set({ isEmitting: emitting }),

  addBuilding: (building) =>
    set((state) => {
      const id = `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        buildings: [...state.buildings, { ...building, id }],
      };
    }),

  deleteBuilding: (id) =>
    set((state) => ({
      buildings: state.buildings.filter((b) => b.id !== id),
      selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
    })),

  updateBuilding: (id, updates) =>
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),
}));
