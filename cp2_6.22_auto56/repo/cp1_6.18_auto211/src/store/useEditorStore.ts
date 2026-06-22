import { create } from 'zustand'

export interface ControlPointData {
  id: string
  position: [number, number, number]
  normal: [number, number, number]
  displacement: number
}

export interface HistoryEntry {
  type: 'drag' | 'parameter'
  subdivisionLevel: number
  noiseIntensity: number
  smoothness: number
  vertexPositions: number[]
}

interface EditorState {
  modelName: string
  uploadTime: string
  isLoading: boolean
  loadProgress: number
  subdivisionLevel: number
  noiseIntensity: number
  smoothness: number
  isDragging: boolean
  controlPoints: ControlPointData[]
  history: HistoryEntry[]
  historyIndex: number
  isReadOnly: boolean
  showCopyToast: boolean

  setModelInfo: (name: string) => void
  setLoading: (v: boolean) => void
  setLoadProgress: (v: number) => void
  setSubdivisionLevel: (v: number) => void
  setNoiseIntensity: (v: number) => void
  setSmoothness: (v: number) => void
  setDragging: (v: boolean) => void
  addControlPoint: (cp: ControlPointData) => void
  removeControlPoint: (id: string) => void
  updateControlPoint: (id: string, displacement: number) => void
  pushHistory: (entry: HistoryEntry) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  setReadOnly: (v: boolean) => void
  setShowCopyToast: (v: boolean) => void
  resetDeformation: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  modelName: '',
  uploadTime: '',
  isLoading: false,
  loadProgress: 0,
  subdivisionLevel: 1,
  noiseIntensity: 0,
  smoothness: 0.5,
  isDragging: false,
  controlPoints: [],
  history: [],
  historyIndex: -1,
  isReadOnly: false,
  showCopyToast: false,

  setModelInfo: (name) =>
    set({ modelName: name, uploadTime: new Date().toLocaleString() }),

  setLoading: (v) => set({ isLoading: v }),

  setLoadProgress: (v) => set({ loadProgress: v }),

  setSubdivisionLevel: (v) => {
    set((state) => {
      const entry: HistoryEntry = {
        type: 'parameter',
        subdivisionLevel: v,
        noiseIntensity: state.noiseIntensity,
        smoothness: state.smoothness,
        vertexPositions: [],
      }
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), entry].slice(-20)
      return {
        subdivisionLevel: v,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
  },

  setNoiseIntensity: (v) => set({ noiseIntensity: v }),

  setSmoothness: (v) => set({ smoothness: v }),

  setDragging: (v) => set({ isDragging: v }),

  addControlPoint: (cp) =>
    set((state) => ({ controlPoints: [...state.controlPoints, cp] })),

  removeControlPoint: (id) =>
    set((state) => ({
      controlPoints: state.controlPoints.filter((cp) => cp.id !== id),
    })),

  updateControlPoint: (id, displacement) =>
    set((state) => ({
      controlPoints: state.controlPoints.map((cp) =>
        cp.id === id ? { ...cp, displacement } : cp
      ),
    })),

  pushHistory: (entry) =>
    set((state) => {
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), entry].slice(-20)
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }),

  undo: () => {
    const { historyIndex, history } = get()
    if (historyIndex <= 0) return null
    const newIndex = historyIndex - 1
    set({ historyIndex: newIndex })
    return history[newIndex]
  },

  redo: () => {
    const { historyIndex, history } = get()
    if (historyIndex >= history.length - 1) return null
    const newIndex = historyIndex + 1
    set({ historyIndex: newIndex })
    return history[newIndex]
  },

  setReadOnly: (v) => set({ isReadOnly: v }),

  setShowCopyToast: (v) => set({ showCopyToast: v }),

  resetDeformation: () =>
    set({
      subdivisionLevel: 1,
      noiseIntensity: 0,
      smoothness: 0.5,
      controlPoints: [],
      history: [],
      historyIndex: -1,
    }),
}))
