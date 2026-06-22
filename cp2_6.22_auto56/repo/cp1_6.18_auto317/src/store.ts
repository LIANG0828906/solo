import { create } from 'zustand'
import type { CityBuilding, HeatGridCell, SimulationParams, HeatStatistics } from './types'
import { generateBuildings, updateHeatGrid } from './heatIsland'

interface AppStore {
  buildings: CityBuilding[]
  heatGrid: HeatGridCell[]
  params: SimulationParams
  selectedBuildingId: string | null
  statistics: HeatStatistics

  setParams: (params: Partial<SimulationParams>) => void
  selectBuilding: (id: string | null) => void
  regenerateBuildings: () => void
}

const initialBuildings = generateBuildings()
const initialResult = updateHeatGrid(initialBuildings, {
  greenCoverage: 20,
  waterCoverage: 10,
  sunlightIntensity: 100,
})

export const useAppStore = create<AppStore>((set, get) => ({
  buildings: initialBuildings,
  heatGrid: initialResult.grid,
  params: {
    greenCoverage: 20,
    waterCoverage: 10,
    sunlightIntensity: 100,
  },
  selectedBuildingId: null,
  statistics: initialResult.statistics,

  setParams: (newParams) => {
    const current = get()
    const updatedParams = { ...current.params, ...newParams }
    const result = updateHeatGrid(current.buildings, updatedParams)
    set({
      params: updatedParams,
      heatGrid: result.grid,
      statistics: result.statistics,
    })
  },

  selectBuilding: (id) => {
    set({ selectedBuildingId: id })
  },

  regenerateBuildings: () => {
    const buildings = generateBuildings()
    const result = updateHeatGrid(buildings, get().params)
    set({
      buildings,
      heatGrid: result.grid,
      statistics: result.statistics,
      selectedBuildingId: null,
    })
  },
}))
