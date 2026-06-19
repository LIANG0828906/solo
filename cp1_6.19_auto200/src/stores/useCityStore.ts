import { create } from 'zustand'
import {
  Building,
  HeatGridPoint,
  MitigationState,
  ZoneData,
  ZONES,
  generateBuildings,
  calculateHeatData,
} from '@/utils/heatCalculation'

interface CityState {
  selectedZoneId: string | null
  selectedZoneData: ZoneData | null
  buildingDensity: number
  vegetationCoverage: number
  materialAlbedo: number
  mitigations: MitigationState
  buildings: Building[]
  heatGrid: HeatGridPoint[]
  stats: {
    avgTemp: number
    maxTemp: number
    minTemp: number
    tempReduction: number
  }
  history: {
    density: number
    vegetation: number
    albedo: number
    mitigations: MitigationState
  }[]
  selectZone: (zoneId: string) => void
  setBuildingDensity: (value: number) => void
  setVegetationCoverage: (value: number) => void
  setMaterialAlbedo: (value: number) => void
  toggleMitigation: (key: keyof MitigationState) => void
  reset: () => void
  undo: () => void
  recalculateHeat: () => void
}

const initialStats = {
  avgTemp: 30,
  maxTemp: 35,
  minTemp: 25,
  tempReduction: 0,
}

export const useCityStore = create<CityState>((set, get) => ({
  selectedZoneId: null,
  selectedZoneData: null,
  buildingDensity: 60,
  vegetationCoverage: 30,
  materialAlbedo: 0.4,
  mitigations: {
    greenRoof: false,
    verticalGreening: false,
    permeablePavement: false,
  },
  buildings: [],
  heatGrid: [],
  stats: initialStats,
  history: [],

  selectZone: (zoneId: string) => {
    const zoneData = ZONES.find((z) => z.id === zoneId)
    if (!zoneData) return

    const buildings = generateBuildings(zoneData.density, zoneData.albedo, zoneId)
    const result = calculateHeatData(
      buildings,
      zoneData.density,
      zoneData.vegetation,
      zoneData.albedo,
      { greenRoof: false, verticalGreening: false, permeablePavement: false }
    )

    set({
      selectedZoneId: zoneId,
      selectedZoneData: zoneData,
      buildingDensity: zoneData.density,
      vegetationCoverage: zoneData.vegetation,
      materialAlbedo: zoneData.albedo,
      mitigations: {
        greenRoof: false,
        verticalGreening: false,
        permeablePavement: false,
      },
      buildings: result.buildings,
      heatGrid: result.grid,
      stats: result.stats,
      history: [],
    })
  },

  setBuildingDensity: (value: number) => {
    const { buildingDensity, vegetationCoverage, materialAlbedo, mitigations, selectedZoneId, history } = get()
    
    const newHistory = [
      ...history,
      { density: buildingDensity, vegetation: vegetationCoverage, albedo: materialAlbedo, mitigations: { ...mitigations } },
    ].slice(-20)

    const newBuildings = selectedZoneId 
      ? generateBuildings(value, materialAlbedo, selectedZoneId)
      : get().buildings

    const result = calculateHeatData(
      newBuildings,
      value,
      vegetationCoverage,
      materialAlbedo,
      mitigations
    )

    set({
      buildingDensity: value,
      buildings: result.buildings,
      heatGrid: result.grid,
      stats: result.stats,
      history: newHistory,
    })
  },

  setVegetationCoverage: (value: number) => {
    const { buildingDensity, vegetationCoverage, materialAlbedo, mitigations, buildings, history } = get()
    
    const newHistory = [
      ...history,
      { density: buildingDensity, vegetation: vegetationCoverage, albedo: materialAlbedo, mitigations: { ...mitigations } },
    ].slice(-20)

    const result = calculateHeatData(
      buildings,
      buildingDensity,
      value,
      materialAlbedo,
      mitigations
    )

    set({
      vegetationCoverage: value,
      heatGrid: result.grid,
      buildings: result.buildings,
      stats: result.stats,
      history: newHistory,
    })
  },

  setMaterialAlbedo: (value: number) => {
    const { buildingDensity, vegetationCoverage, materialAlbedo, mitigations, buildings, selectedZoneId, history } = get()
    
    const newHistory = [
      ...history,
      { density: buildingDensity, vegetation: vegetationCoverage, albedo: materialAlbedo, mitigations: { ...mitigations } },
    ].slice(-20)

    const newBuildings = selectedZoneId
      ? generateBuildings(buildingDensity, value, selectedZoneId)
      : buildings

    const result = calculateHeatData(
      newBuildings,
      buildingDensity,
      vegetationCoverage,
      value,
      mitigations
    )

    set({
      materialAlbedo: value,
      buildings: result.buildings,
      heatGrid: result.grid,
      stats: result.stats,
      history: newHistory,
    })
  },

  toggleMitigation: (key: keyof MitigationState) => {
    const { buildingDensity, vegetationCoverage, materialAlbedo, mitigations, buildings, history } = get()
    
    const newHistory = [
      ...history,
      { density: buildingDensity, vegetation: vegetationCoverage, albedo: materialAlbedo, mitigations: { ...mitigations } },
    ].slice(-20)

    const newMitigations = {
      ...mitigations,
      [key]: !mitigations[key],
    }

    const result = calculateHeatData(
      buildings,
      buildingDensity,
      vegetationCoverage,
      materialAlbedo,
      newMitigations
    )

    set({
      mitigations: newMitigations,
      heatGrid: result.grid,
      buildings: result.buildings,
      stats: result.stats,
      history: newHistory,
    })
  },

  reset: () => {
    const { selectedZoneData } = get()
    if (!selectedZoneData) return

    const buildings = generateBuildings(selectedZoneData.density, selectedZoneData.albedo, selectedZoneData.id)
    const result = calculateHeatData(
      buildings,
      selectedZoneData.density,
      selectedZoneData.vegetation,
      selectedZoneData.albedo,
      { greenRoof: false, verticalGreening: false, permeablePavement: false }
    )

    set({
      buildingDensity: selectedZoneData.density,
      vegetationCoverage: selectedZoneData.vegetation,
      materialAlbedo: selectedZoneData.albedo,
      mitigations: {
        greenRoof: false,
        verticalGreening: false,
        permeablePavement: false,
      },
      buildings: result.buildings,
      heatGrid: result.grid,
      stats: result.stats,
      history: [],
    })
  },

  undo: () => {
    const { history, buildings } = get()
    if (history.length === 0) return

    const prev = history[history.length - 1]
    const newHistory = history.slice(0, -1)

    const result = calculateHeatData(
      buildings,
      prev.density,
      prev.vegetation,
      prev.albedo,
      prev.mitigations
    )

    set({
      buildingDensity: prev.density,
      vegetationCoverage: prev.vegetation,
      materialAlbedo: prev.albedo,
      mitigations: prev.mitigations,
      heatGrid: result.grid,
      stats: result.stats,
      history: newHistory,
    })
  },

  recalculateHeat: () => {
    const { buildings, buildingDensity, vegetationCoverage, materialAlbedo, mitigations } = get()
    const result = calculateHeatData(
      buildings,
      buildingDensity,
      vegetationCoverage,
      materialAlbedo,
      mitigations
    )
    set({
      heatGrid: result.grid,
      stats: result.stats,
      buildings: result.buildings,
    })
  },
}))
