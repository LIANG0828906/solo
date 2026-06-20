import { v4 as uuidv4 } from 'uuid';
import {
  Atom,
  Bond,
  BondOrder,
  ElementType,
  Molecule,
  Vec3,
  ELEMENT_INFO,
  distance,
  vec3,
  vec3Add,
  vec3Sub,
  vec3Lerp,
  vec3Scale,
  vec3Normalize,
} from './MoleculeEngine';

const BOND_ENERGY: Record<string, number> = {
  'C-C': 347,
  'C=C': 614,
  'C≡C': 839,
  'C-H': 414,
  'C-N': 305,
  'C=N': 615,
  'C≡N': 891,
  'C-O': 360,
  'C=O': 745,
  'C-S': 272,
  'C-Cl': 339,
  'C-Br': 285,
  'C-I': 218,
  'N-N': 163,
  'N=N': 418,
  'N≡N': 945,
  'N-H': 389,
  'O-O': 146,
  'O=O': 498,
  'O-H': 464,
  'S-H': 347,
  'S-S': 266,
  'P-H': 326,
  'H-H': 436,
  'H-Cl': 431,
  'H-Br': 366,
  'H-I': 299,
};

export interface ReactionPoint {
  coordinate: number;
  energy: number;
  molecule: Molecule;
  label?: 'reactant' | 'transition' | 'intermediate' | 'product';
}

export interface ReactionResult {
  path: ReactionPoint[];
  enthalpy: number;
  activationEnergy: number;
  reactionType: string;
}

function getBondKey(elemA: ElementType, elemB: ElementType, order: BondOrder): string {
  const sorted = [elemA, elemB].sort();
  const symbol = order === 1 ? '-' : order === 2 ? '=' : '≡';
  return `${sorted[0]}${symbol}${sorted[1]}`;
}

function getBondEnergy(elemA: ElementType, elemB: ElementType, order: BondOrder): number {
  const key = getBondKey(elemA, elemB, order);
  return BOND_ENERGY[key] ?? 300;
}

export function calculateMoleculeEnergy(molecule: Molecule): number {
  let energy = 0;
  const atomMap = new Map<string, Atom>();
  molecule.atoms.forEach((a) => atomMap.set(a.id, a));
  molecule.bonds.forEach((bond) => {
    const atomA = atomMap.get(bond.atomA);
    const atomB = atomMap.get(bond.atomB);
    if (atomA && atomB) {
      energy += getBondEnergy(atomA.element, atomB.element, bond.order);
    }
  });
  molecule.atoms.forEach((a) => {
    energy += ELEMENT_INFO[a.element].mass * 2;
  });
  return energy;
}

function cloneMolecule(mol: Molecule): Molecule {
  return {
    id: uuidv4(),
    name: mol.name,
    atoms: mol.atoms.map((a) => ({ ...a, position: { ...a.position } })),
    bonds: mol.bonds.map((b) => ({ ...b })),
  };
}

function combineMolecules(a: Molecule, b: Molecule): Molecule {
  const offsetA: Vec3 = vec3(-2.5, 0, 0);
  const offsetB: Vec3 = vec3(2.5, 0, 0);
  const combinedAtoms: Atom[] = [
    ...a.atoms.map((atom) => ({
      ...atom,
      id: uuidv4(),
      position: vec3Add(atom.position, offsetA),
    })),
    ...b.atoms.map((atom) => ({
      ...atom,
      id: uuidv4(),
      position: vec3Add(atom.position, offsetB),
    })),
  ];
  const idMap = new Map<string, string>();
  a.atoms.forEach((atom, i) => idMap.set(atom.id, combinedAtoms[i].id));
  b.atoms.forEach((atom, i) => idMap.set(atom.id, combinedAtoms[a.atoms.length + i].id));

  const combinedBonds: Bond[] = [
    ...a.bonds.map((b) => ({
      ...b,
      id: uuidv4(),
      atomA: idMap.get(b.atomA)!,
      atomB: idMap.get(b.atomB)!,
    })),
    ...b.bonds.map((b) => ({
      ...b,
      id: uuidv4(),
      atomA: idMap.get(b.atomA)!,
      atomB: idMap.get(b.atomB)!,
    })),
  ];

  return {
    id: uuidv4(),
    name: `${a.name}+${b.name}`,
    atoms: combinedAtoms,
    bonds: combinedBonds,
  };
}

function interpolateAtoms(
  startAtoms: Atom[],
  endAtoms: Atom[],
  t: number
): Atom[] {
  const count = Math.max(startAtoms.length, endAtoms.length);
  const result: Atom[] = [];
  for (let i = 0; i < count; i++) {
    const startAtom = startAtoms[i];
    const endAtom = endAtoms[i];
    if (startAtom && endAtom) {
      const mid = vec3Lerp(startAtom.position, endAtom.position, 0.5);
      const helixRadius = 0.8 * Math.sin(Math.PI * t);
      const helixAngle = t * Math.PI * 2;
      const helixOffset: Vec3 = vec3(
        Math.cos(helixAngle) * helixRadius,
        Math.sin(helixAngle) * helixRadius,
        Math.sin(Math.PI * t) * 0.5
      );
      const basePos = vec3Lerp(startAtom.position, endAtom.position, t);
      result.push({
        id: startAtom.id,
        element: t < 0.5 ? startAtom.element : endAtom.element,
        position: vec3Add(
          basePos,
          vec3Scale(helixOffset, distance(startAtom.position, endAtom.position) > 0.1 ? 1 : 0)
        ),
        charge: startAtom.charge + (endAtom.charge - startAtom.charge) * t,
      });
    } else if (startAtom) {
      result.push({
        ...startAtom,
        position: { ...startAtom.position },
      });
    } else if (endAtom) {
      result.push({
        ...endAtom,
        position: { ...endAtom.position },
      });
    }
  }
  return result;
}

