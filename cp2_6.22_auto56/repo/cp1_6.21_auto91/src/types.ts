export interface Atom {
  id: number;
  name: string;
  element: string;
  x: number;
  y: number;
  z: number;
  residueName?: string;
  residueNumber?: number;
  chainId?: string;
  vdwRadius: number;
}

export interface Bond {
  id: number;
  atom1Index: number;
  atom2Index: number;
  bondOrder?: number;
}

export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
  name: string;
}

export interface LigandPosition {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

export interface ScoreResult {
  vdwConflicts: number;
  vdwEnergy: number;
  electrostaticEnergy: number;
  solvationEnergy: number;
  totalBindingEnergy: number;
  conflictAtomPairs: Array<{
    proteinAtomIndex: number;
    ligandAtomIndex: number;
    distance: number;
  }>;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  ligandPosition: LigandPosition;
  score: ScoreResult;
  thumbnail?: string;
}

export interface DockingState {
  protein: Molecule | null;
  ligand: Molecule | null;
  ligandPosition: LigandPosition;
  score: ScoreResult | null;
  snapshots: Snapshot[];
  isMinimizing: boolean;
  minimizationProgress: number;
}

export const VDW_RADII: Record<string, number> = {
  H: 1.2,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  S: 1.8,
  P: 1.8,
  F: 1.47,
  Cl: 1.75,
  Br: 1.85,
  I: 1.98,
};

export const ATOM_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#808080',
  N: '#0000FF',
  O: '#FF0000',
  S: '#FFFF00',
  P: '#FFA500',
  F: '#00FFFF',
  Cl: '#00FF00',
  Br: '#8B4513',
  I: '#9400D3',
};
