import { create } from 'zustand'
import type { LightSource, LightType, LightingPlan } from '@/types'

interface LightStoreState {
  lights: LightSource[]
  selectedLightId: string | null
  lightingPlans: LightingPlan[]
  isTransitioning: boolean
}

interface LightStoreActions {
  addLight: (type: LightType) => void
  removeLight: (id: string) => void
  updateLight: (id: string, updates: Partial<LightSource>) => void
  selectLight: (id: string | null) => void
  setLightingPlans: (plans: LightingPlan[]) => void
  addLightingPlan: (plan: LightingPlan) => void
  removeLightingPlan: (id: string) => void
  loadPlan: (plan: LightingPlan) => void
  setTransitioning: (val: boolean) => void
}

type LightStore = LightStoreState & LightStoreActions

function createDefaultLight(type: LightType): LightSource {
  return {
    id: crypto.randomUUID(),
    type,
    position: { x: 0, y: 3, z: 0 },
    direction: { x: 0, y: -1, z: 0 },
    intensity: 1,
    colorTemperature: 4000,
  }
}

export const useLightStore = create<LightStore>((set) => ({
  lights: [],
  selectedLightId: null,
  lightingPlans: [],
  isTransitioning: false,

  addLight: (type) =>
    set((state) => {
      if (state.lights.length >= 6) return state
      return { lights: [...state.lights, createDefaultLight(type)] }
    }),

  removeLight: (id) =>
    set((state) => ({
      lights: state.lights.filter((l) => l.id !== id),
      selectedLightId: state.selectedLightId === id ? null : state.selectedLightId,
    })),

  updateLight: (id, updates) =>
    set((state) => ({
      lights: state.lights.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  selectLight: (id) => set({ selectedLightId: id }),

  setLightingPlans: (plans) => set({ lightingPlans: plans }),

  addLightingPlan: (plan) =>
    set((state) => ({ lightingPlans: [...state.lightingPlans, plan] })),

  removeLightingPlan: (id) =>
    set((state) => ({
      lightingPlans: state.lightingPlans.filter((p) => p.id !== id),
    })),

  loadPlan: (plan) => {
    set({ isTransitioning: true, lights: plan.lights, selectedLightId: null })
    setTimeout(() => set({ isTransitioning: false }), 800)
  },
  setTransitioning: (val) => set({ isTransitioning: val }),
}))
