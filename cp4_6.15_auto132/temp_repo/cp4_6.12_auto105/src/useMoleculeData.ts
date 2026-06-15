import { useState, useCallback } from 'react';
import { Molecule, Atom, PRESET_MOLECULES, ELEMENT_ATOMIC_WEIGHT } from './moleculeData';

export interface UseMoleculeDataReturn {
  molecule: Molecule | null;
  isLoading: boolean;
  moleculeKey: string;
  loadMolecule: (key: string) => void;
}

function centerMolecule(molecule: Molecule): Molecule {
  if (molecule.atoms.length === 0) return molecule;

  let sumX = 0, sumY = 0, sumZ = 0;
  for (const atom of molecule.atoms) {
    sumX += atom.position[0];
    sumY += atom.position[1];
    sumZ += atom.position[2];
  }

  const n = molecule.atoms.length;
  const centerX = sumX / n;
  const centerY = sumY / n;
  const centerZ = sumZ / n;

  const centeredAtoms: Atom[] = molecule.atoms.map(atom => ({
    ...atom,
    position: [
      atom.position[0] - centerX,
      atom.position[1] - centerY,
      atom.position[2] - centerZ,
    ] as [number, number, number],
  }));

  return { ...molecule, atoms: centeredAtoms };
}

function calculateMolecularWeight(molecule: Molecule): number {
  let weight = 0;
  for (const atom of molecule.atoms) {
    weight += ELEMENT_ATOMIC_WEIGHT[atom.element];
  }
  return parseFloat(weight.toFixed(3));
}

export function useMoleculeData(): UseMoleculeDataReturn {
  const [moleculeKey, setMoleculeKey] = useState<string>('caffeine');
  const [molecule, setMolecule] = useState<Molecule | null>(() => {
    const initial = PRESET_MOLECULES['caffeine'];
    const centered = centerMolecule(initial);
    return { ...centered, molecularWeight: calculateMolecularWeight(centered) };
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadMolecule = useCallback((key: string) => {
    if (!PRESET_MOLECULES[key] || key === moleculeKey) return;

    setIsLoading(true);
    setMoleculeKey(key);

    setTimeout(() => {
      const target = PRESET_MOLECULES[key];
      const centered = centerMolecule(target);
      setMolecule({ ...centered, molecularWeight: calculateMolecularWeight(centered) });
      setIsLoading(false);
    }, 200);
  }, [moleculeKey]);

  return { molecule, isLoading, moleculeKey, loadMolecule };
}
