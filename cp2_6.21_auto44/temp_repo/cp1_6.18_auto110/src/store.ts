import { create } from 'zustand'
import {
  BuildingData,
  PulseData,
  BuildingType,
  initializeBuildings,
  stepHeatDiffusion,
  updatePulses,
  createPulse,
  getRegionAverages,
  getTotalAverageHeat,
  resetBuildings,
} from './utils/heatSimulation'

export type SimulationSpeed = 'slow' | 'normal' | 'fast'

export interface HoveredBuilding {
  id: string
  type: BuildingType
  heat: number
  screenX: number
  screenY: number
}

interface SimulationState {
  buildings: BuildingData[]
  pulses: PulseData[]
  isRunning: boolean
  speed: SimulationSpeed
  timestep: number
  avgHeat: number
  regionAvg: Record<BuildingType, number>
  history: Array<{ timestep: number; avgHeat: number; regionAvg: Record<BuildingType, number> }>
  hoveredBuilding: HoveredBuilding | null
  actions: {
    start: () => void
    pause: () => void
    toggle: () => void
    reset: () => void
    setSpeed: (speed: SimulationSpeed) => void
    stepSimulation: (deltaTimeMs: number) => void
    addPulse: (buildingId: string) => void
    setHovered: (hovered: HoveredBuilding | null) => void
  }
}

const SPEED_MULTIPLIERS: Record<SimulationSpeed, number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
}

const MAX_HISTORY = 100

const initialBuildings = initializeBuildings()
const initialRegionAvg = getRegionAverages(initialBuildings)
const initialAvgHeat = getTotalAverageHeat(initialBuildings)

export const useStore = create<SimulationState>((set, get) => ({
  buildings: initialBuildings,
  pulses: [],
  isRunning: true,
  speed: 'normal',
  timestep: 0,
  avgHeat: initialAvgHeat,
  regionAvg: initialRegionAvg,
  history: [
    {
      timestep: 0,
      avgHeat: initialAvgHeat,
      regionAvg: initialRegionAvg,
    },
  ],
  hoveredBuilding: null,

  actions: {
    start: () => set({ isRunning: true }),
    pause: () => set({ isRunning: false }),
    toggle: () => set(s => ({ isRunning: !s.isRunning })),

    reset: () => {
      const buildings = resetBuildings(get().buildings)
      const regionAvg = getRegionAverages(buildings)
      const avgHeat = getTotalAverageHeat(buildings)
      set({
        buildings,
        pulses: [],
        timestep: 0,
        regionAvg,
        avgHeat,
        history: [{ timestep: 0, avgHeat, regionAvg }],
      })
    },

    setSpeed: (speed: SimulationSpeed) => set({ speed }),

    stepSimulation: (deltaTimeMs: number) => {
      const state = get()
      if (!state.isRunning) return

      const multiplier = SPEED_MULTIPLIERS[state.speed]
      const effectiveDelta = deltaTimeMs * multiplier
      const currentTime = performance.now()

      let buildings = state.buildings
      let pulses = state.pulses

      const pulseResult = updatePulses(buildings, pulses, currentTime)
      buildings = pulseResult.buildings
      pulses = pulseResult.pulses

      const diffusionSteps = Math.max(1, Math.round(effectiveDelta / 50))
      for (let i = 0; i < diffusionSteps; i++) {
        buildings = stepHeatDiffusion(buildings)
      }

      const newTimestep = state.timestep + diffusionSteps
      const newRegionAvg = getRegionAverages(buildings)
      const newAvgHeat = getTotalAverageHeat(buildings)

      let newHistory = state.history
      if (newTimestep % 5 < diffusionSteps) {
        newHistory = [
          ...state.history,
          { timestep: newTimestep, avgHeat: newAvgHeat, regionAvg: newRegionAvg },
        ]
        if (newHistory.length > MAX_HISTORY) {
          newHistory = newHistory.slice(-MAX_HISTORY)
        }
      }

      set({
        buildings,
        pulses,
        timestep: newTimestep,
        regionAvg: newRegionAvg,
        avgHeat: newAvgHeat,
        history: newHistory,
      })
    },

    addPulse: (buildingId: string) => {
      const state = get()
      const building = state.buildings.find(b => b.id === buildingId)
      if (!building) return

      const currentTime = performance.now()
      const pulse = createPulse(building, currentTime)
      set(s => ({
        pulses: [...s.pulses, pulse],
      }))
    },

    setHovered: (hovered: HoveredBuilding | null) => {
      set({ hoveredBuilding: hovered })
    },
  },
}))
