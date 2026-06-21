import { create } from 'zustand'
import type {
  StructureType,
  StructureParams,
  MeasurementPoint,
  MeasurementResult,
  DeformationResponse,
} from '../types'

interface AppState {
  structureType: StructureType
  params: StructureParams
  deformationData: DeformationResponse | null
  selectedPoints: MeasurementPoint[]
  measurementResult: MeasurementResult | null
  isLoading: boolean
  lastClickTime: number

  setStructureType: (type: StructureType) => void
  setParams: (params: Partial<StructureParams>) => void
  setDeformationData: (data: DeformationResponse | null) => void
  addSelectedPoint: (point: MeasurementPoint) => void
  clearSelectedPoints: () => void
  setMeasurementResult: (result: MeasurementResult | null) => void
  setIsLoading: (loading: boolean) => void
  setLastClickTime: (time: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  structureType: 'anticline',
  params: {
    pressureDirection: 0,
    stressMagnitude: 3.0,
    rockHardness: 5,
  },
  deformationData: null,
  selectedPoints: [],
  measurementResult: null,
  isLoading: false,
  lastClickTime: 0,

  setStructureType: (type) => set({ structureType: type }),

  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),

  setDeformationData: (data) => set({ deformationData: data }),

  addSelectedPoint: (point) =>
    set((state) => {
      const points = [...state.selectedPoints, point]
      if (points.length > 2) {
        points.shift()
      }
      return { selectedPoints: points }
    }),

  clearSelectedPoints: () =>
    set({ selectedPoints: [], measurementResult: null }),

  setMeasurementResult: (result) => set({ measurementResult: result }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setLastClickTime: (time) => set({ lastClickTime: time }),
}))
