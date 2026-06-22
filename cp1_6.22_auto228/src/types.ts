export type ElementType = 'C' | 'O' | 'N' | 'S' | 'H';

export interface AtomType {
  id: number;
  element: ElementType;
  x: number;
  y: number;
  z: number;
  residueName: string;
  residueId: number;
  atomName: string;
}

export interface BondType {
  atom1Id: number;
  atom2Id: number;
  order: number;
}

export interface MoleculeData {
  atoms: AtomType[];
  bonds: BondType[];
}

export interface Selection {
  atomIds: number[];
}

export interface Measurement {
  id: number;
  atom1Id: number;
  atom2Id: number;
  distance: number;
}

export type ModelMode = 'ball-stick' | 'cartoon' | 'wireframe';

export type HistoryActionType = 'selection' | 'clipping' | 'model-switch';

export interface HistoryEntry {
  type: HistoryActionType;
  selection: number[];
  clippingRadius: number;
  modelMode: ModelMode;
}

export interface AppState {
  molecule: MoleculeData | null;
  modelMode: ModelMode;
  selection: number[];
  measurements: Measurement[];
  clippingRadius: number;
  isMeasuring: boolean;
  measureFirstAtom: number | null;
  history: HistoryEntry[];
  historyIndex: number;
}

export const ELEMENT_COLORS: Record<ElementType, number> = {
  C: 0x808080,
  O: 0xff0d0d,
  N: 0x3050f8,
  S: 0xffff30,
  H: 0xffffff,
};

export const ELEMENT_RADII: Record<ElementType, number> = {
  C: 0.3,
  O: 0.3,
  N: 0.3,
  S: 0.3,
  H: 0.2,
};
