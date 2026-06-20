import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { saveStory, loadStory, listStories, deleteStory } from '../utils/dbService'

export interface StoryNode {
  id: string
  title: string
  text: string
  x: number
  y: number
}

export interface Connection {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
}

interface HistoryState {
  nodes: StoryNode[]
  connections: Connection[]
}

interface StoryState {
  nodes: StoryNode[]
  connections: Connection[]
  selectedNodeId: string | null
  history: HistoryState[]
  historyIndex: number
  scale: number
  panOffset: { x: number; y: number }
  highlightUnconnected: boolean

  addNode: (x: number, y: number) => void
  deleteNode: (id: string) => void
  updateNode: (id: string, updates: Partial<StoryNode>) => void
  moveNode: (id: string, x: number, y: number) => void
  connectNodes: (fromId: string, toId: string, label?: string) => void
  deleteConnection: (id: string) => void
  updateConnectionLabel: (id: string, label: string) => void
  selectNode: (id: string | null) => void
  undo: () => void
  redo: () => void
  setScale: (scale: number) => void
  setPanOffset: (x: number, y: number) => void
  setHighlightUnconnected: (highlight: boolean) => void
  saveToDB: (name: string) => Promise<void>
  loadFromDB: (id: string) => Promise<void>
  listFromDB: () => Promise<{ id: string; name: string; updatedAt: number }[]>
  deleteFromDB: (id: string) => Promise<void>
  pushHistory: () => void
}

const createStartNode = (): StoryNode => ({
  id: 'start',
  title: '故事开始',
  text: '故事从这里开始...',
  x: 100,
  y: 200,
})

export const useStoryStore = create<StoryState>((set, get) => ({
  nodes: [createStartNode()],
  connections: [],
  selectedNodeId: null,
  history: [{ nodes: [createStartNode()], connections: [] }],
  historyIndex: 0,
  scale: 1,
  panOffset: { x: 0, y: 0 },
  highlightUnconnected: false,

  pushHistory: () => {
    const { nodes, connections, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ nodes: [...nodes], connections: [...connections] })
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  addNode: (x: number, y: number) => {
    const newNode: StoryNode = {
      id: uuidv4(),
      title: '新节点',
      text: '',
      x,
      y,
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
    }))
    get().pushHistory()
  },

  deleteNode: (id: string) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter(
        (c) => c.fromNodeId !== id && c.toNodeId !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }))
    get().pushHistory()
  },

  updateNode: (id: string, updates: Partial<StoryNode>) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }))
  },

  moveNode: (id: string, x: number, y: number) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }))
  },

  connectNodes: (fromId: string, toId: string, label = '选项') => {
    const { connections } = get()
    const exists = connections.some(
      (c) => c.fromNodeId === fromId && c.toNodeId === toId
    )
    if (exists || fromId === toId) return

    const existingCount = connections.filter((c) => c.fromNodeId === fromId).length
    const newConnection: Connection = {
      id: uuidv4(),
      fromNodeId: fromId,
      toNodeId: toId,
      label: `${label} ${existingCount + 1}`,
    }
    set((state) => ({
      connections: [...state.connections, newConnection],
    }))
    get().pushHistory()
  },

  deleteConnection: (id: string) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }))
    get().pushHistory()
  },

  updateConnectionLabel: (id: string, label: string) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, label } : c
      ),
    }))
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const state = history[newIndex]
      set({
        nodes: [...state.nodes],
        connections: [...state.connections],
        historyIndex: newIndex,
        selectedNodeId: null,
      })
    }
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const state = history[newIndex]
      set({
        nodes: [...state.nodes],
        connections: [...state.connections],
        historyIndex: newIndex,
        selectedNodeId: null,
      })
    }
  },

  setScale: (scale: number) => {
    const clamped = Math.max(0.5, Math.min(2, scale))
    set({ scale: clamped })
  },

  setPanOffset: (x: number, y: number) => {
    set({ panOffset: { x, y } })
  },

  setHighlightUnconnected: (highlight: boolean) => {
    set({ highlightUnconnected: highlight })
  },

  saveToDB: async (name: string) => {
    const { nodes, connections } = get()
    await saveStory({ name, nodes, connections })
  },

  loadFromDB: async (id: string) => {
    const data = await loadStory(id)
    if (data) {
      const historyState = {
        nodes: [...data.nodes],
        connections: [...data.connections],
      }
      set({
        nodes: data.nodes,
        connections: data.connections,
        history: [historyState],
        historyIndex: 0,
        selectedNodeId: null,
      })
    }
  },

  listFromDB: async () => {
    return await listStories()
  },

  deleteFromDB: async (id: string) => {
    await deleteStory(id)
  },
}))
