import { create } from 'zustand'

export type AppState = 'record' | 'visualizing' | 'sharing'

interface PitchData {
  pitchSequence: number[]
  volumeSequence: number[]
}

interface AppStore {
  appState: AppState
  recordingId: string | null
  pitchData: PitchData | null
  particlesEnabled: boolean
  trailsEnabled: boolean
  setAppState: (state: AppState) => void
  setRecordingId: (id: string | null) => void
  setPitchData: (data: PitchData | null) => void
  toggleParticles: () => void
  toggleTrails: () => void
  reset: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  appState: 'record',
  recordingId: null,
  pitchData: null,
  particlesEnabled: true,
  trailsEnabled: false,
  setAppState: (state) => set({ appState: state }),
  setRecordingId: (id) => set({ recordingId: id }),
  setPitchData: (data) => set({ pitchData: data }),
  toggleParticles: () => set((state) => ({ particlesEnabled: !state.particlesEnabled })),
  toggleTrails: () => set((state) => ({ trailsEnabled: !state.trailsEnabled })),
  reset: () => set({
    appState: 'record',
    recordingId: null,
    pitchData: null,
    particlesEnabled: true,
    trailsEnabled: false
  })
}))
