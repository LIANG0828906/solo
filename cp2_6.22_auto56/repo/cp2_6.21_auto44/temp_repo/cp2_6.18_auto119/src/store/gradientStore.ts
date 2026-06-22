import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type GradientType = 'linear' | 'radial' | 'conic';
export type BlendMode = 'normal' | 'multiply' | 'screen';

export interface GradientLayer {
  id: string;
  type: GradientType;
  colorStart: string;
  colorEnd: string;
  angle: number;
  scale: number;
  visible: boolean;
}

export interface Preset {
  id: string;
  name: string;
  layers: GradientLayer[];
  blendMode: BlendMode;
  createdAt: number;
}

interface GradientState {
  layers: GradientLayer[];
  blendMode: BlendMode;
  presets: Preset[];
  dragOverIndex: number | null;

  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<GradientLayer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setBlendMode: (mode: BlendMode) => void;
  setDragOverIndex: (index: number | null) => void;
  resetLayers: () => void;

  savePreset: (name: string) => boolean;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
}

const createDefaultLayer = (): GradientLayer => ({
  id: uuidv4(),
  type: 'linear',
  colorStart: '#a78bfa',
  colorEnd: '#60a5fa',
  angle: 135,
  scale: 1.0,
  visible: true,
});

const loadPresetsFromStorage = (): Preset[] => {
  try {
    const stored = localStorage.getItem('gradientflow_presets');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const savePresetsToStorage = (presets: Preset[]) => {
  try {
    localStorage.setItem('gradientflow_presets', JSON.stringify(presets));
  } catch {
    /* ignore */
  }
};

const defaultLayers: GradientLayer[] = [
  {
    id: uuidv4(),
    type: 'linear',
    colorStart: '#ff6b6b',
    colorEnd: '#feca57',
    angle: 45,
    scale: 1.0,
    visible: true,
  },
  {
    id: uuidv4(),
    type: 'radial',
    colorStart: '#48dbfb',
    colorEnd: '#0abde3',
    angle: 0,
    scale: 1.2,
    visible: true,
  },
  {
    id: uuidv4(),
    type: 'conic',
    colorStart: '#a78bfa',
    colorEnd: '#f368e0',
    angle: 0,
    scale: 0.9,
    visible: true,
  },
];

export const useGradientStore = create<GradientState>((set, get) => ({
  layers: defaultLayers,
  blendMode: 'screen',
  presets: loadPresetsFromStorage(),
  dragOverIndex: null,

  addLayer: () => {
    const { layers } = get();
    if (layers.length >= 6) return;
    set({ layers: [createDefaultLayer(), ...layers] });
  },

  removeLayer: (id: string) => {
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
    }));
  },

  updateLayer: (id: string, updates: Partial<GradientLayer>) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  reorderLayers: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return { layers: newLayers, dragOverIndex: null };
    });
  },

  setBlendMode: (mode: BlendMode) => set({ blendMode: mode }),

  setDragOverIndex: (index: number | null) => set({ dragOverIndex: index }),

  resetLayers: () => set({ layers: defaultLayers.map((l) => ({ ...l, id: uuidv4() })) }),

  savePreset: (name: string) => {
    const { layers, blendMode, presets } = get();
    if (presets.length >= 10) return false;
    const newPreset: Preset = {
      id: uuidv4(),
      name: name.trim() || `预设 ${presets.length + 1}`,
      layers: JSON.parse(JSON.stringify(layers)),
      blendMode,
      createdAt: Date.now(),
    };
    const newPresets = [...presets, newPreset];
    savePresetsToStorage(newPresets);
    set({ presets: newPresets });
    return true;
  },

  loadPreset: (id: string) => {
    const { presets } = get();
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      set({
        layers: JSON.parse(JSON.stringify(preset.layers)),
        blendMode: preset.blendMode,
      });
    }
  },

  deletePreset: (id: string) => {
    set((state) => {
      const newPresets = state.presets.filter((p) => p.id !== id);
      savePresetsToStorage(newPresets);
      return { presets: newPresets };
    });
  },
}));
