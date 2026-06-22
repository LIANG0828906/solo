import { create } from 'zustand';
import type { Building, SceneState, CameraMode } from '@/types';

const initialBuildings: Building[] = [
  {
    id: 'building-1',
    position: [-10, 15, -8],
    width: 8,
    height: 30,
    depth: 8,
    color: '#ff6b6b',
  },
  {
    id: 'building-2',
    position: [8, 20, -5],
    width: 10,
    height: 40,
    depth: 6,
    color: '#4ecdc4',
  },
  {
    id: 'building-3',
    position: [-5, 12.5, 8],
    width: 6,
    height: 25,
    depth: 10,
    color: '#ffe66d',
  },
  {
    id: 'building-4',
    position: [10, 17.5, 10],
    width: 7,
    height: 35,
    depth: 7,
    color: '#95e1d3',
  },
  {
    id: 'building-5',
    position: [0, 25, 0],
    width: 9,
    height: 50,
    depth: 9,
    color: '#a29bfe',
  },
  {
    id: 'building-6',
    position: [-12, 10, 5],
    width: 5,
    height: 20,
    depth: 6,
    color: '#fd79a8',
  },
];

export const useSceneStore = create<SceneState>((set) => ({
  buildings: initialBuildings,
  selectedBuildingId: null,
  timeOfDay: 12,
  cameraMode: 'top45',

  selectBuilding: (id) => set({ selectedBuildingId: id }),

  updateBuilding: (id, updates) =>
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  setTimeOfDay: (time) => set({ timeOfDay: time }),

  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),
}));
