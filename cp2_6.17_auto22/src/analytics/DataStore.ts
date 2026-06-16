import { create } from 'zustand'

export interface FlowRecord {
  timestamp: number
  particleCount: number
}

export interface PathStats {
  pathId: string
  pathName: string
  currentParticleCount: number
  averageSpeed: number
  history: FlowRecord[]
}

interface DataStoreState {
  selectedPathId: string | null
  pathStats: Record<string, PathStats>
  particleIndexToPathId: Record<number, string>
  selectedParticleIndex: number | null
  selectPath: (pathId: string | null) => void
  selectParticle: (particleIndex: number | null) => void
  updatePathStats: (pathId: string, stats: Partial<PathStats>) => void
  recordFlowSample: (pathId: string, particleCount: number, timestamp: number) => void
  registerParticlePath: (particleIndex: number, pathId: string) => void
  getPathByParticleIndex: (particleIndex: number) => string | null
  getSelectedPathStats: () => PathStats | null
}

export const useStore = create<DataStoreState>((set, get) => ({
  selectedPathId: null,
  pathStats: {},
  particleIndexToPathId: {},
  selectedParticleIndex: null,

  selectPath: (pathId) => set({ selectedPathId: pathId }),

  selectParticle: (particleIndex) => set({ selectedParticleIndex: particleIndex }),

  updatePathStats: (pathId, stats) =>
    set((state) => ({
      pathStats: {
        ...state.pathStats,
        [pathId]: {
          ...state.pathStats[pathId],
          ...stats
        }
      }
    })),

  recordFlowSample: (pathId, particleCount, timestamp) =>
    set((state) => {
      const raw = state.pathStats[pathId]
      const existing: PathStats = raw
        ? {
            pathId: raw.pathId || pathId,
            pathName: raw.pathName || pathId,
            currentParticleCount: raw.currentParticleCount ?? 0,
            averageSpeed: raw.averageSpeed ?? 0,
            history: raw.history ?? []
          }
        : {
            pathId,
            pathName: pathId,
            currentParticleCount: 0,
            averageSpeed: 0,
            history: []
          }
      const newHistory = [
        ...existing.history,
        { timestamp, particleCount }
      ].filter((r) => timestamp - r.timestamp <= 65000)
      return {
        pathStats: {
          ...state.pathStats,
          [pathId]: {
            ...existing,
            currentParticleCount: particleCount,
            history: newHistory
          }
        }
      }
    }),

  registerParticlePath: (particleIndex, pathId) =>
    set((state) => ({
      particleIndexToPathId: {
        ...state.particleIndexToPathId,
        [particleIndex]: pathId
      }
    })),

  getPathByParticleIndex: (particleIndex) => {
    const state = get()
    return state.particleIndexToPathId[particleIndex] ?? null
  },

  getSelectedPathStats: () => {
    const state = get()
    if (!state.selectedPathId) return null
    return state.pathStats[state.selectedPathId] ?? null
  }
}))
