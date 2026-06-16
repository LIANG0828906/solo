import { create } from 'zustand'

export type ColorTheme = 'nebula' | 'fire' | 'frost' | 'aurora'

export interface ThemeColor {
  name: string
  primary: string
  gradient: [string, string, string] | [string]
}

export const THEME_COLORS: Record<ColorTheme, ThemeColor> = {
  nebula: {
    name: '星云紫',
    primary: '#7C4DFF',
    gradient: ['#7C4DFF']
  },
  fire: {
    name: '火焰橙',
    primary: '#FF6D00',
    gradient: ['#FFAB00', '#FF6D00', '#FF1744']
  },
  frost: {
    name: '冰霜蓝',
    primary: '#00B8D4',
    gradient: ['#00E5FF', '#00B8D4', '#2979FF']
  },
  aurora: {
    name: '极光绿',
    primary: '#00E676',
    gradient: ['#B2FF59', '#00E676', '#00BCD4']
  }
}

interface SculptureStore {
  particleCount: number
  colorTheme: ColorTheme
  isFrozen: boolean
  resetTrigger: number
  setParticleCount: (n: number) => void
  setColorTheme: (t: ColorTheme) => void
  toggleFrozen: () => void
  triggerReset: () => void
}

export const useSculptureStore = create<SculptureStore>((set) => ({
  particleCount: 2000,
  colorTheme: 'nebula',
  isFrozen: false,
  resetTrigger: 0,
  setParticleCount: (n) => set({ particleCount: Math.max(500, Math.min(5000, n)) }),
  setColorTheme: (t) => set({ colorTheme: t }),
  toggleFrozen: () => set((state) => ({ isFrozen: !state.isFrozen })),
  triggerReset: () => set((state) => ({ resetTrigger: state.resetTrigger + 1, isFrozen: false }))
}))