function interpolateBonds(
  startBonds: Bond[],
  endBonds: Bond[],
  t: number,
  atoms: Atom[]
): Bond[] {
  if (t < 0.33) return startBonds.map((b) => ({ ...b }));
  if (t > 0.66) return endBonds.map((b) => ({ ...b }));
  const combined: Bond[] = [];
  const seen = new Set<string>();
  [...startBonds, ...endBonds].forEach((b) => {
    const key = [b.atomA, b.atomB].sort().join('-');
    if (!seen.has(key)) {
      seen.add(key);
      combined.push({ ...b });
    }
  });
  return combined;
}

function identifyTransitionStates(path: ReactionPoint[]): ReactionPoint[] {
  if (path.length < 3) return path;
  return path.map((point, i) => {
    if (i === 0) return { ...point, label: 'reactant' as const };
    if (i === path.length - 1) return { ...point, label: 'product' as const };
    const prev = path[i - 1].energy;
    const next = path[i + 1].energy;
    const curr = point.energy;
    if (curr > prev && curr > next) return { ...point, label: 'transition' as const };
    if (curr < prev && curr < next) return { ...point, label: 'intermediate' as const };
    return point;
  });
}

export class ReactionSimulator {
  simulate(reactantA: Molecule, reactantB: Molecule): ReactionResult {
    const reactants = combineMolecules(reactantA, reactantB);
    const product = this.generateProduct(reactants);
    const steps = 40;
    const path: ReactionPoint[] = [];
    const startEnergy = calculateMoleculeEnergy(reactants);
    const endEnergy = calculateMoleculeEnergy(product);
    const enthalpy = endEnergy - startEnergy;
    const barrier = Math.abs(enthalpy) * 0.6 + 150;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const atoms = interpolateAtoms(reactants.atoms, product.atoms, t);
      const bonds = interpolateBonds(reactants.bonds, product.bonds, t, atoms);
      const mol: Molecule = {
        id: uuidv4(),
        name: `frame_${i}`,
        atoms,
        bonds,
      };
      const baseEnergy = startEnergy + (endEnergy - startEnergy) * t;
      const gaussian = Math.exp(-Math.pow((t - 0.5) * 2.5, 2));
      const energy = baseEnergy + barrier * gaussian;
      path.push({
        coordinate: t,
        energy,
        molecule: mol,
      });
    }

    const labeledPath = identifyTransitionStates(path);
    const maxEnergy = Math.max(...labeledPath.map((p) => p.energy));
    const activationEnergy = maxEnergy - startEnergy;

    return {
      path: labeledPath,
      enthalpy: Math.round(enthalpy * 10) / 10,
      activationEnergy: Math.round(activationEnergy * 10) / 10,
      reactionType: this.determineReactionType(reactants, product),
    };
  }

  private generateProduct(reactants: Molecule): Molecule {
    const product = cloneMolecule(reactants);
    if (product.atoms.length >= 2) {
      const mid = Math.floor(product.atoms.length / 2);
      for (let i = 0; i < mid && i + mid < product.atoms.length; i++) {
        const a1 = product.atoms[i];
        const a2 = product.atoms[i + mid];
        if (a1 && a2 && a1.element !== 'H' && a2.element !== 'H') {
          const dir = vec3Normalize(vec3Sub(a2.position, a1.position));
          const newDist = (ELEMENT_INFO[a1.element].radius + ELEMENT_INFO[a2.element].radius) * 1.0;
          const center = vec3Lerp(a1.position, a2.position, 0.5);
          a1.position = vec3Add(center, vec3Scale(dir, -newDist / 2));
          a2.position = vec3Add(center, vec3Scale(dir, newDist / 2));
          const exists = product.bonds.some(
            (b) =>
              (b.atomA === a1.id && b.atomB === a2.id) ||
              (b.atomA === a2.id && b.atomB === a1.id)
          );
          if (!exists) {
            product.bonds.push({
              id: uuidv4(),
              atomA: a1.id,
              atomB: a2.id,
              order: 1,
            });
          }
        }
      }
    }
    return product;
  }

  private determineReactionType(_reactants: Molecule, _product: Molecule): string {
    const types = ['加成反应', '取代反应', '氧化还原反应', '分解反应', '聚合反应'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getFrameAtProgress(path: ReactionPoint[], progress: number): Molecule {
    if (path.length === 0) {
      return { id: uuidv4(), name: 'empty', atoms: [], bonds: [] };
    }
    if (progress <= 0) return path[0].molecule;
    if (progress >= 1) return path[path.length - 1].molecule;
    const scaled = progress * (path.length - 1);
    const idx = Math.floor(scaled);
    const t = scaled - idx;
    const start = path[idx];
    const end = path[Math.min(idx + 1, path.length - 1)];
    const atoms = interpolateAtoms(start.molecule.atoms, end.molecule.atoms, t);
    const bonds = interpolateBonds(start.molecule.bonds, end.molecule.bonds, t, atoms);
    return {
      id: uuidv4(),
      name: 'interp',
      atoms,
      bonds,
    };
  }
}
