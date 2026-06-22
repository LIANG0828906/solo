import { create } from 'zustand'

export interface ColorScheme {
  name: string
  coldColor: { r: number; g: number; b: number }
  midColor: { r: number; g: number; b: number }
  warmColor: { r: number; g: number; b: number }
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 }
}

const colorSchemes: ColorScheme[] = [
  {
    name: '极光青蓝橙',
    coldColor: hexToRgb('#00BCD4'),
    midColor: hexToRgb('#2196F3'),
    warmColor: hexToRgb('#FF6F00'),
  },
  {
    name: '火焰红黄紫',
    coldColor: hexToRgb('#9C27B0'),
    midColor: hexToRgb('#F44336'),
    warmColor: hexToRgb('#FFEB3B'),
  },
  {
    name: '海洋蓝绿白',
    coldColor: hexToRgb('#0D47A1'),
    midColor: hexToRgb('#009688'),
    warmColor: hexToRgb('#E0F7FA'),
  },
  {
    name: '霓虹粉紫青',
    coldColor: hexToRgb('#E91E63'),
    midColor: hexToRgb('#9C27B0'),
    warmColor: hexToRgb('#00BCD4'),
  },
]

interface ParticleState {
  particleCount: number
  flowSpeed: number
  colorSchemeIndex: number
  colorSchemes: ColorScheme[]
  isPaused: boolean
  mouseDirection: [number, number, number]
  isMouseDown: boolean
  resetTrigger: number
  setParticleCount: (count: number) => void
  setFlowSpeed: (speed: number) => void
  setColorSchemeIndex: (index: number) => void
  nextColorScheme: () => void
  togglePause: () => void
  setMouseDirection: (dir: [number, number, number]) => void
  setIsMouseDown: (down: boolean) => void
  triggerReset: () => void
}

export const useParticleStore = create<ParticleState>((set, get) => ({
  particleCount: 5000,
  flowSpeed: 1.0,
  colorSchemeIndex: 0,
  colorSchemes,
  isPaused: false,
  mouseDirection: [0, 0, 0],
  isMouseDown: false,
  resetTrigger: 0,
  setParticleCount: (count) => set({ particleCount: count }),
  setFlowSpeed: (speed) => set({ flowSpeed: speed }),
  setColorSchemeIndex: (index) => set({ colorSchemeIndex: index }),
  nextColorScheme: () => {
    const current = get().colorSchemeIndex
    const next = (current + 1) % colorSchemes.length
    set({ colorSchemeIndex: next })
  },
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setMouseDirection: (dir) => set({ mouseDirection: dir }),
  setIsMouseDown: (down) => set({ isMouseDown: down }),
  triggerReset: () => set((state) => ({ resetTrigger: state.resetTrigger + 1 })),
}))
