import { Atom, Bond, MoleculeData, ParsedMolecule } from '../types';
import { ELEMENT_CONFIG } from '../data/molecules';

export function parseMolecule(data: MoleculeData): ParsedMolecule {
  const atoms: Atom[] = data.atoms.map((atomData, index) => {
    const config = ELEMENT_CONFIG[atomData.element];
    return {
      id: `atom-${index}`,
      element: atomData.element,
      position: atomData.position,
      radius: config.radius,
      color: config.color,
    };
  });

  const bonds: Bond[] = data.bonds.map((bondData, index) => {
    const fromAtom = atoms[bondData.from];
    const toAtom = atoms[bondData.to];
    return {
      id: `bond-${index}`,
      from: fromAtom.id,
      to: toAtom.id,
      type: bondData.type,
    };
  });

  return { atoms, bonds };
}
