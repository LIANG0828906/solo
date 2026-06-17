import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface PaletteColor {
  id: string
  hex: string
}

interface ColorState {
  currentColor: string
  palette: PaletteColor[]
  history: string[]
  setCurrentColor: (color: string) => void
  addToPalette: (color: string) => void
  removeFromPalette: (id: string) => void
  reorderPalette: (fromIndex: number, toIndex: number) => void
  addToHistory: (color: string) => void
  clearHistory: () => void
  undoHistory: () => void
}

const STORAGE_KEY_PALETTE = 'color-harmony-lab-palette'
const STORAGE_KEY_HISTORY = 'color-harmony-lab-history'

const loadPalette = (): PaletteColor[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PALETTE)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load palette from localStorage:', e)
  }
  return []
}

const loadHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load history from localStorage:', e)
  }
  return []
}

const savePalette = (palette: PaletteColor[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_PALETTE, JSON.stringify(palette))
  } catch (e) {
    console.error('Failed to save palette to localStorage:', e)
  }
}

const saveHistory = (history: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
  } catch (e) {
    console.error('Failed to save history to localStorage:', e)
  }
}

export const useColorStore = create<ColorState>((set, get) => ({
  currentColor: '#FF6B6B',
  palette: loadPalette(),
  history: loadHistory(),

  setCurrentColor: (color: string) => {
    set({ currentColor: color })
  },

  addToPalette: (color: string) => {
    const newColor: PaletteColor = {
      id: uuidv4(),
      hex: color,
    }
    const newPalette = [...get().palette, newColor]
    set({ palette: newPalette })
    savePalette(newPalette)
  },

  removeFromPalette: (id: string) => {
    const newPalette = get().palette.filter((c) => c.id !== id)
    set({ palette: newPalette })
    savePalette(newPalette)
  },

  reorderPalette: (fromIndex: number, toIndex: number) => {
    const palette = [...get().palette]
    const [removed] = palette.splice(fromIndex, 1)
    palette.splice(toIndex, 0, removed)
    set({ palette })
    savePalette(palette)
  },

  addToHistory: (color: string) => {
    const history = get().history.filter((c) => c !== color)
    history.unshift(color)
    const newHistory = history.slice(0, 10)
    set({ history: newHistory })
    saveHistory(newHistory)
  },

  clearHistory: () => {
    set({ history: [] })
    saveHistory([])
  },

  undoHistory: () => {
    const history = get().history
    if (history.length > 0) {
      const [first, ...rest] = history
      set({ history: rest, currentColor: first })
      saveHistory(rest)
    }
  },
}))
