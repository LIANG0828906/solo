import { create } from 'zustand'
import { SimulationStats } from '../types'

interface SimulationStore {
  stats: SimulationStats
  displayStats: SimulationStats
  updateStats: (stats: Partial<SimulationStats>) => void
  updateDisplayStats: () => void
}

const initialStats: SimulationStats = {
  avgVehicleWaitTime: 0,
  avgPedestrianCrossTime: 0,
  efficiencyScore: 50,
  vehicleCount: 0,
  pedestrianCount: 0,
  fps: 60,
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  stats: { ...initialStats },
  displayStats: { ...initialStats },

  updateStats: (newStats) => {
    set((state) => ({
      stats: { ...state.stats, ...newStats },
    }))
  },

  updateDisplayStats: () => {
    set((state) => {
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      const t = 0.1
      return {
        displayStats: {
          avgVehicleWaitTime: lerp(state.displayStats.avgVehicleWaitTime, state.stats.avgVehicleWaitTime, t),
          avgPedestrianCrossTime: lerp(state.displayStats.avgPedestrianCrossTime, state.stats.avgPedestrianCrossTime, t),
          efficiencyScore: lerp(state.displayStats.efficiencyScore, state.stats.efficiencyScore, t),
          vehicleCount: state.stats.vehicleCount,
          pedestrianCount: state.stats.pedestrianCount,
          fps: state.stats.fps,
        },
      }
    })
  },
}))
