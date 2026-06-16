import { create } from 'zustand'

export type BreathingPhase = 'inhale' | 'exhale' | 'hold'

export interface ParticleData {
  id: string
  x: number
  y: number
  z: number
  size: number
  color: string
  opacity: number
  velocity: { x: number; y: number; z: number }
  age: number
  life: number
  angle: number
  radius: number
  highlighted: boolean
  highlightTime: number
}

interface MeditationState {
  isMeditating: boolean
  isPaused: boolean
  startTime: number | null
  endTime: number | null
  duration: number
  breathingPhase: BreathingPhase
  breathingProgress: number
  inhaleDuration: number
  exhaleDuration: number
  breathCount: number
  averageBreathRate: number
  particleCount: number
  totalParticles: number
  showDataPanel: boolean
  cameraDistance: number
  cameraRotation: { x: number; y: number }
  heartRate: number
  backgroundHue: number
  
  startMeditation: () => void
  stopMeditation: () => void
  togglePause: () => void
  resetView: () => void
  updateBreathing: (delta: number) => void
  setParticleCount: (count: number) => void
  incrementTotalParticles: () => void
  setCameraDistance: (distance: number) => void
  setCameraRotation: (x: number, y: number) => void
  setHeartRate: (rate: number) => void
  setBackgroundHue: (hue: number) => void
  setShowDataPanel: (show: boolean) => void
}

export const useMeditationStore = create<MeditationState>((set, get) => ({
  isMeditating: false,
  isPaused: false,
  startTime: null,
  endTime: null,
  duration: 0,
  breathingPhase: 'inhale',
  breathingProgress: 0,
  inhaleDuration: 4,
  exhaleDuration: 6,
  breathCount: 0,
  averageBreathRate: 0,
  particleCount: 0,
  totalParticles: 0,
  showDataPanel: false,
  cameraDistance: 15,
  cameraRotation: { x: 0.3, y: 0 },
  heartRate: 60,
  backgroundHue: 0,

  startMeditation: () => {
    set({
      isMeditating: true,
      isPaused: false,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      breathingPhase: 'inhale',
      breathingProgress: 0,
      breathCount: 0,
      totalParticles: 0,
      showDataPanel: false,
    })
  },

  stopMeditation: () => {
    const state = get()
    const endTime = Date.now()
    const duration = state.startTime ? (endTime - state.startTime) / 1000 : 0
    const breathRate = duration > 0 ? (state.breathCount / duration) * 60 : 0
    
    set({
      isMeditating: false,
      isPaused: false,
      endTime,
      duration,
      averageBreathRate: breathRate,
      showDataPanel: true,
    })
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }))
  },

  resetView: () => {
    set({
      cameraDistance: 15,
      cameraRotation: { x: 0.3, y: 0 },
    })
  },

  updateBreathing: (delta: number) => {
    const state = get()
    if (!state.isMeditating || state.isPaused) return

    let newProgress = state.breathingProgress + delta
    let newPhase = state.breathingPhase
    let newBreathCount = state.breathCount

    if (state.breathingPhase === 'inhale') {
      if (newProgress >= state.inhaleDuration) {
        newProgress = newProgress - state.inhaleDuration
        newPhase = 'exhale'
      }
    } else {
      if (newProgress >= state.exhaleDuration) {
        newProgress = newProgress - state.exhaleDuration
        newPhase = 'inhale'
        newBreathCount += 1
      }
    }

    set({
      breathingProgress: newProgress,
      breathingPhase: newPhase,
      breathCount: newBreathCount,
    })
  },

  setParticleCount: (count: number) => {
    set({ particleCount: count })
  },

  incrementTotalParticles: () => {
    set((state) => ({ totalParticles: state.totalParticles + 1 }))
  },

  setCameraDistance: (distance: number) => {
    const clampedDistance = Math.max(8, Math.min(30, distance))
    set({ cameraDistance: clampedDistance })
  },

  setCameraRotation: (x: number, y: number) => {
    const clampedX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, x))
    set({ cameraRotation: { x: clampedX, y } })
  },

  setHeartRate: (rate: number) => {
    set({ heartRate: rate })
  },

  setBackgroundHue: (hue: number) => {
    set({ backgroundHue: hue })
  },

  setShowDataPanel: (show: boolean) => {
    set({ showDataPanel: show })
  },
}))
