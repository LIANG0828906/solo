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
  order: number;
}

export interface MoleculeData {
  name: string;
  atoms: Atom[];
  bonds: Bond[];
}

export type DisplayMode = 'ball-stick' | 'space-filling';

export interface ParsedMolecule {
  atoms: Array<{
    id: string;
    element: string;
    position: [number, number, number];
  }>;
  bonds: Array<{
    id: string;
    atom1Id: string;
    atom2Id: string;
    order: number;
  }>;
}

export interface ElementInfo {
  color: string;
  radius: number;
  vanDerWaalsRadius: number;
  displayName: string;
}
