import { create } from 'zustand'

interface EcosystemState {
  temperature: number
  humidity: number
  light: number
  co2: number
  prevTemperature: number
  prevHumidity: number
  prevLight: number
  prevCo2: number
  alertActive: boolean
  alertStartTime: number | null
  dangerStartTemp: number | null
  dangerStartCo2: number | null
  stableSeconds: number
  maxStableDays: number
  achievementUnlocked: boolean
  tickCount: number
  setParam: (key: string, value: number) => void
  tick: () => void
  isParamStable: () => boolean
}

const RANGES: Record<string, [number, number]> = {
  temperature: [15, 45],
  humidity: [20, 100],
  light: [500, 8000],
  co2: [300, 2000],
}

export const useEcosystemStore = create<EcosystemState>((set, get) => ({
  temperature: 25,
  humidity: 55,
  light: 3000,
  co2: 500,
  prevTemperature: 25,
  prevHumidity: 55,
  prevLight: 3000,
  prevCo2: 500,
  alertActive: false,
  alertStartTime: null,
  dangerStartTemp: null,
  dangerStartCo2: null,
  stableSeconds: 0,
  maxStableDays: 0,
  achievementUnlocked: false,
  tickCount: 0,

  setParam: (key: string, value: number) => {
    const range = RANGES[key]
    if (!range) return
    const clamped = Math.max(range[0], Math.min(range[1], value))
    const state = get()

    switch (key) {
      case 'temperature':
        set({ prevTemperature: state.temperature, temperature: clamped })
        break
      case 'humidity':
        set({ prevHumidity: state.humidity, humidity: clamped })
        break
      case 'light':
        set({ prevLight: state.light, light: clamped })
        break
      case 'co2':
        set({ prevCo2: state.co2, co2: clamped })
        break
    }
  },

  isParamStable: () => {
    const { temperature, humidity, light, co2 } = get()
    return (
      temperature >= 20 &&
      temperature <= 30 &&
      humidity >= 40 &&
      humidity <= 80 &&
      light >= 1000 &&
      light <= 5000 &&
      co2 >= 300 &&
      co2 <= 800
    )
  },

  tick: () => {
    const s = get()
    const now = Date.now()

    let dangerStartTemp = s.dangerStartTemp
    let dangerStartCo2 = s.dangerStartCo2
    let alertActive = s.alertActive
    let alertStartTime = s.alertStartTime

    if (s.temperature < 10 || s.temperature > 40) {
      if (dangerStartTemp === null) dangerStartTemp = now
    } else {
      dangerStartTemp = null
    }

    if (s.co2 > 1500) {
      if (dangerStartCo2 === null) dangerStartCo2 = now
    } else {
      dangerStartCo2 = null
    }

    const dangerTempTimeout = dangerStartTemp !== null && now - dangerStartTemp > 10000
    const dangerCo2Timeout = dangerStartCo2 !== null && now - dangerStartCo2 > 10000

    if (dangerTempTimeout || dangerCo2Timeout) {
      if (!alertActive) {
        alertActive = true
        alertStartTime = now
      }
    }

    if (alertActive && dangerStartTemp === null && dangerStartCo2 === null) {
      alertActive = false
      alertStartTime = null
    }

    let stableSeconds = s.stableSeconds
    let maxStableDays = s.maxStableDays
    let achievementUnlocked = s.achievementUnlocked

    const stable =
      s.temperature >= 20 &&
      s.temperature <= 30 &&
      s.humidity >= 40 &&
      s.humidity <= 80 &&
      s.light >= 1000 &&
      s.light <= 5000 &&
      s.co2 >= 300 &&
      s.co2 <= 800

    if (stable) {
      stableSeconds += 1
      if (stableSeconds >= 60) {
        maxStableDays += Math.floor(stableSeconds / 60)
        stableSeconds = stableSeconds % 60
      }
      if (maxStableDays >= 7 && !achievementUnlocked) {
        achievementUnlocked = true
      }
    } else {
      stableSeconds = 0
    }

    set({
      tickCount: s.tickCount + 1,
      prevTemperature: s.temperature,
      prevHumidity: s.humidity,
      prevLight: s.light,
      prevCo2: s.co2,
      dangerStartTemp,
      dangerStartCo2,
      alertActive,
      alertStartTime,
      stableSeconds,
      maxStableDays,
      achievementUnlocked,
    })
  },
}))
