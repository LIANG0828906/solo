import { create } from 'zustand'
import gsap from 'gsap'

export type PlantId = 'sunflower' | 'cactus' | 'fern' | 'maple' | 'succulent'

export type GrowthStage = 'seedling' | 'growing' | 'mature' | 'flowering'

export interface EnvironmentParams {
  light: number
  water: number
  temperature: number
}

export interface AppState {
  selectedPlant: PlantId
  environment: EnvironmentParams
  smoothedEnv: EnvironmentParams
  growthStage: GrowthStage
  isSimulating: boolean
  simulationProgress: number
  stageLabelVisible: boolean
  stageLabelText: string
  selectPlant: (id: PlantId) => void
  setEnvironment: (params: Partial<EnvironmentParams>) => void
  resetEnvironment: () => void
  startSimulation: () => void
  setSimulationProgress: (p: number) => void
  setGrowthStage: (s: GrowthStage) => void
  showStageLabel: (text: string) => void
  hideStageLabel: () => void
}

const DEFAULT_ENV: EnvironmentParams = {
  light: 50,
  water: 50,
  temperature: 25,
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedPlant: 'sunflower',
  environment: { ...DEFAULT_ENV },
  smoothedEnv: { ...DEFAULT_ENV },
  growthStage: 'mature',
  isSimulating: false,
  simulationProgress: 1,
  stageLabelVisible: false,
  stageLabelText: '',

  selectPlant: (id: PlantId) => {
    set({ selectedPlant: id })
    const state = get()
    if (state.isSimulating) {
      gsap.killTweensOf({ dummy: true })
    }
    set({
      isSimulating: false,
      simulationProgress: 1,
      growthStage: 'mature',
      stageLabelVisible: false,
    })
    const currentSmoothed = get().smoothedEnv
    const target = get().environment
    gsap.to(currentSmoothed, {
      ...target,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => set({ smoothedEnv: { ...currentSmoothed } }),
    })
  },

  setEnvironment: (params) => {
    const newEnv = { ...get().environment, ...params }
    set({ environment: newEnv })
    const currentSmoothed = { ...get().smoothedEnv }
    gsap.to(currentSmoothed, {
      ...newEnv,
      duration: 0.35,
      ease: 'power3.out',
      onUpdate: () => set({ smoothedEnv: { ...currentSmoothed } }),
    })
  },

  resetEnvironment: () => {
    set({ environment: { ...DEFAULT_ENV } })
    const currentSmoothed = { ...get().smoothedEnv }
    gsap.to(currentSmoothed, {
      ...DEFAULT_ENV,
      duration: 0.6,
      ease: 'expo.out',
      onUpdate: () => set({ smoothedEnv: { ...currentSmoothed } }),
      onComplete: () => {
        set({
          isSimulating: false,
          simulationProgress: 1,
          growthStage: 'mature',
          stageLabelVisible: false,
        })
      },
    })
  },

  startSimulation: () => {
    const state = get()
    if (state.isSimulating) return
    set({ isSimulating: true, simulationProgress: 0, growthStage: 'seedling' })

    const timeline = gsap.timeline({
      onUpdate: () => {
        const p = (timeline.progress() as unknown as number)
        set({ simulationProgress: p })
        if (p < 0.33) set({ growthStage: 'seedling' })
        else if (p < 0.66) set({ growthStage: 'growing' })
        else if (p < 0.9) set({ growthStage: 'mature' })
        else set({ growthStage: 'flowering' })
      },
      onComplete: () => {
        set({ isSimulating: false, simulationProgress: 1 })
      }
    })

    const progressObj = { p: 0 }
    get().showStageLabel('🌱 幼苗期')
    timeline.to(progressObj, {
      p: 0.33,
      duration: 5 * 0.33,
      ease: 'power1.inOut',
      onComplete: () => get().showStageLabel('🌿 生长期'),
    })
    timeline.to(progressObj, {
      p: 0.66,
      duration: 5 * 0.33,
      ease: 'power1.inOut',
      onComplete: () => get().showStageLabel('🌳 成熟期'),
    })
    timeline.to(progressObj, {
      p: 1,
      duration: 5 * 0.34,
      ease: 'power1.inOut',
      onComplete: () => get().showStageLabel('🌸 开花期'),
    })
  },

  setSimulationProgress: (p) => set({ simulationProgress: p }),
  setGrowthStage: (s) => set({ growthStage: s }),

  showStageLabel: (text: string) => {
    set({ stageLabelVisible: true, stageLabelText: text })
    gsap.delayedCall(1.5, () => {
      set({ stageLabelVisible: false })
    })
  },
  hideStageLabel: () => set({ stageLabelVisible: false }),
}))
