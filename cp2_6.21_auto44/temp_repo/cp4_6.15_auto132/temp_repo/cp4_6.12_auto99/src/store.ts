import { create } from 'zustand'

export interface HistoryPoint {
  time: number
  position: number
  kineticEnergy: number
  potentialEnergy: number
  totalEnergy: number
}

export interface PhysicsOutput {
  position: number
  velocity: number
  acceleration: number
  kineticEnergy: number
  potentialEnergy: number
}

interface SimulationState {
  damping: number
  stiffness: number
  forceAmplitude: number
  forceFrequency: number

  isRunning: boolean
  elapsedTime: number

  position: number
  velocity: number
  acceleration: number

  history: HistoryPoint[]

  setDamping: (v: number) => void
  setStiffness: (v: number) => void
  setForceAmplitude: (v: number) => void
  setForceFrequency: (v: number) => void

  start: () => void
  pause: () => void
  reset: () => void

  setPhysicsOutput: (output: PhysicsOutput) => void
  addHistoryPoint: (point: HistoryPoint) => void
  incrementElapsedTime: (dt: number) => void
}

const MAX_HISTORY_POINTS = 100

export const useSimulationStore = create<SimulationState>((set, get) => ({
  damping: 2,
  stiffness: 5,
  forceAmplitude: 3,
  forceFrequency: 0.5,

  isRunning: false,
  elapsedTime: 0,

  position: 0,
  velocity: 0,
  acceleration: 0,

  history: [],

  setDamping: (v) => set({ damping: v }),
  setStiffness: (v) => set({ stiffness: v }),
  setForceAmplitude: (v) => set({ forceAmplitude: v }),
  setForceFrequency: (v) => set({ forceFrequency: v }),

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  reset: () =>
    set({
      isRunning: false,
      elapsedTime: 0,
      position: 0,
      velocity: 0,
      acceleration: 0,
      history: []
    }),

  setPhysicsOutput: (output) =>
    set({
      position: output.position,
      velocity: output.velocity,
      acceleration: output.acceleration
    }),

  addHistoryPoint: (point) => {
    const currentHistory = get().history
    const newHistory = [...currentHistory, point]
    if (newHistory.length > MAX_HISTORY_POINTS) {
      newHistory.splice(0, newHistory.length - MAX_HISTORY_POINTS)
    }
    set({ history: newHistory })
  },

  incrementElapsedTime: (dt) =>
    set((state) => ({ elapsedTime: state.elapsedTime + dt }))
}))
