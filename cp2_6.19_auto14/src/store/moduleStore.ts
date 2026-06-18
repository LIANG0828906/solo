import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type ModuleType = 'oscillator' | 'filter' | 'envelope' | 'delay'

export interface SynthModule {
  id: string
  type: ModuleType
  gridX: number
  gridY: number
  params: Record<string, number>
  activated: boolean
  springIn: boolean
}

export interface PortInfo {
  id: string
  moduleId: string
  direction: 'input' | 'output'
  index: number
}

export interface Connection {
  id: string
  sourceModuleId: string
  sourcePortIndex: number
  targetModuleId: string
  targetPortIndex: number
  createdAt: number
}

export interface DraggingState {
  moduleId: string | null
  offsetX: number
  offsetY: number
}

export interface WiringState {
  sourceModuleId: string | null
  sourcePortIndex: number
  mouseX: number
  mouseY: number
  active: boolean
  hoverTargetPort: {
    moduleId: string
    direction: 'input' | 'output'
    portIndex: number
  } | null
}

interface ModuleStore {
  modules: SynthModule[]
  connections: Connection[]
  isPlaying: boolean
  dragging: DraggingState
  wiring: WiringState
  addModule: (type: ModuleType, gridX: number, gridY: number) => string
  removeModule: (id: string) => void
  moveModule: (id: string, gridX: number, gridY: number) => void
  updateParam: (id: string, key: string, value: number) => void
  clearSpringIn: (id: string) => void
  addConnection: (sourceModuleId: string, sourcePortIndex: number, targetModuleId: string, targetPortIndex: number) => void
  removeConnection: (id: string) => void
  togglePlay: () => void
  setPlaying: (v: boolean) => void
  setDragging: (state: DraggingState) => void
  setWiring: (state: WiringState) => void
  resetActivation: () => void
  activateChain: () => void
}

const MAX_CONNECTIONS_PER_MODULE = 3

const DEFAULT_PARAMS: Record<ModuleType, Record<string, number>> = {
  oscillator: { frequency: 440, detune: 0, type: 0 },
  filter: { frequency: 1000, Q: 1, gain: 0 },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
  delay: { delayTime: 0.3, feedback: 0.4, mix: 0.5 },
}

export const MODULE_LABELS: Record<ModuleType, string> = {
  oscillator: '振荡器',
  filter: '滤波器',
  envelope: '包络发生器',
  delay: '延迟效果器',
}

export const MODULE_ICONS: Record<ModuleType, string> = {
  oscillator: '〰',
  filter: '⋙',
  envelope: '⌇',
  delay: '⟳',
}

function getModuleInputCount(connections: Connection[], moduleId: string): Connection[] {
  return connections.filter((c) => c.targetModuleId === moduleId)
}

function getModuleOutputCount(connections: Connection[], moduleId: string): Connection[] {
  return connections.filter((c) => c.sourceModuleId === moduleId)
}

export const useModuleStore = create<ModuleStore>((set, get) => ({
  modules: [],
  connections: [],
  isPlaying: false,
  dragging: { moduleId: null, offsetX: 0, offsetY: 0 },
  wiring: {
    sourceModuleId: null,
    sourcePortIndex: 0,
    mouseX: 0,
    mouseY: 0,
    active: false,
    hoverTargetPort: null,
  },

  addModule: (type, gridX, gridY) => {
    const id = uuidv4()
    const mod: SynthModule = {
      id,
      type,
      gridX,
      gridY,
      params: { ...DEFAULT_PARAMS[type] },
      activated: false,
      springIn: true,
    }
    set((s) => ({ modules: [...s.modules, mod] }))
    return id
  },

  removeModule: (id) => {
    set((s) => ({
      modules: s.modules.filter((m) => m.id !== id),
      connections: s.connections.filter(
        (c) => c.sourceModuleId !== id && c.targetModuleId !== id
      ),
    }))
  },

  moveModule: (id, gridX, gridY) => {
    set((s) => ({
      modules: s.modules.map((m) => (m.id === id ? { ...m, gridX, gridY } : m)),
    }))
  },

  updateParam: (id, key, value) => {
    set((s) => ({
      modules: s.modules.map((m) =>
        m.id === id ? { ...m, params: { ...m.params, [key]: value } } : m
      ),
    }))
  },

  clearSpringIn: (id) => {
    set((s) => ({
      modules: s.modules.map((m) => (m.id === id ? { ...m, springIn: false } : m)),
    }))
  },

  addConnection: (sourceModuleId, sourcePortIndex, targetModuleId, targetPortIndex) => {
    if (sourceModuleId === targetModuleId) return

    const { connections } = get()

    const exists = connections.some(
      (c) =>
        c.sourceModuleId === sourceModuleId &&
        c.sourcePortIndex === sourcePortIndex &&
        c.targetModuleId === targetModuleId &&
        c.targetPortIndex === targetPortIndex
    )
    if (exists) return

    let updated = [...connections]

    const sourceOutputs = getModuleOutputCount(updated, sourceModuleId)
    if (sourceOutputs.length >= MAX_CONNECTIONS_PER_MODULE) {
      const sorted = [...sourceOutputs].sort((a, b) => a.createdAt - b.createdAt)
      const toRemove = sorted[0].id
      updated = updated.filter((c) => c.id !== toRemove)
    }

    const targetInputs = getModuleInputCount(updated, targetModuleId)
    if (targetInputs.length >= MAX_CONNECTIONS_PER_MODULE) {
      const sorted = [...targetInputs].sort((a, b) => a.createdAt - b.createdAt)
      const toRemove = sorted[0].id
      updated = updated.filter((c) => c.id !== toRemove)
    }

    const newConn: Connection = {
      id: uuidv4(),
      sourceModuleId,
      sourcePortIndex,
      targetModuleId,
      targetPortIndex,
      createdAt: Date.now(),
    }

    set({ connections: [...updated, newConn] })
  },

  removeConnection: (id) => {
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }))
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }))
  },

  setPlaying: (v) => {
    set({ isPlaying: v })
  },

  setDragging: (state) => set({ dragging: state }),
  setWiring: (state) => set({ wiring: state }),

  resetActivation: () => {
    set((s) => ({
      modules: s.modules.map((m) => ({ ...m, activated: false })),
    }))
  },

  activateChain: () => {
    const { modules, connections } = get()
    const activated = new Set<string>()

    const oscModules = modules.filter((m) => m.type === 'oscillator')
    const queue: string[] = oscModules.map((m) => m.id)

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (activated.has(currentId)) continue
      activated.add(currentId)

      const downstream = connections
        .filter((c) => c.sourceModuleId === currentId)
        .map((c) => c.targetModuleId)

      for (const targetId of downstream) {
        if (!activated.has(targetId)) {
          queue.push(targetId)
        }
      }
    }

    set((s) => ({
      modules: s.modules.map((m) => ({
        ...m,
        activated: activated.has(m.id),
      })),
    }))
  },
}))
