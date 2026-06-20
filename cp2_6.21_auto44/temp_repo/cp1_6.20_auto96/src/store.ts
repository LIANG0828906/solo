import { create } from 'zustand';
import type { AppState, CabinetData, FilterZone, FrameData } from './types';
import { generateCabinetData } from './utils/dataGenerator';
import { HISTORY_FRAMES } from './utils/constants';

export const useStore = create<AppState>((set, get) => ({
  items: generateCabinetData(),
  filter: 'all',
  mode: 'power',
  progress: 1,
  selectedId: null,
  hoveredId: null,

  setData: (items: CabinetData[]) => set({ items }),

  setFilter: (filter: FilterZone) => set({ filter }),

  setMode: (mode: 'power' | 'temperature') => set({ mode }),

  setProgress: (progress: number) => set({ progress }),

  setSelectedId: (id: string | null) => set({ selectedId: id }),

  setHoveredId: (id: string | null) => set({ hoveredId: id }),

  getCurrentFrameData: (id: string): FrameData => {
    const state = get();
    const cabinet = state.items.find((item) => item.id === id);
    if (!cabinet || cabinet.history.length === 0) {
      return {
        timestamp: Date.now(),
        power: cabinet?.power || 0,
        temperature: cabinet?.temperature || 0,
      };
    }

    const frameIndex = Math.min(
      Math.floor(state.progress * (HISTORY_FRAMES - 1)),
      HISTORY_FRAMES - 1
    );
    return cabinet.history[frameIndex];
  },

  getCurrentValue: (id: string): number => {
    const state = get();
    const frameData = state.getCurrentFrameData(id);
    return state.mode === 'power' ? frameData.power : frameData.temperature;
  },
}));
