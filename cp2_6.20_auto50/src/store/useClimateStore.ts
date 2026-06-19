import { create } from 'zustand'
import { DataType, ClimateDataMap, DataPoint, loadClimateData } from '@/utils/dataLoader'

export type ViewPreset = 'global' | 'northPole' | 'equator'

interface State {
  currentYear: number
  displayYear: number
  dataType: DataType
  isPlaying: boolean
  autoRotate: boolean
  viewPreset: ViewPreset
  climateData: ClimateDataMap
  isLoading: boolean
}

interface Actions {
  setYear: (year: number) => void
  setDisplayYear: (year: number) => void
  setDataType: (type: DataType) => void
  togglePlaying: () => void
  toggleAutoRotate: () => void
  setViewPreset: (preset: ViewPreset) => void
  loadData: () => Promise<void>
}

export const useClimateStore = create<State & Actions>((set) => ({
  currentYear: 2010,
  displayYear: 2010,
  dataType: 'temperature',
  isPlaying: false,
  autoRotate: true,
  viewPreset: 'global',
  climateData: {},
  isLoading: true,

  setYear: (year: number) => set({ currentYear: year }),
  setDisplayYear: (year: number) => set({ displayYear: year }),
  setDataType: (type: DataType) => set({ dataType: type }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  setViewPreset: (preset: ViewPreset) => set({ viewPreset: preset }),
  loadData: async () => {
    const data = await loadClimateData()
    set({ climateData: data, isLoading: false })
  },
}))
