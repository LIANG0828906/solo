import { create } from 'zustand'

export type ColorTheme = 'aurora' | 'flame' | 'ocean'

export interface ForceFieldState {
  isActive: boolean
  x: number
  y: number
  forceX: number
  forceY: number
  strength: number
  speed: number
  decay: number
}

interface AppState {
  particleCount: number
  setParticleCount: (count: number) => void
  flowSpeed: number
  setFlowSpeed: (speed: number) => void
  forceFieldStrength: number
  setForceFieldStrength: (strength: number) => void
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  forceField: ForceFieldState
  updateForceField: (field: Partial<ForceFieldState>) => void
}

export const colorPalettes: Record<ColorTheme, string[]> = {
  aurora: ['#00FF87', '#60EFFF', '#D4A5FF'],
  flame: ['#FF4500', '#FF6347', '#FFD700'],
  ocean: ['#00BFFF', '#1E90FF', '#87CEEB']
}

export const useStore = create<AppState>((set) => ({
  particleCount: 5000,
  setParticleCount: (count) => set({ particleCount: count }),
  flowSpeed: 0.5,
  setFlowSpeed: (speed) => set({ flowSpeed: speed }),
  forceFieldStrength: 30,
  setForceFieldStrength: (strength) => set({ forceFieldStrength: strength }),
  colorTheme: 'aurora',
  setColorTheme: (theme) => set({ colorTheme: theme }),
  forceField: {
    isActive: false,
    x: 0,
    y: 0,
    forceX: 0,
    forceY: 0,
    strength: 0,
    speed: 0,
    decay: 0
  },
  updateForceField: (field) =>
    set((state) => ({
      forceField: { ...state.forceField, ...field }
    }))
}))
