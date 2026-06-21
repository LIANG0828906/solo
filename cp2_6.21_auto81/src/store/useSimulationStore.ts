import { create } from 'zustand'

export type Vec3 = [number, number, number]

export type GradientMode = 'linear' | 'exponential'

export interface EmitterConfig {
  id: string
  position: Vec3
  lifetime: number
  emitRate: number
  velocity: Vec3
  colorStart: string
  colorEnd: string
  particleSize: number
  gradientMode: GradientMode
  active: boolean
}

export interface PhysicsConfig {
  viscosity: number
  gravity: number
  vortexFrequency: number
  vortexAmplitude: number
  windDirection: Vec3
  windStrength: number
  trailLength: number
}

export interface PlacementEffect {
  id: string
  position: Vec3
  timestamp: number
  color: string
}

interface SimulationState {
  emitters: EmitterConfig[]
  physics: PhysicsConfig
  activeEmitterId: string | null
  placementEffects: PlacementEffect[]
  hoveredEmitterId: string | null

  addEmitter: (position: Vec3) => void
  removeEmitter: (id: string) => void
  updateEmitter: (id: string, partial: Partial<EmitterConfig>) => void
  setActiveEmitter: (id: string | null) => void
  updatePhysics: (partial: Partial<PhysicsConfig>) => void
  addPlacementEffect: (position: Vec3, color: string) => void
  clearPlacementEffect: (id: string) => void
  setHoveredEmitter: (id: string | null) => void
}

let emitterCounter = 0

const defaultColors = [
  { start: '#e94560', end: '#0f3460' },
  { start: '#00d2ff', end: '#3a7bd5' },
  { start: '#f7971e', end: '#ffd200' },
]

export const useSimulationStore = create<SimulationState>((set) => ({
  emitters: [],
  physics: {
    viscosity: 0.1,
    gravity: -0.5,
    vortexFrequency: 1.0,
    vortexAmplitude: 2.0,
    windDirection: [1, 0, 0] as Vec3,
    windStrength: 0,
    trailLength: 0.5,
  },
  activeEmitterId: null,
  placementEffects: [],
  hoveredEmitterId: null,

  addEmitter: (position) =>
    set((state) => {
      if (state.emitters.length >= 3) return state
      const idx = state.emitters.length
      const id = `emitter-${++emitterCounter}`
      const emitter: EmitterConfig = {
        id,
        position,
        lifetime: 4,
        emitRate: 150,
        velocity: [0, 2, 0],
        colorStart: defaultColors[idx].start,
        colorEnd: defaultColors[idx].end,
        particleSize: 3,
        gradientMode: 'linear',
        active: true,
      }
      return {
        emitters: [...state.emitters, emitter],
        activeEmitterId: id,
      }
    }),

  removeEmitter: (id) =>
    set((state) => ({
      emitters: state.emitters.filter((e) => e.id !== id),
      activeEmitterId: state.activeEmitterId === id ? null : state.activeEmitterId,
    })),

  updateEmitter: (id, partial) =>
    set((state) => ({
      emitters: state.emitters.map((e) =>
        e.id === id ? { ...e, ...partial } : e
      ),
    })),

  setActiveEmitter: (id) => set({ activeEmitterId: id }),

  updatePhysics: (partial) =>
    set((state) => ({
      physics: { ...state.physics, ...partial },
    })),

  addPlacementEffect: (position, color) =>
    set((state) => ({
      placementEffects: [
        ...state.placementEffects,
        {
          id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position,
          timestamp: Date.now(),
          color,
        },
      ],
    })),

  clearPlacementEffect: (id) =>
    set((state) => ({
      placementEffects: state.placementEffects.filter((e) => e.id !== id),
    })),

  setHoveredEmitter: (id) => set({ hoveredEmitterId: id }),
}))
