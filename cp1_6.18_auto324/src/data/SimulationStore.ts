import { create } from 'zustand'

export interface Particle {
  id: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  color: string
  size: number
  prevPositions: { x: number; y: number; z: number; time: number }[]
}

export interface ParticleConnection {
  id: string
  particleIdA: string
  particleIdB: string
}

export type SimulationMode = 'attract' | 'repel'

export interface SimulationState {
  particles: Particle[]
  connections: ParticleConnection[]
  gravityConstant: number
  simulationMode: SimulationMode
  isRunning: boolean
  selectedParticleId: string | null
  secondSelectedId: string | null
  isDragging: boolean
  draggedParticleId: string | null
  modeTransitionProgress: number
  previousMode: SimulationMode
  prevVelocities: { id: string; vx: number; vy: number; vz: number }[]
  targetVelocities: { id: string; vx: number; vy: number; vz: number }[]
  transitionStartTime: number

  addParticle: (partial?: Partial<Particle>) => void
  removeParticle: (id: string) => void
  updateParticle: (id: string, updates: Partial<Particle>) => void
  setSelectedParticle: (id: string | null) => void
  setSecondSelected: (id: string | null) => void
  addConnection: (idA: string, idB: string) => void
  removeConnection: (id: string) => void
  setGravityConstant: (g: number) => void
  setSimulationMode: (mode: SimulationMode) => void
  setDragging: (isDragging: boolean, particleId?: string) => void
  tickPhysics: (deltaTime: number, physicsEngine: any) => void
  updateModeTransition: (progress: number) => void
  initParticles: () => void
}

const STARDUST_COLORS = [
  '#FFB7C5',
  '#B5EAD7',
  '#C7CEEA',
  '#FFDAC1',
  '#E2F0CB'
]

export const generateId = () => Math.random().toString(36).substring(2, 11)

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

const createRandomParticle = (): Particle => {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = Math.random() * 10
  return {
    id: generateId(),
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
    vx: randomInRange(-1, 1) * 1.5,
    vy: randomInRange(-1, 1) * 1.5,
    vz: randomInRange(-1, 1) * 1.5,
    color: STARDUST_COLORS[Math.floor(Math.random() * STARDUST_COLORS.length)],
    size: randomInRange(0.3, 0.8),
    prevPositions: []
  }
}

const initParticlesFn = (): Particle[] => {
  return Array.from({ length: 30 }, () => createRandomParticle())
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  particles: [],
  connections: [],
  gravityConstant: 2.0,
  simulationMode: 'attract',
  isRunning: true,
  selectedParticleId: null,
  secondSelectedId: null,
  isDragging: false,
  draggedParticleId: null,
  modeTransitionProgress: 1,
  previousMode: 'attract',
  prevVelocities: [],
  targetVelocities: [],
  transitionStartTime: 0,

  initParticles: () => {
    set({ particles: initParticlesFn() })
  },

  addParticle: (partial?: Partial<Particle>) => {
    const base = createRandomParticle()
    const newParticle: Particle = { ...base, ...partial, prevPositions: [] }
    if (!partial?.color) newParticle.color = STARDUST_COLORS[Math.floor(Math.random() * STARDUST_COLORS.length)]
    if (!partial?.size) newParticle.size = randomInRange(0.3, 0.8)
    set((state) => ({ particles: [...state.particles, newParticle] }))
  },

  removeParticle: (id: string) => {
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== id),
      connections: state.connections.filter(
        (c) => c.particleIdA !== id && c.particleIdB !== id
      ),
      selectedParticleId: state.selectedParticleId === id ? null : state.selectedParticleId,
      secondSelectedId: state.secondSelectedId === id ? null : state.secondSelectedId
    }))
  },

  updateParticle: (id: string, updates: Partial<Particle>) => {
    set((state) => ({
      particles: state.particles.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      )
    }))
  },

  setSelectedParticle: (id: string | null) => {
    set({ selectedParticleId: id })
  },

  setSecondSelected: (id: string | null) => {
    set({ secondSelectedId: id })
  },

  addConnection: (idA: string, idB: string) => {
    if (idA === idB) return
    set((state) => {
      if (state.connections.length >= 20) return state
      const exists = state.connections.some(
        (c) =>
          (c.particleIdA === idA && c.particleIdB === idB) ||
          (c.particleIdA === idB && c.particleIdB === idA)
      )
      if (exists) return state
      return {
        connections: [
          ...state.connections,
          { id: generateId(), particleIdA: idA, particleIdB: idB }
        ]
      }
    })
  },

  removeConnection: (id: string) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id)
    }))
  },

  setGravityConstant: (g: number) => {
    set({ gravityConstant: Math.max(0.1, Math.min(10, g)) })
  },

  setSimulationMode: (mode: SimulationMode) => {
    const state = get()
    if (state.simulationMode === mode) return

    const prevVelocities = state.particles.map((p) => ({
      id: p.id,
      vx: p.vx,
      vy: p.vy,
      vz: p.vz
    }))

    const targetVelocities = state.particles.map((p) => ({
      id: p.id,
      vx: -p.vx,
      vy: -p.vy,
      vz: -p.vz
    }))

    set({
      previousMode: state.simulationMode,
      simulationMode: mode,
      modeTransitionProgress: 0,
      prevVelocities,
      targetVelocities,
      transitionStartTime: performance.now()
    })
  },

  setDragging: (isDragging: boolean, particleId?: string) => {
    set({
      isDragging,
      draggedParticleId: isDragging ? particleId || null : null
    })
  },

  tickPhysics: (deltaTime: number, physicsEngine: any) => {
    const state = get()
    if (!state.isRunning) return

    let newModeProgress = state.modeTransitionProgress
    if (state.modeTransitionProgress < 1) {
      const elapsed = performance.now() - state.transitionStartTime
      newModeProgress = Math.min(1, elapsed / 1000)
    }

    const result = physicsEngine.step(
      state.particles,
      state.gravityConstant,
      state.simulationMode,
      deltaTime,
      state.prevVelocities,
      state.targetVelocities,
      newModeProgress,
      state.draggedParticleId
    )

    set({
      particles: result.particles,
      modeTransitionProgress: newModeProgress
    })
  },

  updateModeTransition: (progress: number) => {
    set({ modeTransitionProgress: Math.min(1, Math.max(0, progress)) })
  }
}))

export { STARDUST_COLORS }
