import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { CrossroadSignal, SignalColor, GRID_SIZE, PRESET_MODULES } from '../types'

interface CrossroadSignalStore {
  crossroads: Map<string, CrossroadSignal>
  initCrossroads: () => void
  setSignalDuration: (id: string, color: SignalColor, duration: number) => void
  applyPreset: (presetId: string) => void
  updateSignalStates: (deltaTime: number) => void
  getCrossroadAtGrid: (gridX: number, gridY: number) => CrossroadSignal | undefined
}

const getCrossroadId = (gridX: number, gridY: number) => `crossroad_${gridX}_${gridY}`

const createDefaultCrossroad = (gridX: number, gridY: number): CrossroadSignal => {
  const defaultConfig = PRESET_MODULES[0].signalConfig
  return {
    id: getCrossroadId(gridX, gridY),
    gridX,
    gridY,
    redDuration: defaultConfig.redDuration,
    yellowDuration: defaultConfig.yellowDuration,
    greenDuration: defaultConfig.greenDuration,
    currentColor: ((gridX + gridY) % 2 === 0 ? 'green' : 'red') as SignalColor,
    remainingTime: ((gridX + gridY) % 2 === 0 ? defaultConfig.greenDuration : defaultConfig.redDuration),
  }
}

export const useCrossroadSignalStore = create<CrossroadSignalStore>((set, get) => ({
  crossroads: new Map(),

  initCrossroads: () => {
    const crossroads = new Map<string, CrossroadSignal>()
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const crossroad = createDefaultCrossroad(x, y)
        crossroads.set(crossroad.id, crossroad)
      }
    }
    set({ crossroads })
  },

  setSignalDuration: (id: string, color: SignalColor, duration: number) => {
    set((state) => {
      const newCrossroads = new Map(state.crossroads)
      const crossroad = newCrossroads.get(id)
      if (crossroad) {
        const updated = { ...crossroad }
        if (color === 'red') updated.redDuration = Math.max(1, duration)
        if (color === 'yellow') updated.yellowDuration = Math.max(1, duration)
        if (color === 'green') updated.greenDuration = Math.max(1, duration)
        if (updated.currentColor === color) {
          updated.remainingTime = Math.min(updated.remainingTime, duration)
        }
        newCrossroads.set(id, updated)
      }
      return { crossroads: newCrossroads }
    })
  },

  applyPreset: (presetId: string) => {
    const preset = PRESET_MODULES.find((p) => p.id === presetId)
    if (!preset) return

    set((state) => {
      const newCrossroads = new Map(state.crossroads)
      newCrossroads.forEach((crossroad, id) => {
        const updated = {
          ...crossroad,
          redDuration: preset.signalConfig.redDuration,
          yellowDuration: preset.signalConfig.yellowDuration,
          greenDuration: preset.signalConfig.greenDuration,
          currentColor: 'green' as SignalColor,
          remainingTime: preset.signalConfig.greenDuration,
        }
        newCrossroads.set(id, updated)
      })
      return { crossroads: newCrossroads }
    })
  },

  updateSignalStates: (deltaTime: number) => {
    set((state) => {
      const newCrossroads = new Map(state.crossroads)
      newCrossroads.forEach((crossroad, id) => {
        const updated = { ...crossroad }
        updated.remainingTime -= deltaTime
        if (updated.remainingTime <= 0) {
          if (updated.currentColor === 'green') {
            updated.currentColor = 'yellow'
            updated.remainingTime = updated.yellowDuration
          } else if (updated.currentColor === 'yellow') {
            updated.currentColor = 'red'
            updated.remainingTime = updated.redDuration
          } else {
            updated.currentColor = 'green'
            updated.remainingTime = updated.greenDuration
          }
        }
        newCrossroads.set(id, updated)
      })
      return { crossroads: newCrossroads }
    })
  },

  getCrossroadAtGrid: (gridX: number, gridY: number) => {
    return get().crossroads.get(getCrossroadId(gridX, gridY))
  },
}))
