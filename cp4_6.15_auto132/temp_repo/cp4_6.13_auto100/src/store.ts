import { create } from 'zustand'

export type Theme = 'dawn' | 'deepSea' | 'aurora'
export type Speed = 'slow' | 'medium' | 'fast'
export type BackgroundMode = 'dark' | 'black'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
}

export const themeColors: Record<Theme, ThemeColors> = {
  dawn: {
    primary: '#ff6b35',
    secondary: '#f7c59f',
    accent: '#ffd166'
  },
  deepSea: {
    primary: '#4a90d9',
    secondary: '#9b59b6',
    accent: '#3498db'
  },
  aurora: {
    primary: '#00d4aa',
    secondary: '#00a8e8',
    accent: '#2ecc71'
  }
}

interface ParticleClockState {
  theme: Theme
  targetTime: { hours: number; minutes: number; seconds: number }
  isRealTime: boolean
  density: number
  speed: Speed
  background: BackgroundMode
  isTimePickerOpen: boolean
  isSettingsOpen: boolean
  morphTrigger: number
  setTheme: (theme: Theme) => void
  setTargetTime: (time: { hours: number; minutes: number }) => void
  setDensity: (density: number) => void
  setSpeed: (speed: Speed) => void
  setBackground: (background: BackgroundMode) => void
  toggleTimePicker: () => void
  toggleSettings: () => void
  setSeconds: (seconds: number) => void
  triggerMorph: () => void
}

const getCurrentTime = () => {
  const now = new Date()
  return {
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds()
  }
}

export const useStore = create<ParticleClockState>((set) => ({
  theme: 'aurora',
  targetTime: getCurrentTime(),
  isRealTime: true,
  density: 200,
  speed: 'medium',
  background: 'black',
  isTimePickerOpen: false,
  isSettingsOpen: false,
  morphTrigger: 0,

  setTheme: (theme) => set({ theme }),
  setTargetTime: (time) => set({ 
    targetTime: { ...time, seconds: 0 },
    isRealTime: false
  }),
  setDensity: (density) => set({ density }),
  setSpeed: (speed) => set({ speed }),
  setBackground: (background) => set({ background }),
  toggleTimePicker: () => set((state) => ({ isTimePickerOpen: !state.isTimePickerOpen })),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSeconds: (seconds) => set((state) => ({
    targetTime: { ...state.targetTime, seconds }
  })),
  triggerMorph: () => set((state) => ({ morphTrigger: state.morphTrigger + 1 }))
}))
