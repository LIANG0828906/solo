import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type GeometryType = 'sphere' | 'box' | 'cylinder' | 'torus';

export type TextureType = 'wood' | 'stone' | 'metal' | 'fabric' | 'camo';

export interface MaterialParams {
  color: string;
  metalness: number;
  roughness: number;
  textureScale: number;
  textureType: TextureType;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  geometryType: GeometryType;
  materialParams: MaterialParams;
  thumbnail: string;
}

interface AppState {
  geometryType: GeometryType;
  materialParams: MaterialParams;
  snapshots: Snapshot[];
  comparisonMode: boolean;
  capturedParams: MaterialParams | null;
  maxSnapshots: number;

  setGeometryType: (type: GeometryType) => void;
  setColor: (color: string) => void;
  setMetalness: (value: number) => void;
  setRoughness: (value: number) => void;
  setTextureScale: (value: number) => void;
  setTextureType: (type: TextureType) => void;
  toggleComparisonMode: () => void;
  saveSnapshot: (thumbnail: string) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
}

export const defaultMaterialParams: MaterialParams = {
  color: '#ffffff',
  metalness: 0.1,
  roughness: 0.8,
  textureScale: 1.0,
  textureType: 'wood',
};

export const comparisonDefaultParams: MaterialParams = {
  color: '#ffffff',
  metalness: 0.1,
  roughness: 0.8,
  textureScale: 1.0,
  textureType: 'wood',
};

export const useAppStore = create<AppState>((set, get) => ({
  geometryType: 'sphere',
  materialParams: { ...defaultMaterialParams },
  snapshots: [],
  comparisonMode: false,
  capturedParams: null,
  maxSnapshots: 10,

  setGeometryType: (type: GeometryType) => set({ geometryType: type }),

  setColor: (color: string) =>
    set((state) => ({
      materialParams: { ...state.materialParams, color },
    })),

  setMetalness: (value: number) =>
    set((state) => ({
      materialParams: { ...state.materialParams, metalness: value },
    })),

  setRoughness: (value: number) =>
    set((state) => ({
      materialParams: { ...state.materialParams, roughness: value },
    })),

  setTextureScale: (value: number) =>
    set((state) => ({
      materialParams: { ...state.materialParams, textureScale: value },
    })),

  setTextureType: (type: TextureType) =>
    set((state) => ({
      materialParams: { ...state.materialParams, textureType: type },
    })),

  toggleComparisonMode: () =>
    set((state) => ({
      comparisonMode: !state.comparisonMode,
      capturedParams: !state.comparisonMode ? { ...state.materialParams } : null,
    })),

  saveSnapshot: (thumbnail: string) => {
    const { snapshots, geometryType, materialParams, maxSnapshots } = get();
    const newSnapshot: Snapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      geometryType,
      materialParams: { ...materialParams },
      thumbnail,
    };

    const updatedSnapshots = [newSnapshot, ...snapshots].slice(0, maxSnapshots);
    set({ snapshots: updatedSnapshots });
  },

  loadSnapshot: (id: string) => {
    const { snapshots } = get();
    const snapshot = snapshots.find((s) => s.id === id);
    if (snapshot) {
      set({
        geometryType: snapshot.geometryType,
        materialParams: { ...snapshot.materialParams },
        comparisonMode: false,
        capturedParams: null,
      });
    }
  },

  deleteSnapshot: (id: string) => {
    const { snapshots } = get();
    set({
      snapshots: snapshots.filter((s) => s.id !== id),
    });
  },
}));
