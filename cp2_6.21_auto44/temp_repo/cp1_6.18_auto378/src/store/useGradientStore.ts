import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { GradientState, GradientConfig, ColorStop, GradientDirection } from '../types/gradient';
import { MAX_COLOR_STOPS, MIN_COLOR_STOPS } from '../types/gradient';
import { createDefaultColorStops } from '../utils/gradientUtils';

const STORAGE_KEY = 'gradient-workshop-presets';

function loadPresetsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePresetsToStorage(presets: unknown) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    console.error('Failed to save presets to localStorage');
  }
}

const initialConfig: GradientConfig = {
  colorStops: createDefaultColorStops(),
  direction: 'to bottom right',
};

export const useGradientStore = create<GradientState>((set, get) => ({
  config: initialConfig,
  presets: loadPresetsFromStorage(),
  selectedColorStopId: 'stop-1',
  isExporting: false,

  setDirection: (direction: GradientDirection) => {
    set((state) => ({
      config: { ...state.config, direction },
    }));
  },

  addColorStop: () => {
    set((state) => {
      if (state.config.colorStops.length >= MAX_COLOR_STOPS) return state;

      const sortedStops = [...state.config.colorStops].sort((a, b) => a.position - b.position);
      let newPosition = 50;
      if (sortedStops.length >= 2) {
        const mid = Math.floor(sortedStops.length / 2);
        newPosition = (sortedStops[mid - 1].position + sortedStops[mid].position) / 2;
      }

      const newStop: ColorStop = {
        id: uuidv4(),
        color: '#FFFFFF',
        position: Math.round(newPosition),
        opacity: 1,
      };

      return {
        config: {
          ...state.config,
          colorStops: [...state.config.colorStops, newStop],
        },
        selectedColorStopId: newStop.id,
      };
    });
  },

  removeColorStop: (id: string) => {
    set((state) => {
      if (state.config.colorStops.length <= MIN_COLOR_STOPS) return state;

      const newStops = state.config.colorStops.filter((stop) => stop.id !== id);
      const newSelectedId =
        state.selectedColorStopId === id ? newStops[0]?.id ?? null : state.selectedColorStopId;

      return {
        config: {
          ...state.config,
          colorStops: newStops,
        },
        selectedColorStopId: newSelectedId,
      };
    });
  },

  updateColorStop: (id: string, updates: Partial<ColorStop>) => {
    set((state) => ({
      config: {
        ...state.config,
        colorStops: state.config.colorStops.map((stop) =>
          stop.id === id ? { ...stop, ...updates } : stop
        ),
      },
    }));
  },

  selectColorStop: (id: string | null) => {
    set({ selectedColorStopId: id });
  },

  savePreset: (name: string) => {
    const { config, presets } = get();
    const newPreset = {
      id: uuidv4(),
      name,
      config: JSON.parse(JSON.stringify(config)),
      createdAt: Date.now(),
    };
    const newPresets = [...presets, newPreset];
    set({ presets: newPresets });
    savePresetsToStorage(newPresets);
  },

  loadPreset: (id: string) => {
    const { presets } = get();
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      set({
        config: JSON.parse(JSON.stringify(preset.config)),
        selectedColorStopId: preset.config.colorStops[0]?.id ?? null,
      });
    }
  },

  deletePreset: (id: string) => {
    const { presets } = get();
    const newPresets = presets.filter((p) => p.id !== id);
    set({ presets: newPresets });
    savePresetsToStorage(newPresets);
  },

  setExporting: (exporting: boolean) => {
    set({ isExporting: exporting });
  },
}));
