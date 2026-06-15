import { create } from 'zustand'

export interface Atom {
  id: number
  element: string
  x: number
  y: number
  z: number
  charge: number
}

export interface Bond {
  id: number
  atom1Id: number
  atom2Id: number
  type: 'single' | 'double' | 'triple'
}

export interface MoleculeData {
  atoms: Atom[]
  bonds: Bond[]
  formula: string
  molecularWeight: number
  totalCharge: number
}

export type DisplayMode = 'ball-stick' | 'wireframe' | 'space-filling'
export type MeasureMode = 'none' | 'distance' | 'angle' | 'dihedral'
export type BackgroundTheme = 'dark' | 'light' | 'custom'

export interface Measurement {
  type: MeasureMode
  atomIds: number[]
  value: number
  label: string
}

interface MoleculeStore {
  moleculeData: MoleculeData | null
  displayMode: DisplayMode
  measureMode: MeasureMode
  selectedAtomIds: number[]
  measurements: Measurement[]
  highlightedAtomId: number | null
  highlightedBondId: number | null
  backgroundTheme: BackgroundTheme
  customBgColor: string
  showLabels: boolean
  isParsing: boolean
  parsingError: string | null

  setMoleculeData: (data: MoleculeData | null) => void
  setDisplayMode: (mode: DisplayMode) => void
  setMeasureMode: (mode: MeasureMode) => void
  addSelectedAtom: (atomId: number) => void
  clearSelection: () => void
  addMeasurement: (measurement: Measurement) => void
  removeMeasurement: (index: number) => void
  clearMeasurements: () => void
  setHighlightedAtom: (id: number | null) => void
  setHighlightedBond: (id: number | null) => void
  setBackgroundTheme: (theme: BackgroundTheme) => void
  setCustomBgColor: (color: string) => void
  setShowLabels: (show: boolean) => void
  setIsParsing: (parsing: boolean) => void
  setParsingError: (error: string | null) => void
}

export const useMoleculeStore = create<MoleculeStore>((set) => ({
  moleculeData: null,
  displayMode: 'ball-stick',
  measureMode: 'none',
  selectedAtomIds: [],
  measurements: [],
  highlightedAtomId: null,
  highlightedBondId: null,
  backgroundTheme: 'dark',
  customBgColor: '#1a1a2e',
  showLabels: false,
  isParsing: false,
  parsingError: null,

  setMoleculeData: (data) => set({ moleculeData: data }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setMeasureMode: (mode) => set({ measureMode: mode, selectedAtomIds: [] }),
  addSelectedAtom: (atomId) =>
    set((state) => {
      const maxAtoms =
        state.measureMode === 'distance' ? 2 :
        state.measureMode === 'angle' ? 3 :
        state.measureMode === 'dihedral' ? 4 : 0
      if (maxAtoms === 0) return state
      const newIds = [...state.selectedAtomIds, atomId]
      if (newIds.length >= maxAtoms) {
        return { selectedAtomIds: newIds }
      }
      return { selectedAtomIds: newIds }
    }),
  clearSelection: () => set({ selectedAtomIds: [] }),
  addMeasurement: (measurement) =>
    set((state) => ({ measurements: [...state.measurements, measurement], selectedAtomIds: [] })),
  removeMeasurement: (index) =>
    set((state) => ({
      measurements: state.measurements.filter((_, i) => i !== index),
    })),
  clearMeasurements: () => set({ measurements: [], selectedAtomIds: [] }),
  setHighlightedAtom: (id) => set({ highlightedAtomId: id }),
  setHighlightedBond: (id) => set({ highlightedBondId: id }),
  setBackgroundTheme: (theme) => set({ backgroundTheme: theme }),
  setCustomBgColor: (color) => set({ customBgColor: color }),
  setShowLabels: (show) => set({ showLabels: show }),
  setIsParsing: (parsing) => set({ isParsing: parsing }),
  setParsingError: (error) => set({ parsingError: error }),
}))

export const ELEMENT_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  S: '#FFFF30',
  P: '#FF8000',
  F: '#90E050',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
  Fe: '#E06633',
  Ca: '#3DFF00',
  Na: '#AB5CF2',
  K: '#8F40D4',
  Mg: '#8AFF00',
  Zn: '#7D80B0',
  Cu: '#C88033',
  Li: '#CC80FF',
  Si: '#F0C8A0',
  Se: '#FFA100',
}

export function getElementColor(element: string): string {
  return ELEMENT_COLORS[element] || '#FF1493'
}

export const ELEMENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.77,
  N: 0.75,
  O: 0.73,
  S: 1.02,
  P: 1.06,
  F: 0.64,
  Cl: 0.99,
  Br: 1.14,
  I: 1.33,
  Fe: 1.26,
  Ca: 1.74,
  Na: 1.54,
  K: 2.03,
  Mg: 1.30,
  Zn: 1.22,
  Cu: 1.18,
  Si: 1.11,
  Se: 1.16,
}

export function getElementRadius(element: string): number {
  return ELEMENT_RADII[element] || 1.0
}

export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, C: 12.011, N: 14.007, O: 15.999, S: 32.06,
  P: 30.974, F: 18.998, Cl: 35.45, Br: 79.904, I: 126.904,
  Fe: 55.845, Ca: 40.078, Na: 22.990, K: 39.098, Mg: 24.305,
  Zn: 65.38, Cu: 63.546, Li: 6.941, Si: 28.086, Se: 78.96,
}

export function getAtomicWeight(element: string): number {
  return ATOMIC_WEIGHTS[element] || 0
}
