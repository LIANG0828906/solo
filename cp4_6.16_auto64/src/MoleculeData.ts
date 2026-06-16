import { v4 as uuidv4 } from 'uuid';

export interface AtomData {
  id: string;
  index: number;
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface BondData {
  id: string;
  atom1Id: string;
  atom2Id: string;
  type: 1 | 2 | 3 | 4;
}

export interface MoleculeData {
  name: string;
  atoms: AtomData[];
  bonds: BondData[];
}

const EPSILON = 1e-6;

export function parseMOL(text: string): MoleculeData {
  const lines = text.split(/\r?\n/);
  
  const name = lines[0]?.trim() || '';
  
  const countsLine = lines[3] || '';
  const atomCount = parseInt(countsLine.substring(0, 3).trim(), 10);
  const bondCount = parseInt(countsLine.substring(3, 6).trim(), 10);
  
  if (isNaN(atomCount) || atomCount < 0) {
    throw new Error(`Invalid atom count: ${atomCount}`);
  }
  if (isNaN(bondCount) || bondCount < 0) {
    throw new Error(`Invalid bond count: ${bondCount}`);
  }
  
  const atoms: AtomData[] = [];
  const atomStartIndex = 4;
  
  for (let i = 0; i < atomCount; i++) {
    const line = lines[atomStartIndex + i] || '';
    let x = parseFloat(line.substring(0, 10));
    let y = parseFloat(line.substring(10, 20));
    let z = parseFloat(line.substring(20, 30));
    const element = line.substring(30, 33).trim();
    
    if (isNaN(x)) x = 0;
    if (isNaN(y)) y = 0;
    if (isNaN(z)) z = 0;
    
    atoms.push({
      id: uuidv4(),
      index: i + 1,
      element,
      x,
      y,
      z,
    });
  }
  
  const bonds: BondData[] = [];
  const bondStartIndex = atomStartIndex + atomCount;
  
  for (let i = 0; i < bondCount; i++) {
    const line = lines[bondStartIndex + i] || '';
    const atom1Index = parseInt(line.substring(0, 3).trim(), 10);
    const atom2Index = parseInt(line.substring(3, 6).trim(), 10);
    const bondTypeRaw = parseInt(line.substring(6, 9).trim(), 10);
    const type = bondTypeRaw as 1 | 2 | 3 | 4;
    
    const atom1 = atoms.find((a) => a.index === atom1Index);
    const atom2 = atoms.find((a) => a.index === atom2Index);
    
    if (atom1 && atom2) {
      bonds.push({
        id: uuidv4(),
        atom1Id: atom1.id,
        atom2Id: atom2.id,
        type,
      });
    }
  }
  
  return { name, atoms, bonds };
}

export function parseSDF(text: string): MoleculeData {
  const molBlocks = text.split(/\$\$\$\$/);
  const firstMolBlock = molBlocks[0] || '';
  return parseMOL(firstMolBlock);
}

export function toMOL(data: MoleculeData): string {
  const lines: string[] = [];
  
  lines.push(data.name);
  lines.push('');
  lines.push('');
  
  const atomCount = data.atoms.length;
  const bondCount = data.bonds.length;
  lines.push(
    `${atomCount.toString().padStart(3)}${bondCount.toString().padStart(3)}  0  0  0  0  0  0  0  0  0999 V2000`
  );
  
  const atomIndexMap = new Map<string, number>();
  data.atoms.forEach((atom, idx) => {
    const displayIndex = idx + 1;
    atomIndexMap.set(atom.id, displayIndex);
    
    const xStr = atom.x.toFixed(4).padStart(10);
    const yStr = atom.y.toFixed(4).padStart(10);
    const zStr = atom.z.toFixed(4).padStart(10);
    const elemStr = atom.element.padEnd(3);
    lines.push(`${xStr}${yStr}${zStr} ${elemStr} 0  0  0  0  0  0  0  0  0  0  0  0`);
  });
  
  data.bonds.forEach((bond) => {
    const a1Idx = atomIndexMap.get(bond.atom1Id) ?? 0;
    const a2Idx = atomIndexMap.get(bond.atom2Id) ?? 0;
    lines.push(
      `${a1Idx.toString().padStart(3)}${a2Idx.toString().padStart(3)}${bond.type.toString().padStart(3)}  0  0  0  0`
    );
  });
  
  lines.push('M  END');
  
  return lines.join('\n');
}

export function calculateBondLength(a1: AtomData, a2: AtomData): number {
  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;
  const dz = a2.z - a1.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  if (distSq < EPSILON * EPSILON) {
    return 0;
  }
  return Math.sqrt(distSq);
}

export function calculateBondAngle(center: AtomData, a1: AtomData, a2: AtomData): number {
  const v1x = a1.x - center.x;
  const v1y = a1.y - center.y;
  const v1z = a1.z - center.z;
  
  const v2x = a2.x - center.x;
  const v2y = a2.y - center.y;
  const v2z = a2.z - center.z;
  
  const dot = v1x * v2x + v1y * v2y + v1z * v2z;
  
  const len1Sq = v1x * v1x + v1y * v1y + v1z * v1z;
  const len2Sq = v2x * v2x + v2y * v2y + v2z * v2z;
  
  if (len1Sq < EPSILON * EPSILON || len2Sq < EPSILON * EPSILON) {
    return 0;
  }
  
  const len1 = Math.sqrt(len1Sq);
  const len2 = Math.sqrt(len2Sq);
  const lenProduct = len1 * len2;
  
  if (lenProduct < EPSILON) {
    return 0;
  }
  
  const cosAngle = dot / lenProduct;
  
  if (cosAngle > 1 - EPSILON) {
    return 0;
  }
  if (cosAngle < -1 + EPSILON) {
    return 180;
  }
  
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  return (Math.acos(clampedCos) * 180) / Math.PI;
}

export function findAdjacentAtoms(atomId: string, bonds: BondData[]): string[] {
  const adjacent: string[] = [];
  bonds.forEach((bond) => {
    if (bond.atom1Id === atomId) {
      adjacent.push(bond.atom2Id);
    } else if (bond.atom2Id === atomId) {
      adjacent.push(bond.atom1Id);
    }
  });
  return adjacent;
}

export function recomputeBonds(atoms: AtomData[], threshold: number = 1.6): BondData[] {
  const bonds: BondData[] = [];
  const bonded = new Set<string>();
  const effectiveThreshold = threshold + EPSILON;
  
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a1 = atoms[i];
      const a2 = atoms[j];
      const dist = calculateBondLength(a1, a2);
      
      if (dist < effectiveThreshold) {
        const key1 = `${a1.id}-${a2.id}`;
        const key2 = `${a2.id}-${a1.id}`;
        if (!bonded.has(key1) && !bonded.has(key2)) {
          bonds.push({
            id: uuidv4(),
            atom1Id: a1.id,
            atom2Id: a2.id,
            type: 1,
          });
          bonded.add(key1);
        }
      }
    }
  }
  
  return bonds;
}

