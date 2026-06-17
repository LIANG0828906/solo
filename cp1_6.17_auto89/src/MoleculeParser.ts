export interface AtomData {
  type: string;
  x: number;
  y: number;
  z: number;
}

export interface BondData {
  atom1: number;
  atom2: number;
  length: number;
}

export interface MoleculeData {
  atoms: AtomData[];
  bonds: BondData[];
  formula: string;
}

export const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
  S: '#FFFF30',
  P: '#FF8000'
};

export const ATOM_RADII: Record<string, number> = {
  H: 0.4,
  C: 0.6,
  N: 0.55,
  O: 0.6,
  F: 0.5,
  Cl: 0.7,
  Br: 0.75,
  I: 0.8,
  S: 0.7,
  P: 0.65
};

export const ELECTRONEGATIVITY: Record<string, number> = {
  H: 2.20,
  C: 2.55,
  N: 3.04,
  O: 3.44,
  F: 3.98,
  Cl: 3.16,
  Br: 2.96,
  I: 2.66,
  S: 2.58,
  P: 2.19
};

export class MoleculeParser {
  static parse(input: string): MoleculeData {
    const trimmed = input.trim();
    
    if (trimmed in PRESET_MOLECULES) {
      return JSON.parse(JSON.stringify(PRESET_MOLECULES[trimmed]));
    }
    
    return this.parseFormulaString(trimmed);
  }

  private static parseFormulaString(input: string): MoleculeData {
    const parts = input.split(/\s+/);
    const formula = parts[0];
    
    if (formula === 'H2O' && parts.length >= 4) {
      const scale = parseFloat(parts[1]) || 1;
      const bondLength = parseFloat(parts[2]) || 0.96;
      const bondAngle = parseFloat(parts[3]) || 104.5;
      return this.createWater(bondLength * scale, bondAngle);
    }
    
    if (formula in PRESET_MOLECULES) {
      return JSON.parse(JSON.stringify(PRESET_MOLECULES[formula]));
    }
    
    return this.createFromFormula(formula);
  }

  private static createFromFormula(formula: string): MoleculeData {
    const atoms: AtomData[] = [];
    const bonds: BondData[] = [];
    
    const elements = this.parseFormulaElements(formula);
    let index = 0;
    
    for (const [element, count] of elements) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 1.5;
        atoms.push({
          type: element,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0
        });
        if (i > 0) {
          bonds.push({
            atom1: index - 1,
            atom2: index,
            length: 2 * radius * Math.sin(Math.PI / count)
          });
        }
        index++;
      }
    }
    
    return { atoms, bonds, formula };
  }

  private static parseFormulaElements(formula: string): [string, number][] {
    const results: [string, number][] = [];
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;
    
    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = match[2] ? parseInt(match[2], 10) : 1;
      results.push([element, count]);
    }
    
    return results;
  }

  private static createWater(bondLength: number, bondAngle: number): MoleculeData {
    const angleRad = (bondAngle / 2) * (Math.PI / 180);
    const y = bondLength * Math.cos(angleRad);
    const x = bondLength * Math.sin(angleRad);
    
    const atoms: AtomData[] = [
      { type: 'O', x: 0, y: 0, z: 0 },
      { type: 'H', x: x, y: y, z: 0 },
      { type: 'H', x: -x, y: y, z: 0 }
    ];
    
    const bonds: BondData[] = [
      { atom1: 0, atom2: 1, length: bondLength },
      { atom1: 0, atom2: 2, length: bondLength }
    ];
    
    return { atoms, bonds, formula: 'H2O' };
  }

  static getAdjacentAtoms(molecule: MoleculeData, atomIndex: number): number[] {
    const adjacent: number[] = [];
    for (const bond of molecule.bonds) {
      if (bond.atom1 === atomIndex) {
        adjacent.push(bond.atom2);
      } else if (bond.atom2 === atomIndex) {
        adjacent.push(bond.atom1);
      }
    }
    return adjacent;
  }

  static calculateBondAngle(molecule: MoleculeData, centralAtom: number, atom1: number, atom2: number): { degrees: number; radians: number } {
    const central = molecule.atoms[centralAtom];
    const a = molecule.atoms[atom1];
    const b = molecule.atoms[atom2];
    
    const v1 = {
      x: a.x - central.x,
      y: a.y - central.y,
      z: a.z - central.z
    };
    
    const v2 = {
      x: b.x - central.x,
      y: b.y - central.y,
      z: b.z - central.z
    };
    
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    
    const cosAngle = dot / (mag1 * mag2);
    const clamped = Math.max(-1, Math.min(1, cosAngle));
    const radians = Math.acos(clamped);
    const degrees = radians * (180 / Math.PI);
    
    return { degrees, radians };
  }

  static calculateBondLength(molecule: MoleculeData, atom1: number, atom2: number): number {
    const a = molecule.atoms[atom1];
    const b = molecule.atoms[atom2];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  static getAllBondAngles(molecule: MoleculeData): { central: number; atom1: number; atom2: number; angle: number }[] {
    const angles: { central: number; atom1: number; atom2: number; angle: number }[] = [];
    
    for (let i = 0; i < molecule.atoms.length; i++) {
      const adjacent = this.getAdjacentAtoms(molecule, i);
      if (adjacent.length >= 2) {
        for (let j = 0; j < adjacent.length; j++) {
          for (let k = j + 1; k < adjacent.length; k++) {
            const { degrees } = this.calculateBondAngle(molecule, i, adjacent[j], adjacent[k]);
            angles.push({
              central: i,
              atom1: adjacent[j],
              atom2: adjacent[k],
              angle: degrees
            });
          }
        }
      }
    }
    
    return angles;
  }

  static calculateAverageBondAngle(molecule: MoleculeData): number {
    const angles = this.getAllBondAngles(molecule);
    if (angles.length === 0) return 0;
    const sum = angles.reduce((acc, a) => acc + a.angle, 0);
    return sum / angles.length;
  }

  static calculatePolarity(molecule: MoleculeData): '极性' | '非极性' {
    let dipoleX = 0;
    let dipoleY = 0;
    let dipoleZ = 0;

    for (const bond of molecule.bonds) {
      const atom1 = molecule.atoms[bond.atom1];
      const atom2 = molecule.atoms[bond.atom2];
      
      const en1 = ELECTRONEGATIVITY[atom1.type] || 2.5;
      const en2 = ELECTRONEGATIVITY[atom2.type] || 2.5;
      const enDiff = Math.abs(en1 - en2);
      
      if (enDiff < 0.01) continue;
      
      const dx = atom2.x - atom1.x;
      const dy = atom2.y - atom1.y;
      const dz = atom2.z - atom1.z;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (length < 0.001) continue;
      
      const direction = en2 > en1 ? 1 : -1;
      const magnitude = enDiff * direction;
      
      dipoleX += (dx / length) * magnitude;
      dipoleY += (dy / length) * magnitude;
      dipoleZ += (dz / length) * magnitude;
    }

    const netDipole = Math.sqrt(dipoleX * dipoleX + dipoleY * dipoleY + dipoleZ * dipoleZ);
    
    return netDipole > 0.1 ? '极性' : '非极性';
  }
}

