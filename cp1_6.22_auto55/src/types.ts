export interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface Bond {
  id: string;
  atom1: string;
  atom2: string;
  type: 'single' | 'double' | 'triple' | 'aromatic';
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  molecularWeight: number;
  atoms: Atom[];
  bonds: Bond[];
}

export interface ReactionResult {
  product: Molecule;
  reactant1Id: string;
  reactant2Id: string;
  atomMapping: Record<string, string>;
}

export const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#000000',
  O: '#FF0D0D',
  N: '#3050F8',
  S: '#FFFF30',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
  P: '#FF8000',
  F: '#90E050',
  B: '#FFB5B5',
  Li: '#CC80FF',
  Na: '#AB5CF2',
  K: '#8F40D4',
  Mg: '#8AFF00',
  Ca: '#3DFF00',
  Fe: '#E06633',
  Cu: '#C88033',
  Zn: '#7D80B0',
};

export const ATOM_RADIUS: Record<string, number> = {
  H: 0.25,
  C: 0.4,
  O: 0.35,
  N: 0.35,
  S: 0.45,
  Cl: 0.4,
  Br: 0.45,
  I: 0.5,
  P: 0.4,
  F: 0.35,
  default: 0.4,
};
