import { create } from 'zustand';

export interface TreeParams {
  angle: number;
  scale: number;
  depth: number;
  thicknessDecay: number;
  randomness: number;
  leafDensity: number;
}

export interface Preset {
  id: string;
  name: string;
  params: TreeParams;
  timestamp: number;
}

interface HighlightInfo {
  level: number;
  angle: number;
  length: number;
}

interface AppState {
  params: TreeParams;
  presets: Preset[];
  selectedBranch: string | null;
  highlightInfo: HighlightInfo | null;
  setParam: <K extends keyof TreeParams>(key: K, value: TreeParams[K]) => void;
  setParams: (params: TreeParams) => void;
  randomizeParams: () => void;
  savePreset: () => void;
  deletePreset: (id: string) => void;
  applyPreset: (id: string) => void;
  setSelectedBranch: (id: string | null) => void;
  setHighlightInfo: (info: HighlightInfo | null) => void;
  loadPresets: () => void;
}

const defaultParams: TreeParams = {
  angle: 45,
  scale: 0.7,
  depth: 5,
  thicknessDecay: 0.7,
  randomness: 10,
  leafDensity: 2,
};

const MAX_PRESETS = 5;

const randomInRange = (min: number, max: number, step: number): number => {
  const steps = Math.floor((max - min) / step);
  const randomStep = Math.floor(Math.random() * (steps + 1));
  return Math.round((min + randomStep * step) * 100) / 100;
};

export const useStore = create<AppState>((set, get) => ({
  params: defaultParams,
  presets: [],
  selectedBranch: null,
  highlightInfo: null,

  setParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value },
    })),

  setParams: (params) => set({ params }),

  randomizeParams: () =>
    set({
      params: {
        angle: randomInRange(0, 90, 1),
        scale: randomInRange(0.5, 0.9, 0.05),
        depth: randomInRange(1, 8, 1),
        thicknessDecay: randomInRange(0.3, 1.0, 0.05),
        randomness: randomInRange(0, 30, 1),
        leafDensity: randomInRange(0, 5, 1),
      },
    }),

  savePreset: () => {
    const { presets, params } = get();
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: `预设 ${presets.length + 1}`,
      params: { ...params },
      timestamp: Date.now(),
    };
    const newPresets = [newPreset, ...presets].slice(0, MAX_PRESETS);
    set({ presets: newPresets });
    localStorage.setItem('ltree_presets', JSON.stringify(newPresets));
  },

  deletePreset: (id) => {
    const { presets } = get();
    const newPresets = presets.filter((p) => p.id !== id);
    set({ presets: newPresets });
    localStorage.setItem('ltree_presets', JSON.stringify(newPresets));
  },

  applyPreset: (id) => {
    const { presets } = get();
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      set({ params: { ...preset.params } });
    }
  },

  setSelectedBranch: (id) => set({ selectedBranch: id }),

  setHighlightInfo: (info) => set({ highlightInfo: info }),

  loadPresets: () => {
    try {
      const stored = localStorage.getItem('ltree_presets');
      if (stored) {
        const presets = JSON.parse(stored) as Preset[];
        set({ presets: presets.slice(0, MAX_PRESETS) });
      }
    } catch {
      // ignore
    }
  },
}));
