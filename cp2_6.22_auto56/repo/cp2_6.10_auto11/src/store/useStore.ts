import { create } from 'zustand'

type GearRatio = 3 | 5 | 8 | 10

interface StoreState {
  gateOpening: number
  bladeAngle: number
  gearRatio: GearRatio
  setGateOpening: (value: number) => void
  setBladeAngle: (value: number) => void
  setGearRatio: (value: GearRatio) => void
}

export const useStore = create<StoreState>((set) => ({
  gateOpening: 50,
  bladeAngle: 15,
  gearRatio: 5,
  setGateOpening: (value: number) => set({ gateOpening: Math.max(0, Math.min(100, value)) }),
  setBladeAngle: (value: number) => set({ bladeAngle: Math.max(5, Math.min(45, value)) }),
  setGearRatio: (value: GearRatio) => set({ gearRatio: value })
}))
