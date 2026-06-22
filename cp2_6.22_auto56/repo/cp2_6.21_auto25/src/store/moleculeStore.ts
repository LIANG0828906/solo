import { create } from 'zustand'

export type EnergyMode = 'thermal' | 'light' | 'none'

interface MoleculeState {
  currentMoleculeId: string
  energyMode: EnergyMode
  temperature: number
  heatmapEnabled: boolean
  lightPosition: [number, number]
  panelCollapsed: boolean
  screenshotTrigger: number

  setCurrentMolecule: (id: string) => void
  setEnergyMode: (mode: EnergyMode) => void
  setTemperature: (temp: number) => void
  setHeatmapEnabled: (enabled: boolean) => void
  setLightPosition: (pos: [number, number]) => void
  setPanelCollapsed: (collapsed: boolean) => void
  triggerScreenshot: () => void
}

export const useMoleculeStore = create<MoleculeState>((set) => ({
  currentMoleculeId: 'methane',
  energyMode: 'none',
  temperature: 1.5,
  heatmapEnabled: false,
  lightPosition: [100, 100],
  panelCollapsed: false,
  screenshotTrigger: 0,

  setCurrentMolecule: (id) => set({ currentMoleculeId: id }),
  setEnergyMode: (mode) => set({ energyMode: mode }),
  setTemperature: (temp) => set({ temperature: temp }),
  setHeatmapEnabled: (enabled) => set({ heatmapEnabled: enabled }),
  setLightPosition: (pos) => set({ lightPosition: pos }),
  setPanelCollapsed: (collapsed) => set({ panelCollapsed: collapsed }),
  triggerScreenshot: () => set((s) => ({ screenshotTrigger: s.screenshotTrigger + 1 })),
}))
