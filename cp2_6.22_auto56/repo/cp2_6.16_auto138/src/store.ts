import { create } from 'zustand'

export interface ColorTheme {
  name: string
  colors: number[]
  angle: number
}

export const colorThemes: ColorTheme[] = [
  {
    name: 'Purple Pink',
    colors: [0x8b5cf6, 0xec4899, 0xf472b6, 0xa855f7],
    angle: 0
  },
  {
    name: 'Cyan Gold',
    colors: [0x06b6d4, 0xfbbf24, 0x22d3ee, 0xf59e0b],
    angle: 1
  },
  {
    name: 'Blue Violet',
    colors: [0x3b82f6, 0x8b5cf6, 0x60a5fa, 0xa78bfa],
    angle: 2
  },
  {
    name: 'Emerald Rose',
    colors: [0x10b981, 0xf43f5e, 0x34d399, 0xfb7185],
    angle: 3
  },
  {
    name: 'Sunset',
    colors: [0xf97316, 0xef4444, 0xfbbf24, 0xf43f5e],
    angle: 4
  },
  {
    name: 'Deep Space',
    colors: [0x1e3a8a, 0x7c3aed, 0x3730a3, 0x8b5cf6],
    angle: 5
  }
]

export interface NebulaState {
  particleCount: number
  colorSpeed: number
  particleSize: number
  colorThemeIndex: number
  
  setParticleCount: (count: number) => void
  setColorSpeed: (speed: number) => void
  setParticleSize: (size: number) => void
  setColorTheme: (index: number) => void
  reset: () => void
}

const DEFAULT_STATE = {
  particleCount: 2000,
  colorSpeed: 0.5,
  particleSize: 2,
  colorThemeIndex: 0
}

export const useNebulaStore = create<NebulaState>((set) => ({
  ...DEFAULT_STATE,
  
  setParticleCount: (count: number) => set({ particleCount: count }),
  setColorSpeed: (speed: number) => set({ colorSpeed: speed }),
  setParticleSize: (size: number) => set({ particleSize: size }),
  setColorTheme: (index: number) => set({ colorThemeIndex: index }),
  
  reset: () => set(DEFAULT_STATE)
}))
