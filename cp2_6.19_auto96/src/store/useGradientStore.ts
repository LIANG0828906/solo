import { create } from "zustand";
import {
  GradientLayer,
  PresetTheme,
  PRESET_THEMES,
  generateId,
  parseColorToHex,
} from "@/utils/gradientUtils";

interface GradientState {
  layers: GradientLayer[];
  activePreset: string;
  eyedropperMode: boolean;
  eyedropperTarget: { layerId: string; field: "startColor" | "endColor" } | null;
  showExportModal: boolean;

  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<GradientLayer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setPreset: (presetId: string) => void;
  toggleEyedropper: (target?: { layerId: string; field: "startColor" | "endColor" } | null) => void;
  pickColor: (hex: string) => void;
  setShowExportModal: (show: boolean) => void;
}

export const useGradientStore = create<GradientState>((set, get) => ({
  layers: PRESET_THEMES[0].layers.map((l) => ({ ...l })),
  activePreset: PRESET_THEMES[0].id,
  eyedropperMode: false,
  eyedropperTarget: null,
  showExportModal: false,

  addLayer: () => {
    const layer: GradientLayer = {
      id: generateId(),
      startColor: "#ff6b6b",
      endColor: "#4ecdc4",
      angle: 135,
      stop1: 0,
      stop2: 100,
    };
    set((state) => ({ layers: [...state.layers, layer] }));
  },

  removeLayer: (id: string) => {
    set((state) => ({ layers: state.layers.filter((l) => l.id !== id) }));
  },

  updateLayer: (id: string, updates: Partial<GradientLayer>) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  },

  reorderLayers: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return { layers: newLayers };
    });
  },

  setPreset: (presetId: string) => {
    const preset = PRESET_THEMES.find((p) => p.id === presetId);
    if (preset) {
      set({
        activePreset: presetId,
        layers: preset.layers.map((l) => ({ ...l })),
      });
    }
  },

  toggleEyedropper: (target) => {
    set((state) => ({
      eyedropperMode: target ? true : !state.eyedropperMode,
      eyedropperTarget: target || state.eyedropperTarget,
    }));
  },

  pickColor: (hex: string) => {
    const state = get();
    if (state.eyedropperTarget) {
      const normalized = parseColorToHex(hex);
      set((s) => ({
        layers: s.layers.map((l) =>
          l.id === state.eyedropperTarget!.layerId
            ? { ...l, [state.eyedropperTarget!.field]: normalized }
            : l
        ),
        eyedropperMode: false,
        eyedropperTarget: null,
      }));
    }
  },

  setShowExportModal: (show: boolean) => {
    set({ showExportModal: show });
  },
}));