export function getCaffeineMolecule(): MoleculeData {
  const atoms: AtomData[] = [];
  let idx = 1;
  
  const addAtom = (element: string, x: number, y: number, z: number): AtomData => {
    const atom: AtomData = {
      id: uuidv4(),
      index: idx++,
      element,
      x,
      y,
      z,
    };
    atoms.push(atom);
    return atom;
  };
  
  const N1 = addAtom('N', 0.0, 0.0, 0.0);
  const C2 = addAtom('C', 1.45, 0.0, 0.0);
  const N3 = addAtom('N', 2.15, 1.15, 0.0);
  const C4 = addAtom('C', 1.45, 2.3, 0.0);
  const C5 = addAtom('C', 0.0, 2.3, 0.0);
  const C6 = addAtom('C', -0.7, 1.15, 0.0);
  const N7 = addAtom('N', -0.7, -1.2, 0.0);
  const C8 = addAtom('C', 2.15, -1.2, 0.0);
  const O9 = addAtom('O', 2.9, -0.3, 0.0);
  const N10 = addAtom('N', 2.15, 3.5, 0.0);
  const C11 = addAtom('C', 0.7, 3.5, 0.0);
  const O12 = addAtom('O', -0.7, 3.3, 0.0);
  const C13 = addAtom('C', -1.4, -1.4, 0.5);
  const C14 = addAtom('C', -1.4, -1.4, -0.5);
  const C15 = addAtom('C', 2.8, 1.2, 0.5);
  const C16 = addAtom('C', 3.5, 1.2, -0.5);
  const H17 = addAtom('H', -1.3, 1.1, 0.8);
  const H18 = addAtom('H', -1.3, 1.1, -0.8);
  const H19 = addAtom('H', 0.3, 4.2, 0.0);
  const H20 = addAtom('H', 1.1, 3.8, 0.8);
  const H21 = addAtom('H', 1.1, 3.8, -0.8);
  const H22 = addAtom('H', -1.8, -2.2, 0.8);
  const H23 = addAtom('H', -0.6, -1.8, 0.8);
  const H24 = addAtom('H', -2.0, -0.5, 0.8);
  
  const bonds: BondData[] = [];
  const addBond = (a1: AtomData, a2: AtomData, type: 1 | 2 | 3 | 4): void => {
    bonds.push({
      id: uuidv4(),
      atom1Id: a1.id,
      atom2Id: a2.id,
      type,
    });
  };
  
  addBond(N1, C2, 1);
  addBond(C2, N3, 2);
  addBond(N3, C4, 1);
  addBond(C4, C5, 2);
  addBond(C5, C6, 1);
  addBond(C6, N1, 2);
  addBond(N1, N7, 1);
  addBond(C2, C8, 1);
  addBond(C8, O9, 2);
  addBond(C4, N10, 1);
  addBond(C5, C11, 1);
  addBond(C11, O12, 2);
  addBond(N7, C13, 1);
  addBond(N7, C14, 1);
  addBond(N3, C15, 1);
  addBond(N3, C16, 1);
  addBond(C6, H17, 1);
  addBond(C6, H18, 1);
  addBond(N10, C11, 1);
  addBond(N10, H19, 1);
  addBond(N10, H20, 1);
  addBond(N10, H21, 1);
  addBond(C13, H22, 1);
  addBond(C13, H23, 1);
  addBond(C13, H24, 1);
  
  return { name: 'Caffeine', atoms, bonds };
}

