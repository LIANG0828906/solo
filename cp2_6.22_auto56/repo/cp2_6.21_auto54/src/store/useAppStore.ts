import { create } from 'zustand'

export type ViewMode = 'structure' | 'section'

export interface HistoryEntry {
  organelle: string
  timestamp: number
}

interface AppState {
  viewMode: ViewMode
  selectedOrganelle: string | null
  hoveredOrganelle: string | null
  interactionHistory: HistoryEntry[]
  isCapturing: boolean
  autoRotate: boolean
  setViewMode: (mode: ViewMode) => void
  selectOrganelle: (name: string | null) => void
  hoverOrganelle: (name: string | null) => void
  addHistory: (entry: HistoryEntry) => void
  setCapturing: (val: boolean) => void
  setAutoRotate: (val: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'structure',
  selectedOrganelle: null,
  hoveredOrganelle: null,
  interactionHistory: [],
  isCapturing: false,
  autoRotate: true,
  setViewMode: (mode) => set({ viewMode: mode }),
  selectOrganelle: (name) =>
    set((state) => {
      const updates: Partial<AppState> = { selectedOrganelle: name }
      if (name) {
        updates.interactionHistory = [
          ...state.interactionHistory,
          { organelle: name, timestamp: Date.now() },
        ]
      }
      return updates
    }),
  hoverOrganelle: (name) => set({ hoveredOrganelle: name }),
  addHistory: (entry) =>
    set((state) => ({
      interactionHistory: [...state.interactionHistory, entry],
    })),
  setCapturing: (val) => set({ isCapturing: val }),
  setAutoRotate: (val) => set({ autoRotate: val }),
}))
