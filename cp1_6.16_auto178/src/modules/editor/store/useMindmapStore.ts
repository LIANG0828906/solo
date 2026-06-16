import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { MindMapNode, MindMapEdge, MindMapState } from '../types'
import { getRandomColor } from '../types'

interface HistoryState {
  past: Omit<MindMapState, 'selectedNodeId'>[]
  future: Omit<MindMapState, 'selectedNodeId'>[]
}

interface MindMapActions {
  addNode: (label: string, x: number, y: number) => void
  moveNode: (id: string, x: number, y: number) => void
  updateNode: (id: string, updates: Partial<MindMapNode>) => void
  removeNode: (id: string) => void
  addEdge: (source: string, target: string) => void
  removeEdge: (id: string) => void
  selectNode: (id: string | null) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  replaceState: (state: Omit<MindMapState, 'selectedNodeId'>) => void
  exportPNG: () => void
  skipNextHistory: () => void
}

type StoreState = MindMapState & HistoryState & MindMapActions

const MAX_HISTORY = 50

const createInitialState = (): Omit<MindMapState, 'selectedNodeId'> => ({
  nodes: [],
  edges: [],
  zoom: 1,
  panX: 0,
  panY: 0,
})

let skipNextHistoryFlag = false

const snapshotState = (state: StoreState): Omit<MindMapState, 'selectedNodeId'> => ({
  nodes: JSON.parse(JSON.stringify(state.nodes)),
  edges: JSON.parse(JSON.stringify(state.edges)),
  zoom: state.zoom,
  panX: state.panX,
  panY: state.panY,
})

const pushHistory = (state: StoreState): HistoryState => {
  if (skipNextHistoryFlag) {
    skipNextHistoryFlag = false
    return {
      past: state.past,
      future: state.future,
    }
  }
  const snapshot = snapshotState(state)
  const newPast = [...state.past, snapshot].slice(-MAX_HISTORY)
  return {
    past: newPast,
    future: [],
  }
}

export const useMindmapStore = create<StoreState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  past: [],
  future: [],

  addNode: (label: string, x: number, y: number) => {
    set((state) => {
      const history = pushHistory(state)
      const newNode: MindMapNode = {
        id: uuidv4(),
        label,
        x,
        y,
        color: getRandomColor(),
      }
      return {
        ...history,
        nodes: [...state.nodes, newNode],
        selectedNodeId: newNode.id,
      }
    })
  },

  moveNode: (id: string, x: number, y: number) => {
    set((state) => {
      const history = pushHistory(state)
      return {
        ...history,
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, x, y } : n
        ),
      }
    })
  },

  updateNode: (id: string, updates: Partial<MindMapNode>) => {
    set((state) => {
      const history = pushHistory(state)
      return {
        ...history,
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
      }
    })
  },

  removeNode: (id: string) => {
    set((state) => {
      const history = pushHistory(state)
      return {
        ...history,
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      }
    })
  },

  addEdge: (source: string, target: string) => {
    if (source === target) return
    set((state) => {
      const exists = state.edges.some(
        (e) => e.source === source && e.target === target
      )
      if (exists) return state
      const history = pushHistory(state)
      const newEdge: MindMapEdge = {
        id: uuidv4(),
        source,
        target,
      }
      return {
        ...history,
        edges: [...state.edges, newEdge],
      }
    })
  },

  removeEdge: (id: string) => {
    set((state) => {
      const history = pushHistory(state)
      return {
        ...history,
        edges: state.edges.filter((e) => e.id !== id),
      }
    })
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  setZoom: (zoom: number) => {
    const clamped = Math.max(0.25, Math.min(2, zoom))
    set({ zoom: clamped })
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y })
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state
      const newPast = [...state.past]
      const current = snapshotState(state)
      const previous = newPast.pop()!
      return {
        ...state,
        ...previous,
        past: newPast,
        future: [current, ...state.future].slice(0, MAX_HISTORY),
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state
      const newFuture = [...state.future]
      const current = snapshotState(state)
      const next = newFuture.shift()!
      return {
        ...state,
        ...next,
        past: [...state.past, current].slice(-MAX_HISTORY),
        future: newFuture,
      }
    })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  replaceState: (newState) => {
    set((state) => ({
      ...state,
      nodes: newState.nodes,
      edges: newState.edges,
      zoom: newState.zoom,
      panX: newState.panX,
      panY: newState.panY,
    }))
  },

  exportPNG: () => {
    const canvas = document.getElementById('mindmap-canvas') as HTMLCanvasElement
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `mindmap-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  },

  skipNextHistory: () => {
    skipNextHistoryFlag = true
  },
}))

export const selectMindmapState = (state: StoreState): Omit<MindMapState, 'selectedNodeId'> => ({
  nodes: state.nodes,
  edges: state.edges,
  zoom: state.zoom,
  panX: state.panX,
  panY: state.panY,
})
