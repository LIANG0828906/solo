export interface AtomData {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface BondData {
  id: string;
  atom1: string;
  atom2: string;
  type: 'single' | 'double' | 'aromatic';
}

export interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  atoms: AtomData[];
  bonds: BondData[];
}

const MOLECULES: MoleculeData[] = [
  {
    id: 'water',
    name: '水',
    formula: 'H₂O',
    atoms: [
      { id: 'O1', element: 'O', x: 0, y: 0, z: 0 },
      { id: 'H1', element: 'H', x: 0.757, y: 0.586, z: 0 },
      { id: 'H2', element: 'H', x: -0.757, y: 0.586, z: 0 }
    ],
    bonds: [
      { id: 'B1', atom1: 'O1', atom2: 'H1', type: 'single' },
      { id: 'B2', atom1: 'O1', atom2: 'H2', type: 'single' }
    ]
  },
  {
    id: 'co2',
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { id: 'C1', element: 'C', x: 0, y: 0, z: 0 },
      { id: 'O1', element: 'O', x: 1.163, y: 0, z: 0 },
      { id: 'O2', element: 'O', x: -1.163, y: 0, z: 0 }
    ],
    bonds: [
      { id: 'B1', atom1: 'C1', atom2: 'O1', type: 'double' },
      { id: 'B2', atom1: 'C1', atom2: 'O2', type: 'double' }
    ]
  },
  {
    id: 'methane',
    name: '甲烷',
    formula: 'CH₄',
    atoms: [
      { id: 'C1', element: 'C', x: 0, y: 0, z: 0 },
      { id: 'H1', element: 'H', x: 0.629, y: 0.629, z: 0.629 },
      { id: 'H2', element: 'H', x: -0.629, y: -0.629, z: 0.629 },
      { id: 'H3', element: 'H', x: -0.629, y: 0.629, z: -0.629 },
      { id: 'H4', element: 'H', x: 0.629, y: -0.629, z: -0.629 }
    ],
    bonds: [
      { id: 'B1', atom1: 'C1', atom2: 'H1', type: 'single' },
      { id: 'B2', atom1: 'C1', atom2: 'H2', type: 'single' },
      { id: 'B3', atom1: 'C1', atom2: 'H3', type: 'single' },
      { id: 'B4', atom1: 'C1', atom2: 'H4', type: 'single' }
    ]
  },
  {
    id: 'ammonia',
    name: '氨',
    formula: 'NH₃',
    atoms: [
      { id: 'N1', element: 'N', x: 0, y: 0, z: 0 },
      { id: 'H1', element: 'H', x: 0.9377, y: 0, z: -0.3272 },
      { id: 'H2', element: 'H', x: -0.4689, y: 0.816, z: -0.3272 },
      { id: 'H3', element: 'H', x: -0.4689, y: -0.816, z: -0.3272 }
    ],
    bonds: [
      { id: 'B1', atom1: 'N1', atom2: 'H1', type: 'single' },
      { id: 'B2', atom1: 'N1', atom2: 'H2', type: 'single' },
      { id: 'B3', atom1: 'N1', atom2: 'H3', type: 'single' }
    ]
  },
  {
    id: 'benzene',
    name: '苯',
    formula: 'C₆H₆',
    atoms: [
      { id: 'C1', element: 'C', x: 1.39, y: 0, z: 0 },
      { id: 'C2', element: 'C', x: 0.695, y: 1.203, z: 0 },
      { id: 'C3', element: 'C', x: -0.695, y: 1.203, z: 0 },
      { id: 'C4', element: 'C', x: -1.39, y: 0, z: 0 },
      { id: 'C5', element: 'C', x: -0.695, y: -1.203, z: 0 },
      { id: 'C6', element: 'C', x: 0.695, y: -1.203, z: 0 },
      { id: 'H1', element: 'H', x: 2.46, y: 0, z: 0 },
      { id: 'H2', element: 'H', x: 1.23, y: 2.13, z: 0 },
      { id: 'H3', element: 'H', x: -1.23, y: 2.13, z: 0 },
      { id: 'H4', element: 'H', x: -2.46, y: 0, z: 0 },
      { id: 'H5', element: 'H', x: -1.23, y: -2.13, z: 0 },
      { id: 'H6', element: 'H', x: 1.23, y: -2.13, z: 0 }
    ],
    bonds: [
      { id: 'B1', atom1: 'C1', atom2: 'C2', type: 'aromatic' },
      { id: 'B2', atom1: 'C2', atom2: 'C3', type: 'aromatic' },
      { id: 'B3', atom1: 'C3', atom2: 'C4', type: 'aromatic' },
      { id: 'B4', atom1: 'C4', atom2: 'C5', type: 'aromatic' },
      { id: 'B5', atom1: 'C5', atom2: 'C6', type: 'aromatic' },
      { id: 'B6', atom1: 'C6', atom2: 'C1', type: 'aromatic' },
      { id: 'B7', atom1: 'C1', atom2: 'H1', type: 'single' },
      { id: 'B8', atom1: 'C2', atom2: 'H2', type: 'single' },
      { id: 'B9', atom1: 'C3', atom2: 'H3', type: 'single' },
      { id: 'B10', atom1: 'C4', atom2: 'H4', type: 'single' },
      { id: 'B11', atom1: 'C5', atom2: 'H5', type: 'single' },
      { id: 'B12', atom1: 'C6', atom2: 'H6', type: 'single' }
    ]
  },
  {
    id: 'ethanol',
    name: '乙醇',
    formula: 'C₂H₆O',
    atoms: [
      { id: 'C1', element: 'C', x: -0.720, y: 0.000, z: 0.000 },
      { id: 'C2', element: 'C', x: 0.770, y: 0.000, z: 0.000 },
      { id: 'O1', element: 'O', x: 1.420, y: 1.140, z: 0.000 },
      { id: 'H1', element: 'H', x: -1.120, y: -1.000, z: 0.000 },
      { id: 'H2', element: 'H', x: -1.120, y: 0.500, z: 0.870 },
      { id: 'H3', element: 'H', x: -1.120, y: 0.500, z: -0.870 },
      { id: 'H4', element: 'H', x: 1.100, y: -0.530, z: 0.890 },
      { id: 'H5', element: 'H', x: 1.100, y: -0.530, z: -0.890 },
      { id: 'H6', element: 'H', x: 2.370, y: 1.140, z: 0.000 }
    ],
    bonds: [
      { id: 'B1', atom1: 'C1', atom2: 'C2', type: 'single' },
      { id: 'B2', atom1: 'C2', atom2: 'O1', type: 'single' },
      { id: 'B3', atom1: 'C1', atom2: 'H1', type: 'single' },
      { id: 'B4', atom1: 'C1', atom2: 'H2', type: 'single' },
      { id: 'B5', atom1: 'C1', atom2: 'H3', type: 'single' },
      { id: 'B6', atom1: 'C2', atom2: 'H4', type: 'single' },
      { id: 'B7', atom1: 'C2', atom2: 'H5', type: 'single' },
      { id: 'B8', atom1: 'O1', atom2: 'H6', type: 'single' }
    ]
  }
];

