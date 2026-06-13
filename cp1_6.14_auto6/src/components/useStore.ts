import { create } from 'zustand'

export type AppMode = 'place' | 'replay'

export interface FlagData {
  id: string
  x: number
  y: number
  z: number
  color: string
  timestamp: number
}

interface AppState {
  mode: AppMode
  selectedColor: string
  flags: FlagData[]
  visibleFlags: FlagData[]
  replayIndex: number
  isReplaying: boolean
  setMode: (mode: AppMode) => void
  setSelectedColor: (color: string) => void
  addFlag: (flag: FlagData) => void
  setFlags: (flags: FlagData[]) => void
  clearFlags: () => void
  startReplay: () => void
  advanceReplay: () => void
  stopReplay: () => void
}

export const PRESET_COLORS = [
  '#E53935',
  '#1E88E5',
  '#43A047',
  '#FDD835',
  '#8E24AA',
]

export const MAX_FLAGS = 50

export const useStore = create<AppState>((set, get) => ({
  mode: 'place',
  selectedColor: PRESET_COLORS[0],
  flags: [],
  visibleFlags: [],
  replayIndex: 0,
  isReplaying: false,

  setMode: (mode) => {
    if (mode === 'replay') {
      get().startReplay()
    } else {
      get().stopReplay()
    }
    set({ mode })
  },

  setSelectedColor: (color) => set({ selectedColor: color }),

  addFlag: (flag) =>
    set((state) => {
      if (state.flags.length >= MAX_FLAGS) return state
      const newFlags = [...state.flags, flag]
      return {
        flags: newFlags,
        visibleFlags: state.mode === 'place' ? newFlags : state.visibleFlags,
      }
    }),

  setFlags: (flags) => set({ flags }),

  clearFlags: () => set({ flags: [], visibleFlags: [], replayIndex: 0, isReplaying: false }),

  startReplay: () => {
    const sorted = [...get().flags].sort((a, b) => a.timestamp - b.timestamp)
    set({
      visibleFlags: [],
      flags: sorted,
      replayIndex: 0,
      isReplaying: true,
    })
  },

  advanceReplay: () =>
    set((state) => {
      if (state.replayIndex >= state.flags.length) {
        return { isReplaying: false, replayIndex: state.flags.length }
      }
      const nextIndex = state.replayIndex + 1
      return {
        replayIndex: nextIndex,
        visibleFlags: state.flags.slice(0, nextIndex),
      }
    }),

  stopReplay: () =>
    set((state) => ({
      isReplaying: false,
      visibleFlags: state.flags,
      replayIndex: state.flags.length,
    })),
}))
