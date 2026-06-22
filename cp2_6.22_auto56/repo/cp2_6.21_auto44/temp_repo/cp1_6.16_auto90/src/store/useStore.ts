import { create } from 'zustand'

interface AppState {
  completedSymbols: number[]
  currentCardIndex: number
  allSymbolsCompleted: boolean
  hoveredFragment: string | null
  addCompletedSymbol: (symbolId: number) => void
  setCurrentCardIndex: (index: number) => void
  setAllSymbolsCompleted: (completed: boolean) => void
  setHoveredFragment: (fragmentId: string | null) => void
  resetAll: () => void
}

export const useStore = create<AppState>((set) => ({
  completedSymbols: [],
  currentCardIndex: 0,
  allSymbolsCompleted: false,
  hoveredFragment: null,
  addCompletedSymbol: (symbolId) =>
    set((state) => {
      if (state.completedSymbols.includes(symbolId)) return state
      return {
        completedSymbols: [...state.completedSymbols, symbolId]
      }
    }),
  setCurrentCardIndex: (index) => set({ currentCardIndex: index }),
  setAllSymbolsCompleted: (completed) => set({ allSymbolsCompleted: completed }),
  setHoveredFragment: (fragmentId) => set({ hoveredFragment: fragmentId }),
  resetAll: () =>
    set({
      completedSymbols: [],
      currentCardIndex: 0,
      allSymbolsCompleted: false,
      hoveredFragment: null
    })
}))