export class MoleculeStore {
  private molecules: Map<string, MoleculeData>;

  constructor() {
    this.molecules = new Map();
    MOLECULES.forEach(mol => this.molecules.set(mol.id, mol));
  }

  getMolecule(id: string): MoleculeData | undefined {
    return this.molecules.get(id);
  }

  getAllMolecules(): MoleculeData[] {
    return Array.from(this.molecules.values());
  }

  getAtomById(molecule: MoleculeData, atomId: string): AtomData | undefined {
    return molecule.atoms.find(a => a.id === atomId);
  }

  getBondById(molecule: MoleculeData, bondId: string): BondData | undefined {
    return molecule.bonds.find(b => b.id === bondId);
  }

  getNeighborAtoms(molecule: MoleculeData, atomId: string): { atom: AtomData; bond: BondData; distance: number }[] {
    const neighbors: { atom: AtomData; bond: BondData; distance: number }[] = [];
    const atom = this.getAtomById(molecule, atomId);
    if (!atom) return neighbors;

    for (const bond of molecule.bonds) {
      let neighborId: string | null = null;
      if (bond.atom1 === atomId) {
        neighborId = bond.atom2;
      } else if (bond.atom2 === atomId) {
        neighborId = bond.atom1;
      }
      if (neighborId) {
        const neighbor = this.getAtomById(molecule, neighborId);
        if (neighbor) {
          const dx = atom.x - neighbor.x;
          const dy = atom.y - neighbor.y;
          const dz = atom.z - neighbor.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          neighbors.push({ atom: neighbor, bond, distance });
        }
      }
    }
    return neighbors;
  }

  calculateBondLength(molecule: MoleculeData, bond: BondData): number {
    const a1 = this.getAtomById(molecule, bond.atom1);
    const a2 = this.getAtomById(molecule, bond.atom2);
    if (!a1 || !a2) return 0;
    const dx = a1.x - a2.x;
    const dy = a1.y - a2.y;
    const dz = a1.z - a2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
