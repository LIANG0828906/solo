import { create } from 'zustand'
import type { WrinkleStats } from './types'

interface AppState {
  capturedImage: string | null
  sensitivity: number
  wrinkleStats: WrinkleStats | null
  setCapturedImage: (img: string | null) => void
  setSensitivity: (value: number) => void
  setWrinkleStats: (stats: WrinkleStats | null) => void
}

export const useStore = create<AppState>((set) => ({
  capturedImage: null,
  sensitivity: 50,
  wrinkleStats: null,
  setCapturedImage: (img) => set({ capturedImage: img }),
  setSensitivity: (value) => set({ sensitivity: value }),
  setWrinkleStats: (stats) => set({ wrinkleStats: stats }),
}))
