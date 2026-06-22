import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Flower, ScoreResult } from '../services/api'
import { flowerApi } from '../services/api'

export interface VaseFlower {
  instanceId: string
  flowerId: string
  flower: Flower
  position: {
    x: number
    y: number
    z: number
  }
  layer: number
}

interface FlowerState {
  allFlowers: Flower[]
  vaseFlowers: VaseFlower[]
  activeCategory: string
  loading: boolean
  error: string | null
  scoreResult: ScoreResult | null
  isMobileDrawerOpen: boolean

  setActiveCategory: (category: string) => void
  loadAllFlowers: () => Promise<void>
  addFlowerToVase: (flower: Flower) => void
  removeFlowerFromVase: (instanceId: string) => void
  clearVase: () => void
  setScoreResult: (result: ScoreResult | null) => void
  calculateAndSetScore: () => Promise<void>
  replaceVaseFlowers: (flowers: Flower[]) => void
  setMobileDrawerOpen: (open: boolean) => void
}

const CATEGORIES = ['玫瑰类', '百合类', '菊类', '配叶类', '填充花类']

export const useFlowerStore = create<FlowerState>((set, get) => ({
  allFlowers: [],
  vaseFlowers: [],
  activeCategory: CATEGORIES[0],
  loading: false,
  error: null,
  scoreResult: null,
  isMobileDrawerOpen: false,

  setActiveCategory: (category) => set({ activeCategory: category }),

  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),

  loadAllFlowers: async () => {
    set({ loading: true, error: null })
    try {
      const result = await flowerApi.getFlowers()
      set({ allFlowers: result.flowers, loading: false })
    } catch (err) {
      console.error(err)
      set({ loading: false, error: '加载花材失败，请检查后端服务是否启动' })
    }
  },

  addFlowerToVase: (flower) => {
    const current = get().vaseFlowers
    const heights = current.map((f) => f.flower.height).concat([flower.height])
    const sortedHeights = [...heights].sort((a, b) => b - a)
    const layer = sortedHeights.indexOf(flower.height)

    const totalCount = current.length
    const angleStep = totalCount === 0 ? 0 : (2 * Math.PI) / (totalCount + 1) * totalCount
    const baseAngle = angleStep + (totalCount % 2 === 0 ? 0.3 : -0.3) * Math.random()
    const radius = 30 + Math.min(totalCount * 15, 80)

    const newFlower: VaseFlower = {
      instanceId: uuidv4(),
      flowerId: flower.id,
      flower,
      position: {
        x: 50 + Math.cos(baseAngle) * radius * 0.3,
        y: 0,
        z: totalCount * 0.5,
      },
      layer,
    }

    const updated = [...current, newFlower]
    const sorted = updated.sort((a, b) => a.flower.height - b.flower.height)
    const finalFlowers = sorted.map((f, idx) => ({
      ...f,
      position: {
        ...f.position,
        x: 50 + (idx - sorted.length / 2) * (80 / Math.max(sorted.length, 4)) + (Math.random() - 0.5) * 10,
      },
    }))

    set({ vaseFlowers: finalFlowers })
    get().calculateAndSetScore()
  },

  removeFlowerFromVase: (instanceId) => {
    set((state) => ({
      vaseFlowers: state.vaseFlowers.filter((f) => f.instanceId !== instanceId),
    }))
    get().calculateAndSetScore()
  },

  clearVase: () => {
    set({ vaseFlowers: [], scoreResult: null })
  },

  setScoreResult: (result) => set({ scoreResult: result }),

  calculateAndSetScore: async () => {
    const ids = get().vaseFlowers.map((f) => f.flowerId)
    if (ids.length === 0) {
      set({ scoreResult: null })
      return
    }
    try {
      const result = await flowerApi.calculateScore(ids)
      set({ scoreResult: result })
    } catch (err) {
      console.error('评分计算失败', err)
    }
  },

  replaceVaseFlowers: (flowers) => {
    const vaseFlowers: VaseFlower[] = flowers
      .sort((a, b) => a.height - b.height)
      .map((flower, idx) => ({
        instanceId: uuidv4(),
        flowerId: flower.id,
        flower,
        position: {
          x: 50 + (idx - flowers.length / 2) * (80 / Math.max(flowers.length, 4)) + (Math.random() - 0.5) * 10,
          y: 0,
          z: idx * 0.5,
        },
        layer: idx,
      }))
    set({ vaseFlowers })
    get().calculateAndSetScore()
  },
}))

export { CATEGORIES }
