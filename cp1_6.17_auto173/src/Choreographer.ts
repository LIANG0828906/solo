import { create } from 'zustand'
import {
  IBeam,
  BeamType,
  createBeam,
  GRID_COLS,
  GRID_ROWS,
  MAX_BEAMS,
} from './BeamModel'

interface HistoryState {
  beams: IBeam[]
}

interface ChoreographerState {
  beams: IBeam[]
  selectedBeamId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  history: HistoryState[]
  historyIndex: number
  errorCell: { x: number; y: number } | null

  addBeam: (type: BeamType, gridX: number, gridY: number) => boolean
  removeBeam: (id: string) => void
  updateBeam: (id: string, updates: Partial<IBeam>) => void
  clearAll: () => void
  selectBeam: (id: string | null) => void
  setErrorCell: (cell: { x: number; y: number } | null) => void

  play: () => void
  pause: () => void
  setCurrentTime: (time: number) => void

  undo: () => void
  canUndo: () => boolean

  getBeamAt: (gridX: number, gridY: number) => IBeam | undefined
  saveToHistory: () => void
}

const initialState: Omit<
  ChoreographerState,
  | 'addBeam'
  | 'removeBeam'
  | 'updateBeam'
  | 'clearAll'
  | 'selectBeam'
  | 'setErrorCell'
  | 'play'
  | 'pause'
  | 'setCurrentTime'
  | 'undo'
  | 'canUndo'
  | 'getBeamAt'
  | 'saveToHistory'
> = {
  beams: [],
  selectedBeamId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 10,
  history: [{ beams: [] }],
  historyIndex: 0,
  errorCell: null,
}

export const useChoreographerStore = create<ChoreographerState>((set, get) => ({
  ...initialState,

  addBeam: (type: BeamType, gridX: number, gridY: number) => {
    const state = get()

    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
      return false
    }

    if (state.beams.length >= MAX_BEAMS) {
      return false
    }

    const existing = state.beams.find(
      (b) => b.gridX === gridX && b.gridY === gridY
    )
    if (existing) {
      return false
    }

    const newBeam = createBeam({
      type,
      gridX,
      gridY,
      order: state.beams.length,
    })

    const newBeams = [...state.beams, newBeam]

    set({
      beams: newBeams,
      history: [...state.history.slice(0, state.historyIndex + 1), { beams: newBeams }],
      historyIndex: state.historyIndex + 1,
    })

    return true
  },

  removeBeam: (id: string) => {
    const state = get()
    const newBeams = state.beams.filter((b) => b.id !== id)

    set({
      beams: newBeams,
      selectedBeamId: state.selectedBeamId === id ? null : state.selectedBeamId,
      history: [...state.history.slice(0, state.historyIndex + 1), { beams: newBeams }],
      historyIndex: state.historyIndex + 1,
    })
  },

  updateBeam: (id: string, updates: Partial<IBeam>) => {
    const state = get()
    const newBeams = state.beams.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    )

    set({
      beams: newBeams,
    })
  },

  clearAll: () => {
    set({
      beams: [],
      selectedBeamId: null,
      history: [...get().history.slice(0, get().historyIndex + 1), { beams: [] }],
      historyIndex: get().historyIndex + 1,
    })
  },

  selectBeam: (id: string | null) => {
    set({ selectedBeamId: id })
  },

  setErrorCell: (cell: { x: number; y: number } | null) => {
    set({ errorCell: cell })
  },

  play: () => {
    set({ isPlaying: true, currentTime: 0 })
  },

  pause: () => {
    set({ isPlaying: false })
  },

  setCurrentTime: (time: number) => {
    const state = get()
    const clampedTime = Math.max(0, Math.min(state.duration, time))
    set({ currentTime: clampedTime })

    if (clampedTime >= state.duration) {
      set({ isPlaying: false, currentTime: 0 })
    }
  },

  undo: () => {
    const state = get()
    if (state.historyIndex <= 0) return

    const newIndex = state.historyIndex - 1
    const historyState = state.history[newIndex]

    set({
      beams: historyState.beams,
      historyIndex: newIndex,
      selectedBeamId: null,
    })
  },

  canUndo: () => {
    return get().historyIndex > 0
  },

  getBeamAt: (gridX: number, gridY: number) => {
    return get().beams.find((b) => b.gridX === gridX && b.gridY === gridY)
  },

  saveToHistory: () => {
    const state = get()
    set({
      history: [...state.history.slice(0, state.historyIndex + 1), { beams: [...state.beams] }],
      historyIndex: state.historyIndex + 1,
    })
  },
}))
