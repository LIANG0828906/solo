import { Atom, Bond, Molecule, VDW_RADII } from './types';

export function parsePDB(pdbString: string, name: string = 'molecule'): Molecule {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const lines = pdbString.split('\n');
  let atomId = 0;
  let bondId = 0;

  const atomSerialToIndex = new Map<number, number>();

  for (const line of lines) {
    if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
      const serial = parseInt(line.substring(6, 11).trim(), 10);
      const atomName = line.substring(12, 16).trim();
      const residueName = line.substring(17, 20).trim();
      const chainId = line.substring(21, 22).trim();
      const residueNumber = parseInt(line.substring(22, 26).trim(), 10);
      const x = parseFloat(line.substring(30, 38).trim());
      const y = parseFloat(line.substring(38, 46).trim());
      const z = parseFloat(line.substring(46, 54).trim());
      const elementRaw = line.substring(76, 78).trim() || atomName.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase();
      const element = elementRaw.length > 0 ? elementRaw.charAt(0).toUpperCase() + elementRaw.slice(1).toLowerCase() : 'C';

      const vdwRadius = VDW_RADII[element] || VDW_RADII['C'];

      const atom: Atom = {
        id: atomId,
        name: atomName,
        element: element,
        x,
        y,
        z,
        residueName,
        residueNumber,
        chainId,
        vdwRadius,
      };

      atoms.push(atom);
      atomSerialToIndex.set(serial, atomId);
      atomId++;
    }

    if (line.startsWith('CONECT')) {
      const parts: number[] = [];
      for (let i = 0; i < 6; i++) {
        const start = 6 + i * 5;
        const end = start + 5;
        if (end <= line.length) {
          const val = parseInt(line.substring(start, end).trim(), 10);
          if (!isNaN(val)) {
            parts.push(val);
          }
        }
      }

      if (parts.length >= 2) {
        const source = parts[0];
        for (let i = 1; i < parts.length; i++) {
          const target = parts[i];
          const sourceIdx = atomSerialToIndex.get(source);
          const targetIdx = atomSerialToIndex.get(target);
          if (sourceIdx !== undefined && targetIdx !== undefined && sourceIdx < targetIdx) {
            bonds.push({
              id: bondId++,
              atom1Index: sourceIdx,
              atom2Index: targetIdx,
              bondOrder: 1,
            });
          }
        }
      }
    }
  }

  if (bonds.length === 0 && atoms.length > 1) {
    bonds.push(...inferBondsFromDistance(atoms));
  }

  return { atoms, bonds, name };
}

function inferBondsFromDistance(atoms: Atom[]): Bond[] {
  const bonds: Bond[] = [];
  const bondThreshold = 1.9;
  let bondId = 0;

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const dz = atoms[i].z - atoms[j].z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < bondThreshold) {
        bonds.push({
          id: bondId++,
          atom1Index: i,
          atom2Index: j,
          bondOrder: 1,
        });
      }
    }
  }

  return bonds;
}

export function centerMolecule(molecule: Molecule): { molecule: Molecule; center: { x: number; y: number; z: number } } {
  if (molecule.atoms.length === 0) {
    return { molecule, center: { x: 0, y: 0, z: 0 } };
  }

  let sumX = 0, sumY = 0, sumZ = 0;
  for (const atom of molecule.atoms) {
    sumX += atom.x;
    sumY += atom.y;
    sumZ += atom.z;
  }

  const center = {
    x: sumX / molecule.atoms.length,
    y: sumY / molecule.atoms.length,
    z: sumZ / molecule.atoms.length,
  };

  const centeredAtoms = molecule.atoms.map(atom => ({
    ...atom,
    x: atom.x - center.x,
    y: atom.y - center.y,
    z: atom.z - center.z,
  }));

  return {
    molecule: { ...molecule, atoms: centeredAtoms },
    center,
  };
}
