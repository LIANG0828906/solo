export interface AtomType {
  name: string;
  color: number;
  radius: number;
}

export interface Atom {
  type: string;
  position: [number, number, number];
}

export interface Bond {
  from: number;
  to: number;
}

export interface MoleculeData {
  atoms: Atom[];
  bonds: Bond[];
}

export const atomTypes: Record<string, AtomType> = {
  H: { name: 'hydrogen', color: 0xffffff, radius: 0.3 },
  C: { name: 'carbon', color: 0x808080, radius: 0.5 },
  O: { name: 'oxygen', color: 0xff0000, radius: 0.6 }
};

const water: MoleculeData = {
  atoms: [
    { type: 'O', position: [0, 0, 0] },
    { type: 'H', position: [0.96, 0, 0] },
    { type: 'H', position: [-0.24, 0.93, 0] }
  ],
  bonds: [
    { from: 0, to: 1 },
    { from: 0, to: 2 }
  ]
};

const methane: MoleculeData = {
  atoms: [
    { type: 'C', position: [0, 0, 0] },
    { type: 'H', position: [1.09, 0, 0] },
    { type: 'H', position: [-0.36, 0.72, 0.72] },
    { type: 'H', position: [-0.36, -0.72, 0.72] },
    { type: 'H', position: [-0.36, 0, -1.02] }
  ],
  bonds: [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 0, to: 3 },
    { from: 0, to: 4 }
  ]
};

const glucose: MoleculeData = {
  atoms: [
    { type: 'O', position: [0, 1.4, 0] },
    { type: 'C', position: [0, 0, 0] },
    { type: 'C', position: [1.3, -0.4, 0.3] },
    { type: 'C', position: [1.6, -1.4, 1.4] },
    { type: 'C', position: [0.5, -2.2, 1.9] },
    { type: 'C', position: [-0.8, -1.8, 1.6] },
    { type: 'C', position: [-1.2, -0.8, 0.5] },
    { type: 'O', position: [-1.5, 0.2, 0.8] },
    { type: 'O', position: [2.3, 0.3, 0.6] },
    { type: 'O', position: [2.8, -1.8, 1.6] },
    { type: 'O', position: [0.8, -3.2, 2.7] },
    { type: 'O', position: [-1.8, -2.5, 2.0] },
    { type: 'H', position: [0.5, 1.8, 0.3] },
    { type: 'H', position: [-0.5, 0.3, -0.9] },
    { type: 'H', position: [1.3, 0.2, -0.7] },
    { type: 'H', position: [2.7, 0.7, 0.2] },
    { type: 'H', position: [1.7, -0.9, 2.4] },
    { type: 'H', position: [3.2, -2.2, 1.2] },
    { type: 'H', position: [0.4, -1.7, 2.9] },
    { type: 'H', position: [1.2, -3.8, 3.2] },
    { type: 'H', position: [-1.5, -1.3, 2.5] },
    { type: 'H', position: [-2.2, -2.9, 2.3] },
    { type: 'H', position: [-2.0, 0.5, 0.3] },
    { type: 'H', position: [-1.0, -1.3, -0.5] }
  ],
  bonds: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 1 },
    { from: 6, to: 7 },
    { from: 2, to: 8 },
    { from: 3, to: 9 },
    { from: 4, to: 10 },
    { from: 5, to: 11 },
    { from: 0, to: 12 },
    { from: 1, to: 13 },
    { from: 2, to: 14 },
    { from: 8, to: 15 },
    { from: 3, to: 16 },
    { from: 9, to: 17 },
    { from: 4, to: 18 },
    { from: 10, to: 19 },
    { from: 5, to: 20 },
    { from: 11, to: 21 },
    { from: 7, to: 22 },
    { from: 6, to: 23 }
  ]
};

const molecules: Record<string, MoleculeData> = {
  water,
  methane,
  glucose
};

export function getMoleculeData(name: string): MoleculeData {
  return molecules[name] || water;
}

export function getMoleculeNames(): string[] {
  return Object.keys(molecules);
}
