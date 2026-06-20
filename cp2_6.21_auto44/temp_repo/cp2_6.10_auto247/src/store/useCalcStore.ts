import { create } from 'zustand'
import { DataPoint, FitResult, polynomialFit, generateId } from '../utils/fitCurve'

const COLORS = ['#3a3a3a', '#c0392b', '#4a7c59', '#7b68ee', '#d2691e']

interface CalcState {
  points: DataPoint[]
  degree: number
  fitResult: FitResult | null
  selectedColor: string
  editingPointId: string | null

  addPoint: (x: number, y: number) => void
  updatePoint: (id: string, x: number, y: number) => void
  deletePoint: (id: string) => void
  setDegree: (degree: number) => void
  setSelectedColor: (color: string) => void
  setEditingPointId: (id: string | null) => void
  clearPoints: () => void
  loadSampleData: () => void
  computeFit: () => void
}

export const useCalcStore = create<CalcState>((set, get) => ({
  points: [],
  degree: 2,
  fitResult: null,
  selectedColor: COLORS[0],
  editingPointId: null,

  addPoint: (x: number, y: number) => {
    const { selectedColor, computeFit } = get()
    const newPoint: DataPoint = {
      id: generateId(),
      x,
      y,
      color: selectedColor
    }
    set(state => ({ points: [...state.points, newPoint] }))
    computeFit()
  },

  updatePoint: (id: string, x: number, y: number) => {
    const { computeFit } = get()
    set(state => ({
      points: state.points.map(p =>
        p.id === id ? { ...p, x, y } : p
      )
    }))
    computeFit()
  },

  deletePoint: (id: string) => {
    const { computeFit } = get()
    set(state => ({
      points: state.points.filter(p => p.id !== id),
      editingPointId: state.editingPointId === id ? null : state.editingPointId
    }))
    computeFit()
  },

  setDegree: (degree: number) => {
    const { computeFit } = get()
    set({ degree })
    computeFit()
  },

  setSelectedColor: (color: string) => set({ selectedColor: color }),

  setEditingPointId: (id: string | null) => set({ editingPointId: id }),

  clearPoints: () => {
    set({ points: [], fitResult: null, editingPointId: null })
  },

  loadSampleData: () => {
    const samplePoints: DataPoint[] = [
      { id: generateId(), x: 1, y: 2.1, color: COLORS[0] },
      { id: generateId(), x: 2, y: 3.9, color: COLORS[1] },
      { id: generateId(), x: 3, y: 7.2, color: COLORS[2] },
      { id: generateId(), x: 4, y: 11.8, color: COLORS[3] },
      { id: generateId(), x: 5, y: 18.5, color: COLORS[4] },
      { id: generateId(), x: 6, y: 27.3, color: COLORS[0] },
      { id: generateId(), x: 7, y: 38.1, color: COLORS[1] }
    ]
    set({ points: samplePoints })
    get().computeFit()
  },

  computeFit: () => {
    const { points, degree } = get()
    if (points.length < degree + 1) {
      set({
        fitResult: {
          coefficients: new Array(degree + 1).fill(0),
          equation: `需要至少 ${degree + 1} 个数据点`,
          rSquared: 0,
          mse: 0
        }
      })
      return
    }
    const result = polynomialFit(points, degree)
    set({ fitResult: result })
  }
}))

export { COLORS }
