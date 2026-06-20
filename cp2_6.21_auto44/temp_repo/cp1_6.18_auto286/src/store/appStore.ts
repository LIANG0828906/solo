import { create } from 'zustand'
import * as THREE from 'three'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export interface Building {
  id: string
  position: [number, number, number]
  size: [number, number, number]
}

const SEASON_CONFIG: Record<Season, { maxAltitude: number; intensity: number }> = {
  spring: { maxAltitude: 45, intensity: 1.2 },
  summer: { maxAltitude: 70, intensity: 1.5 },
  autumn: { maxAltitude: 45, intensity: 1.0 },
  winter: { maxAltitude: 20, intensity: 0.8 }
}

function kelvinToColor(kelvin: number): string {
  const temp = kelvin / 100
  let r: number, g: number, b: number

  if (temp <= 66) {
    r = 255
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661))
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)))
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)))
  }

  if (temp >= 66) {
    b = 255
  } else if (temp <= 19) {
    b = 0
  } else {
    b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307))
  }

  const color = new THREE.Color(r / 255, g / 255, b / 255)
  return '#' + color.getHexString()
}

function calculateSunPosition(time: number, season: Season): { altitude: number; azimuth: number } {
  const progress = (time - 6) / 12
  const { maxAltitude } = SEASON_CONFIG[season]
  const altitude = maxAltitude * Math.sin(progress * Math.PI)
  const azimuth = -90 + progress * 180
  return { altitude, azimuth }
}

function calculateLightColor(time: number): string {
  let kelvin: number
  if (time <= 12) {
    const t = (time - 6) / 6
    kelvin = 3000 + t * (6500 - 3000)
  } else {
    const t = (time - 12) / 6
    kelvin = 6500 - t * (6500 - 2000)
  }
  return kelvinToColor(kelvin)
}

const DEFAULT_BUILDINGS: Building[] = [
  { id: 'b1', position: [-6, 0, -4], size: [2.5, 5, 2.5] },
  { id: 'b2', position: [-2, 0, -5], size: [2, 7, 2] },
  { id: 'b3', position: [3, 0, -3], size: [3, 3.5, 3] },
  { id: 'b4', position: [6, 0, 2], size: [2, 8, 2.5] },
  { id: 'b5', position: [0, 0, 3], size: [2.5, 6, 2] },
  { id: 'b6', position: [-5, 0, 4], size: [3, 4, 2.5] }
]

interface AppState {
  time: number
  season: Season
  sunAltitude: number
  sunAzimuth: number
  lightColor: string
  lightIntensity: number
  showHeatmap: boolean
  buildings: Building[]
  setTime: (time: number) => void
  setSeason: (season: Season) => void
  toggleHeatmap: () => void
}

const initialTime = 9
const initialSeason: Season = 'spring'
const initialSun = calculateSunPosition(initialTime, initialSeason)

export const useAppStore = create<AppState>((set) => ({
  time: initialTime,
  season: initialSeason,
  sunAltitude: initialSun.altitude,
  sunAzimuth: initialSun.azimuth,
  lightColor: calculateLightColor(initialTime),
  lightIntensity: SEASON_CONFIG[initialSeason].intensity,
  showHeatmap: false,
  buildings: DEFAULT_BUILDINGS,
  setTime: (time: number) => {
    const clampedTime = Math.max(6, Math.min(18, time))
    set((state) => {
      const sun = calculateSunPosition(clampedTime, state.season)
      return {
        time: clampedTime,
        sunAltitude: sun.altitude,
        sunAzimuth: sun.azimuth,
        lightColor: calculateLightColor(clampedTime)
      }
    })
  },
  setSeason: (season: Season) => {
    set((state) => {
      const sun = calculateSunPosition(state.time, season)
      return {
        season,
        sunAltitude: sun.altitude,
        sunAzimuth: sun.azimuth,
        lightIntensity: SEASON_CONFIG[season].intensity
      }
    })
  },
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap }))
}))

export function formatTime(time: number): string {
  const hours = Math.floor(time)
  const minutes = Math.round((time - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
  winter: '冬季'
}
