import { create } from 'zustand'
import type { AppState, StarNode, LogEntry } from '@/types'
import {
  generateId,
  generateConnectionId,
  generateLogId,
  generatePulseId,
  getRandomColor,
  getRandomRotationSpeed,
  calculateDistance,
  getNodeById
} from '@/utils/nodeUtils'

export const useNodeStore = create<AppState>((set, get) => ({
  nodes: [],
  connections: [],
  logs: [],
  pulseEffects: [],
  signalStrength: 50,
  mode: 'normal',
  selectedNode: null,
  connectingFrom: null,
  cameraResetTrigger: 0,

  addNode: (position: [number, number, number]) => {
    const { signalStrength, addLog } = get()
    const newNode: StarNode = {
      id: generateId(),
      position,
      color: getRandomColor(),
      rotationSpeed: getRandomRotationSpeed(),
      createdAt: Date.now()
    }
    set(state => ({
      nodes: [...state.nodes, newNode]
    }))
    addLog({
      nodeId: newNode.id,
      signalStrength,
      distance: 0,
      type: 'create'
    })
  },

  addConnection: (from: string, to: string) => {
    const { nodes, connections, signalStrength, addLog } = get()
    if (from === to) return

    const exists = connections.some(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    )
    if (exists) return

    const fromNode = getNodeById(nodes, from)
    const toNode = getNodeById(nodes, to)
    if (!fromNode || !toNode) return

    const distance = calculateDistance(fromNode.position, toNode.position)

    set(state => ({
      connections: [
        ...state.connections,
        {
          id: generateConnectionId(),
          from,
          to,
          signalStrength,
          createdAt: Date.now()
        }
      ]
    }))

    addLog({
      nodeId: to,
      signalStrength,
      distance,
      type: 'connect'
    })
  },

  removeNode: (id: string) => {
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== id),
      connections: state.connections.filter(c => c.from !== id && c.to !== id),
      selectedNode: state.selectedNode === id ? null : state.selectedNode,
      connectingFrom: state.connectingFrom === id ? null : state.connectingFrom
    }))
  },

  triggerPulse: (nodeId: string) => {
    const { nodes, signalStrength, addLog } = get()
    const node = getNodeById(nodes, nodeId)
    if (!node) return

    const pulseId = generatePulseId()
    set(state => ({
      pulseEffects: [
        ...state.pulseEffects,
        {
          id: pulseId,
          position: node.position,
          color: node.color,
          createdAt: Date.now()
        }
      ]
    }))

    setTimeout(() => {
      get().removePulseEffect(pulseId)
    }, 1500)

    addLog({
      nodeId,
      signalStrength,
      distance: 0,
      type: 'pulse'
    })
  },

  removePulseEffect: (id: string) => {
    set(state => ({
      pulseEffects: state.pulseEffects.filter(p => p.id !== id)
    }))
  },

  setSignalStrength: (value: number) => {
    set({ signalStrength: value })
  },

  setMode: (mode: 'normal' | 'spectrum') => {
    set({ mode })
  },

  setSelectedNode: (id: string | null) => {
    set({ selectedNode: id })
  },

  setConnectingFrom: (id: string | null) => {
    set({ connectingFrom: id })
  },

  resetCamera: () => {
    set(state => ({ cameraResetTrigger: state.cameraResetTrigger + 1 }))
  },

  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: generateLogId(),
      timestamp: Date.now()
    }
    set(state => ({
      logs: [newLog, ...state.logs].slice(0, 6)
    }))
  }
}))
