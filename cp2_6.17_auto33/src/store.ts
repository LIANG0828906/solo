import { create } from 'zustand'

export type ColorTheme = 'nebula' | 'aurora' | 'lava'

interface StoreState {
  particleCount: number
  colorTheme: ColorTheme
  isResetting: boolean
  setParticleCount: (count: number) => void
  setColorTheme: (theme: ColorTheme) => void
  resetView: () => void
}

export const useStore = create<StoreState>((set) => ({
  particleCount: 3000,
  colorTheme: 'nebula',
  isResetting: false,
  setParticleCount: (count) => set({ particleCount: count }),
  setColorTheme: (theme) => set({ colorTheme: theme }),
  resetView: () => {
    set({ isResetting: true })
    setTimeout(() => set({ isResetting: false }), 800)
  },
}))

export const colorThemes = {
  nebula: [
    ['#4B6CB7', '#7393D1'],
    ['#6C5B7B', '#9B59B6'],
    ['#F39C12', '#F1C40F'],
  ],
  aurora: [
    ['#1ABC9C', '#16A085'],
    ['#3498DB', '#2980B9'],
    ['#00D4AA', '#00B894'],
  ],
  lava: [
    ['#E74C3C', '#C0392B'],
    ['#E67E22', '#D35400'],
    ['#F39C12', '#E67E22'],
  ],
}
