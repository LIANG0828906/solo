import { create } from 'zustand'
import type { AreaId, HistoryStep, MaterialPreset, StyleId } from '../types'
import { findMaterialById, STYLE_PRESETS } from '../modules/material/MaterialLibrary'

interface MaterialAssignment {
  [key: string]: string
}

interface InteriorState {
  selectedStyle: StyleId
  materialAssignments: MaterialAssignment
  selectedArea: AreaId | null
  floorTexture: string | null
  history: HistoryStep[]
  fps: number
  currentView: 'top' | 'firstPerson'

  setStyle: (style: StyleId) => void
  setSelectedArea: (area: AreaId | null) => void
  replaceMaterial: (area: AreaId, materialId: string) => void
  undo: () => void
  setFloorTexture: (url: string | null) => void
  setFps: (fps: number) => void
  setCurrentView: (view: 'top' | 'firstPerson') => void
  getMaterialForArea: (area: AreaId) => MaterialPreset
}

const DEFAULT_STYLE: StyleId = 'modern'

function getDefaultAssignments(styleId: StyleId): MaterialAssignment {
  const style = STYLE_PRESETS.find((s) => s.id === styleId)!
  return {
    floor: style.materials.floor,
    wall_north: style.materials.walls.north,
    wall_south: style.materials.walls.south,
    wall_east: style.materials.walls.east,
    wall_west: style.materials.walls.west,
    sofa: style.materials.sofa,
    sofa_left: style.materials.sofa,
    sofa_right: style.materials.sofa,
    table: style.materials.table,
  }
}

export const useInteriorStore = create<InteriorState>((set, get) => ({
  selectedStyle: DEFAULT_STYLE,
  materialAssignments: getDefaultAssignments(DEFAULT_STYLE),
  selectedArea: null,
  floorTexture: null,
  history: [],
  fps: 60,
  currentView: 'top',

  setStyle: (style: StyleId) => {
    const stylePreset = STYLE_PRESETS.find((s) => s.id === style)!
    set({
      selectedStyle: style,
      materialAssignments: getDefaultAssignments(style),
    })
  },

  setSelectedArea: (area) => set({ selectedArea: area }),

  replaceMaterial: (area, materialId) => {
    const { materialAssignments, history } = get()
    const prevMaterialId = materialAssignments[area] ?? ''
    const newHistory: HistoryStep[] = [
      ...history,
      { area, prevMaterialId, newMaterialId: materialId },
    ].slice(-5)
    set({
      materialAssignments: { ...materialAssignments, [area]: materialId },
      history: newHistory,
    })
  },

  undo: () => {
    const { materialAssignments, history } = get()
    if (history.length === 0) return
    const newHistory = [...history]
    const lastStep = newHistory.pop()!
    const newAssignments = {
      ...materialAssignments,
      [lastStep.area]: lastStep.prevMaterialId,
    }
    set({
      materialAssignments: newAssignments,
      history: newHistory,
    })
  },

  setFloorTexture: (url) => set({ floorTexture: url }),

  setFps: (fps) => set({ fps }),

  setCurrentView: (view) => set({ currentView: view }),

  getMaterialForArea: (area) => {
    const { materialAssignments } = get()
    const id = materialAssignments[area]
    const mat = findMaterialById(id)
    if (mat) return mat
    return findMaterialById('wall_white')!
  },
}))
