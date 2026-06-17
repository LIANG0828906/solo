import { create } from 'zustand';

export interface AppState {
  dayOfYear: number;
  hour: number;
  latitude: number;
  longitude: number;
  buildingLoaded: boolean;
  editMode: boolean;
  setDayOfYear: (day: number) => void;
  setHour: (hour: number) => void;
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
  setBuildingLoaded: (loaded: boolean) => void;
  setEditMode: (edit: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  dayOfYear: 182,
  hour: 12,
  latitude: 39.9,
  longitude: 116.3,
  buildingLoaded: false,
  editMode: false,
  setDayOfYear: (day) => set({ dayOfYear: day }),
  setHour: (hour) => set({ hour }),
  setLatitude: (lat) => set({ latitude: lat }),
  setLongitude: (lng) => set({ longitude: lng }),
  setBuildingLoaded: (loaded) => set({ buildingLoaded: loaded }),
  setEditMode: (edit) => set({ editMode: edit }),
}));