export function getAspirinMolecule(): MoleculeData {
  const atoms: AtomData[] = [];
  let idx = 1;
  
  const addAtom = (element: string, x: number, y: number, z: number): AtomData => {
    const atom: AtomData = {
      id: uuidv4(),
      index: idx++,
      element,
      x,
      y,
      z,
    };
    atoms.push(atom);
    return atom;
  };
  
  const C1 = addAtom('C', 0.0, 0.0, 0.0);
  const C2 = addAtom('C', 1.4, 0.0, 0.0);
  const C3 = addAtom('C', 2.1, 1.2, 0.0);
  const C4 = addAtom('C', 1.4, 2.4, 0.0);
  const C5 = addAtom('C', 0.0, 2.4, 0.0);
  const C6 = addAtom('C', -0.7, 1.2, 0.0);
  const C7 = addAtom('C', 2.1, -1.2, 0.0);
  const O8 = addAtom('O', 3.5, -1.2, 0.0);
  const O9 = addAtom('O', 1.4, -2.3, 0.0);
  const C10 = addAtom('C', 2.1, 3.6, 0.0);
  const O11 = addAtom('O', 3.5, 3.6, 0.0);
  const O12 = addAtom('O', 1.4, 4.8, 0.0);
  const C13 = addAtom('C', -2.1, 1.2, 0.5);
  const H14 = addAtom('H', -0.6, 0.0, 0.8);
  const H15 = addAtom('H', -0.6, 0.0, -0.8);
  const H16 = addAtom('H', 2.6, 1.2, 0.8);
  const H17 = addAtom('H', 2.6, 1.2, -0.8);
  const H18 = addAtom('H', -0.6, 3.2, 0.8);
  const H19 = addAtom('H', -0.6, 3.2, -0.8);
  const H20 = addAtom('H', -2.6, 0.3, 0.8);
  const H21 = addAtom('H', -2.6, 2.1, 0.8);
  const H22 = addAtom('H', -2.0, 1.2, -0.5);
  const H23 = addAtom('H', 1.4, -3.2, 0.0);
  const H24 = addAtom('H', 1.6, 5.6, 0.0);
  
  const bonds: BondData[] = [];
  const addBond = (a1: AtomData, a2: AtomData, type: 1 | 2 | 3 | 4): void => {
    bonds.push({
      id: uuidv4(),
      atom1Id: a1.id,
      atom2Id: a2.id,
      type,
    });
  };
  
  addBond(C1, C2, 2);
  addBond(C2, C3, 1);
  addBond(C3, C4, 2);
  addBond(C4, C5, 1);
  addBond(C5, C6, 2);
  addBond(C6, C1, 1);
  addBond(C2, C7, 1);
  addBond(C7, O8, 2);
  addBond(C7, O9, 1);
  addBond(C4, C10, 1);
  addBond(C10, O11, 2);
  addBond(C10, O12, 1);
  addBond(C6, C13, 1);
  addBond(C1, H14, 1);
  addBond(C1, H15, 1);
  addBond(C3, H16, 1);
  addBond(C3, H17, 1);
  addBond(C5, H18, 1);
  addBond(C5, H19, 1);
  addBond(C13, H20, 1);
  addBond(C13, H21, 1);
  addBond(C13, H22, 1);
  addBond(O9, H23, 1);
  addBond(O12, H24, 1);
  
  return { name: 'Aspirin', atoms, bonds };
}
