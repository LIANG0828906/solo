export interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
}

export interface Bond {
  id: string;
  atom1Id: string;
  atom2Id: string;
  order: number;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface VibrationMode {
  id: string;
  name: string;
  description: string;
  frequency: number;
}

export interface VibrationFrame {
  time: number;
  displacements: Record<string, { x: number; y: number; z: number }>;
}

export interface MoleculeStoreState {
  currentMolecule: Molecule | null;
  selectedAtoms: string[];
  vibrationMode: VibrationMode | null;
  vibrationAmplitude: number;
  isVibrating: boolean;
  isRecording: boolean;
  isPanelCollapsed: boolean;
  atomInfoCard: { atomId: string; position: { x: number; y: number } } | null;
  setCurrentMolecule: (molecule: Molecule | null) => void;
  setSelectedAtoms: (atoms: string[]) => void;
  addSelectedAtom: (atomId: string) => void;
  removeSelectedAtom: (atomId: string) => void;
  clearSelectedAtoms: () => void;
  setVibrationMode: (mode: VibrationMode | null) => void;
  setVibrationAmplitude: (amplitude: number) => void;
  setIsVibrating: (vibrating: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setIsPanelCollapsed: (collapsed: boolean) => void;
  setAtomInfoCard: (card: { atomId: string; position: { x: number; y: number } } | null) => void;
}

export interface ElementProperties {
  color: string;
  radius: number;
  name: string;
}
