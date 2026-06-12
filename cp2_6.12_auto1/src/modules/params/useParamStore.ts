import { create } from 'zustand';
import type { ParamState, RoomComponent, Preset, WeatherMode } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useParamStore = create<ParamState>((set, get) => ({
  month: 6,
  day: 15,
  hour: 12,
  weather: 'sunny',
  floorReflectivity: 0.2,
  wallRoughness: 0.5,
  components: [],
  selectedComponentId: null,
  activePreset: null,
  showHeatmap: false,
  latitude: 39.9,
  longitude: 116.4,

  setMonth: (month: number) => set({ month: Math.max(1, Math.min(12, month)) }),
  setDay: (day: number) => set({ day: Math.max(1, Math.min(28, day)) }),
  setHour: (hour: number) => set({ hour: Math.max(6, Math.min(18, hour)) }),
  setWeather: (weather: WeatherMode) => set({ weather }),
  setFloorReflectivity: (value: number) => set({ floorReflectivity: Math.max(0.1, Math.min(0.9, value)) }),
  setWallRoughness: (value: number) => set({ wallRoughness: Math.max(0.1, Math.min(1.0, value)) }),
  setSelectedComponent: (id: string | null) => set({ selectedComponentId: id }),
  setShowHeatmap: (show: boolean) => set({ showHeatmap: show }),

  addComponent: (component: Omit<RoomComponent, 'id'>) =>
    set((state) => ({
      components: [...state.components, { ...component, id: generateId() }],
    })),

  removeComponent: (id: string) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
    })),

  updateComponent: (id: string, updates: Partial<RoomComponent>) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  loadPreset: (preset: Preset) =>
    set({
      components: preset.components.map((c) => ({ ...c, id: generateId() })),
      month: preset.month,
      day: preset.day,
      hour: preset.hour,
      weather: preset.weather,
      floorReflectivity: preset.floorReflectivity,
      wallRoughness: preset.wallRoughness,
      activePreset: preset.id,
      selectedComponentId: null,
    }),
}));
