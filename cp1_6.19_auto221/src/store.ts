import { create } from 'zustand';
import { presets, PresetData } from '@/data/presets';

interface CRTStore {
  frameIndex: number;
  isPlaying: boolean;
  scanlineDensity: number;
  chromaAberration: number;
  phosphorPersistence: number;
  selectedPreset: number;
  presets: PresetData[];
  changeKnob: (param: string, value: number) => void;
  selectPreset: (index: number) => void;
  togglePlay: () => void;
  nextFrame: () => void;
}

export const useStore = create<CRTStore>((set, get) => ({
  frameIndex: 0,
  isPlaying: true,
  scanlineDensity: 50,
  chromaAberration: 30,
  phosphorPersistence: 50,
  selectedPreset: 0,
  presets,

  changeKnob: (param, value) => {
    const clamped = Math.max(0, Math.min(100, value));
    switch (param) {
      case 'scanlineDensity':
        set({ scanlineDensity: clamped });
        break;
      case 'chromaAberration':
        set({ chromaAberration: clamped });
        break;
      case 'phosphorPersistence':
        set({ phosphorPersistence: clamped });
        break;
    }
  },

  selectPreset: (index) => {
    set({ selectedPreset: index, frameIndex: 0, isPlaying: true });
  },

  togglePlay: () => {
    set({ isPlaying: !get().isPlaying });
  },

  nextFrame: () => {
    const { frameIndex, selectedPreset, presets } = get();
    const totalFrames = presets[selectedPreset].frames.length;
    set({ frameIndex: (frameIndex + 1) % totalFrames });
  },
}));
