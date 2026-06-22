import { create } from 'zustand'

export interface EnergyNode {
  id: string
  position: [number, number, number]
  energy: number
  color: string
  createdAt: number
}

export interface Connection {
  id: string
  from: string
  to: string
  energyFlow: number
}

export interface Shockwave {
  id: string
  position: [number, number, number]
  startTime: number
  color: string
}

interface AppState {
  nodes: EnergyNode[]
  connections: Connection[]
  shockwaves: Shockwave[]
  energyFlow: number
  selectedNode: string | null
  connectingFrom: string | null
  isPlacingNode: boolean
  maxNodes: number
  addNode: (position: [number, number, number]) => void
  removeNode: (id: string) => void
  updateNodePosition: (id: string, position: [number, number, number]) => void
  addConnection: (from: string, to: string) => void
  setEnergyFlow: (value: number) => void
  setSelectedNode: (id: string | null) => void
  setConnectingFrom: (id: string | null) => void
  setIsPlacingNode: (value: boolean) => void
  addShockwave: (position: [number, number, number], color: string) => void
  removeShockwave: (id: string) => void
  resetView: () => void
  clearAll: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const generateColor = () => {
  const colors = ['#ff4500', '#ff6347', '#ff8c00', '#dc143c', '#ff0000']
  return colors[Math.floor(Math.random() * colors.length)]
}

const generateEnergy = () => Math.floor(Math.random() * 50) + 50

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  connections: [],
  shockwaves: [],
  energyFlow: 50,
  selectedNode: null,
  connectingFrom: null,
  isPlacingNode: false,
  maxNodes: 20,

  addNode: (position) => {
    const { nodes, maxNodes } = get()
    if (nodes.length >= maxNodes) return
    
    const newNode: EnergyNode = {
      id: generateId(),
      position,
      energy: generateEnergy(),
      color: generateColor(),
      createdAt: Date.now()
    }
    set((state) => ({ nodes: [...state.nodes, newNode] }))
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter((c) => c.from !== id && c.to !== id)
    }))
  },

  updateNodePosition: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position } : n
      )
    }))
  },

  addConnection: (from, to) => {
    const { connections, energyFlow } = get()
    const exists = connections.some(
      (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    )
    if (exists || from === to) return

    const newConnection: Connection = {
      id: generateId(),
      from,
      to,
      energyFlow
    }
    set((state) => ({ connections: [...state.connections, newConnection] }))
  },

  setEnergyFlow: (value) => {
    set({ energyFlow: value })
    set((state) => ({
      connections: state.connections.map((c) => ({ ...c, energyFlow: value }))
    }))
  },

  setSelectedNode: (id) => set({ selectedNode: id }),
  setConnectingFrom: (id) => set({ connectingFrom: id }),
  setIsPlacingNode: (value) => set({ isPlacingNode: value }),

  addShockwave: (position, color) => {
    const shockwave: Shockwave = {
      id: generateId(),
      position,
      startTime: Date.now(),
      color
    }
    set((state) => ({ shockwaves: [...state.shockwaves, shockwave] }))
  },

  removeShockwave: (id) => {
    set((state) => ({
      shockwaves: state.shockwaves.filter((s) => s.id !== id)
    }))
  },

  resetView: () => {
    const event = new CustomEvent('reset-camera')
    window.dispatchEvent(event)
  },

  clearAll: () => {
    set({ nodes: [], connections: [], shockwaves: [], selectedNode: null, connectingFrom: null })
  }
}))
