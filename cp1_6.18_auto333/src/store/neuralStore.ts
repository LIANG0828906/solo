import { create } from 'zustand'
import type { NeuronNode, SynapseConnection, SignalParticle } from '../types/neuralTypes'
import { generateNeurons } from '../modules/neuronGenerator'
import { createConnection } from '../modules/synapseConnector'
import {
  particlePool,
  updateParticles,
  shouldEmitParticle,
  createParticle,
  getParticleCountForConnection,
} from '../modules/signalAnimator'

interface NeuralState {
  neurons: NeuronNode[]
  connections: SynapseConnection[]
  particles: SignalParticle[]
  selectedConnectionId: string | null
  playing: boolean
  lastEmitTime: Record<string, number>
  currentTime: number
  particleCounters: Record<string, number>

  initializeNeurons: () => void
  addRandomConnections: () => void
  selectConnection: (id: string | null) => void
  updateConnection: (id: string, updates: Partial<SynapseConnection>) => void
  startAnimation: () => void
  pauseAnimation: () => void
  resetAnimation: () => void
  tick: (delta: number) => void
}

export const useNeuralStore = create<NeuralState>((set, get) => ({
  neurons: [],
  connections: [],
  particles: [],
  selectedConnectionId: null,
  playing: false,
  lastEmitTime: {},
  currentTime: 0,
  particleCounters: {},

  initializeNeurons: () => {
    const neuronCount = Math.floor(Math.random() * 3) + 3
    const neurons = generateNeurons(neuronCount)
    set({ neurons })
  },

  addRandomConnections: () => {
    const { neurons } = get()
    if (neurons.length < 2) return

    const connections: SynapseConnection[] = []
    const connectionCount = Math.min(neurons.length - 1, Math.floor(Math.random() * 3) + 2)

    for (let i = 0; i < connectionCount; i++) {
      const fromIdx = i % neurons.length
      const toIdx = (i + 1) % neurons.length
      if (fromIdx !== toIdx) {
        const conn = createConnection(neurons[fromIdx], neurons[toIdx])
        if (conn) connections.push(conn)
      }
    }

    set({ connections })
  },

  selectConnection: (id) => {
    set((state) => ({
      selectedConnectionId: id,
      connections: state.connections.map((c) => ({
        ...c,
        selected: c.id === id,
      })),
    }))
  },

  updateConnection: (id, updates) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    }))
  },

  startAnimation: () => {
    set((state) => {
      const now = performance.now()
      const newLastEmitTime: Record<string, number> = {}
      state.connections.forEach((c) => {
        newLastEmitTime[c.id] = state.lastEmitTime[c.id] || now
      })
      return { playing: true, lastEmitTime: newLastEmitTime, currentTime: now }
    })
  },

  pauseAnimation: () => {
    set({ playing: false })
  },

  resetAnimation: () => {
    particlePool.releaseAll()
    set({
      playing: false,
      particles: [],
      lastEmitTime: {},
      particleCounters: {},
    })
  },

  tick: (delta) => {
    const state = get()
    if (!state.playing) return

    const now = performance.now()
    let newParticles = [...state.particles]
    const newLastEmitTime = { ...state.lastEmitTime }
    const newCounters = { ...state.particleCounters }

    for (const connection of state.connections) {
      const particlesOnConnection = newParticles.filter(
        (p) => p.connectionId === connection.id && p.active,
      )
      const maxParticles = getParticleCountForConnection(connection)

      if (
        particlesOnConnection.length < maxParticles &&
        shouldEmitParticle(connection, newLastEmitTime[connection.id] || 0, now)
      ) {
        newCounters[connection.id] = (newCounters[connection.id] || 0) + 1
        const particle = createParticle(connection, newCounters[connection.id])
        newParticles.push(particle)
        newLastEmitTime[connection.id] = now
      }
    }

    newParticles = updateParticles(newParticles, state.connections, delta)

    set({
      particles: newParticles,
      currentTime: now,
      lastEmitTime: newLastEmitTime,
      particleCounters: newCounters,
    })
  },
}))
