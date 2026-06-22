import { create } from 'zustand'

export interface CrystalAttributes {
  symmetry: number
  transparency: number
  hardness: number
  cleavage: number
  luster: number
}

export interface CrystalState {
  temperature: number
  concentration: number
  impurity: number
  isPlaying: boolean
  progress: number
  growthTime: number
  stage: string
  lastStageTriggered: number
  attributes: CrystalAttributes
  setTemperature: (v: number) => void
  setConcentration: (v: number) => void
  setImpurity: (v: number) => void
  setPlaying: (v: boolean) => void
  setProgress: (v: number) => void
  tick: (delta: number) => void
  computeAttributes: () => void
}

function getStage(progress: number): string {
  if (progress < 0.15) return '初始成核'
  if (progress < 0.5) return '快速扩展'
  if (progress < 0.85) return '稳定结晶'
  return '晶体成熟'
}

function computeAttributesFrom(
  temperature: number,
  concentration: number,
  impurity: number
): CrystalAttributes {
  const symmetry = Math.max(0, Math.min(100, 100 - impurity * 0.8 + (1 - Math.abs(concentration - 1) / 1) * 10))
  const transparency = Math.max(0, Math.min(100, concentration * 50 - impurity * 0.2))
  const tempDeviation = Math.abs(temperature - 550) / 450
  const hardness = Math.max(0, Math.min(100, (1 - tempDeviation) * 100))
  const cleavage = Math.max(
    0,
    Math.min(100, ((1000 - temperature) * 0.05 + (100 - impurity) * 0.05) * 1.2)
  )
  const tempFitness = 1 - Math.abs(temperature - 500) / 500
  const luster = Math.max(0, Math.min(100, concentration * 35 + tempFitness * 30 - impurity * 0.15))
  return { symmetry, transparency, hardness, cleavage, luster }
}

export const useCrystalStore = create<CrystalState>((set, get) => ({
  temperature: 550,
  concentration: 1.0,
  impurity: 10,
  isPlaying: true,
  progress: 0,
  growthTime: 0,
  stage: '初始成核',
  lastStageTriggered: -1,
  attributes: computeAttributesFrom(550, 1.0, 10),

  setTemperature: (v: number) =>
    set(() => {
      const state = get()
      return {
        temperature: v,
        attributes: computeAttributesFrom(v, state.concentration, state.impurity)
      }
    }),

  setConcentration: (v: number) =>
    set(() => {
      const state = get()
      return {
        concentration: v,
        attributes: computeAttributesFrom(state.temperature, v, state.impurity)
      }
    }),

  setImpurity: (v: number) =>
    set(() => {
      const state = get()
      return {
        impurity: v,
        attributes: computeAttributesFrom(state.temperature, state.concentration, v)
      }
    }),

  setPlaying: (v: boolean) => set({ isPlaying: v }),

  setProgress: (v: number) =>
    set({
      progress: v,
      growthTime: v * 30,
      stage: getStage(v)
    }),

  computeAttributes: () => {
    const state = get()
    set({ attributes: computeAttributesFrom(state.temperature, state.concentration, state.impurity) })
  },

  tick: (delta: number) => {
    const state = get()
    if (!state.isPlaying) return
    const newGrowthTime = state.growthTime + delta
    const newProgress = Math.min(1, newGrowthTime / 30)
    const newStage = getStage(newProgress)
    const stageIndex = newProgress < 0.15 ? 0 : newProgress < 0.5 ? 1 : newProgress < 0.85 ? 2 : 3
    set({
      growthTime: newGrowthTime,
      progress: newProgress,
      stage: newStage,
      lastStageTriggered: stageIndex !== state.lastStageTriggered ? stageIndex : state.lastStageTriggered
    })
  }
}))
