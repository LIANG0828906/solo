import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { CellValue, GameObject, ObjectType, TerrainTheme, LevelData } from '../types'

const GRID_COLS = 12
const GRID_ROWS = 8

const createEmptyGrid = (): CellValue[][] => {
  return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(0))
}

interface GameState {
  grid: CellValue[][]
  objects: GameObject[]
  terrainTheme: TerrainTheme
  selectedTool: ObjectType | null
  selectedObjectId: string | null
  isPlaying: boolean
  gridCols: number
  gridRows: number
  showExportPanel: boolean
  exportJson: string

  toggleCell: (row: number, col: number) => void
  setCell: (row: number, col: number, value: CellValue) => void
  setTerrainTheme: (theme: TerrainTheme) => void
  fillRow: (row: number) => void
  clearColumn: (col: number) => void

  addObject: (type: ObjectType, gridX: number, gridY: number) => void
  removeObject: (id: string) => void
  moveObject: (id: string, gridX: number, gridY: number) => void
  selectObject: (id: string | null) => void
  setSelectedTool: (tool: ObjectType | null) => void

  setPlaying: (playing: boolean) => void
  loadLevel: (data: LevelData) => void
  clearLevel: () => void

  setShowExportPanel: (show: boolean) => void
  setExportJson: (json: string) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  grid: createEmptyGrid(),
  objects: [],
  terrainTheme: 'grass',
  selectedTool: null,
  selectedObjectId: null,
  isPlaying: false,
  gridCols: GRID_COLS,
  gridRows: GRID_ROWS,
  showExportPanel: false,
  exportJson: '',

  toggleCell: (row, col) => {
    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? (c === 1 ? 0 : 1) : c))
      )
      return { grid: newGrid }
    })
  },

  setCell: (row, col, value) => {
    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? value : c))
      )
      return { grid: newGrid }
    })
  },

  setTerrainTheme: (theme) => set({ terrainTheme: theme }),

  fillRow: (row) => {
    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        ri === row ? r.map(() => 1 as CellValue) : r
      )
      return { grid: newGrid }
    })
  },

  clearColumn: (col) => {
    set((state) => {
      const newGrid = state.grid.map((r) =>
        r.map((c, ci) => (ci === col ? (0 as CellValue) : c))
      )
      return { grid: newGrid }
    })
  },

  addObject: (type, gridX, gridY) => {
    const { objects } = get()
    const existing = objects.find((o) => o.gridX === gridX && o.gridY === gridY)
    if (existing) return

    const newObj: GameObject = {
      id: uuidv4(),
      type,
      gridX,
      gridY,
      offsetX: 0,
      offsetY: 0,
    }

    if (type === 'movingPlatform') {
      newObj.platformRange = 3
      newObj.platformSpeed = 1
      newObj.platformDirection = 1
      newObj.platformOriginalX = gridX
    }

    set({ objects: [...objects, newObj] })
  },

  removeObject: (id) => {
    set((state) => ({
      objects: state.objects.filter((o) => o.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    }))
  },

  moveObject: (id, gridX, gridY) => {
    set((state) => ({
      objects: state.objects.map((o) =>
        o.id === id ? { ...o, gridX, gridY } : o
      ),
    }))
  },

  selectObject: (id) => set({ selectedObjectId: id }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  loadLevel: (data) => {
    set({
      grid: data.grid,
      objects: data.objects,
      terrainTheme: data.terrainTheme || 'grass',
    })
  },

  clearLevel: () => {
    set({
      grid: createEmptyGrid(),
      objects: [],
      selectedObjectId: null,
    })
  },

  setShowExportPanel: (show) => set({ showExportPanel: show }),
  setExportJson: (json) => set({ exportJson: json }),
}))
