import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface Breakpoint {
  id: string
  label: string
  width: number
  color: string
}

interface BreakpointState {
  breakpoints: Breakpoint[]
  addBreakpoint: (bp: Omit<Breakpoint, 'id'>) => void
  removeBreakpoint: (id: string) => void
  updateBreakpoint: (id: string, updates: Partial<Omit<Breakpoint, 'id'>>) => void
  resetBreakpoints: () => void
  reorderBreakpoints: (fromIndex: number, toIndex: number) => void
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: uuidv4(), label: '手机', width: 375, color: '#4A90D9' },
  { id: uuidv4(), label: '平板', width: 768, color: '#7B61FF' },
  { id: uuidv4(), label: '桌面', width: 1280, color: '#50B86C' },
]

const COLORS = [
  '#4A90D9',
  '#7B61FF',
  '#50B86C',
  '#F38BA8',
  '#FAB387',
  '#89DCEB',
  '#CBA6F7',
  '#A6E3A1',
]

export const useBreakpointStore = create<BreakpointState>((set, get) => ({
  breakpoints: DEFAULT_BREAKPOINTS,

  addBreakpoint: (bp) => {
    const { breakpoints } = get()
    const colorIndex = breakpoints.length % COLORS.length
    set({
      breakpoints: [
        ...breakpoints,
        { id: uuidv4(), ...bp, color: COLORS[colorIndex] },
      ],
    })
  },

  removeBreakpoint: (id) => {
    const { breakpoints } = get()
    if (breakpoints.length <= 1) return
    set({
      breakpoints: breakpoints.filter((bp) => bp.id !== id),
    })
  },

  updateBreakpoint: (id, updates) => {
    const { breakpoints } = get()
    set({
      breakpoints: breakpoints.map((bp) =>
        bp.id === id ? { ...bp, ...updates } : bp
      ),
    })
  },

  resetBreakpoints: () => {
    set({
      breakpoints: DEFAULT_BREAKPOINTS.map((bp) => ({
        ...bp,
        id: uuidv4(),
      })),
    })
  },

  reorderBreakpoints: (fromIndex, toIndex) => {
    const { breakpoints } = get()
    const newBreakpoints = [...breakpoints]
    const [removed] = newBreakpoints.splice(fromIndex, 1)
    newBreakpoints.splice(toIndex, 0, removed)
    set({ breakpoints: newBreakpoints })
  },
}))
