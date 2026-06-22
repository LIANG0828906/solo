import { create } from 'zustand';
import type { Settings } from '../../shared/types';

interface SettingsStore extends Settings {
  setSettings: (settings: Settings) => void;
  updateSettings: (partial: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  userName: '自由职业者',
  hourlyRate: 50.0,
  logoData: '',

  setSettings: (settings) => set(settings),
  updateSettings: (partial) => set((state) => ({ ...state, ...partial })),
}));
