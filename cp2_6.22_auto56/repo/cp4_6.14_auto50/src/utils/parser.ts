import { Molecule, Atom, Bond, CPK_COLORS, VDW_RADII } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface RawMolecule {
  id?: string;
  name?: string;
  formula?: string;
  atoms: Array<{
    id?: string;
    name?: string;
    element: string;
    position: [number, number, number] | number[];
  }>;
  bonds?: Array<{
    id?: string;
    from: string | number;
    to: string | number;
    order?: number;
  }>;
}

export function parseMolecule(raw: RawMolecule): Molecule {
  const atoms: Atom[] = raw.atoms.map((a, idx) => {
    const element = a.element.toUpperCase();
    const pos = a.position as [number, number, number];
    return {
      id: a.id || `atom_${idx}_${uuidv4().slice(0, 6)}`,
      name: a.name || `${element}${idx + 1}`,
      element,
      position: [pos[0], pos[1], pos[2]],
    };
  });

  const atomIndex = atoms.reduce<Record<string, Atom>>((acc, atom) => {
    acc[atom.id] = atom;
    return acc;
  }, {});

  const bonds: Bond[] = (raw.bonds || []).map((b, idx) => {
    let fromId = '';
    let toId = '';

    if (typeof b.from === 'number') {
      fromId = atoms[b.from as number].id;
    } else {
      fromId = b.from as string;
    }

    if (typeof b.to === 'number') {
      toId = atoms[b.to as number].id;
    } else {
      toId = b.to as string;
    }

    return {
      id: b.id || `bond_${idx}_${uuidv4().slice(0, 6)}`,
      from: fromId,
      to: toId,
      order: b.order || 1,
    };
  });

  return {
    id: raw.id || `mol_${uuidv4().slice(0, 8)}`,
    name: raw.name || 'Unknown',
    formula: raw.formula || '',
    atoms,
    bonds,
  };
}

export function getAtomColor(element: string): string {
  const key = element.toUpperCase();
  return CPK_COLORS[key] || '#CCCCCC';
}

export function getAtomRadius(element: string): number {
  const key = element.toUpperCase();
  return VDW_RADII[key] || 0.5;
}

export function getAtomById(molecule: Molecule, atomId: string): Atom | undefined {
  return molecule.atoms.find((a) => a.id === atomId);
}

export function centerMolecule(molecule: Molecule): Molecule {
  if (molecule.atoms.length === 0) return molecule;

  let cx = 0, cy = 0, cz = 0;
  molecule.atoms.forEach((a) => {
    cx += a.position[0];
    cy += a.position[1];
    cz += a.position[2];
  });
  cx /= molecule.atoms.length;
  cy /= molecule.atoms.length;
  cz /= molecule.atoms.length;

  const atoms = molecule.atoms.map((a) => ({
    ...a,
    position: [
      a.position[0] - cx,
      a.position[1] - cy,
      a.position[2] - cz,
    ] as [number, number, number],
  }));

  return {
    ...molecule,
    atoms,
  };
}
