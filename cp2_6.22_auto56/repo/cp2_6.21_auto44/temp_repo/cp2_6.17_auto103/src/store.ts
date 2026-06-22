import { create } from 'zustand'

export type ColorCurve = 'linear' | 'sin' | 'exp'
export type Preset = 'fire' | 'smoke' | 'snow' | 'explosion'

interface ParticleState {
  gravity: number
  windX: number
  windY: number
  windZ: number
  wind: { x: number; y: number; z: number }
  drag: number
  colorStart: string
  colorEnd: string
  colorCurve: ColorCurve
  sizeMin: number
  sizeMax: number
  lifetime: number
  particleCount: number
  maxParticles: number
  activePreset: Preset | null
  isApplying: boolean
  isPanelOpen: boolean

  setGravity: (v: number) => void
  setWindX: (v: number) => void
  setWindY: (v: number) => void
  setWindZ: (v: number) => void
  setDrag: (v: number) => void
  setColorStart: (v: string) => void
  setColorEnd: (v: string) => void
  setColorCurve: (v: ColorCurve) => void
  setSizeMin: (v: number) => void
  setSizeMax: (v: number) => void
  setLifetime: (v: number) => void
  setParticleCount: (v: number) => void
  setActivePreset: (v: Preset | null) => void
  setIsApplying: (v: boolean) => void
  togglePanel: () => void
  applyPreset: (preset: Preset) => void
  reset: () => void
}

const presets: Record<Preset, Partial<ParticleState>> = {
  fire: {
    gravity: -2,
    windX: 0,
    windY: 0,
    windZ: 0,
    wind: { x: 0, y: 0, z: 0 },
    drag: 0.01,
    colorStart: '#FF6B6B',
    colorEnd: '#FFD93D',
    colorCurve: 'exp',
    sizeMin: 3,
    sizeMax: 7,
    lifetime: 3,
  },
  smoke: {
    gravity: -0.5,
    windX: 1.5,
    windY: 0,
    windZ: 0,
    wind: { x: 1.5, y: 0, z: 0 },
    drag: 0.05,
    colorStart: '#888888',
    colorEnd: '#333333',
    colorCurve: 'linear',
    sizeMin: 4,
    sizeMax: 8,
    lifetime: 6,
  },
  snow: {
    gravity: 1,
    windX: 0.5,
    windY: 0,
    windZ: 0.3,
    wind: { x: 0.5, y: 0, z: 0.3 },
    drag: 0.03,
    colorStart: '#FFFFFF',
    colorEnd: '#B0E0E6',
    colorCurve: 'sin',
    sizeMin: 2,
    sizeMax: 4,
    lifetime: 8,
  },
  explosion: {
    gravity: 9.8,
    windX: 0,
    windY: 0,
    windZ: 0,
    wind: { x: 0, y: 0, z: 0 },
    drag: 0.005,
    colorStart: '#FF6B6B',
    colorEnd: '#FFA500',
    colorCurve: 'exp',
    sizeMin: 2,
    sizeMax: 6,
    lifetime: 2,
  },
}

export const useParticleStore = create<ParticleState>((set) => ({
  gravity: 9.8,
  windX: 1,
  windY: 0,
  windZ: 0,
  wind: { x: 1, y: 0, z: 0 },
  drag: 0.02,
  colorStart: '#FF6B6B',
  colorEnd: '#4ECDC4',
  colorCurve: 'linear',
  sizeMin: 2,
  sizeMax: 6,
  lifetime: 5,
  particleCount: 0,
  maxParticles: 300,
  activePreset: null,
  isApplying: false,
  isPanelOpen: false,

  setGravity: (v) => set({ gravity: v }),
  setWindX: (v) => set((s) => ({ windX: v, wind: { ...s.wind, x: v } })),
  setWindY: (v) => set((s) => ({ windY: v, wind: { ...s.wind, y: v } })),
  setWindZ: (v) => set((s) => ({ windZ: v, wind: { ...s.wind, z: v } })),
  setDrag: (v) => set({ drag: v }),
  setColorStart: (v) => set({ colorStart: v }),
  setColorEnd: (v) => set({ colorEnd: v }),
  setColorCurve: (v) => set({ colorCurve: v }),
  setSizeMin: (v) => set({ sizeMin: v }),
  setSizeMax: (v) => set({ sizeMax: v }),
  setLifetime: (v) => set({ lifetime: v }),
  setParticleCount: (v) => set({ particleCount: v }),
  setActivePreset: (v) => set({ activePreset: v }),
  setIsApplying: (v) => set({ isApplying: v }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),

  applyPreset: (preset) => {
    const p = presets[preset]
    set({
      ...p,
      activePreset: preset,
      particleCount: 0,
    })
  },

  reset: () => set({ particleCount: 0 }),
}))
