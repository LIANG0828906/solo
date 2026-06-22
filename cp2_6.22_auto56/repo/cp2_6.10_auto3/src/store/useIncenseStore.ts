import { create } from 'zustand'
import type { IncenseStore, IncenseType, FanLevel } from '@/types'

export const useIncenseStore = create<IncenseStore>((set) => ({
  incenseType: 'chenxiang',
  fan: {
    level: 0,
    angle: 0,
  },
  doorWindow: {
    leftDoor: false,
    backWindow: false,
  },
  particleCount: 0,
  fps: 60,

  setIncenseType: (type: IncenseType) => set({ incenseType: type }),

  setFanLevel: (level: FanLevel) =>
    set((state) => ({
      fan: { ...state.fan, level },
    })),

  setFanAngle: (angle: number) =>
    set((state) => ({
      fan: { ...state.fan, angle: Math.max(-45, Math.min(45, angle)) },
    })),

  toggleLeftDoor: () =>
    set((state) => ({
      doorWindow: { ...state.doorWindow, leftDoor: !state.doorWindow.leftDoor },
    })),

  toggleBackWindow: () =>
    set((state) => ({
      doorWindow: { ...state.doorWindow, backWindow: !state.doorWindow.backWindow },
    })),

  setParticleCount: (count: number) => set({ particleCount: count }),

  setFPS: (fps: number) => set({ fps }),
}))
