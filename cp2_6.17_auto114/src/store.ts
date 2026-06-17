import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type CrystalType = 'NaCl' | 'CsCl' | 'ZnS';

export interface AtomData {
  id: string;
  position: [number, number, number];
  color: string;
  radius: number;
  element: string;
}

export interface BondData {
  id: string;
  atomA: string;
  atomB: string;
  positionA: [number, number, number];
  positionB: [number, number, number];
}

export interface SelectedAtom {
  id: string;
  position: [number, number, number];
  screenPosition?: { x: number; y: number };
}

export interface BondMeasurement {
  id: string;
  atom1: SelectedAtom;
  atom2: SelectedAtom;
  length: number;
}

export interface AngleMeasurement {
  id: string;
  atom1: SelectedAtom;
  atom2: SelectedAtom;
  atom3: SelectedAtom;
  angle: number;
}

interface CrystalStore {
  crystalType: CrystalType;
  latticeConstant: number;
  atomScale: number;
  rotationSpeed: number;
  cellOpacity: number;
  isExploded: boolean;
  isTransitioning: boolean;
  loadingStructure: CrystalType | null;

  atoms: AtomData[];
  bonds: BondData[];

  selectedAtoms: SelectedAtom[];
  bondMeasurements: BondMeasurement[];
  angleMeasurements: AngleMeasurement[];

  panelExpanded: boolean;

  setCrystalType: (type: CrystalType) => void;
  setLatticeConstant: (value: number) => void;
  setAtomScale: (value: number) => void;
  setRotationSpeed: (value: number) => void;
  setCellOpacity: (value: number) => void;
  toggleExploded: () => void;
  setIsTransitioning: (value: boolean) => void;
  setLoadingStructure: (value: CrystalType | null) => void;

  setAtoms: (atoms: AtomData[]) => void;
  setBonds: (bonds: BondData[]) => void;

  selectAtom: (atom: AtomData, screenPos?: { x: number; y: number }) => void;
  clearMeasurements: () => void;
  updateAtomScreenPosition: (atomId: string, screenPos: { x: number; y: number }) => void;

  togglePanel: () => void;
  setPanelExpanded: (expanded: boolean) => void;
}

export const useCrystalStore = create<CrystalStore>((set, get) => ({
  crystalType: 'NaCl',
  latticeConstant: 3.0,
  atomScale: 1.0,
  rotationSpeed: 20,
  cellOpacity: 1.0,
  isExploded: false,
  isTransitioning: false,
  loadingStructure: null,

  atoms: [],
  bonds: [],

  selectedAtoms: [],
  bondMeasurements: [],
  angleMeasurements: [],

  panelExpanded: false,

  setCrystalType: (type: CrystalType) => {
    set({ crystalType: type, selectedAtoms: [], bondMeasurements: [], angleMeasurements: [] });
  },

  setLatticeConstant: (value: number) => set({ latticeConstant: value }),
  setAtomScale: (value: number) => set({ atomScale: value }),
  setRotationSpeed: (value: number) => set({ rotationSpeed: value }),
  setCellOpacity: (value: number) => set({ cellOpacity: value }),

  toggleExploded: () => set((state) => ({ isExploded: !state.isExploded })),
  setIsTransitioning: (value: boolean) => set({ isTransitioning: value }),
  setLoadingStructure: (value: CrystalType | null) => set({ loadingStructure: value }),

  setAtoms: (atoms: AtomData[]) => set({ atoms }),
  setBonds: (bonds: BondData[]) => set({ bonds }),

  selectAtom: (atom: AtomData, screenPos?: { x: number; y: number }) => {
    const state = get();
    const selected = [...state.selectedAtoms];

    const existingIndex = selected.findIndex((a) => a.id === atom.id);

    if (existingIndex >= 0) {
      selected.splice(existingIndex, 1);
    } else {
      if (selected.length >= 3) {
        selected.shift();
      }
      selected.push({
        id: atom.id,
        position: atom.position,
        screenPosition: screenPos,
      });
    }

    const newBondMeasurements: BondMeasurement[] = [];
    const newAngleMeasurements: AngleMeasurement[] = [];

    if (selected.length >= 2) {
      const a1 = selected[0];
      const a2 = selected[1];
      const dx = a2.position[0] - a1.position[0];
      const dy = a2.position[1] - a1.position[1];
      const dz = a2.position[2] - a1.position[2];
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

      newBondMeasurements.push({
        id: uuidv4(),
        atom1: a1,
        atom2: a2,
        length: length,
      });
    }

    if (selected.length === 3) {
      const a1 = selected[0];
      const a2 = selected[1];
      const a3 = selected[2];

      const v1x = a1.position[0] - a2.position[0];
      const v1y = a1.position[1] - a2.position[1];
      const v1z = a1.position[2] - a2.position[2];

      const v2x = a3.position[0] - a2.position[0];
      const v2y = a3.position[1] - a2.position[1];
      const v2z = a3.position[2] - a2.position[2];

      const dot = v1x * v2x + v1y * v2y + v1z * v2z;
      const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
      const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

      let cosAngle = dot / (mag1 * mag2);
      cosAngle = Math.max(-1, Math.min(1, cosAngle));
      const angle = (Math.acos(cosAngle) * 180) / Math.PI;

      newAngleMeasurements.push({
        id: uuidv4(),
        atom1: a1,
        atom2: a2,
        atom3: a3,
        angle: parseFloat(angle.toFixed(1)),
      });
    }

    set({
      selectedAtoms: selected,
      bondMeasurements: newBondMeasurements,
      angleMeasurements: newAngleMeasurements,
    });
  },

  clearMeasurements: () => {
    set({
      selectedAtoms: [],
      bondMeasurements: [],
      angleMeasurements: [],
    });
  },

  updateAtomScreenPosition: (atomId: string, screenPos: { x: number; y: number }) => {
    set((state) => {
      const newSelected = state.selectedAtoms.map((a) =>
        a.id === atomId ? { ...a, screenPosition: screenPos } : a
      );

      const newBondMeasurements = state.bondMeasurements.map((m) => ({
        ...m,
        atom1: m.atom1.id === atomId ? { ...m.atom1, screenPosition: screenPos } : m.atom1,
        atom2: m.atom2.id === atomId ? { ...m.atom2, screenPosition: screenPos } : m.atom2,
      }));

      const newAngleMeasurements = state.angleMeasurements.map((m) => ({
        ...m,
        atom1: m.atom1.id === atomId ? { ...m.atom1, screenPosition: screenPos } : m.atom1,
        atom2: m.atom2.id === atomId ? { ...m.atom2, screenPosition: screenPos } : m.atom2,
        atom3: m.atom3.id === atomId ? { ...m.atom3, screenPosition: screenPos } : m.atom3,
      }));

      return {
        selectedAtoms: newSelected,
        bondMeasurements: newBondMeasurements,
        angleMeasurements: newAngleMeasurements,
      };
    });
  },

  togglePanel: () => set((state) => ({ panelExpanded: !state.panelExpanded })),
  setPanelExpanded: (expanded: boolean) => set({ panelExpanded: expanded }),
}));
