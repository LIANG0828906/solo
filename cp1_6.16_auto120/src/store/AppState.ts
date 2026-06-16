import { create } from 'zustand'

export interface WaveformSample {
  timestamp: number
  values: number[]
}

export interface AppState {
  currentMode: 'manual' | 'pattern'
  isPaused: boolean
  sensitivity: number

  jointAngles: number[]
  jointTorques: number[]
  jointLastPulse: number[]
  jointTargets: number[]

  waveformData: WaveformSample[]
  currentPattern: string | null
  patternProgress: number

  fps: number
  sampleRate: number

  setMode: (mode: 'manual' | 'pattern') => void
  togglePause: () => void
  setSensitivity: (s: number) => void
  setJointAngle: (index: number, angle: number) => void
  setJointTorque: (index: number, torque: number) => void
  setJointLastPulse: (index: number, time: number) => void
  appendWaveform: (sample: WaveformSample) => void
  selectPattern: (name: string | null) => void
  setPatternProgress: (progress: number) => void
  setPerformance: (fps: number, sampleRate: number) => void
  reset: () => void
}

const MAX_SAMPLES = 6000

export const useAppStore = create<AppState>((set, get) => ({
  currentMode: 'manual',
  isPaused: false,
  sensitivity: 1.0,

  jointAngles: [0, 0, 0, 0, 0],
  jointTorques: [0, 0, 0, 0, 0],
  jointLastPulse: [0, 0, 0, 0, 0],
  jointTargets: [0, 0, 0, 0, 0],

  waveformData: [],
  currentPattern: null,
  patternProgress: 0,

  fps: 60,
  sampleRate: 0,

  setMode: (mode) => set({ currentMode: mode }),
  togglePause: () => set({ isPaused: !get().isPaused }),
  setSensitivity: (s) => set({ sensitivity: Math.max(0.1, Math.min(2.0, s)) }),

  setJointAngle: (index, angle) => {
    const clamped = Math.max(0, Math.min(180, angle))
    const angles = [...get().jointAngles]
    angles[index] = clamped
    set({ jointAngles: angles })
  },

  setJointTorque: (index, torque) => {
    const clamped = Math.max(0, Math.min(100, torque))
    const torques = [...get().jointTorques]
    torques[index] = clamped
    set({ jointTorques: torques })
  },

  setJointLastPulse: (index, time) => {
    const times = [...get().jointLastPulse]
    times[index] = time
    set({ jointLastPulse: times })
  },

  appendWaveform: (sample) => {
    const data = [...get().waveformData, sample]
    if (data.length > MAX_SAMPLES) {
      data.splice(0, data.length - MAX_SAMPLES)
    }
    set({ waveformData: data })
  },

  selectPattern: (name) => {
    set({ currentPattern: name, patternProgress: 0 })
    if (name) {
      set({ currentMode: 'pattern' })
    }
  },

  setPatternProgress: (progress) => set({ patternProgress: progress }),
  setPerformance: (fps, sampleRate) => set({ fps, sampleRate }),

  reset: () => set({
    currentMode: 'manual',
    isPaused: false,
    sensitivity: 1.0,
    jointAngles: [0, 0, 0, 0, 0],
    jointTorques: [0, 0, 0, 0, 0],
    jointLastPulse: [0, 0, 0, 0, 0],
    jointTargets: [0, 0, 0, 0, 0],
    waveformData: [],
    currentPattern: null,
    patternProgress: 0
  })
}))
