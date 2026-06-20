
import type { ElementType } from './constants';

export interface PresetAtom {
  element: ElementType;
  position: [number, number, number];
}

export interface PresetBond {
  atomA: number;
  atomB: number;
  type: 'single' | 'double' | 'triple';
}

export interface PresetMolecule {
  name: string;
  formula: string;
  atoms: PresetAtom[];
  bonds: PresetBond[];
}

export const PRESET_MOLECULES: Record<string, PresetMolecule> = {
  H2O: {
    name: '水',
    formula: 'H₂O',
    atoms: [
      { element: 'O', position: [0, 0, 0] },
      { element: 'H', position: [0.76, 0.59, 0] },
      { element: 'H', position: [-0.76, 0.59, 0] },
    ],
    bonds: [
      { atomA: 0, atomB: 1, type: 'single' },
      { atomA: 0, atomB: 2, type: 'single' },
    ],
  },
  CO2: {
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [1.16, 0, 0] },
      { element: 'O', position: [-1.16, 0, 0] },
    ],
    bonds: [
      { atomA: 0, atomB: 1, type: 'double' },
      { atomA: 0, atomB: 2, type: 'double' },
    ],
  },
  CH4: {
    name: '甲烷',
    formula: 'CH₄',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'H', position: [0.63, 0.63, 0.63] },
      { element: 'H', position: [-0.63, -0.63, 0.63] },
      { element: 'H', position: [-0.63, 0.63, -0.63] },
      { element: 'H', position: [0.63, -0.63, -0.63] },
    ],
    bonds: [
      { atomA: 0, atomB: 1, type: 'single' },
      { atomA: 0, atomB: 2, type: 'single' },
      { atomA: 0, atomB: 3, type: 'single' },
      { atomA: 0, atomB: 4, type: 'single' },
    ],
  },
  C6H6: {
    name: '苯',
    formula: 'C₆H₆',
    atoms: [
      { element: 'C', position: [1.39, 0, 0] },
      { element: 'C', position: [0.695, 1.204, 0] },
      { element: 'C', position: [-0.695, 1.204, 0] },
      { element: 'C', position: [-1.39, 0, 0] },
      { element: 'C', position: [-0.695, -1.204, 0] },
      { element: 'C', position: [0.695, -1.204, 0] },
      { element: 'H', position: [2.48, 0, 0] },
      { element: 'H', position: [1.24, 2.149, 0] },
      { element: 'H', position: [-1.24, 2.149, 0] },
      { element: 'H', position: [-2.48, 0, 0] },
      { element: 'H', position: [-1.24, -2.149, 0] },
      { element: 'H', position: [1.24, -2.149, 0] },
    ],
    bonds: [
      { atomA: 0, atomB: 1, type: 'double' },
      { atomA: 1, atomB: 2, type: 'single' },
      { atomA: 2, atomB: 3, type: 'double' },
      { atomA: 3, atomB: 4, type: 'single' },
      { atomA: 4, atomB: 5, type: 'double' },
      { atomA: 5, atomB: 0, type: 'single' },
      { atomA: 0, atomB: 6, type: 'single' },
      { atomA: 1, atomB: 7, type: 'single' },
      { atomA: 2, atomB: 8, type: 'single' },
      { atomA: 3, atomB: 9, type: 'single' },
      { atomA: 4, atomB: 10, type: 'single' },
      { atomA: 5, atomB: 11, type: 'single' },
    ],
  },
};
