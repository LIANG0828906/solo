import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Card } from './utils/randomCards'
import { generateRandomCards, generateSingleCard } from './utils/randomCards'
import {
  type Breakpoint,
  type GridConfig,
  type FlexConfig,
  type PresetId,
  BREAKPOINT_PRESETS,
  pickNextBreakpointColor,
} from './layoutEngine'

export type DeviceKey = 'mobile' | 'tablet' | 'desktop'

export interface PreviewCards {
  mobile: Card[]
  tablet: Card[]
  desktop: Card[]
}

function createInitialCards(): PreviewCards {
  return {
    mobile: generateRandomCards(18),
    tablet: generateRandomCards(20),
    desktop: generateRandomCards(22),
  }
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: uuidv4(), value: 640, color: '#3B82F6', label: 'sm' },
  { id: uuidv4(), value: 1024, color: '#10B981', label: 'lg' },
]

const DEFAULT_GRID: GridConfig = {
  columns: 4,
  gap: 12,
  margin: 16,
}

const DEFAULT_FLEX: FlexConfig = {
  grow: 1,
  shrink: 1,
  basis: 0,
}

export interface LayoutState {
  breakpoints: Breakpoint[]
  grid: GridConfig
  flex: FlexConfig
  cards: PreviewCards
  activePreset: PresetId | null
  controlPanelCollapsed: boolean
  mobilePanelOpen: boolean
  exportModalOpen: boolean
  presetTransitionKey: number

  addBreakpoint: () => void
  removeBreakpoint: (id: string) => void
  updateBreakpoint: (id: string, patch: Partial<Breakpoint>) => void
  reorderBreakpoints: (fromIndex: number, toIndex: number) => void

  setGrid: (patch: Partial<GridConfig>) => void
  setFlex: (patch: Partial<FlexConfig>) => void

  loadPreset: (id: PresetId) => void
  resetCards: () => void

  addCard: (device: DeviceKey) => void
  removeCard: (device: DeviceKey, id: string) => void
  reorderCard: (device: DeviceKey, fromIndex: number, toIndex: number) => void

  togglePanel: () => void
  setPanelCollapsed: (v: boolean) => void
  toggleMobilePanel: () => void
  setMobilePanelOpen: (v: boolean) => void

  openExportModal: () => void
  closeExportModal: () => void
}

function migrateBreakpointsWithIds(bps: Omit<Breakpoint, 'id'>[]): Breakpoint[] {
  return bps.map((bp) => ({ ...bp, id: uuidv4() }))
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      breakpoints: DEFAULT_BREAKPOINTS,
      grid: DEFAULT_GRID,
      flex: DEFAULT_FLEX,
      cards: createInitialCards(),
      activePreset: null,
      controlPanelCollapsed: false,
      mobilePanelOpen: false,
      exportModalOpen: false,
      presetTransitionKey: 0,

      addBreakpoint: () => {
        const state = get()
        const existingColors = state.breakpoints.map((b) => b.color)
        const values = state.breakpoints.map((b) => b.value)
        const maxVal = values.length > 0 ? Math.max(...values) : 0
        const newValue = Math.max(320, maxVal + 160)
        set({
          breakpoints: [
            ...state.breakpoints,
            {
              id: uuidv4(),
              value: newValue,
              color: pickNextBreakpointColor(existingColors),
              label: `bp${state.breakpoints.length + 1}`,
            },
          ],
          activePreset: null,
        })
      },

      removeBreakpoint: (id: string) => {
        const state = get()
        if (state.breakpoints.length <= 1) return
        set({
          breakpoints: state.breakpoints.filter((b) => b.id !== id),
          activePreset: null,
        })
      },

      updateBreakpoint: (id: string, patch: Partial<Breakpoint>) => {
        set((state) => ({
          breakpoints: state.breakpoints.map((b) =>
            b.id === id ? { ...b, ...patch } : b
          ),
          activePreset: null,
        }))
      },

      reorderBreakpoints: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const next = [...state.breakpoints]
          const [moved] = next.splice(fromIndex, 1)
          next.splice(toIndex, 0, moved)
          return { breakpoints: next, activePreset: null }
        })
      },

      setGrid: (patch: Partial<GridConfig>) => {
        set((state) => ({
          grid: { ...state.grid, ...patch },
          activePreset: null,
        }))
      },

      setFlex: (patch: Partial<FlexConfig>) => {
        set((state) => ({
          flex: { ...state.flex, ...patch },
          activePreset: null,
        }))
      },

      loadPreset: (id: PresetId) => {
        const preset = BREAKPOINT_PRESETS[id]
        if (!preset) return
        set({
          breakpoints: migrateBreakpointsWithIds(preset.breakpoints),
          grid: { ...preset.grid },
          flex: { ...preset.flex },
          cards: createInitialCards(),
          activePreset: id,
          presetTransitionKey: get().presetTransitionKey + 1,
        })
      },

      resetCards: () => {
        set({ cards: createInitialCards() })
      },

      addCard: (device: DeviceKey) => {
        set((state) => ({
          cards: {
            ...state.cards,
            [device]: [...state.cards[device], generateSingleCard()],
          },
        }))
      },

      removeCard: (device: DeviceKey, id: string) => {
        set((state) => ({
          cards: {
            ...state.cards,
            [device]: state.cards[device].filter((c) => c.id !== id),
          },
        }))
      },

      reorderCard: (device: DeviceKey, fromIndex: number, toIndex: number) => {
        set((state) => {
          const list = [...state.cards[device]]
          const safeTo = Math.max(0, Math.min(list.length - 1, toIndex))
          const [moved] = list.splice(fromIndex, 1)
          list.splice(safeTo, 0, moved)
          return {
            cards: {
              ...state.cards,
              [device]: list,
            },
          }
        })
      },

      togglePanel: () => {
        set((state) => ({ controlPanelCollapsed: !state.controlPanelCollapsed }))
      },
      setPanelCollapsed: (v: boolean) => set({ controlPanelCollapsed: v }),

      toggleMobilePanel: () => {
        set((state) => ({ mobilePanelOpen: !state.mobilePanelOpen }))
      },
      setMobilePanelOpen: (v: boolean) => set({ mobilePanelOpen: v }),

      openExportModal: () => set({ exportModalOpen: true }),
      closeExportModal: () => set({ exportModalOpen: false }),
    }),
    {
      name: 'responsive-layout-tool:v1',
      partialize: (state) => ({
        breakpoints: state.breakpoints,
        grid: state.grid,
        flex: state.flex,
        cards: state.cards,
        activePreset: state.activePreset,
        controlPanelCollapsed: state.controlPanelCollapsed,
      }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<LayoutState>) }
        if (!merged.cards?.mobile?.length) {
          merged.cards = createInitialCards()
        }
        return merged
      },
    }
  )
)
