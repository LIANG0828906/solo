import { create } from 'zustand'

export type ColorMapName = 'rainbow' | 'heatmap' | 'blueCyan' | 'redGreen' | 'grayscale'

export interface FieldDataPoint {
  x: number
  y: number
  u: number
  v: number
}

interface SimState {
  fieldData: FieldDataPoint[] | null
  colorMap: ColorMapName
  density: number
  timeStep: number
  arrowScale: number
  isRunning: boolean
  panelOpen: boolean
  screenshotTrigger: number
  recordingTrigger: number
  isRecording: boolean
}

interface SimActions {
  setFieldData: (data: FieldDataPoint[] | null) => void
  setParam: <K extends keyof SimState>(key: K, value: SimState[K]) => void
  start: () => void
  pause: () => void
  reset: () => void
  togglePanel: () => void
  triggerScreenshot: () => void
  toggleRecording: () => void
  stopRecording: () => void
}

export const useStore = create<SimState & SimActions>((set) => ({
  fieldData: null,
  colorMap: 'rainbow',
  density: 0.5,
  timeStep: 0.03,
  arrowScale: 1.0,
  isRunning: false,
  panelOpen: true,
  screenshotTrigger: 0,
  recordingTrigger: 0,
  isRecording: false,

  setFieldData: (data) => set({ fieldData: data }),
  setParam: (key, value) => set({ [key]: value } as Partial<SimState>),
  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  reset: () => set({ isRunning: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  triggerScreenshot: () => set((s) => ({ screenshotTrigger: s.screenshotTrigger + 1 })),
  toggleRecording: () =>
    set((s) => ({
      isRecording: !s.isRecording,
      recordingTrigger: s.isRecording ? s.recordingTrigger : s.recordingTrigger + 1,
    })),
  stopRecording: () => set({ isRecording: false }),
}))
