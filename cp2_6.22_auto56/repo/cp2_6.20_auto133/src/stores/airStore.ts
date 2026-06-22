import { create } from 'zustand'

export interface City {
  id: string
  name: string
  icon: string
}

export interface AirQualityCurrent {
  cityId: string
  aqi: number
  pm25: number
  pm10: number
  ozone: number
  no2: number
  timestamp: string
}

export interface AirQualityHourly {
  time: string
  pm25: number
  pm10: number
  ozone: number
  no2: number
}

export interface AirQualityHistory {
  cityId: string
  data: AirQualityHourly[]
}

export type PollutantKey = 'pm25' | 'pm10' | 'ozone' | 'no2'

interface AirStore {
  cities: City[]
  currentData: Record<string, AirQualityCurrent>
  historyData: Record<string, AirQualityHourly[]>
  selectedCities: string[]
  loading: boolean
  setCities: (cities: City[]) => void
  setCurrentData: (data: AirQualityCurrent[]) => void
  setHistoryData: (cityId: string, data: AirQualityHourly[]) => void
  toggleCitySelection: (cityId: string) => void
  clearSelection: () => void
  setLoading: (loading: boolean) => void
}

export const useAirStore = create<AirStore>((set) => ({
  cities: [],
  currentData: {},
  historyData: {},
  selectedCities: [],
  loading: false,

  setCities: (cities) => set({ cities }),

  setCurrentData: (data) =>
    set((state) => {
      const newData = { ...state.currentData }
      data.forEach((item) => {
        newData[item.cityId] = item
      })
      return { currentData: newData }
    }),

  setHistoryData: (cityId, data) =>
    set((state) => ({
      historyData: { ...state.historyData, [cityId]: data },
    })),

  toggleCitySelection: (cityId) =>
    set((state) => {
      const exists = state.selectedCities.includes(cityId)
      if (exists) {
        return { selectedCities: state.selectedCities.filter((id) => id !== cityId) }
      }
      if (state.selectedCities.length >= 2) {
        return { selectedCities: [state.selectedCities[1], cityId] }
      }
      return { selectedCities: [...state.selectedCities, cityId] }
    }),

  clearSelection: () => set({ selectedCities: [] }),
  setLoading: (loading) => set({ loading }),
}))

export function getAqiLevel(aqi: number): { level: string; color: string } {
  if (aqi <= 50) return { level: '优', color: '#00e400' }
  if (aqi <= 100) return { level: '良', color: '#ffff00' }
  if (aqi <= 150) return { level: '轻度污染', color: '#ff7e00' }
  if (aqi <= 200) return { level: '中度污染', color: '#ff0000' }
  if (aqi <= 300) return { level: '重度污染', color: '#99004c' }
  return { level: '严重污染', color: '#7e0023' }
}

export const POLLUTANT_RANGES: Record<PollutantKey, { min: number; max: number; unit: string; label: string }> = {
  pm25: { min: 0, max: 250, unit: 'μg/m³', label: 'PM2.5' },
  pm10: { min: 0, max: 350, unit: 'μg/m³', label: 'PM10' },
  ozone: { min: 0, max: 300, unit: 'μg/m³', label: '臭氧' },
  no2: { min: 0, max: 200, unit: 'μg/m³', label: '二氧化氮' },
}

export function getPollutantColor(key: PollutantKey, value: number): string {
  const range = POLLUTANT_RANGES[key]
  const ratio = (value - range.min) / (range.max - range.min)
  if (ratio <= 0.2) return '#00e400'
  if (ratio <= 0.4) return '#ffff00'
  if (ratio <= 0.6) return '#ff7e00'
  if (ratio <= 0.8) return '#ff0000'
  return '#99004c'
}
