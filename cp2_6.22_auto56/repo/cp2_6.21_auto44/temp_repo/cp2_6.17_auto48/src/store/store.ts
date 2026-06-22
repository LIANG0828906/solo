import { create } from 'zustand'
import * as THREE from 'three'

export interface PlanetData {
  name: string
  radius: number
  orbitRadius: number
  orbitSpeed: number
  rotationSpeed: number
  tiltAngle: number
  color: string
  orbitPeriod: number
  rotationPeriod: number
  distanceFromSun: number
  hasRing?: boolean
  isSun?: boolean
  mesh: THREE.Mesh | null
  orbitLine: THREE.LineLoop | null
  tiltGroup: THREE.Group | null
  currentAngle: number
}

interface CameraState {
  target: THREE.Vector3
  zoom: number
  isFlying: boolean
}

interface PlanetariumStore {
  planets: PlanetData[]
  camera: CameraState
  timeScale: number
  targetTimeScale: number
  timeScaleProgress: number
  isAutoRotate: boolean
  selectedPlanet: string | null
  setSelectedPlanet: (name: string | null) => void
  setTimeScale: (scale: number) => void
  setIsAutoRotate: (auto: boolean) => void
  setCameraTarget: (target: THREE.Vector3, zoom?: number) => void
  setCameraFlying: (flying: boolean) => void
  updatePlanets: (planets: PlanetData[]) => void
  updateTimeScaleProgress: (progress: number) => void
}

const initialCamera: CameraState = {
  target: new THREE.Vector3(0, 0, 0),
  zoom: 1,
  isFlying: false
}

export const usePlanetariumStore = create<PlanetariumStore>((set) => ({
  planets: [],
  camera: initialCamera,
  timeScale: 1,
  targetTimeScale: 1,
  timeScaleProgress: 1,
  isAutoRotate: false,
  selectedPlanet: null,

  setSelectedPlanet: (name) => set({ selectedPlanet: name }),

  setTimeScale: (scale) => set({ targetTimeScale: scale, timeScaleProgress: 0 }),

  setIsAutoRotate: (auto) => set({ isAutoRotate: auto }),

  setCameraTarget: (target, zoom) =>
    set((state) => ({
      camera: {
        ...state.camera,
        target: target.clone(),
        zoom: zoom ?? state.camera.zoom
      }
    })),

  setCameraFlying: (flying) =>
    set((state) => ({
      camera: { ...state.camera, isFlying: flying }
    })),

  updatePlanets: (planets) => set({ planets }),

  updateTimeScaleProgress: (progress) =>
    set((state) => ({
      timeScaleProgress: progress,
      timeScale:
        state.timeScale + (state.targetTimeScale - state.timeScale) * (progress - state.timeScaleProgress)
    }))
}))
