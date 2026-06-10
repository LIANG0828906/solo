export interface StarNode {
  id: string
  position: [number, number, number]
  color: string
  rotationSpeed: number
  createdAt: number
}

export interface Connection {
  id: string
  from: string
  to: string
  signalStrength: number
  createdAt: number
}

export interface LogEntry {
  id: string
  nodeId: string
  signalStrength: number
  distance: number
  timestamp: number
  type: 'create' | 'connect' | 'pulse'
}

export interface PulseEffectData {
  id: string
  position: [number, number, number]
  color: string
  createdAt: number
}

export type AppMode = 'normal' | 'spectrum'

export interface AppState {
  nodes: StarNode[]
  connections: Connection[]
  logs: LogEntry[]
  pulseEffects: PulseEffectData[]
  signalStrength: number
  mode: AppMode
  selectedNode: string | null
  connectingFrom: string | null
  addNode: (position: [number, number, number]) => void
  addConnection: (from: string, to: string) => void
  removeNode: (id: string) => void
  triggerPulse: (nodeId: string) => void
  removePulseEffect: (id: string) => void
  setSignalStrength: (value: number) => void
  setMode: (mode: AppMode) => void
  setSelectedNode: (id: string | null) => void
  setConnectingFrom: (id: string | null) => void
  resetCamera: () => void
  cameraResetTrigger: number
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
}
