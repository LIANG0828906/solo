import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'C' | 'N' | 'O' | 'H' | 'S' | 'P' | 'Cl' | 'Br' | 'I';
export type BondOrder = 1 | 2 | 3;
export type EditMode = 'atom' | 'bond' | 'select';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Atom {
  id: string;
  element: ElementType;
  position: Vec3;
  charge: number;
}

export interface Bond {
  id: string;
  atomA: string;
  atomB: string;
  order: BondOrder;
}

export interface Molecule {
  id: string;
  name: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface ElementInfo {
  color: string;
  radius: number;
  mass: number;
  name: string;
}

export const ELEMENT_INFO: Record<ElementType, ElementInfo> = {
  C: { color: '#404040', radius: 0.77, mass: 12.01, name: '碳' },
  N: { color: '#3050F8', radius: 0.71, mass: 14.01, name: '氮' },
  O: { color: '#FF0D0D', radius: 0.66, mass: 16.00, name: '氧' },
  H: { color: '#FFFFFF', radius: 0.37, mass: 1.008, name: '氢' },
  S: { color: '#FFFF30', radius: 1.04, mass: 32.07, name: '硫' },
  P: { color: '#FF8000', radius: 1.10, mass: 30.97, name: '磷' },
  Cl: { color: '#1FF01F', radius: 1.02, mass: 35.45, name: '氯' },
  Br: { color: '#A62929', radius: 1.20, mass: 79.90, name: '溴' },
  I: { color: '#940094', radius: 1.39, mass: 126.90, name: '碘' },
};

const BOND_LENGTH_MULTIPLIER: Record<BondOrder, number> = {
  1: 1.0,
  2: 0.89,
  3: 0.81,
};

export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len < 1e-8) return { x: 0, y: 0, z: 0 };
  return vec3Scale(v, 1 / len);
}

export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function calculateBondLength(elementA: ElementType, elementB: ElementType, order: BondOrder): number {
  const rA = ELEMENT_INFO[elementA].radius;
  const rB = ELEMENT_INFO[elementB].radius;
  return (rA + rB) * BOND_LENGTH_MULTIPLIER[order];
}

export class MoleculeEngine {
  private atoms: Map<string, Atom> = new Map();
  private bonds: Map<string, Bond> = new Map();

  constructor() {
    this.initDefaultMolecule();
  }

  private initDefaultMolecule(): void {
    const c1 = this.addAtom('C', vec3(-0.77, 0, 0));
    const c2 = this.addAtom('C', vec3(0.77, 0, 0));
    this.addBond(c1, c2, 1);
    this.addAtom('H', vec3(-1.35, 0.9, 0));
    this.addAtom('H', vec3(-1.35, -0.9, 0));
    this.addAtom('H', vec3(1.35, 0.9, 0));
    this.addAtom('H', vec3(1.35, -0.9, 0));
  }

  addAtom(element: ElementType, position: Vec3): string {
    const id = uuidv4();
    const atom: Atom = {
      id,
      element,
      position: { ...position },
      charge: 0,
    };
    this.atoms.set(id, atom);
    return id;
  }

  removeAtom(id: string): void {
    this.atoms.delete(id);
    const bondsToRemove: string[] = [];
    this.bonds.forEach((bond) => {
      if (bond.atomA === id || bond.atomB === id) {
        bondsToRemove.push(bond.id);
      }
    });
    bondsToRemove.forEach((bid) => this.bonds.delete(bid));
  }

  updateAtomPosition(id: string, position: Vec3): void {
    const atom = this.atoms.get(id);
    if (atom) {
      atom.position = { ...position };
    }
  }

  getAtom(id: string): Atom | undefined {
    return this.atoms.get(id);
  }

  getAtoms(): Atom[] {
    return Array.from(this.atoms.values());
  }

  addBond(atomAId: string, atomBId: string, order: BondOrder): string | null {
    if (atomAId === atomBId) return null;
    const atomA = this.atoms.get(atomAId);
    const atomB = this.atoms.get(atomBId);
    if (!atomA || !atomB) return null;

    let exists = false;
    this.bonds.forEach((bond) => {
      if (
        (bond.atomA === atomAId && bond.atomB === atomBId) ||
        (bond.atomA === atomBId && bond.atomB === atomAId)
      ) {
        exists = true;
      }
    });
    if (exists) return null;

    const id = uuidv4();
    this.bonds.set(id, { id, atomA: atomAId, atomB: atomBId, order });
    return id;
  }

  removeBond(id: string): void {
    this.bonds.delete(id);
  }

  getBonds(): Bond[] {
    return Array.from(this.bonds.values());
  }

  getBond(id: string): Bond | undefined {
    return this.bonds.get(id);
  }

  getAtomsNear(position: Vec3, threshold: number = 2.0): Atom[] {
    const result: Atom[] = [];
    this.atoms.forEach((atom) => {
      if (distance(atom.position, position) <= threshold) {
        result.push(atom);
      }
    });
    return result;
  }

  getAtomBonds(atomId: string): Bond[] {
    return this.getBonds().filter(
      (bond) => bond.atomA === atomId || bond.atomB === atomId
    );
  }

  getBondCountForAtom(atomId: string): number {
    return this.getAtomBonds(atomId).length;
  }

  getMolecule(name: string = 'molecule'): Molecule {
    return {
      id: uuidv4(),
      name,
      atoms: this.getAtoms(),
      bonds: this.getBonds(),
    };
  }

  clear(): void {
    this.atoms.clear();
    this.bonds.clear();
  }

  loadMolecule(molecule: Molecule): void {
    this.clear();
    molecule.atoms.forEach((a) => this.atoms.set(a.id, { ...a, position: { ...a.position } }));
    molecule.bonds.forEach((b) => this.bonds.set(b.id, { ...b }));
  }

  centerOfMass(): Vec3 {
    const atoms = this.getAtoms();
    if (atoms.length === 0) return vec3(0, 0, 0);
    let totalMass = 0;
    let sumX = 0,
      sumY = 0,
      sumZ = 0;
    atoms.forEach((a) => {
      const mass = ELEMENT_INFO[a.element].mass;
      totalMass += mass;
      sumX += a.position.x * mass;
      sumY += a.position.y * mass;
      sumZ += a.position.z * mass;
    });
    return vec3(sumX / totalMass, sumY / totalMass, sumZ / totalMass);
  }
}