const PRESET_MOLECULES: Record<string, MoleculeData> = {
  H2O: {
    formula: 'H2O',
    atoms: [
      { type: 'O', x: 0, y: 0, z: 0 },
      { type: 'H', x: 0.757, y: 0.587, z: 0 },
      { type: 'H', x: -0.757, y: 0.587, z: 0 }
    ],
    bonds: [
      { atom1: 0, atom2: 1, length: 0.958 },
      { atom1: 0, atom2: 2, length: 0.958 }
    ]
  },
  CO2: {
    formula: 'CO2',
    atoms: [
      { type: 'C', x: 0, y: 0, z: 0 },
      { type: 'O', x: 1.163, y: 0, z: 0 },
      { type: 'O', x: -1.163, y: 0, z: 0 }
    ],
    bonds: [
      { atom1: 0, atom2: 1, length: 1.163 },
      { atom1: 0, atom2: 2, length: 1.163 }
    ]
  },
  C6H6: {
    formula: 'C6H6',
    atoms: [
      { type: 'C', x: 1.39, y: 0, z: 0 },
      { type: 'C', x: 0.695, y: 1.203, z: 0 },
      { type: 'C', x: -0.695, y: 1.203, z: 0 },
      { type: 'C', x: -1.39, y: 0, z: 0 },
      { type: 'C', x: -0.695, y: -1.203, z: 0 },
      { type: 'C', x: 0.695, y: -1.203, z: 0 },
      { type: 'H', x: 2.47, y: 0, z: 0 },
      { type: 'H', x: 1.235, y: 2.137, z: 0 },
      { type: 'H', x: -1.235, y: 2.137, z: 0 },
      { type: 'H', x: -2.47, y: 0, z: 0 },
      { type: 'H', x: -1.235, y: -2.137, z: 0 },
      { type: 'H', x: 1.235, y: -2.137, z: 0 }
    ],
    bonds: [
      { atom1: 0, atom2: 1, length: 1.39 },
      { atom1: 1, atom2: 2, length: 1.39 },
      { atom1: 2, atom2: 3, length: 1.39 },
      { atom1: 3, atom2: 4, length: 1.39 },
      { atom1: 4, atom2: 5, length: 1.39 },
      { atom1: 5, atom2: 0, length: 1.39 },
      { atom1: 0, atom2: 6, length: 1.08 },
      { atom1: 1, atom2: 7, length: 1.08 },
      { atom1: 2, atom2: 8, length: 1.08 },
      { atom1: 3, atom2: 9, length: 1.08 },
      { atom1: 4, atom2: 10, length: 1.08 },
      { atom1: 5, atom2: 11, length: 1.08 }
    ]
  },
  NH3: {
    formula: 'NH3',
    atoms: [
      { type: 'N', x: 0, y: 0.38, z: 0 },
      { type: 'H', x: 0.938, y: -0.127, z: 0 },
      { type: 'H', x: -0.469, y: -0.127, z: 0.812 },
      { type: 'H', x: -0.469, y: -0.127, z: -0.812 }
    ],
    bonds: [
      { atom1: 0, atom2: 1, length: 1.012 },
      { atom1: 0, atom2: 2, length: 1.012 },
      { atom1: 0, atom2: 3, length: 1.012 }
    ]
  }
};
