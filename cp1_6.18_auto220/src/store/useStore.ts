import { create } from 'zustand'

export interface BrushSettings {
  color: string
  size: number
  colorScheme: string
}

interface AppState {
  brushSettings: BrushSettings
  setBrushColor: (color: string) => void
  setBrushSize: (size: number) => void
  setColorScheme: (scheme: string) => void
  resetNebula: () => void
  resetTrigger: number
}

export const colorSchemes: Record<string, { name: string; start: string; end: string }> = {
  galaxy: { name: '银河金', start: '#FFD700', end: '#FFA500' },
  rose: { name: '玫瑰星云', start: '#FF69B4', end: '#FF1493' },
  emerald: { name: '翡翠星云', start: '#00FF7F', end: '#00CED1' }
}

export const useStore = create<AppState>((set) => ({
  brushSettings: {
    color: '#FFD700',
    size: 2,
    colorScheme: 'galaxy'
  },
  setBrushColor: (color) =>
    set((state) => ({
      brushSettings: { ...state.brushSettings, color }
    })),
  setBrushSize: (size) =>
    set((state) => ({
      brushSettings: { ...state.brushSettings, size }
    })),
  setColorScheme: (scheme) => {
    const schemeData = colorSchemes[scheme]
    if (schemeData) {
      set((state) => ({
        brushSettings: {
          ...state.brushSettings,
          color: schemeData.start,
          colorScheme: scheme
        }
      }))
    }
  },
  resetTrigger: 0,
  resetNebula: () =>
    set((state) => ({
      resetTrigger: state.resetTrigger + 1
    }))
}))
