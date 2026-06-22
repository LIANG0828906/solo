import { create } from 'zustand'

export interface EditorState {
  text: string
  color: string
  thickness: number
  twist: number
  glowIntensity: number
}

interface EditorStore extends EditorState {
  history: EditorState[]
  historyIndex: number
  isExporting: boolean
  shutterFlash: number | null

  setText: (text: string) => void
  setColor: (color: string) => void
  setThickness: (thickness: number) => void
  setTwist: (twist: number) => void
  setGlowIntensity: (glowIntensity: number) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  setExporting: (exporting: boolean) => void
  setShutterFlash: (val: number | null) => void
}

const MAX_HISTORY = 10
const DEFAULT_TILT = 15

const defaultState: EditorState = {
  text: 'NEON',
  color: '#00ffff',
  thickness: 0.3,
  twist: DEFAULT_TILT,
  glowIntensity: 1.5,
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...defaultState,
  history: [{ ...defaultState }],
  historyIndex: 0,
  isExporting: false,
  shutterFlash: null,

  setText: (text) => set({ text: text.slice(0, 12) }),
  setColor: (color) => set({ color }),
  setThickness: (thickness) => set({ thickness }),
  setTwist: (twist) => set({ twist: Math.round(twist) }),
  setGlowIntensity: (glowIntensity) => set({ glowIntensity }),

  pushHistory: () => {
    const state = get()
    const currentSnapshot: EditorState = {
      text: state.text,
      color: state.color,
      thickness: state.thickness,
      twist: state.twist,
      glowIntensity: state.glowIntensity,
    }
    const lastEntry = state.history[state.historyIndex]
    if (
      lastEntry &&
      lastEntry.text === currentSnapshot.text &&
      lastEntry.color === currentSnapshot.color &&
      lastEntry.thickness === currentSnapshot.thickness &&
      lastEntry.twist === currentSnapshot.twist &&
      lastEntry.glowIntensity === currentSnapshot.glowIntensity
    ) {
      return
    }
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(currentSnapshot)
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  undo: () => {
    const state = get()
    if (state.historyIndex <= 0) return
    const newIndex = state.historyIndex - 1
    const snapshot = state.history[newIndex]
    set({
      ...snapshot,
      historyIndex: newIndex,
    })
  },

  redo: () => {
    const state = get()
    if (state.historyIndex >= state.history.length - 1) return
    const newIndex = state.historyIndex + 1
    const snapshot = state.history[newIndex]
    set({
      ...snapshot,
      historyIndex: newIndex,
    })
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  setExporting: (exporting) => set({ isExporting: exporting }),
  setShutterFlash: (val) => set({ shutterFlash: val }),
}))
