export interface AtomData {
  element: string
  atomicNumber: number
  x: number
  y: number
  z: number
  covalentRadius: number
  vdwRadius: number
  color: string
  hybridization: string
  electronegativity: number
  isotopeMass: number
}

export interface BondData {
  atomIndexA: number
  atomIndexB: number
  order: number
}

export interface MoleculeData {
  id: string
  name: string
  formula: string
  formulaHTML: string
  molecularWeight: number
  atoms: AtomData[]
  bonds: BondData[]
}

const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  S: '#FFFF30',
  P: '#FF8000',
}

const ELEMENT_DATA: Record<string, { atomicNumber: number; covalentRadius: number; vdwRadius: number; electronegativity: number; isotopeMass: number }> = {
  H:  { atomicNumber: 1,  covalentRadius: 0.31, vdwRadius: 1.20, electronegativity: 2.20, isotopeMass: 1.008 },
  C:  { atomicNumber: 6,  covalentRadius: 0.77, vdwRadius: 1.70, electronegativity: 2.55, isotopeMass: 12.011 },
  N:  { atomicNumber: 7,  covalentRadius: 0.75, vdwRadius: 1.55, electronegativity: 3.04, isotopeMass: 14.007 },
  O:  { atomicNumber: 8,  covalentRadius: 0.73, vdwRadius: 1.52, electronegativity: 3.44, isotopeMass: 15.999 },
  S:  { atomicNumber: 16, covalentRadius: 1.02, vdwRadius: 1.80, electronegativity: 2.58, isotopeMass: 32.065 },
  P:  { atomicNumber: 15, covalentRadius: 1.06, vdwRadius: 1.80, electronegativity: 2.19, isotopeMass: 30.974 },
}

function atom(
  element: string,
  x: number,
  y: number,
  z: number,
  hybridization: string,
): AtomData {
  const d = ELEMENT_DATA[element]
  return {
    element,
    atomicNumber: d.atomicNumber,
    x,
    y,
    z,
    covalentRadius: d.covalentRadius,
    vdwRadius: d.vdwRadius,
    color: CPK_COLORS[element] || '#FFB5B5',
    hybridization,
    electronegativity: d.electronegativity,
    isotopeMass: d.isotopeMass,
  }
}

