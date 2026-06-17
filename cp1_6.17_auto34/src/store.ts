import { create } from 'zustand';
import type { FontEffectType } from '@/utils/fontEffects';

interface AppState {
  text: string;
  style: FontEffectType;
  exportState: 'idle' | 'loading' | 'success';
  setText: (text: string) => void;
  setStyle: (style: FontEffectType) => void;
  setExportState: (state: 'idle' | 'loading' | 'success') => void;
}

export const useAppStore = create<AppState>((set) => ({
  text: '创意字体',
  style: 'neon',
  exportState: 'idle',
  setText: (text) => set({ text }),
  setStyle: (style) => set({ style }),
  setExportState: (exportState) => set({ exportState }),
}));
