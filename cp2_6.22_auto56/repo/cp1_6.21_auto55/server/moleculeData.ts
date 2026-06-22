export interface Atom {
  id: string;
  element: 'H' | 'C' | 'O';
  position: [number, number, number];
}

export interface Bond {
  id: string;
  atom1Id: string;
  atom2Id: string;
  bondLength: number;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface EnergyResponse {
  energy: number;
  timestamp: number;
}

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

const createWater = (): Molecule => {
  const bondLength = 1.0;
  const angle = degToRad(104.5);

  return {
    id: 'h2o',
    name: '水分子',
    formula: 'H₂O',
    atoms: [
      { id: 'o1', element: 'O', position: [0, 0, 0] },
      {
        id: 'h1',
        element: 'H',
        position: [bondLength * Math.sin(angle / 2), bondLength * Math.cos(angle / 2), 0],
      },
      {
        id: 'h2',
        element: 'H',
        position: [-bondLength * Math.sin(angle / 2), bondLength * Math.cos(angle / 2), 0],
      },
    ],
    bonds: [
      { id: 'b1', atom1Id: 'o1', atom2Id: 'h1', bondLength },
      { id: 'b2', atom1Id: 'o1', atom2Id: 'h2', bondLength },
    ],
  };
};

const createCO2 = (): Molecule => {
  const bondLength = 1.16;

  return {
    id: 'co2',
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { id: 'c1', element: 'C', position: [0, 0, 0] },
      { id: 'o1', element: 'O', position: [-bondLength, 0, 0] },
      { id: 'o2', element: 'O', position: [bondLength, 0, 0] },
    ],
    bonds: [
      { id: 'b1', atom1Id: 'c1', atom2Id: 'o1', bondLength },
      { id: 'b2', atom1Id: 'c1', atom2Id: 'o2', bondLength },
    ],
  };
};

const createBenzene = (): Molecule => {
  const ccBondLength = 1.39;
  const chBondLength = 1.09;
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];

  for (let i = 0; i < 6; i++) {
    const angle = degToRad(60 * i);
    const x = ccBondLength * Math.cos(angle);
    const z = ccBondLength * Math.sin(angle);

    atoms.push({
      id: `c${i + 1}`,
      element: 'C',
      position: [x, 0, z],
    });

    const hx = (ccBondLength + chBondLength) * Math.cos(angle);
    const hz = (ccBondLength + chBondLength) * Math.sin(angle);

    atoms.push({
      id: `h${i + 1}`,
      element: 'H',
      position: [hx, 0, hz],
    });

    bonds.push({
      id: `cc${i + 1}`,
      atom1Id: `c${i + 1}`,
      atom2Id: `c${((i + 1) % 6) + 1}`,
      bondLength: ccBondLength,
    });

    bonds.push({
      id: `ch${i + 1}`,
      atom1Id: `c${i + 1}`,
      atom2Id: `h${i + 1}`,
      bondLength: chBondLength,
    });
  }

  return {
    id: 'c6h6',
    name: '苯',
    formula: 'C₆H₆',
    atoms,
    bonds,
  };
};

export const molecules: Record<string, Molecule> = {
  h2o: createWater(),
  co2: createCO2(),
  c6h6: createBenzene(),
};

export const getMolecule = (id: string): Molecule | null => {
  return molecules[id] || null;
};

export const getMoleculeList = (): Array<{ id: string; name: string; formula: string }> => {
  return Object.values(molecules).map(({ id, name, formula }) => ({ id, name, formula }));
};

const getAtomPosition = (atoms: Atom[], id: string): [number, number, number] | null => {
  const atom = atoms.find((a) => a.id === id);
  return atom ? atom.position : null;
};

const distance = (p1: [number, number, number], p2: [number, number, number]): number => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const morsePotential = (r: number, r0: number, De: number, a: number): number => {
  return De * Math.pow(1 - Math.exp(-a * (r - r0)), 2);
};

export const calculateEnergy = (atoms: Atom[], originalMolecule: Molecule): number => {
  let totalEnergy = 0;
  const k = 100;

  for (const bond of originalMolecule.bonds) {
    const pos1 = getAtomPosition(atoms, bond.atom1Id);
    const pos2 = getAtomPosition(atoms, bond.atom2Id);

    if (pos1 && pos2) {
      const currentDistance = distance(pos1, pos2);
      const De = 50;
      const a = 2;
      totalEnergy += morsePotential(currentDistance, bond.bondLength, De, a);
    }
  }

  const atomMap = new Map(originalMolecule.atoms.map((a) => [a.id, a.position]));
  for (const atom of atoms) {
    const originalPos = atomMap.get(atom.id);
    if (originalPos && atom.element === 'H') {
      const dist = distance(atom.position, originalPos);
      const chBond = originalMolecule.bonds.find(
        (b) => b.atom1Id === atom.id || b.atom2Id === atom.id
      );
      const threshold = (chBond?.bondLength || 1.0) * 1.5;
      if (dist > threshold) {
        totalEnergy += k * Math.pow(dist - threshold, 2);
      }
    }
  }

  return Math.min(100, Math.max(0, totalEnergy));
};

interface CalculateEnergyRequest {
  moleculeId: string;
  atoms: Atom[];
}

export const handleEnergyCalculation = (req: CalculateEnergyRequest): EnergyResponse | { error: string } => {
  const { moleculeId, atoms } = req;
  const originalMolecule = molecules[moleculeId];

  if (!originalMolecule) {
    return { error: 'Molecule not found' };
  }

  const energy = calculateEnergy(atoms, originalMolecule);
  return {
    energy,
    timestamp: Date.now(),
  };
};
