import { create } from 'zustand'

export type CoralType = 'staghorn' | 'brain' | 'soft'

export interface Coral {
  id: string
  type: CoralType
  position: [number, number, number]
  growth: number
  health: number
  colorProgress: number
  bleachingProgress: number
  placementTime: number
}

export interface EnvironmentParams {
  temperature: number
  light: number
  waterFlow: number
  nutrients: number
}

export interface HistoryDataPoint {
  timestamp: number
  totalArea: number
  colorSaturation: number
}

interface CoralStore {
  corals: Coral[]
  environmentParams: EnvironmentParams
  historyData: HistoryDataPoint[]
  selectedCoralType: CoralType | null
  isPlacing: boolean
  hoverPosition: [number, number, number] | null
  showMenu: boolean
  menuPosition: [number, number, number] | null
  lastRecordTime: number
  elapsedTime: number

  addCoral: (type: CoralType, position: [number, number, number]) => void
  updateParams: (params: Partial<EnvironmentParams>) => void
  tick: (deltaTime: number) => void
  reset: () => void
  startPlacing: (type: CoralType) => void
  cancelPlacing: () => void
  setHoverPosition: (pos: [number, number, number] | null) => void
  showCoralMenu: (position: [number, number, number]) => void
  hideCoralMenu: () => void
  calculateTotalArea: () => number
  calculateColorSaturation: () => number
}

const BASE_AREAS: Record<CoralType, number> = {
  staghorn: 0.15,
  brain: 0.5,
  soft: 0.3
}

const DEFAULT_PARAMS: EnvironmentParams = {
  temperature: 26,
  light: 1500,
  waterFlow: 2,
  nutrients: 0.3
}

const generateId = () => Math.random().toString(36).substring(2, 11)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const useCoralStore = create<CoralStore>((set, get) => ({
  corals: [],
  environmentParams: { ...DEFAULT_PARAMS },
  historyData: [],
  selectedCoralType: null,
  isPlacing: false,
  hoverPosition: null,
  showMenu: false,
  menuPosition: null,
  lastRecordTime: 0,
  elapsedTime: 0,

  addCoral: (type: CoralType, position: [number, number, number]) => {
    const newCoral: Coral = {
      id: generateId(),
      type,
      position,
      growth: 0.1,
      health: 1,
      colorProgress: Math.random(),
      bleachingProgress: 0,
      placementTime: Date.now()
    }
    set((state) => ({
      corals: [...state.corals, newCoral],
      isPlacing: false,
      selectedCoralType: null,
      showMenu: false,
      menuPosition: null
    }))
  },

  updateParams: (params: Partial<EnvironmentParams>) => {
    set((state) => ({
      environmentParams: { ...state.environmentParams, ...params }
    }))
  },

  tick: (deltaTime: number) => {
    const state = get()
    const { environmentParams, corals, lastRecordTime, elapsedTime } = state

    const newElapsedTime = elapsedTime + deltaTime

    const updatedCorals = corals.map((coral) => {
      const tempStress = Math.max(0, environmentParams.temperature - 30) * 0.1
      const nutrientStress = Math.max(0, 0.1 - environmentParams.nutrients) * 2
      const health = Math.max(0, 1 - tempStress - nutrientStress)

      const growthRate = 0.001 * (environmentParams.light / 1500) * (environmentParams.nutrients / 0.3) * health
      const growth = Math.min(1, coral.growth + growthRate * deltaTime)

      let bleachingProgress = coral.bleachingProgress
      if (health < 0.3) {
        bleachingProgress = Math.min(1, bleachingProgress + deltaTime / 15)
      } else if (health > 0.7) {
        bleachingProgress = Math.max(0, bleachingProgress - deltaTime / 30)
      }

      const colorProgress = (coral.colorProgress + deltaTime * 0.02) % 1

      return {
        ...coral,
        growth,
        health,
        bleachingProgress,
        colorProgress
      }
    })

    let newHistoryData = state.historyData
    if (newElapsedTime - lastRecordTime >= 5) {
      const totalArea = updatedCorals.reduce((sum, coral) => {
        return sum + BASE_AREAS[coral.type] * coral.growth * coral.health
      }, 0)

      const colorSaturation = updatedCorals.length > 0
        ? updatedCorals.reduce((sum, coral) => {
            return sum + (1 - coral.bleachingProgress)
          }, 0) / updatedCorals.length
        : 0

      const newPoint: HistoryDataPoint = {
        timestamp: newElapsedTime,
        totalArea: Math.round(totalArea * 100) / 100,
        colorSaturation: Math.round(colorSaturation * 100) / 100
      }

      const cutoffTime = newElapsedTime - 120
      newHistoryData = [...state.historyData, newPoint]
        .filter((p) => p.timestamp >= cutoffTime)

      set({ lastRecordTime: newElapsedTime })
    }

    set({
      corals: updatedCorals,
      historyData: newHistoryData,
      elapsedTime: newElapsedTime
    })
  },

  reset: () => {
    set({
      corals: [],
      environmentParams: { ...DEFAULT_PARAMS },
      historyData: [],
      selectedCoralType: null,
      isPlacing: false,
      hoverPosition: null,
      showMenu: false,
      menuPosition: null,
      lastRecordTime: 0,
      elapsedTime: 0
    })
  },

  startPlacing: (type: CoralType) => {
    set({
      selectedCoralType: type,
      isPlacing: true,
      showMenu: false,
      menuPosition: null
    })
  },

  cancelPlacing: () => {
    set({
      selectedCoralType: null,
      isPlacing: false,
      hoverPosition: null
    })
  },

  setHoverPosition: (pos: [number, number, number] | null) => {
    set({ hoverPosition: pos })
  },

  showCoralMenu: (position: [number, number, number]) => {
    set({
      showMenu: true,
      menuPosition: position
    })
  },

  hideCoralMenu: () => {
    set({
      showMenu: false,
      menuPosition: null
    })
  },

  calculateTotalArea: () => {
    const { corals } = get()
    return corals.reduce((sum, coral) => {
      return sum + BASE_AREAS[coral.type] * coral.growth * coral.health
    }, 0)
  },

  calculateColorSaturation: () => {
    const { corals } = get()
    if (corals.length === 0) return 0
    return corals.reduce((sum, coral) => {
      return sum + (1 - coral.bleachingProgress)
    }, 0) / corals.length
  }
}))

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = Math.round(lerp(c1.r, c2.r, t))
  const g = Math.round(lerp(c1.g, c2.g, t))
  const b = Math.round(lerp(c1.b, c2.b, t))
  return `rgb(${r}, ${g}, ${b})`
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

export function getCoralColor(coral: Coral): string {
  const healthyColor = lerpColor('#FF6B6B', '#FFD93D', coral.colorProgress)
  const midBleach = lerpColor('#E0E0E0', '#B0B0B0', 0.5)
  const bleachedColor = coral.bleachingProgress < 0.5
    ? lerpColor('#E0E0E0', midBleach, coral.bleachingProgress * 2)
    : lerpColor(midBleach, '#808080', (coral.bleachingProgress - 0.5) * 2)

  const h = hexToRgb(healthyColor)
  const b = hexToRgb(bleachedColor.startsWith('#') ? bleachedColor : rgbToHex(bleachedColor))

  const r = Math.round(lerp(h.r, b.r, coral.bleachingProgress))
  const g = Math.round(lerp(h.g, b.g, coral.bleachingProgress))
  const b_val = Math.round(lerp(h.b, b.b, coral.bleachingProgress))

  return `rgb(${r}, ${g}, ${b_val})`
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return '#808080'
  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
