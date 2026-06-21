import type { MoleculeData } from '../types';

export const H2O: MoleculeData = {
  name: 'H₂O',
  atoms: [
    { symbol: 'O', name: 'Oxygen', atomicNumber: 8, position: [0, 0, 0], color: '#ff4444', radius: 0.6 },
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, position: [0.76, 0.59, 0], color: '#ffffff', radius: 0.3 },
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, position: [-0.76, 0.59, 0], color: '#ffffff', radius: 0.3 },
  ],
  bonds: [
    { atom1: 0, atom2: 1, order: 1 },
    { atom1: 0, atom2: 2, order: 1 },
  ],
};

export const CO2: MoleculeData = {
  name: 'CO₂',
  atoms: [
    { symbol: 'C', name: 'Carbon', atomicNumber: 6, position: [0, 0, 0], color: '#888888', radius: 0.5 },
    { symbol: 'O', name: 'Oxygen', atomicNumber: 8, position: [1.16, 0, 0], color: '#ff4444', radius: 0.6 },
    { symbol: 'O', name: 'Oxygen', atomicNumber: 8, position: [-1.16, 0, 0], color: '#ff4444', radius: 0.6 },
  ],
  bonds: [
    { atom1: 0, atom2: 1, order: 2 },
    { atom1: 0, atom2: 2, order: 2 },
  ],
};

export const CH4: MoleculeData = {
  name: 'CH₄',
  atoms: [
    { symbol: 'C', name: 'Carbon', atomicNumber: 6, position: [0, 0, 0], color: '#888888', radius: 0.5 },
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, position: [0.63, 0.63, 0.63], color: '#ffffff', radius: 0.3 },
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, position: [-0.63, -0.63, 0.63], color: '#ffffff', radius: 0.3 },
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, position: [-0.63, 0.63, -0.63], color: '#ffffff', radius: 0.3 },
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, position: [0.63, -0.63, -0.63], color: '#ffffff', radius: 0.3 },
  ],
  bonds: [
    { atom1: 0, atom2: 1, order: 1 },
    { atom1: 0, atom2: 2, order: 1 },
    { atom1: 0, atom2: 3, order: 1 },
    { atom1: 0, atom2: 4, order: 1 },
  ],
};

const benzeneCAngle = Math.PI / 3;
const cRadius = 1.4;
const hRadius = 2.48;
const cPositions: [number, number, number][] = [];
const hPositions: [number, number, number][] = [];

for (let i = 0; i < 6; i++) {
  const angle = benzeneCAngle * i - Math.PI / 6;
  cPositions.push([cRadius * Math.cos(angle), cRadius * Math.sin(angle), 0]);
  hPositions.push([hRadius * Math.cos(angle), hRadius * Math.sin(angle), 0]);
}

export const C6H6: MoleculeData = {
  name: 'C₆H₆',
  atoms: [
    ...cPositions.map((pos, i) => ({
      symbol: 'C' as const,
      name: 'Carbon' as const,
      atomicNumber: 6,
      position: pos,
      color: '#888888',
      radius: 0.5,
    })),
    ...hPositions.map((pos) => ({
      symbol: 'H' as const,
      name: 'Hydrogen' as const,
      atomicNumber: 1,
      position: pos,
      color: '#ffffff',
      radius: 0.3,
    })),
  ],
  bonds: [
    { atom1: 0, atom2: 1, order: 2 },
    { atom1: 1, atom2: 2, order: 1 },
    { atom1: 2, atom2: 3, order: 2 },
    { atom1: 3, atom2: 4, order: 1 },
    { atom1: 4, atom2: 5, order: 2 },
    { atom1: 5, atom2: 0, order: 1 },
    { atom1: 0, atom2: 6, order: 1 },
    { atom1: 1, atom2: 7, order: 1 },
    { atom1: 2, atom2: 8, order: 1 },
    { atom1: 3, atom2: 9, order: 1 },
    { atom1: 4, atom2: 10, order: 1 },
    { atom1: 5, atom2: 11, order: 1 },
  ],
};

export const moleculeMap: Record<string, MoleculeData> = {
  H2O,
  CO2,
  CH4,
  C6H6,
};

export const moleculeKeys = Object.keys(moleculeMap);
