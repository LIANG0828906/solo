import { create } from 'zustand'
import { TrafficData, TrafficMode, trafficSimulator } from '../modules/trafficSimulator'

interface TrafficStore {
  data: TrafficData[]
  mode: TrafficMode
  currentTime: Date
  updateData: (data: TrafficData[]) => void
  setMode: (mode: TrafficMode) => void
  updateTime: () => void
}

export const useTrafficStore = create<TrafficStore>((set) => {
  const initialData = trafficSimulator.getData()
  const initialMode = trafficSimulator.getMode()

  return {
    data: initialData,
    mode: initialMode,
    currentTime: new Date(),

    updateData: (data: TrafficData[]) => set({ data }),

    setMode: (mode: TrafficMode) => {
      trafficSimulator.setMode(mode)
      set({ mode })
    },

    updateTime: () => set({ currentTime: new Date() })
  }
})

export const startTrafficSimulation = () => {
  trafficSimulator.start()
  return trafficSimulator.subscribe((data) => {
    useTrafficStore.getState().updateData(data)
  })
}

export const stopTrafficSimulation = () => {
  trafficSimulator.stop()
}
