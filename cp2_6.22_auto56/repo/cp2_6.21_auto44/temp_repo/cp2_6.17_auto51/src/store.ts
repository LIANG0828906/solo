import { create } from 'zustand';
import { CITIES, DEFAULT_CITY_ID, getCityById } from './cityConfig';
import type { CityConfig } from './types';

interface AppState {
  currentCityId: string;
  currentCity: CityConfig;
  isMobile: boolean;
  setCurrentCity: (id: string) => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentCityId: DEFAULT_CITY_ID,
  currentCity: getCityById(DEFAULT_CITY_ID),
  isMobile: false,
  setCurrentCity: (id: string) => {
    const city = CITIES.find((c) => c.id === id);
    if (city) {
      set({ currentCityId: id, currentCity: city });
    }
  },
  setIsMobile: (isMobile: boolean) => set({ isMobile }),
}));
