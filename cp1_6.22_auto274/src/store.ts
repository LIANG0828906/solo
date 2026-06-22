import { create } from 'zustand';
import type { PlanetData } from './PhysicsEngine';
import type { ResourceInventory, ResourceType } from './ResourceManager';

interface SimulationState {
  planets: PlanetData[];
  selectedPlanetId: number | null;
  shipAngle: number;
  shipSpeed: number;
  isRunning: boolean;
  showTrajectory: boolean;
  resources: ResourceInventory;
  nextPlanetId: number;

  addPlanet: (x: number, y: number) => void;
  updatePlanetMass: (id: number, mass: number) => void;
  selectPlanet: (id: number | null) => void;
  setShipAngle: (angle: number) => void;
  setShipSpeed: (speed: number) => void;
  setRunning: (running: boolean) => void;
  setShowTrajectory: (show: boolean) => void;
  collectResource: (type: ResourceType) => void;
  resetAll: () => void;
  resetResources: () => void;
}

export const useSimStore = create<SimulationState>((set) => ({
  planets: [],
  selectedPlanetId: null,
  shipAngle: 0,
  shipSpeed: 150,
  isRunning: false,
  showTrajectory: true,
  resources: { iron: 0, copper: 0, titanium: 0, totalCollections: 0 },
  nextPlanetId: 1,

  addPlanet: (x, y) =>
    set((state) => {
      const id = state.nextPlanetId;
      return {
        planets: [...state.planets, { id, x, y, mass: 10 }],
        nextPlanetId: id + 1,
        selectedPlanetId: id,
      };
    }),

  updatePlanetMass: (id, mass) =>
    set((state) => ({
      planets: state.planets.map((p) => (p.id === id ? { ...p, mass } : p)),
    })),

  selectPlanet: (id) => set({ selectedPlanetId: id }),

  setShipAngle: (angle) => set({ shipAngle: angle }),

  setShipSpeed: (speed) => set({ shipSpeed: speed }),

  setRunning: (running) => set({ isRunning: running }),

  setShowTrajectory: (show) => set({ showTrajectory: show }),

  collectResource: (type) =>
    set((state) => ({
      resources: {
        ...state.resources,
        [type]: state.resources[type] + 1,
        totalCollections: state.resources.totalCollections + 1,
      },
    })),

  resetAll: () =>
    set({
      planets: [],
      selectedPlanetId: null,
      shipAngle: 0,
      shipSpeed: 150,
      isRunning: false,
      showTrajectory: true,
      resources: { iron: 0, copper: 0, titanium: 0, totalCollections: 0 },
      nextPlanetId: 1,
    }),

  resetResources: () =>
    set({
      resources: { iron: 0, copper: 0, titanium: 0, totalCollections: 0 },
    }),
}));
