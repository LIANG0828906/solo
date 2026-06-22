export type ElementType = 'C' | 'O' | 'N' | 'H';

export interface Atom {
  id: string;
  element: ElementType;
  position: [number, number, number];
}

export interface Bond {
  id: string;
  atom1: string;
  atom2: string;
}

export interface Molecule {
  name: string;
  formula: string;
  molecularWeight: number;
  atoms: Atom[];
  bonds: Bond[];
}

export interface ElementVisualProps {
  color: string;
  radius: number;
  nameCN: string;
}

export const ELEMENT_VISUAL: Record<ElementType, ElementVisualProps> = {
  C: { color: '#555555', radius: 0.3, nameCN: '碳' },
  O: { color: '#ff0000', radius: 0.25, nameCN: '氧' },
  N: { color: '#3050f8', radius: 0.28, nameCN: '氮' },
  H: { color: '#ffffff', radius: 0.15, nameCN: '氢' },
};

export const ELEMENT_ATOMIC_WEIGHT: Record<ElementType, number> = {
  C: 12.01,
  O: 16.00,
  N: 14.01,
  H: 1.008,
};

const waterAtoms: Atom[] = [
  { id: 'O1', element: 'O', position: [0, 0, 0] },
  { id: 'H1', element: 'H', position: [0.76, 0.59, 0] },
  { id: 'H2', element: 'H', position: [-0.76, 0.59, 0] },
];

const waterBonds: Bond[] = [
  { id: 'b1', atom1: 'O1', atom2: 'H1' },
  { id: 'b2', atom1: 'O1', atom2: 'H2' },
];

const methaneAtoms: Atom[] = [
  { id: 'C1', element: 'C', position: [0, 0, 0] },
  { id: 'H1', element: 'H', position: [0.63, 0.63, 0.63] },
  { id: 'H2', element: 'H', position: [-0.63, -0.63, 0.63] },
  { id: 'H3', element: 'H', position: [-0.63, 0.63, -0.63] },
  { id: 'H4', element: 'H', position: [0.63, -0.63, -0.63] },
];

const methaneBonds: Bond[] = [
  { id: 'b1', atom1: 'C1', atom2: 'H1' },
  { id: 'b2', atom1: 'C1', atom2: 'H2' },
  { id: 'b3', atom1: 'C1', atom2: 'H3' },
  { id: 'b4', atom1: 'C1', atom2: 'H4' },
];

const caffeineAtoms: Atom[] = [
  { id: 'N1', element: 'N', position: [0.52, -0.50, 0.00] },
  { id: 'C2', element: 'C', position: [-0.73, -0.37, 0.00] },
  { id: 'N3', element: 'N', position: [-1.29, 0.83, 0.00] },
  { id: 'C4', element: 'C', position: [-0.30, 1.83, 0.00] },
  { id: 'C5', element: 'C', position: [1.00, 1.42, 0.00] },
  { id: 'C6', element: 'C', position: [1.45, 0.00, 0.00] },
  { id: 'N7', element: 'N', position: [2.77, -0.20, 0.00] },
  { id: 'C8', element: 'C', position: [3.15, 1.10, 0.00] },
  { id: 'N9', element: 'N', position: [2.10, 2.02, 0.00] },
  { id: 'O10', element: 'O', position: [-1.58, -1.33, 0.00] },
  { id: 'O11', element: 'O', position: [0.26, 3.00, 0.00] },
  { id: 'C12', element: 'C', position: [1.03, -1.83, 0.00] },
  { id: 'C13', element: 'C', position: [-2.60, 1.20, 0.00] },
  { id: 'C14', element: 'C', position: [3.80, 2.30, 0.00] },
  { id: 'H15', element: 'H', position: [1.68, -2.10, 0.87] },
  { id: 'H16', element: 'H', position: [0.02, -2.25, 0.88] },
  { id: 'H17', element: 'H', position: [0.95, -1.95, -1.04] },
  { id: 'H18', element: 'H', position: [-2.76, 1.55, -1.04] },
  { id: 'H19', element: 'H', position: [-3.20, 0.29, 0.00] },
  { id: 'H20', element: 'H', position: [-2.75, 1.98, 0.77] },
  { id: 'H21', element: 'H', position: [3.45, 3.28, 0.00] },
  { id: 'H22', element: 'H', position: [4.50, 2.05, 0.82] },
  { id: 'H23', element: 'H', position: [4.35, 2.35, -0.95] },
  { id: 'H24', element: 'H', position: [3.40, -1.03, 0.00] },
];

const caffeineBonds: Bond[] = [
  { id: 'b1', atom1: 'N1', atom2: 'C2' },
  { id: 'b2', atom1: 'N1', atom2: 'C6' },
  { id: 'b3', atom1: 'N1', atom2: 'C12' },
  { id: 'b4', atom1: 'C2', atom2: 'N3' },
  { id: 'b5', atom1: 'C2', atom2: 'O10' },
  { id: 'b6', atom1: 'N3', atom2: 'C4' },
  { id: 'b7', atom1: 'N3', atom2: 'C13' },
  { id: 'b8', atom1: 'C4', atom2: 'C5' },
  { id: 'b9', atom1: 'C4', atom2: 'O11' },
  { id: 'b10', atom1: 'C5', atom2: 'C6' },
  { id: 'b11', atom1: 'C5', atom2: 'N9' },
  { id: 'b12', atom1: 'C6', atom2: 'N7' },
  { id: 'b13', atom1: 'N7', atom2: 'C8' },
  { id: 'b14', atom1: 'N7', atom2: 'H24' },
  { id: 'b15', atom1: 'C8', atom2: 'N9' },
  { id: 'b16', atom1: 'C8', atom2: 'C14' },
  { id: 'b17', atom1: 'C12', atom2: 'H15' },
  { id: 'b18', atom1: 'C12', atom2: 'H16' },
  { id: 'b19', atom1: 'C12', atom2: 'H17' },
  { id: 'b20', atom1: 'C13', atom2: 'H18' },
  { id: 'b21', atom1: 'C13', atom2: 'H19' },
  { id: 'b22', atom1: 'C13', atom2: 'H20' },
  { id: 'b23', atom1: 'C14', atom2: 'H21' },
  { id: 'b24', atom1: 'C14', atom2: 'H22' },
  { id: 'b25', atom1: 'C14', atom2: 'H23' },
];

export const PRESET_MOLECULES: Record<string, Molecule> = {
  water: {
    name: '水分子',
    formula: 'H₂O',
    molecularWeight: 18.015,
    atoms: waterAtoms,
    bonds: waterBonds,
  },
  methane: {
    name: '甲烷',
    formula: 'CH₄',
    molecularWeight: 16.04,
    atoms: methaneAtoms,
    bonds: methaneBonds,
  },
  caffeine: {
    name: '咖啡因',
    formula: 'C₈H₁₀N₄O₂',
    molecularWeight: 194.19,
    atoms: caffeineAtoms,
    bonds: caffeineBonds,
  },
};
