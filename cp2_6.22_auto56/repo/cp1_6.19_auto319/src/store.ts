import { create } from 'zustand'
import { produce } from 'immer'
import type { Shape, ToolType, Point } from './types'
import { generateId, normalizeRect } from './utils'

const MAX_HISTORY = 50

interface WhiteboardState {
  shapes: Shape[]
  selectedId: string | null
  currentTool: ToolType
  history: Shape[][]
  historyIndex: number
  setCurrentTool: (tool: ToolType) => void
  selectShape: (id: string | null) => void
  addShape: (shape: Shape) => void
  deleteShape: (id: string) => void
  deleteSelected: () => void
  moveShape: (id: string, dx: number, dy: number) => void
  updateShape: (id: string, updates: Partial<Shape>) => void
  createRect: (start: Point, end: Point) => void
  createCircle: (start: Point, end: Point) => void
  createLine: (start: Point, end: Point) => void
  createArrow: (start: Point, end: Point) => void
  createText: (point: Point, text: string) => void
  undo: () => void
  redo: () => void
  pushToHistory: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  shapes: [],
  selectedId: null,
  currentTool: 'select',
  history: [[]],
  historyIndex: 0,

  setCurrentTool: (tool) => set({ currentTool: tool, selectedId: null }),

  selectShape: (id) => set({ selectedId: id }),

  addShape: (shape) => {
    set(
      produce((state) => {
        state.shapes.push(shape)
        state.selectedId = shape.id
      })
    )
    get().pushToHistory()
  },

  deleteShape: (id) => {
    set(
      produce((state) => {
        state.shapes = state.shapes.filter((s: Shape) => s.id !== id)
        if (state.selectedId === id) {
          state.selectedId = null
        }
      })
    )
    get().pushToHistory()
  },

  deleteSelected: () => {
    const { selectedId, deleteShape } = get()
    if (selectedId) {
      deleteShape(selectedId)
    }
  },

  moveShape: (id, dx, dy) => {
    set(
      produce((state) => {
        const shape = state.shapes.find((s: Shape) => s.id === id)
        if (!shape) return
        switch (shape.type) {
          case 'rect':
          case 'text':
            shape.x += dx
            shape.y += dy
            break
          case 'circle':
            shape.cx += dx
            shape.cy += dy
            break
          case 'line':
          case 'arrow':
            shape.start.x += dx
            shape.start.y += dy
            shape.end.x += dx
            shape.end.y += dy
            break
        }
      })
    )
  },

  updateShape: (id, updates) => {
    set(
      produce((state) => {
        const index = state.shapes.findIndex((s: Shape) => s.id === id)
        if (index !== -1) {
          state.shapes[index] = { ...state.shapes[index], ...updates }
        }
      })
    )
  },

  createRect: (start, end) => {
    const rect = normalizeRect(start, end)
    if (rect.width < 2 || rect.height < 2) return
    const shape: Shape = {
      id: generateId(),
      type: 'rect',
      ...rect,
    }
    get().addShape(shape)
  },

  createCircle: (start, end) => {
    const cx = (start.x + end.x) / 2
    const cy = (start.y + end.y) / 2
    const r = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2
    if (r < 2) return
    const shape: Shape = {
      id: generateId(),
      type: 'circle',
      cx,
      cy,
      r,
    }
    get().addShape(shape)
  },

  createLine: (start, end) => {
    if (start.x === end.x && start.y === end.y) return
    const shape: Shape = {
      id: generateId(),
      type: 'line',
      start,
      end,
    }
    get().addShape(shape)
  },

  createArrow: (start, end) => {
    if (start.x === end.x && start.y === end.y) return
    const shape: Shape = {
      id: generateId(),
      type: 'arrow',
      start,
      end,
    }
    get().addShape(shape)
  },

  createText: (point, text) => {
    if (!text.trim()) return
    const shape: Shape = {
      id: generateId(),
      type: 'text',
      x: point.x,
      y: point.y,
      text,
    }
    get().addShape(shape)
  },

  pushToHistory: () => {
    set(
      produce((state) => {
        const newShapes = JSON.parse(JSON.stringify(state.shapes))
        state.history = state.history.slice(0, state.historyIndex + 1)
        state.history.push(newShapes)
        if (state.history.length > MAX_HISTORY) {
          state.history.shift()
        } else {
          state.historyIndex++
        }
      })
    )
  },

  undo: () => {
    const { historyIndex, history } = get()
    if (historyIndex <= 0) return
    set(
      produce((state) => {
        state.historyIndex = historyIndex - 1
        state.shapes = JSON.parse(JSON.stringify(history[state.historyIndex]))
        state.selectedId = null
      })
    )
  },

  redo: () => {
    const { historyIndex, history } = get()
    if (historyIndex >= history.length - 1) return
    set(
      produce((state) => {
        state.historyIndex = historyIndex + 1
        state.shapes = JSON.parse(JSON.stringify(history[state.historyIndex]))
        state.selectedId = null
      })
    )
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}))
