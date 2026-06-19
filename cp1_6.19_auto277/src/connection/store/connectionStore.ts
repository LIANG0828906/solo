import { create } from 'zustand'
import type { Connection } from '@/types'
import { generateId } from '@/utils/geometryUtils'

interface ConnectionStore {
  connections: Connection[]
  addConnection: (fromBubbleId: string, toBubbleId: string, label?: string) => Connection
  updateConnection: (id: string, patch: Partial<Connection>) => void
  removeConnection: (id: string) => void
  getConnectionsByBubble: (bubbleId: string) => Connection[]
  removeConnectionsByBubble: (bubbleId: string) => void
  setConnections: (connections: Connection[]) => void
  clearAll: () => void
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],

  addConnection: (fromBubbleId, toBubbleId, label = '') => {
    const exists = get().connections.some(
      c => (c.fromBubbleId === fromBubbleId && c.toBubbleId === toBubbleId) ||
           (c.fromBubbleId === toBubbleId && c.toBubbleId === fromBubbleId)
    )
    if (exists || fromBubbleId === toBubbleId) {
      return {} as Connection
    }
    const newConnection: Connection = {
      id: generateId(),
      fromBubbleId,
      toBubbleId,
      label
    }
    set(state => ({ connections: [...state.connections, newConnection] }))
    return newConnection
  },

  updateConnection: (id, patch) => set(state => ({
    connections: state.connections.map(c =>
      c.id === id ? { ...c, ...patch } : c
    )
  })),

  removeConnection: (id) => set(state => ({
    connections: state.connections.filter(c => c.id !== id)
  })),

  getConnectionsByBubble: (bubbleId) => get().connections.filter(
    c => c.fromBubbleId === bubbleId || c.toBubbleId === bubbleId
  ),

  removeConnectionsByBubble: (bubbleId) => set(state => ({
    connections: state.connections.filter(
      c => c.fromBubbleId !== bubbleId && c.toBubbleId !== bubbleId
    )
  })),

  setConnections: (connections) => set({ connections }),

  clearAll: () => set({ connections: [] })
}))
