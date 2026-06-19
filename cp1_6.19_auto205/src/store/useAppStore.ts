import { create } from 'zustand';
import { AppState, BASE_YEAR } from '@/types';
import { emissionSources } from '@/data/emissionSources';
import { heatPoints } from '@/data/heatPoints';
import { generateTemperatureData } from '@/utils/temperatureCalculator';

const temperatureData = generateTemperatureData();

export const useAppStore = create<AppState>((set) => ({
  currentYear: BASE_YEAR,
  selectedSourceId: null,
  emissionSources,
  heatPoints,
  temperatureData,
  isResetting: false,

  setCurrentYear: (year: number) => set({ currentYear: year }),

  setSelectedSourceId: (id: string | null) => set({ selectedSourceId: id }),

  setIsResetting: (value: boolean) => set({ isResetting: value }),

  resetToBase: () => {
    set({ isResetting: true });
    setTimeout(() => {
      set({
        currentYear: BASE_YEAR,
        selectedSourceId: null,
        isResetting: false,
      });
    }, 500);
  },
}));
