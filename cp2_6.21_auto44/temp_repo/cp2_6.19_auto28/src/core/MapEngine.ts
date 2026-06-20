import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { MindMapNode, Connection, ThemeName } from '../types'
import { eventBus } from './EventBus'

const STORAGE_KEY_NODES = 'mindmap_nodes'
const STORAGE_KEY_CONNECTIONS = 'mindmap_connections'
const STORAGE_KEY_VIEW = 'mindmap_view'

const DEFAULT_NODE_WIDTH = 140
const DEFAULT_NODE_HEIGHT = 50

interface MapState {
  nodes: Record<string, MindMapNode>
  connections: Record<string, Connection>
  selectedNodeId: string | null
  editingNodeId: string | null
  scale: number
  offsetX: number
  offsetY: number
  theme: ThemeName
  isDraggingNode: boolean
  dragNodeId: string | null
  isCreatingChild: boolean
  creatingFromId: string | null
  creatingPosition: { x: number; y: number } | null
  flashNodeId: string | null
}

interface MapActions {
  loadFromStorage: () => void
  saveToStorage: () => void
  createNode: (x: number, y: number, parentId?: string | null, title?: string) => MindMapNode
  updateNode: (id: string, updates: Partial<MindMapNode>) => void
  deleteNode: (id: string) => void
  selectNode: (id: string | null) => void
  setEditingNode: (id: string | null) => void
  updateNodeTitle: (id: string, title: string) => void
  startDragNode: (id: string) => void
  dragNode: (id: string, x: number, y: number) => void
  endDragNode: () => void
  startCreateChild: (fromId: string) => void
  updateCreatingPosition: (x: number, y: number) => void
  endCreateChild: (x: number, y: number) => void
  cancelCreateChild: () => void
  setScale: (scale: number) => void
  setOffset: (x: number, y: number) => void
  setTheme: (theme: ThemeName) => void
  setFlashNode: (id: string | null) => void
  getNodeList: () => MindMapNode[]
  getConnectionList: () => Connection[]
}

const loadNodes = (): Record<string, MindMapNode> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_NODES)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

const loadConnections = (): Record<string, Connection> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CONNECTIONS)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

const loadView = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_VIEW)
    return data ? JSON.parse(data) : { scale: 1, offsetX: 0, offsetY: 0, theme: 'blue' as ThemeName }
  } catch {
    return { scale: 1, offsetX: 0, offsetY: 0, theme: 'blue' as ThemeName }
  }
}

