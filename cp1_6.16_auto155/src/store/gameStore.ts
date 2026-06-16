import { create } from 'zustand'
import type { GameState, MapData, PathPoint, EncounterEvent, TooltipData } from '../types'

export const useGameStore = create<GameState>((set, get) => ({
  seed: Date.now() % 100000,
  mapSize: 128,
  mapData: null,
  anchorPoint: null,
  route: [],
  encounters: [],
  selectedEncounterId: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  ripples: [],
  tooltip: { x: 0, y: 0, text: '', visible: false, fadeStart: 0 },
  lastFrame: 0,

  generateMap: (seed: number, size: number) => {
    set({ seed, mapSize: size })
  },

  setMapData: (data: MapData) => {
    set({ mapData: data, anchorPoint: null, route: [], encounters: [] })
  },

  setAnchorPoint: (point: PathPoint | null) => {
    set({ anchorPoint: point })
  },

  setRoute: (route: PathPoint[]) => {
    set({ route })
  },

  addEncounters: (encounters: EncounterEvent[]) => {
    set((state) => ({
      encounters: [...state.encounters, ...encounters],
    }))
  },

  setSelectedEncounter: (id: string | null) => {
    set({ selectedEncounterId: id })
  },

  updateEncounterNote: (id: string, note: string) => {
    set((state) => ({
      encounters: state.encounters.map((e) =>
        e.id === id ? { ...e, note } : e
      ),
    }))
  },

  setScale: (scale: number) => {
    const clamped = Math.max(0.5, Math.min(2, scale))
    set({ scale: clamped })
  },

  setOffset: (x: number, y: number) => {
    set({ offsetX: x, offsetY: y })
  },

  addRipple: (x: number, y: number) => {
    set((state) => ({
      ripples: [...state.ripples, { x, y, startTime: performance.now() }],
    }))
  },

  removeOldRipples: () => {
    const now = performance.now()
    set((state) => ({
      ripples: state.ripples.filter((r) => now - r.startTime < 600),
    }))
  },

  setTooltip: (tooltip: Partial<TooltipData>) => {
    set((state) => ({
      tooltip: { ...state.tooltip, ...tooltip },
    }))
  },

  setLastFrame: (frame: number) => {
    set({ lastFrame: frame })
  },

  exportEncountersJSON: () => {
    const { encounters } = get()
    const dataStr = JSON.stringify(encounters, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `encounters_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}))
