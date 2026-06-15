import { create } from 'zustand'

export type BuildingType = 'box' | 'lshape' | 'courtyard'

interface SimState {
  dayOfYear: number
  timeHours: number
  latitude: number
  longitude: number
  selectedBuilding: BuildingType

  setDayOfYear: (day: number) => void
  setTimeHours: (time: number) => void
  setLatitude: (lat: number) => void
  setLongitude: (lng: number) => void
  setSelectedBuilding: (type: BuildingType) => void
}

export const useSimStore = create<SimState>((set) => ({
  dayOfYear: 196,
  timeHours: 12,
  latitude: 39.9,
  longitude: 116.4,
  selectedBuilding: 'box',

  setDayOfYear: (day: number) => set({ dayOfYear: Math.max(1, Math.min(365, day)) }),
  setTimeHours: (time: number) => set({ timeHours: Math.max(6, Math.min(19, time)) }),
  setLatitude: (lat: number) => set({ latitude: Math.max(-90, Math.min(90, lat)) }),
  setLongitude: (lng: number) => set({ longitude: Math.max(-180, Math.min(180, lng)) }),
  setSelectedBuilding: (type: BuildingType) => set({ selectedBuilding: type }),
}))
