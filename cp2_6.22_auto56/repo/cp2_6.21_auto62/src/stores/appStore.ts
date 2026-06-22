import { create } from 'zustand';
import type { AtomInfo, DisplayMode, Measurement } from '../types';

interface AppState {
  currentMolecule: string;
  selectedAtom: AtomInfo | null;
  displayMode: DisplayMode;
  measurements: Measurement[];
  isMeasuring: boolean;
  measureFirstAtom: AtomInfo | null;
  setMolecule: (molecule: string) => void;
  setSelectedAtom: (atom: AtomInfo | null) => void;
  toggleDisplayMode: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  addMeasurement: (measurement: Measurement) => void;
  clearMeasurements: () => void;
  setIsMeasuring: (measuring: boolean) => void;
  setMeasureFirstAtom: (atom: AtomInfo | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentMolecule: 'H2O',
  selectedAtom: null,
  displayMode: 'ball-stick',
  measurements: [],
  isMeasuring: false,
  measureFirstAtom: null,
  setMolecule: (molecule) =>
    set({ currentMolecule: molecule, selectedAtom: null, measureFirstAtom: null }),
  setSelectedAtom: (atom) => set({ selectedAtom: atom }),
  toggleDisplayMode: () =>
    set((state) => ({
      displayMode: state.displayMode === 'ball-stick' ? 'space-filling' : 'ball-stick',
    })),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  addMeasurement: (measurement) =>
    set((state) => ({ measurements: [...state.measurements, measurement] })),
  clearMeasurements: () => set({ measurements: [] }),
  setIsMeasuring: (measuring) =>
    set({ isMeasuring: measuring, measureFirstAtom: null }),
  setMeasureFirstAtom: (atom) => set({ measureFirstAtom: atom }),
}));