export const useMapStore = create<MapState & MapActions>((set, get) => {
  const initialView = loadView()
  const initialNodes = loadNodes()
  const initialConnections = loadConnections()

  return {
    nodes: initialNodes,
    connections: initialConnections,
    selectedNodeId: null,
    editingNodeId: null,
    scale: initialView.scale,
    offsetX: initialView.offsetX,
    offsetY: initialView.offsetY,
    theme: initialView.theme,
    isDraggingNode: false,
    dragNodeId: null,
    isCreatingChild: false,
    creatingFromId: null,
    creatingPosition: null,
    flashNodeId: null,

    loadFromStorage: () => {
      set({
        nodes: loadNodes(),
        connections: loadConnections(),
      })
    },

    saveToStorage: () => {
      const { nodes, connections, scale, offsetX, offsetY, theme } = get()
      localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes))
      localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connections))
      localStorage.setItem(STORAGE_KEY_VIEW, JSON.stringify({ scale, offsetX, offsetY, theme }))
    },

    createNode: (x: number, y: number, parentId: string | null = null, title: string = '新节点') => {
      const id = uuidv4()
      const node: MindMapNode = {
        id,
        title,
        x,
        y,
        parentId,
        children: [],
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      }

      set((state) => {
        const newNodes = { ...state.nodes, [id]: node }
        const newConnections = { ...state.connections }

        if (parentId && state.nodes[parentId]) {
          const parentNode = { ...state.nodes[parentId] }
          parentNode.children = [...parentNode.children, id]
          newNodes[parentId] = parentNode

          const connectionId = uuidv4()
          newConnections[connectionId] = {
            id: connectionId,
            fromId: parentId,
            toId: id,
          }
        }

        return { nodes: newNodes, connections: newConnections, flashNodeId: id }
      })

      eventBus.emit('node:created', node)
      setTimeout(() => get().setFlashNode(null), 800)

      get().saveToStorage()
      return node
    },

    updateNode: (id: string, updates: Partial<MindMapNode>) => {
      set((state) => {
        if (!state.nodes[id]) return state
        return {
          nodes: {
            ...state.nodes,
            [id]: { ...state.nodes[id], ...updates },
          },
        }
      })
      eventBus.emit('node:updated', id, updates)
      get().saveToStorage()
    },

    deleteNode: (id: string) => {
      set((state) => {
        const node = state.nodes[id]
        if (!node) return state

        const newNodes = { ...state.nodes }
        const newConnections = { ...state.connections }

        const deleteRecursive = (nodeId: string) => {
          const n = newNodes[nodeId]
          if (!n) return

          n.children.forEach((childId) => deleteRecursive(childId))

          if (n.parentId && newNodes[n.parentId]) {
            const parent = newNodes[n.parentId]
            parent.children = parent.children.filter((cid) => cid !== nodeId)
          }

          delete newNodes[nodeId]

          Object.keys(newConnections).forEach((connId) => {
            if (newConnections[connId].fromId === nodeId || newConnections[connId].toId === nodeId) {
              delete newConnections[connId]
            }
          })
        }

        deleteRecursive(id)

        return {
          nodes: newNodes,
          connections: newConnections,
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }
      })

      eventBus.emit('node:deleted', id)
      get().saveToStorage()
    },

    selectNode: (id: string | null) => {
      set({ selectedNodeId: id, editingNodeId: null })
      eventBus.emit('node:selected', id)
    },

    setEditingNode: (id: string | null) => {
      set({ editingNodeId: id })
    },

    updateNodeTitle: (id: string, title: string) => {
      const truncated = title.slice(0, 50)
      get().updateNode(id, { title: truncated })
      set({ flashNodeId: id })
      setTimeout(() => get().setFlashNode(null), 600)
    },

    startDragNode: (id: string) => {
      set({ isDraggingNode: true, dragNodeId: id })
    },

    dragNode: (id: string, x: number, y: number) => {
      get().updateNode(id, { x, y })
    },

    endDragNode: () => {
      set({ isDraggingNode: false, dragNodeId: null })
    },

    startCreateChild: (fromId: string) => {
      set({ isCreatingChild: true, creatingFromId: fromId })
    },

    updateCreatingPosition: (x: number, y: number) => {
      set({ creatingPosition: { x, y } })
    },

    endCreateChild: (x: number, y: number) => {
      const { creatingFromId } = get()
      if (creatingFromId) {
        get().createNode(x, y, creatingFromId, '子主题')
      }
      set({ isCreatingChild: false, creatingFromId: null, creatingPosition: null })
    },

    cancelCreateChild: () => {
      set({ isCreatingChild: false, creatingFromId: null, creatingPosition: null })
    },

    setScale: (scale: number) => {
      const clamped = Math.max(0.5, Math.min(2, scale))
      set({ scale: clamped })
      get().saveToStorage()
    },

    setOffset: (x: number, y: number) => {
      set({ offsetX: x, offsetY: y })
      get().saveToStorage()
    },

    setTheme: (theme: ThemeName) => {
      set({ theme })
      eventBus.emit('theme:changed', theme)
      get().saveToStorage()
    },

    setFlashNode: (id: string | null) => {
      set({ flashNodeId: id })
    },

    getNodeList: () => {
      return Object.values(get().nodes)
    },

    getConnectionList: () => {
      return Object.values(get().connections)
    },
  }
})