export const MOLECULES: MoleculeData[] = [
  {
    id: 'methane',
    name: '甲烷',
    formula: 'CH4',
    formulaHTML: 'CH<sub>4</sub>',
    molecularWeight: 16.04,
    atoms: [
      atom('C', 0, 0, 0, 'sp3'),
      atom('H', 0.629, 0.629, 0.629, 's'),
      atom('H', -0.629, -0.629, 0.629, 's'),
      atom('H', -0.629, 0.629, -0.629, 's'),
      atom('H', 0.629, -0.629, -0.629, 's'),
    ],
    bonds: [
      { atomIndexA: 0, atomIndexB: 1, order: 1 },
      { atomIndexA: 0, atomIndexB: 2, order: 1 },
      { atomIndexA: 0, atomIndexB: 3, order: 1 },
      { atomIndexA: 0, atomIndexB: 4, order: 1 },
    ],
  },
  {
    id: 'water',
    name: '水',
    formula: 'H2O',
    formulaHTML: 'H<sub>2</sub>O',
    molecularWeight: 18.015,
    atoms: [
      atom('O', 0, 0, 0, 'sp3'),
      atom('H', -0.757, 0.587, 0, 's'),
      atom('H', 0.757, 0.587, 0, 's'),
    ],
    bonds: [
      { atomIndexA: 0, atomIndexB: 1, order: 1 },
      { atomIndexA: 0, atomIndexB: 2, order: 1 },
    ],
  },
  {
    id: 'benzene',
    name: '苯',
    formula: 'C6H6',
    formulaHTML: 'C<sub>6</sub>H<sub>6</sub>',
    molecularWeight: 78.11,
    atoms: [
      atom('C', 1.400, 0.000, 0, 'sp2'),
      atom('C', 0.700, 1.212, 0, 'sp2'),
      atom('C', -0.700, 1.212, 0, 'sp2'),
      atom('C', -1.400, 0.000, 0, 'sp2'),
      atom('C', -0.700, -1.212, 0, 'sp2'),
      atom('C', 0.700, -1.212, 0, 'sp2'),
      atom('H', 2.490, 0.000, 0, 's'),
      atom('H', 1.245, 2.157, 0, 's'),
      atom('H', -1.245, 2.157, 0, 's'),
      atom('H', -2.490, 0.000, 0, 's'),
      atom('H', -1.245, -2.157, 0, 's'),
      atom('H', 1.245, -2.157, 0, 's'),
    ],
    bonds: [
      { atomIndexA: 0, atomIndexB: 1, order: 2 },
      { atomIndexA: 1, atomIndexB: 2, order: 1 },
      { atomIndexA: 2, atomIndexB: 3, order: 2 },
      { atomIndexA: 3, atomIndexB: 4, order: 1 },
      { atomIndexA: 4, atomIndexB: 5, order: 2 },
      { atomIndexA: 5, atomIndexB: 0, order: 1 },
      { atomIndexA: 0, atomIndexB: 6, order: 1 },
      { atomIndexA: 1, atomIndexB: 7, order: 1 },
      { atomIndexA: 2, atomIndexB: 8, order: 1 },
      { atomIndexA: 3, atomIndexB: 9, order: 1 },
      { atomIndexA: 4, atomIndexB: 10, order: 1 },
      { atomIndexA: 5, atomIndexB: 11, order: 1 },
    ],
  },
  {
    id: 'ethanol',
    name: '乙醇',
    formula: 'C2H5OH',
    formulaHTML: 'C<sub>2</sub>H<sub>5</sub>OH',
    molecularWeight: 46.07,
    atoms: [
      atom('C', 0, 0, 0, 'sp3'),
      atom('C', 1.52, 0, 0, 'sp3'),
      atom('O', 2.22, 0.93, 0, 'sp3'),
      atom('H', 3.08, 0.63, 0, 's'),
      atom('H', -0.36, 1.02, 0, 's'),
      atom('H', -0.36, -0.51, 0.88, 's'),
      atom('H', -0.36, -0.51, -0.88, 's'),
      atom('H', 1.88, -0.55, 0.88, 's'),
      atom('H', 1.88, -0.55, -0.88, 's'),
    ],
    bonds: [
      { atomIndexA: 0, atomIndexB: 1, order: 1 },
      { atomIndexA: 1, atomIndexB: 2, order: 1 },
      { atomIndexA: 2, atomIndexB: 3, order: 1 },
      { atomIndexA: 0, atomIndexB: 4, order: 1 },
      { atomIndexA: 0, atomIndexB: 5, order: 1 },
      { atomIndexA: 0, atomIndexB: 6, order: 1 },
      { atomIndexA: 1, atomIndexB: 7, order: 1 },
      { atomIndexA: 1, atomIndexB: 8, order: 1 },
    ],
  },
  {
    id: 'glucose',
    name: '葡萄糖',
    formula: 'C6H12O6',
    formulaHTML: 'C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>',
    molecularWeight: 180.16,
    atoms: [
      atom('C', 1.40, 0.40, 0.25, 'sp3'),
      atom('C', 1.50, 1.60, -0.45, 'sp3'),
      atom('C', 0.30, 2.10, -1.15, 'sp3'),
      atom('C', -1.00, 1.50, -0.75, 'sp3'),
      atom('C', -1.10, 0.30, 0.05, 'sp3'),
      atom('C', -2.40, -0.20, 0.55, 'sp3'),
      atom('O', 0.00, 0.00, 0.00, 'sp3'),
      atom('O', 2.55, 0.05, 0.90, 'sp3'),
      atom('O', 2.55, 2.25, -0.25, 'sp3'),
      atom('O', 0.40, 3.20, -1.75, 'sp3'),
      atom('O', -1.85, 2.05, -1.40, 'sp3'),
      atom('O', -3.30, 0.35, 1.15, 'sp3'),
      atom('H', 1.05, 0.30, 1.28, 's'),
      atom('H', 1.75, 1.80, -1.45, 's'),
      atom('H', 0.10, 1.85, -2.15, 's'),
      atom('H', -1.20, 1.75, 0.20, 's'),
      atom('H', -0.95, -0.35, 0.85, 's'),
      atom('H', -2.35, -1.25, 0.25, 's'),
      atom('H', -2.65, -0.10, 1.55, 's'),
      atom('H', 2.70, 0.70, 1.65, 's'),
      atom('H', 3.15, 1.95, -0.85, 's'),
      atom('H', 0.85, 3.65, -1.35, 's'),
      atom('H', -2.40, 1.55, -1.90, 's'),
      atom('H', -4.05, 0.00, 0.70, 's'),
    ],
    bonds: [
      { atomIndexA: 0, atomIndexB: 6, order: 1 },
      { atomIndexA: 6, atomIndexB: 4, order: 1 },
      { atomIndexA: 4, atomIndexB: 3, order: 1 },
      { atomIndexA: 3, atomIndexB: 2, order: 1 },
      { atomIndexA: 2, atomIndexB: 1, order: 1 },
      { atomIndexA: 1, atomIndexB: 0, order: 1 },
      { atomIndexA: 4, atomIndexB: 5, order: 1 },
      { atomIndexA: 0, atomIndexB: 7, order: 1 },
      { atomIndexA: 1, atomIndexB: 8, order: 1 },
      { atomIndexA: 2, atomIndexB: 9, order: 1 },
      { atomIndexA: 3, atomIndexB: 10, order: 1 },
      { atomIndexA: 5, atomIndexB: 11, order: 1 },
      { atomIndexA: 0, atomIndexB: 12, order: 1 },
      { atomIndexA: 1, atomIndexB: 13, order: 1 },
      { atomIndexA: 2, atomIndexB: 14, order: 1 },
      { atomIndexA: 3, atomIndexB: 15, order: 1 },
      { atomIndexA: 4, atomIndexB: 16, order: 1 },
      { atomIndexA: 5, atomIndexB: 17, order: 1 },
      { atomIndexA: 5, atomIndexB: 18, order: 1 },
      { atomIndexA: 7, atomIndexB: 19, order: 1 },
      { atomIndexA: 8, atomIndexB: 20, order: 1 },
      { atomIndexA: 9, atomIndexB: 21, order: 1 },
      { atomIndexA: 10, atomIndexB: 22, order: 1 },
      { atomIndexA: 11, atomIndexB: 23, order: 1 },
    ],
  },
]
