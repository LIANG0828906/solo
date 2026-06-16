import { create } from 'zustand'
import { DataPoint, Point3D, parseCSV, zScoreNormalize, simplifiedTSNE } from './utils'

export type BrushMode = 'select' | 'rectangle' | 'lasso' | null

interface AppState {
  rawData: DataPoint[]
  reducedCoords: Point3D[]
  selectedIds: Set<string>
  brushMode: BrushMode
  isProcessing: boolean
  progress: number
  autoRotate: boolean

  setBrushMode: (mode: BrushMode) => void
  loadDataFromCSV: (csvText: string) => Promise<void>
  runDimensionalityReduction: () => Promise<void>
  togglePointSelection: (id: string) => void
  selectPoints: (ids: string[]) => void
  clearSelection: () => void
  assignLabelToSelected: (label: string) => void
  setIsProcessing: (v: boolean) => void
  setProgress: (v: number) => void
  setAutoRotate: (v: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  rawData: [],
  reducedCoords: [],
  selectedIds: new Set(),
  brushMode: null,
  isProcessing: false,
  progress: 0,
  autoRotate: true,

  setBrushMode: (mode) => set({ brushMode: mode }),

  loadDataFromCSV: async (csvText) => {
    set({ isProcessing: true, progress: 0, selectedIds: new Set() })

    await new Promise(resolve => setTimeout(resolve, 50))
    const data = parseCSV(csvText)
    set({ rawData: data, progress: 0.1 })

    if (data.length > 0) {
      await get().runDimensionalityReduction()
    } else {
      set({ reducedCoords: [], isProcessing: false })
    }
  },

  runDimensionalityReduction: async () => {
    const { rawData } = get()
    if (rawData.length === 0) return

    set({ isProcessing: true, progress: 0.1 })

    await new Promise(resolve => setTimeout(resolve, 50))
    const normalized = zScoreNormalize(rawData)
    set({ progress: 0.2 })

    await new Promise(resolve => setTimeout(resolve, 50))

    const coords = await new Promise<Point3D[]>((resolve) => {
      const result = simplifiedTSNE(
        normalized,
        3,
        30,
        150,
        (p) => {
          set({ progress: 0.2 + p * 0.8 })
        }
      )
      resolve(result)
    })

    set({ reducedCoords: coords, progress: 1, isProcessing: false })
  },

  togglePointSelection: (id) => {
    const newSet = new Set(get().selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    set({ selectedIds: newSet })
  },

  selectPoints: (ids) => {
    const newSet = new Set(get().selectedIds)
    ids.forEach(id => newSet.add(id))
    set({ selectedIds: newSet })
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  assignLabelToSelected: (label) => {
    const { rawData, selectedIds } = get()
    if (selectedIds.size === 0) return

    const updated = rawData.map(point => {
      if (selectedIds.has(point.id)) {
        return { ...point, label }
      }
      return point
    })

    set({ rawData: updated, selectedIds: new Set() })
  },

  setIsProcessing: (v) => set({ isProcessing: v }),
  setProgress: (v) => set({ progress: v }),
  setAutoRotate: (v) => set({ autoRotate: v })
}))
