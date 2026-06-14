import { create } from 'zustand'

interface HeartState {
  heartRate: number
  isPaused: boolean
  conductionVisible: boolean
  activationArray: Float32Array
  cycleNumber: number
  avDelay: number
  cardiacOutput: number
  simulationTime: number
  
  setHeartRate: (rate: number) => void
  togglePause: () => void
  toggleConduction: () => void
  setActivationArray: (arr: Float32Array) => void
  setSimulationData: (data: {
    activationArray: Float32Array
    cycleNumber: number
    avDelay: number
    cardiacOutput: number
    simulationTime: number
  }) => void
}

export const useHeartStore = create<HeartState>((set) => ({
  heartRate: 1.0,
  isPaused: false,
  conductionVisible: true,
  activationArray: new Float32Array(40),
  cycleNumber: 0,
  avDelay: 120,
  cardiacOutput: 5.0,
  simulationTime: 0,

  setHeartRate: (rate) => set({ heartRate: rate }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  toggleConduction: () => set((state) => ({ conductionVisible: !state.conductionVisible })),
  setActivationArray: (arr) => set({ activationArray: arr }),
  setSimulationData: (data) => set(data),
}))
