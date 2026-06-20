import { create } from 'zustand';
import {
  Layer,
  deepCloneLayers,
  generateRandomLayers,
} from '../utils/layerUtils';

interface LayerState {
  layers: Layer[];
  initialLayers: Layer[];
  compareMode: boolean;
  splitPosition: number;
  mobilePanelOpen: boolean;
}

interface LayerActions {
  initLayers: () => void;
  toggleLayerVisibility: (id: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  toggleCompareMode: () => void;
  setSplitPosition: (pos: number) => void;
  resetAll: () => void;
  toggleMobilePanel: () => void;
  closeMobilePanel: () => void;
}

export type LayerStore = LayerState & LayerActions;

export const useLayerStore = create<LayerStore>((set, get) => ({
  layers: [],
  initialLayers: [],
  compareMode: false,
  splitPosition: 0.5,
  mobilePanelOpen: false,

  initLayers: () => {
    const layers = generateRandomLayers();
    set({
      layers,
      initialLayers: deepCloneLayers(layers),
    });
  },

  toggleLayerVisibility: (id: string) => {
    set(state => ({
      layers: state.layers.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    }));
  },

  reorderLayers: (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    set(state => {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return { layers: newLayers };
    });
  },

  toggleCompareMode: () => {
    set(state => ({ compareMode: !state.compareMode }));
  },

  setSplitPosition: (pos: number) => {
    const clamped = Math.max(0.05, Math.min(0.95, pos));
    if (clamped !== get().splitPosition) {
      set({ splitPosition: clamped });
    }
  },

  resetAll: () => {
    set(state => ({
      layers: deepCloneLayers(state.initialLayers),
      splitPosition: 0.5,
      compareMode: false,
    }));
  },

  toggleMobilePanel: () => {
    set(state => ({ mobilePanelOpen: !state.mobilePanelOpen }));
  },

  closeMobilePanel: () => {
    set({ mobilePanelOpen: false });
  },
}));
