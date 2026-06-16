import { create } from 'zustand'

export interface BuildingFace {
  id: string
  normal: { x: number; y: number; z: number }
  intensity: number
  position: { x: number; y: number; z: number }
  size: { width: number; height: number }
}

export interface SunState {
  azimuth: number
  altitude: number
  sunDirection: { x: number; y: number; z: number }
  currentDate: { month: number; day: number }
  timeHour: number
  buildingFaces: BuildingFace[]
  faceColors: { h: number; s: number; v: number; a: number }[]
  latitude: number
  longitude: number

  setSunPosition: (azimuth: number, altitude: number) => void
  setDate: (month: number, day: number) => void
  setTime: (hour: number) => void
  setBuildingFaces: (faces: BuildingFace[]) => void
  setFaceColors: (colors: { h: number; s: number; v: number; a: number }[]) => void
  updateFaceIntensities: (intensities: number[]) => void
}

export const useSunStore = create<SunState>((set, get) => ({
  azimuth: 120,
  altitude: 45,
  sunDirection: { x: 0.5, y: 0.7, z: 0.5 },
  currentDate: { month: 6, day: 21 },
  timeHour: 10,
  buildingFaces: [],
  faceColors: [],
  latitude: 39.9,
  longitude: 116.4,

  setSunPosition: (azimuth, altitude) => {
    const azimuthRad = (azimuth * Math.PI) / 180
    const altitudeRad = (altitude * Math.PI) / 180
    const x = Math.cos(altitudeRad) * Math.sin(azimuthRad)
    const y = Math.sin(altitudeRad)
    const z = Math.cos(altitudeRad) * Math.cos(azimuthRad)
    set({ azimuth, altitude, sunDirection: { x, y, z } })
  },

  setDate: (month, day) => {
    set({ currentDate: { month, day } })
  },

  setTime: (hour) => {
    set({ timeHour: hour })
  },

  setBuildingFaces: (faces) => {
    set({ buildingFaces: faces })
  },

  setFaceColors: (colors) => {
    set({ faceColors: colors })
  },

  updateFaceIntensities: (intensities) => {
    const { buildingFaces } = get()
    const updatedFaces = buildingFaces.map((face, index) => ({
      ...face,
      intensity: intensities[index] ?? face.intensity,
    }))
    set({ buildingFaces: updatedFaces })
  },
}))
