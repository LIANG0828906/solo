import { create } from 'zustand';
import {
  SceneStore,
  GeometryObject,
  GeometryType,
  MaterialType,
  RayPath,
  RT60Data,
  HeatmapData,
} from '../types';
import { simulateRays } from '../engine/rayTracer';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

const defaultGeometries: GeometryObject[] = [
  {
    id: 'wall-1',
    type: 'wall',
    position: { x: 0, y: 1.5, z: -5 },
    rotation: { x: 0, y: 0, z: 0 },
    size: { x: 10, y: 3, z: 0.3 },
    material: 'marble',
  },
  {
    id: 'wall-2',
    type: 'wall',
    position: { x: -5, y: 1.5, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    size: { x: 10, y: 3, z: 0.3 },
    material: 'wood',
  },
  {
    id: 'wall-3',
    type: 'wall',
    position: { x: 5, y: 1.5, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    size: { x: 10, y: 3, z: 0.3 },
    material: 'wood',
  },
  {
    id: 'cyl-1',
    type: 'cylinder',
    position: { x: 2, y: 1, z: -2 },
    rotation: { x: 0, y: 0, z: 0 },
    size: { x: 1, y: 2, z: 1 },
    material: 'glass',
  },
  {
    id: 'wedge-1',
    type: 'wedge',
    position: { x: -2, y: 1, z: 2 },
    rotation: { x: 0, y: Math.PI / 4, z: 0 },
    size: { x: 1.5, y: 2, z: 1.5 },
    material: 'acoustic',
  },
];

const initialHeatmap: HeatmapData = {
  gridSize: 24,
  cellSize: 0.5,
  values: Array(24)
    .fill(0)
    .map(() => Array(24).fill(0)),
};

export const useSceneStore = create<SceneStore>((set, get) => ({
  geometries: defaultGeometries,
  selectedId: null,
  sourcePosition: { x: 0, y: 1, z: 0 },
  receiverPositions: [
    { x: 3, y: 0.5, z: 3 },
    { x: -3, y: 0.5, z: -3 },
  ],
  isSimulating: false,
  rayPaths: [],
  rt60Data: { low: 0, mid: 0, high: 0 },
  heatmapData: initialHeatmap,
  activeGeometryType: 'wall',
  activeMaterial: 'wood',
  showPanel: true,

  addGeometry: (geo) => {
    const newGeo: GeometryObject = {
      ...geo,
      id: generateId(),
    };
    set((state) => ({
      geometries: [...state.geometries, newGeo],
    }));
    get().simulateRays();
  },

  removeGeometry: (id) => {
    set((state) => ({
      geometries: state.geometries.filter((g) => g.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
    get().simulateRays();
  },

  updateGeometry: (id, updates) => {
    set((state) => ({
      geometries: state.geometries.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }));
  },

  selectGeometry: (id) => {
    set({ selectedId: id });
  },

  setSourcePosition: (pos) => {
    set({ sourcePosition: pos });
  },

  setReceiverPosition: (index, pos) => {
    set((state) => {
      const newPositions = [...state.receiverPositions];
      newPositions[index] = pos;
      return { receiverPositions: newPositions };
    });
  },

  simulateRays: () => {
    const { sourcePosition, receiverPositions, geometries } = get();
    
    const result = simulateRays(
      sourcePosition,
      receiverPositions,
      geometries
    );

    set({
      isSimulating: true,
      rayPaths: result.allPaths,
      rt60Data: result.rt60,
      heatmapData: result.heatmap,
    });

    setTimeout(() => {
      set({ isSimulating: false });
    }, 300);
  },

  resetScene: () => {
    set({
      geometries: defaultGeometries,
      selectedId: null,
      sourcePosition: { x: 0, y: 1, z: 0 },
      receiverPositions: [
        { x: 3, y: 0.5, z: 3 },
        { x: -3, y: 0.5, z: -3 },
      ],
      rayPaths: [],
      rt60Data: { low: 0, mid: 0, high: 0 },
      heatmapData: initialHeatmap,
    });
  },

  setActiveGeometryType: (type: GeometryType) => {
    set({ activeGeometryType: type });
  },

  setActiveMaterial: (material: MaterialType) => {
    set({ activeMaterial: material });
    const { selectedId, updateGeometry } = get();
    if (selectedId) {
      updateGeometry(selectedId, { material });
      get().simulateRays();
    }
  },

  setShowPanel: (show: boolean) => {
    set({ showPanel: show });
  },
}));
