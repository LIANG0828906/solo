import { MoleculeData } from '../types';

export const ELEMENT_CONFIG: Record<string, { color: string; radius: number; name: string }> = {
  H: { color: '#FFFFFF', radius: 0.3, name: '氢' },
  C: { color: '#555555', radius: 0.5, name: '碳' },
  O: { color: '#FF3333', radius: 0.6, name: '氧' },
  N: { color: '#3050F8', radius: 0.55, name: '氮' },
};

export const MOLECULES: MoleculeData[] = [
  {
    id: 'h2o',
    name: '水',
    formula: 'H₂O',
    atoms: [
      { element: 'O', position: [0, 0, 0] },
      { element: 'H', position: [0.957, 0, 0] },
      { element: 'H', position: [-0.239, 0.926, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: 'single' },
      { from: 0, to: 2, type: 'single' },
    ],
  },
  {
    id: 'co2',
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [1.16, 0, 0] },
      { element: 'O', position: [-1.16, 0, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: 'double' },
      { from: 0, to: 2, type: 'double' },
    ],
  },
  {
    id: 'ch4',
    name: '甲烷',
    formula: 'CH₄',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'H', position: [1.087, 0, 0] },
      { element: 'H', position: [-0.362, 0.993, 0.357] },
      { element: 'H', position: [-0.362, -0.296, -1.017] },
      { element: 'H', position: [-0.362, -0.697, 0.66] },
    ],
    bonds: [
      { from: 0, to: 1, type: 'single' },
      { from: 0, to: 2, type: 'single' },
      { from: 0, to: 3, type: 'single' },
      { from: 0, to: 4, type: 'single' },
    ],
  },
  {
    id: 'c6h6',
    name: '苯',
    formula: 'C₆H₆',
    atoms: [
      { element: 'C', position: [1.39, 0, 0] },
      { element: 'C', position: [0.695, 1.204, 0] },
      { element: 'C', position: [-0.695, 1.204, 0] },
      { element: 'C', position: [-1.39, 0, 0] },
      { element: 'C', position: [-0.695, -1.204, 0] },
      { element: 'C', position: [0.695, -1.204, 0] },
      { element: 'H', position: [2.47, 0, 0] },
      { element: 'H', position: [1.235, 2.139, 0] },
      { element: 'H', position: [-1.235, 2.139, 0] },
      { element: 'H', position: [-2.47, 0, 0] },
      { element: 'H', position: [-1.235, -2.139, 0] },
      { element: 'H', position: [1.235, -2.139, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: 'double' },
      { from: 1, to: 2, type: 'single' },
      { from: 2, to: 3, type: 'double' },
      { from: 3, to: 4, type: 'single' },
      { from: 4, to: 5, type: 'double' },
      { from: 5, to: 0, type: 'single' },
      { from: 0, to: 6, type: 'single' },
      { from: 1, to: 7, type: 'single' },
      { from: 2, to: 8, type: 'single' },
      { from: 3, to: 9, type: 'single' },
      { from: 4, to: 10, type: 'single' },
      { from: 5, to: 11, type: 'single' },
    ],
  },
];
