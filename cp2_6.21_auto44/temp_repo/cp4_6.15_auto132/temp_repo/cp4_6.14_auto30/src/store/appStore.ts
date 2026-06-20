import { create } from 'zustand'
import type { LightPreset, MarkPoint } from '../utils/sceneHelpers'
import { defaultPresets } from '../utils/sceneHelpers'

interface AppState {
  modelUrl: string | null
  modelFileName: string | null
  currentPresetId: string
  comparisonPresetId: string
  isSplitMode: boolean
  splitDirection: 'vertical' | 'horizontal'
  splitRatio: number
  markPoints: MarkPoint[]
  savedPresets: LightPreset[]
  leftPanelCollapsed: boolean
  rightPanelVisible: boolean
  isMarkMode: boolean
  ambientIntensity: number
  directionalIntensity: number
  showHelpModal: boolean
  projectToScreen:
    | ((pos: [number, number, number]) => { x: number; y: number } | null)
    | null

  uploadModel: (file: File) => void
  setCurrentPreset: (id: string) => void
  setComparisonPreset: (id: string) => void
  toggleSplitMode: () => void
  setSplitDirection: (dir: 'vertical' | 'horizontal') => void
  toggleSplitDirection: () => void
  setSplitRatio: (ratio: number) => void
  addMarkPoint: (point: MarkPoint) => void
  removeMarkPoint: (id: string) => void
  moveMarkPoint: (
    id: string,
    position: [number, number, number],
    worldPosition: { x: number; y: number }
  ) => void
  clearAllMarks: () => void
  addPreset: (preset: LightPreset) => void
  removePreset: (id: string) => void
  reorderPresets: (fromIndex: number, toIndex: number) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleMarkMode: () => void
  setAmbientIntensity: (val: number) => void
  setDirectionalIntensity: (val: number) => void
  setShowHelpModal: (show: boolean) => void
  setProjectToScreen: (
    fn: (pos: [number, number, number]) => { x: number; y: number } | null
  ) => void
  applyPresetToCurrent: (preset: LightPreset) => void
}

export const useAppStore = create<AppState>((set) => ({
  modelUrl: null,
  modelFileName: null,
  currentPresetId: defaultPresets[0]?.id ?? '',
  comparisonPresetId: defaultPresets[1]?.id ?? '',
  isSplitMode: false,
  splitDirection: 'vertical',
  splitRatio: 0.5,
  markPoints: [],
  savedPresets: [...defaultPresets],
  leftPanelCollapsed: false,
  rightPanelVisible: true,
  isMarkMode: false,
  ambientIntensity: 1,
  directionalIntensity: 2,
  showHelpModal: false,
  projectToScreen: null,

  uploadModel: (file: File) => {
    const url = URL.createObjectURL(file)
    set({ modelUrl: url, modelFileName: file.name })
  },

  setCurrentPreset: (id: string) => set({ currentPresetId: id }),
  setComparisonPreset: (id: string) => set({ comparisonPresetId: id }),

  toggleSplitMode: () => set((s) => ({ isSplitMode: !s.isSplitMode })),
  setSplitDirection: (dir) => set({ splitDirection: dir }),
  toggleSplitDirection: () =>
    set((s) => ({
      splitDirection: s.splitDirection === 'vertical' ? 'horizontal' : 'vertical',
    })),
  setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.1, Math.min(0.9, ratio)) }),

  addMarkPoint: (point) =>
    set((s) => ({ markPoints: [...s.markPoints, point] })),
  removeMarkPoint: (id) =>
    set((s) => ({ markPoints: s.markPoints.filter((p) => p.id !== id) })),
  moveMarkPoint: (id, position, worldPosition) =>
    set((s) => ({
      markPoints: s.markPoints.map((p) =>
        p.id === id ? { ...p, position, worldPosition } : p
      ),
    })),
  clearAllMarks: () => set({ markPoints: [] }),

  addPreset: (preset) =>
    set((s) => ({ savedPresets: [...s.savedPresets, preset] })),
  removePreset: (id) =>
    set((s) => ({
      savedPresets: s.savedPresets.filter((p) => p.id !== id),
    })),
  reorderPresets: (fromIndex, toIndex) =>
    set((s) => {
      const arr = [...s.savedPresets]
      const [moved] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, moved)
      return { savedPresets: arr }
    }),

  toggleLeftPanel: () =>
    set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () =>
    set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),
  toggleMarkMode: () => set((s) => ({ isMarkMode: !s.isMarkMode })),

  setAmbientIntensity: (val) => set({ ambientIntensity: val }),
  setDirectionalIntensity: (val) => set({ directionalIntensity: val }),

  setShowHelpModal: (show) => set({ showHelpModal: show }),

  setProjectToScreen: (fn) => set({ projectToScreen: fn }),

  applyPresetToCurrent: (preset) => {
    set({
      currentPresetId: preset.id,
      ambientIntensity: preset.ambient.intensity,
      directionalIntensity: preset.directional.intensity,
    })
  },
}))
