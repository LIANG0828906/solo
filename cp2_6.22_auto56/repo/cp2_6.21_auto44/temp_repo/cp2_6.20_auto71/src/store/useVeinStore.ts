import { create } from 'zustand'
import type { VeinNodeState, SmeltedArtifact, Achievement, ElementType } from '@/utils/api'

interface VeinStore {
  nodes: VeinNodeState[]
  activeOrder: ElementType[]
  resonationCount: number
  resonationBoost: number
  collection: SmeltedArtifact[]
  achievements: Achievement[]
  activateNode: (nodeId: string) => void
  setNodes: (nodes: VeinNodeState[]) => void
  addResonation: () => void
  addToCollection: (artifact: SmeltedArtifact) => void
  setAchievements: (achievements: Achievement[]) => void
  addResonationBoost: (percent: number) => void
}

const initialNodes: VeinNodeState[] = [
  {
    id: 'metal',
    name: '金灵脉',
    symbol: '金',
    color: '#c0c0c0',
    isActive: false,
    energy: 0,
    energyBalance: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 },
  },
  {
    id: 'wood',
    name: '木灵脉',
    symbol: '木',
    color: '#4caf50',
    isActive: false,
    energy: 0,
    energyBalance: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 },
  },
  {
    id: 'water',
    name: '水灵脉',
    symbol: '水',
    color: '#2196f3',
    isActive: false,
    energy: 0,
    energyBalance: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 },
  },
  {
    id: 'fire',
    name: '火灵脉',
    symbol: '火',
    color: '#f44336',
    isActive: false,
    energy: 0,
    energyBalance: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 },
  },
  {
    id: 'earth',
    name: '土灵脉',
    symbol: '土',
    color: '#ff9800',
    isActive: false,
    energy: 0,
    energyBalance: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 },
  },
]

export const useVeinStore = create<VeinStore>((set) => ({
  nodes: initialNodes,
  activeOrder: [],
  resonationCount: 0,
  resonationBoost: 0,
  collection: [],
  achievements: [],

  activateNode: (nodeId: string) =>
    set((state) => {
      const newNodes = state.nodes.map((node) =>
        node.id === nodeId ? { ...node, isActive: true, energy: Math.min(100, node.energy + 20) } : node,
      )
      const newActiveOrder = [...state.activeOrder, nodeId as ElementType]
      if (newActiveOrder.length > 5) {
        newActiveOrder.shift()
      }
      return { nodes: newNodes, activeOrder: newActiveOrder }
    }),

  setNodes: (nodes: VeinNodeState[]) => set({ nodes }),

  addResonation: () => set((state) => ({ resonationCount: state.resonationCount + 1 })),

  addToCollection: (artifact: SmeltedArtifact) =>
    set((state) => ({ collection: [...state.collection, artifact] })),

  setAchievements: (achievements: Achievement[]) => set({ achievements }),

  addResonationBoost: (percent: number) =>
    set((state) => ({ resonationBoost: state.resonationBoost + percent })),
}))
