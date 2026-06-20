import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'torus' | 'cone';
export type MaterialType = 'diffuse' | 'metal' | 'glossy' | 'transparent';
export type TransformMode = 'translate' | 'rotate';

export interface MaterialParams {
  color: string;
  ambientIntensity: number;
  roughness?: number;
  metalness?: number;
  specularIntensity?: number;
  specularSharpness?: number;
  opacity?: number;
  ior?: number;
}

export interface GeometryItem {
  id: string;
  type: GeometryType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  material: {
    type: MaterialType;
    params: MaterialParams;
  };
}

export interface LightItem {
  id: string;
  position: [number, number, number];
  color: string;
  intensity: number;
  decay: number;
}

export interface SnapshotData {
  geometryList: GeometryItem[];
  lightList: LightItem[];
  version: string;
  timestamp: number;
}

const getDefaultMaterialParams = (type: MaterialType): MaterialParams => {
  const base = { color: '#4A90D9', ambientIntensity: 0.5 };
  switch (type) {
    case 'metal':
      return { ...base, roughness: 0.3, metalness: 0.8 };
    case 'glossy':
      return { ...base, specularIntensity: 1.0, specularSharpness: 0.5 };
    case 'transparent':
      return { ...base, opacity: 0.7, ior: 1.5 };
    default:
      return base;
  }
};

interface EditorState {
  geometryList: GeometryItem[];
  lightList: LightItem[];
  selectedId: string | null;
  selectedLightId: string | null;
  transformMode: TransformMode;
  addGeometry: (type: GeometryType) => void;
  removeGeometry: (id: string) => void;
  updateTransform: (
    id: string,
    transform: Partial<Pick<GeometryItem, 'position' | 'rotation' | 'scale'>>
  ) => void;
  updateMaterial: (id: string, material: GeometryItem['material']) => void;
  updateMaterialType: (id: string, type: MaterialType) => void;
  updateMaterialParams: (id: string, params: Partial<MaterialParams>) => void;
  addLight: () => void;
  updateLight: (id: string, updates: Partial<LightItem>) => void;
  removeLight: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedLightId: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  saveSnapshot: () => SnapshotData;
  loadSnapshot: (data: SnapshotData) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  geometryList: [],
  lightList: [],
  selectedId: null,
  selectedLightId: null,
  transformMode: 'translate',

  addGeometry: (type) => {
    const newGeometry: GeometryItem = {
      id: uuidv4(),
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      material: {
        type: 'diffuse',
        params: getDefaultMaterialParams('diffuse'),
      },
    };
    set((state) => ({
      geometryList: [...state.geometryList, newGeometry],
      selectedId: newGeometry.id,
      selectedLightId: null,
    }));
  },

  removeGeometry: (id) => {
    set((state) => ({
      geometryList: state.geometryList.filter((g) => g.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  updateTransform: (id, transform) => {
    set((state) => ({
      geometryList: state.geometryList.map((g) =>
        g.id === id ? { ...g, ...transform } : g
      ),
    }));
  },

  updateMaterial: (id, material) => {
    set((state) => ({
      geometryList: state.geometryList.map((g) =>
        g.id === id ? { ...g, material } : g
      ),
    }));
  },

  updateMaterialType: (id, type) => {
    set((state) => ({
      geometryList: state.geometryList.map((g) =>
        g.id === id
          ? { ...g, material: { type, params: getDefaultMaterialParams(type) } }
          : g
      ),
    }));
  },

  updateMaterialParams: (id, params) => {
    set((state) => ({
      geometryList: state.geometryList.map((g) =>
        g.id === id
          ? { ...g, material: { ...g.material, params: { ...g.material.params, ...params } } }
          : g
      ),
    }));
  },

  addLight: () => {
    const count = get().lightList.length;
    if (count >= 3) return;
    const positions: Array<[number, number, number]> = [
      [3, 3, 3],
      [-3, 3, 3],
      [0, 4, -3],
    ];
    const colors = ['#ffffff', '#fff5e0', '#e0f0ff'];
    const newLight: LightItem = {
      id: uuidv4(),
      position: positions[count] || [0, 3, 0],
      color: colors[count] || '#ffffff',
      intensity: 0.8,
      decay: 1.0,
    };
    set((state) => ({
      lightList: [...state.lightList, newLight],
    }));
  },

  updateLight: (id, updates) => {
    set((state) => ({
      lightList: state.lightList.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  removeLight: (id) => {
    set((state) => ({
      lightList: state.lightList.filter((l) => l.id !== id),
      selectedLightId: state.selectedLightId === id ? null : state.selectedLightId,
    }));
  },

  setSelectedId: (id) => {
    set({ selectedId: id, selectedLightId: null });
  },

  setSelectedLightId: (id) => {
    set({ selectedLightId: id, selectedId: null });
  },

  setTransformMode: (mode) => {
    set({ transformMode: mode });
  },

  saveSnapshot: () => {
    const state = get();
    return {
      geometryList: state.geometryList,
      lightList: state.lightList,
      version: '1.0.0',
      timestamp: Date.now(),
    };
  },

  loadSnapshot: (data) => {
    set({
      geometryList: data.geometryList || [],
      lightList: data.lightList || [],
      selectedId: null,
      selectedLightId: null,
    });
  },
}));
