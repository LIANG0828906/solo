export interface CityBuilding {
  id: string
  position: { x: number; z: number }
  width: number
  depth: number
  height: number
  orientation: 'north' | 'south' | 'east' | 'west'
  heatLevel: 'low' | 'medium' | 'high'
}

export interface HeatGridCell {
  x: number
  z: number
  temperature: number
}

export interface SimulationParams {
  greenCoverage: number
  waterCoverage: number
  sunlightIntensity: number
}

export interface HeatStatistics {
  avgTemp: number
  maxTemp: number
  minTemp: number
  stdDev: number
}

export interface AppState {
  buildings: CityBuilding[]
  heatGrid: HeatGridCell[]
  params: SimulationParams
  selectedBuildingId: string | null
  statistics: HeatStatistics
}

export interface AppActions {
  setParams: (params: Partial<SimulationParams>) => void
  selectBuilding: (id: string | null) => void
  regenerateBuildings: () => void
  updateHeatGrid: () => void
}

export const GRID_SIZE = 16
export const SCENE_SIZE = 10
export const BASE_TEMP = 25
