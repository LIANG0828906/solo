export interface AtomInfo {
  symbol: string;
  name: string;
  atomicNumber: number;
  position: [number, number, number];
  color: string;
  radius: number;
}

export interface BondInfo {
  atom1: number;
  atom2: number;
  order: number;
}

export interface MoleculeData {
  name: string;
  atoms: AtomInfo[];
  bonds: BondInfo[];
}

export interface Measurement {
  atom1: AtomInfo;
  atom2: AtomInfo;
  distance: number;
}

export type DisplayMode = 'ball-stick' | 'space-filling';
