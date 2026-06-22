import { create } from 'zustand'
import { defaultParams, type SurfaceParams } from '@/utils/surfaceGeometry'

interface CameraState {
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
}

interface StoreState {
  params: SurfaceParams
  isPlaying: boolean
  initialCamera: CameraState
  resetTrigger: number
  screenshotTrigger: number
  fps: number

  updateParam: (key: keyof SurfaceParams, value: number) => void
  toggleAnimation: () => void
  setPlaying: (playing: boolean) => void
  triggerReset: () => void
  triggerScreenshot: () => void
  setFps: (fps: number) => void
}

export const useStore = create<StoreState>((set) => ({
  params: { ...defaultParams },
  isPlaying: false,
  initialCamera: {
    position: { x: 5, y: 5, z: 5 },
    target: { x: 0, y: 0, z: 0 },
  },
  resetTrigger: 0,
  screenshotTrigger: 0,
  fps: 60,

  updateParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value },
    })),

  toggleAnimation: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
    })),

  setPlaying: (playing) =>
    set(() => ({
      isPlaying: playing,
    })),

  triggerReset: () =>
    set((state) => ({
      resetTrigger: state.resetTrigger + 1,
    })),

  triggerScreenshot: () =>
    set((state) => ({
      screenshotTrigger: state.screenshotTrigger + 1,
    })),

  setFps: (fps) =>
    set(() => ({
      fps,
    })),
}))
