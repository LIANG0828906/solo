import { create } from 'zustand'
import { PresetModule, PRESET_MODULES } from '../types'

interface UIStore {
  sidebarCollapsed: boolean
  selectedCrossroadId: string | null
  showControlPanel: boolean
  pendingPreset: PresetModule | null
  showConfirmModal: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  selectCrossroad: (id: string | null) => void
  requestPresetActivation: (presetId: string) => void
  confirmPresetActivation: () => void
  cancelPresetActivation: () => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarCollapsed: false,
  selectedCrossroadId: null,
  showControlPanel: false,
  pendingPreset: null,
  showConfirmModal: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  selectCrossroad: (id) => {
    set({
      selectedCrossroadId: id,
      showControlPanel: id !== null,
    })
  },

  requestPresetActivation: (presetId) => {
    const preset = PRESET_MODULES.find((p) => p.id === presetId)
    if (preset) {
      set({ pendingPreset: preset, showConfirmModal: true })
    }
  },

  confirmPresetActivation: () => {
    set({ showConfirmModal: false, pendingPreset: null })
  },

  cancelPresetActivation: () => {
    set({ showConfirmModal: false, pendingPreset: null })
  },
}))
