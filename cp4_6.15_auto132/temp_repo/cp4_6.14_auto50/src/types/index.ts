export interface Atom {
  id: string;
  name: string;
  element: 'C' | 'O' | 'H' | 'N' | string;
  position: [number, number, number];
}

export interface Bond {
  id: string;
  from: string;
  to: string;
  order: number;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface ComparisonResult {
  rmsd: number;
  similarity: number;
  matchedPairs: Array<{ atomA: string; atomB: string }>;
  unmatchedA: string[];
  unmatchedB: string[];
  matchedCount: number;
  totalAtomsA: number;
  totalAtomsB: number;
}

export interface CPKColor {
  [element: string]: string;
}

export interface VdwRadius {
  [element: string]: number;
}

export const CPK_COLORS: CPKColor = {
  C: '#909090',
  O: '#FF0D0D',
  H: '#FFFFFF',
  N: '#3050F8',
  S: '#FFFF30',
  P: '#FF8000',
  Cl: '#1FF01F',
  F: '#90E050',
  Br: '#A62929',
  I: '#940094',
};

export const VDW_RADII: VdwRadius = {
  C: 0.7,
  O: 0.6,
  H: 0.3,
  N: 0.65,
  S: 1.0,
  P: 1.0,
  Cl: 0.95,
  F: 0.5,
  Br: 1.15,
  I: 1.35,
};

export const BOND_RADIUS = 0.15;
export const BOND_COLOR = '#C0C0C0';
