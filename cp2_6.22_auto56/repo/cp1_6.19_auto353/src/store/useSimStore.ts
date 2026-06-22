import { create } from 'zustand'

export interface LightParams {
  intensity: number
  colorTemp: number
  angle: number
}

export interface PlantState {
  leafCount: number
  avgLeafArea: number
  stemHeight: number
  leafColor: string
  leafCurvature: number
}

export interface LightScheme {
  id: string
  name: string
  lightParams: LightParams
  plantState: PlantState
  thumbnail: string
}

export interface GrowthLog {
  id: string
  timestamp: string
  lightParams: LightParams
  plantState: PlantState
  photosynthesisRate: number
}

interface SimState {
  lightParams: LightParams
  plantState: PlantState
  schemes: LightScheme[]
  logs: GrowthLog[]
  activeSchemeId: string | null
  isResetting: boolean
  setLight: (params: Partial<LightParams>) => void
  addScheme: (name: string, thumbnail: string) => void
  removeScheme: (id: string) => void
  activateScheme: (id: string) => void
  updateSchemeName: (id: string, name: string) => void
  addLog: () => void
  resetAll: () => void
  setIsResetting: (value: boolean) => void
  updatePlantState: (state: Partial<PlantState>) => void
}

const DEFAULT_LIGHT_PARAMS: LightParams = {
  intensity: 500,
  colorTemp: 4500,
  angle: 90
}

const DEFAULT_PLANT_STATE: PlantState = {
  leafCount: 5,
  avgLeafArea: 25,
  stemHeight: 30,
  leafColor: '#1B5E20',
  leafCurvature: 0
}

export const calculateLeafColor = (intensity: number): string => {
  if (intensity < 300) {
    const t = intensity / 300
    return interpolateColor('#1B5E20', '#1B5E20', t)
  } else if (intensity < 700) {
    const t = (intensity - 300) / 400
    return interpolateColor('#1B5E20', '#FFEB3B', t)
  } else {
    const t = Math.min(1, (intensity - 700) / 300)
    return interpolateColor('#FFEB3B', '#795548', t)
  }
}

export const calculateLeafCurvature = (intensity: number): number => {
  if (intensity < 300) {
    return 0
  } else if (intensity > 800) {
    return 2
  } else {
    return ((intensity - 300) / 500) * 2
  }
}

export const calculatePhotosynthesisRate = (intensity: number): number => {
  const optimalLow = 300
  const optimalHigh = 700
  const maxRate = 15

  if (intensity < optimalLow) {
    return (intensity / optimalLow) * maxRate * 0.8
  } else if (intensity <= optimalHigh) {
    const mid = (optimalLow + optimalHigh) / 2
    const distFromMid = Math.abs(intensity - mid)
    const peakFactor = 1 - (distFromMid / ((optimalHigh - optimalLow) / 2)) * 0.2
    return maxRate * peakFactor
  } else {
    const overOptimal = intensity - optimalHigh
    const decayFactor = Math.max(0.3, 1 - (overOptimal / 300) * 0.7)
    return maxRate * decayFactor
  }
}

function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  return rgbToHex(r, g, b)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export const useSimStore = create<SimState>((set, get) => ({
  lightParams: DEFAULT_LIGHT_PARAMS,
  plantState: DEFAULT_PLANT_STATE,
  schemes: [],
  logs: [],
  activeSchemeId: null,
  isResetting: false,

  setLight: (params) => set((state) => {
    const newLightParams = { ...state.lightParams, ...params }
    const newLeafColor = calculateLeafColor(newLightParams.intensity)
    const newCurvature = calculateLeafCurvature(newLightParams.intensity)
    return {
      lightParams: newLightParams,
      plantState: {
        ...state.plantState,
        leafColor: newLeafColor,
        leafCurvature: newCurvature
      },
      activeSchemeId: null
    }
  }),

  updatePlantState: (state) => set((prev) => ({
    plantState: { ...prev.plantState, ...state }
  })),

  addScheme: (name, thumbnail) => set((state) => {
    if (state.schemes.length >= 4) return state
    const newScheme: LightScheme = {
      id: Date.now().toString(),
      name,
      lightParams: { ...state.lightParams },
      plantState: { ...state.plantState },
      thumbnail
    }
    return {
      schemes: [...state.schemes, newScheme],
      activeSchemeId: newScheme.id
    }
  }),

  removeScheme: (id) => set((state) => ({
    schemes: state.schemes.filter(s => s.id !== id),
    activeSchemeId: state.activeSchemeId === id ? null : state.activeSchemeId
  })),

  activateScheme: (id) => set((state) => {
    const scheme = state.schemes.find(s => s.id === id)
    if (!scheme) return state
    return {
      lightParams: { ...scheme.lightParams },
      plantState: { ...scheme.plantState },
      activeSchemeId: id
    }
  }),

  updateSchemeName: (id, name) => set((state) => ({
    schemes: state.schemes.map(s =>
      s.id === id ? { ...s, name } : s
    )
  })),

  addLog: () => set((state) => {
    const rate = calculatePhotosynthesisRate(state.lightParams.intensity)
    const now = new Date()
    const timestamp = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    const growthFactor = rate / 15
    const newLeafCount = Math.min(12, state.plantState.leafCount + (growthFactor > 0.7 ? 0.1 : 0))
    const newAvgLeafArea = Math.max(15, Math.min(45, state.plantState.avgLeafArea + (growthFactor > 0.5 ? 0.2 : -0.1)))
    const newStemHeight = Math.max(20, Math.min(60, state.plantState.stemHeight + (growthFactor > 0.6 ? 0.15 : -0.05)))

    const newLog: GrowthLog = {
      id: now.getTime().toString(),
      timestamp,
      lightParams: { ...state.lightParams },
      plantState: {
        ...state.plantState,
        leafCount: Math.round(newLeafCount * 10) / 10,
        avgLeafArea: Math.round(newAvgLeafArea * 10) / 10,
        stemHeight: Math.round(newStemHeight * 10) / 10
      },
      photosynthesisRate: Math.round(rate * 10) / 10
    }

    const newLogs = [...state.logs, newLog].slice(-100)
    
    return {
      logs: newLogs,
      plantState: {
        ...state.plantState,
        leafCount: Math.round(newLeafCount * 10) / 10,
        avgLeafArea: Math.round(newAvgLeafArea * 10) / 10,
        stemHeight: Math.round(newStemHeight * 10) / 10
      }
    }
  }),

  resetAll: () => set({
    lightParams: DEFAULT_LIGHT_PARAMS,
    plantState: DEFAULT_PLANT_STATE,
    schemes: [],
    logs: [],
    activeSchemeId: null
  }),

  setIsResetting: (value) => set({ isResetting: value })
}))
