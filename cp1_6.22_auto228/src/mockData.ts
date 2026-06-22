import { MoleculeData, AtomType, BondType, ElementType } from './types';

const RESIDUES = [
  'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY',
  'HIS', 'ILE', 'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER',
  'THR', 'TRP', 'TYR', 'VAL',
];

const BACKBONE_ATOMS: { name: string; element: ElementType; offsets: [number, number, number] }[] = [
  { name: 'N', element: 'N', offsets: [0, 0, 0] },
  { name: 'CA', element: 'C', offsets: [0.5, 0.3, 0.1] },
  { name: 'C', element: 'C', offsets: [1.0, 0.0, -0.2] },
  { name: 'O', element: 'O', offsets: [1.2, -0.8, -0.3] },
];

const SIDECHAIN_ATOMS: Record<string, { name: string; element: ElementType; offsets: [number, number, number] }[]> = {
  ALA: [{ name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] }],
  ARG: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD', element: 'C', offsets: [0.5, 2.0, 0.7] },
    { name: 'NE', element: 'N', offsets: [0.5, 2.6, 1.2] },
    { name: 'CZ', element: 'C', offsets: [0.5, 3.2, 0.7] },
    { name: 'NH1', element: 'N', offsets: [1.0, 3.4, 0.2] },
    { name: 'NH2', element: 'N', offsets: [0.0, 3.4, 1.2] },
  ],
  ASN: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'OD1', element: 'O', offsets: [0.9, 1.5, 1.8] },
    { name: 'ND2', element: 'N', offsets: [0.1, 2.0, 1.0] },
  ],
  ASP: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'OD1', element: 'O', offsets: [0.9, 1.8, 1.7] },
    { name: 'OD2', element: 'O', offsets: [0.1, 1.8, 0.7] },
  ],
  CYS: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'SG', element: 'S', offsets: [0.5, 1.5, 1.2] },
  ],
  GLN: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD', element: 'C', offsets: [0.5, 2.0, 0.7] },
    { name: 'OE1', element: 'O', offsets: [0.9, 2.4, 0.2] },
    { name: 'NE2', element: 'N', offsets: [0.1, 2.4, 1.2] },
  ],
  GLU: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD', element: 'C', offsets: [0.5, 2.0, 0.7] },
    { name: 'OE1', element: 'O', offsets: [0.9, 2.4, 0.2] },
    { name: 'OE2', element: 'O', offsets: [0.1, 2.4, 1.2] },
  ],
  GLY: [],
  HIS: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'ND1', element: 'N', offsets: [0.9, 1.8, 1.6] },
    { name: 'CD2', element: 'C', offsets: [0.1, 2.0, 1.4] },
    { name: 'CE1', element: 'C', offsets: [0.7, 2.4, 1.8] },
    { name: 'NE2', element: 'N', offsets: [0.2, 2.4, 1.8] },
  ],
  ILE: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG1', element: 'C', offsets: [0.8, 1.4, 1.0] },
    { name: 'CG2', element: 'C', offsets: [0.2, 1.4, 0.4] },
    { name: 'CD1', element: 'C', offsets: [1.1, 2.0, 0.6] },
  ],
  LEU: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD1', element: 'C', offsets: [0.9, 2.0, 1.5] },
    { name: 'CD2', element: 'C', offsets: [0.1, 2.0, 1.0] },
  ],
  LYS: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD', element: 'C', offsets: [0.5, 2.0, 0.7] },
    { name: 'CE', element: 'C', offsets: [0.5, 2.6, 1.2] },
    { name: 'NZ', element: 'N', offsets: [0.5, 3.2, 0.7] },
  ],
  MET: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'SD', element: 'S', offsets: [0.5, 2.0, 0.7] },
    { name: 'CE', element: 'C', offsets: [0.5, 2.8, 1.0] },
  ],
  PHE: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD1', element: 'C', offsets: [0.9, 1.8, 1.6] },
    { name: 'CD2', element: 'C', offsets: [0.1, 1.8, 1.0] },
    { name: 'CE1', element: 'C', offsets: [0.9, 2.4, 2.0] },
    { name: 'CE2', element: 'C', offsets: [0.1, 2.4, 1.0] },
    { name: 'CZ', element: 'C', offsets: [0.5, 2.8, 1.6] },
  ],
  PRO: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD', element: 'C', offsets: [0.0, 1.2, 1.6] },
  ],
  SER: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'OG', element: 'O', offsets: [0.8, 1.3, 1.2] },
  ],
  THR: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'OG1', element: 'O', offsets: [0.8, 1.3, 1.2] },
    { name: 'CG2', element: 'C', offsets: [0.2, 1.3, 0.3] },
  ],
  TRP: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD1', element: 'C', offsets: [0.9, 1.8, 1.6] },
    { name: 'CD2', element: 'C', offsets: [0.1, 2.0, 1.0] },
    { name: 'NE1', element: 'N', offsets: [0.7, 2.4, 1.8] },
    { name: 'CE2', element: 'C', offsets: [0.2, 2.6, 1.2] },
    { name: 'CE3', element: 'C', offsets: [-0.3, 2.2, 0.6] },
    { name: 'CZ2', element: 'C', offsets: [0.2, 3.2, 1.4] },
    { name: 'CZ3', element: 'C', offsets: [-0.3, 2.8, 0.4] },
    { name: 'CH2', element: 'C', offsets: [-0.1, 3.4, 0.8] },
  ],
  TYR: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG', element: 'C', offsets: [0.5, 1.4, 1.2] },
    { name: 'CD1', element: 'C', offsets: [0.9, 1.8, 1.6] },
    { name: 'CD2', element: 'C', offsets: [0.1, 1.8, 1.0] },
    { name: 'CE1', element: 'C', offsets: [0.9, 2.4, 2.0] },
    { name: 'CE2', element: 'C', offsets: [0.1, 2.4, 1.0] },
    { name: 'CZ', element: 'C', offsets: [0.5, 2.8, 1.6] },
    { name: 'OH', element: 'O', offsets: [0.5, 3.4, 2.0] },
  ],
  VAL: [
    { name: 'CB', element: 'C', offsets: [0.5, 0.8, 0.7] },
    { name: 'CG1', element: 'C', offsets: [0.8, 1.4, 1.0] },
    { name: 'CG2', element: 'C', offsets: [0.2, 1.4, 0.4] },
  ],
};

function generateMolecule(): MoleculeData {
  const atoms: AtomType[] = [];
  const bonds: BondType[] = [];
  let atomId = 0;
  const numResidues = 55;

  const helixParams = {
    radius: 3.0,
    pitch: 1.5,
    turns: 3,
  };

  for (let r = 0; r < numResidues; r++) {
    const t = (r / numResidues) * helixParams.turns * Math.PI * 2;
    const resName = RESIDUES[r % RESIDUES.length];
    const baseX = helixParams.radius * Math.cos(t);
    const baseY = (r / numResidues) * helixParams.pitch * helixParams.turns * 2;
    const baseZ = helixParams.radius * Math.sin(t);

    const radAngle = t * 0.3;
    const cosA = Math.cos(radAngle);
    const sinA = Math.sin(radAngle);

    const resAtomStart = atomId;
    const backboneIds: number[] = [];

    for (const ba of BACKBONE_ATOMS) {
      const ox = ba.offsets[0] * cosA - ba.offsets[2] * sinA;
      const oz = ba.offsets[0] * sinA + ba.offsets[2] * cosA;
      const oy = ba.offsets[1];

      atoms.push({
        id: atomId,
        element: ba.element,
        x: baseX + ox,
        y: baseY + oy,
        z: baseZ + oz,
        residueName: resName,
        residueId: r + 1,
        atomName: ba.name,
      });
      backboneIds.push(atomId);
      atomId++;
    }

    for (let i = 1; i < backboneIds.length; i++) {
      bonds.push({ atom1Id: backboneIds[i - 1], atom2Id: backboneIds[i], order: 1 });
    }

    if (r > 0) {
      bonds.push({ atom1Id: resAtomStart, atom2Id: resAtomStart - 1, order: 1 });
    }

    const sidechain = SIDECHAIN_ATOMS[resName] || [];
    const sidechainIds: number[] = [];
    for (const sa of sidechain) {
      const ox = sa.offsets[0] * cosA - sa.offsets[2] * sinA;
      const oz = sa.offsets[0] * sinA + sa.offsets[2] * cosA;
      const oy = sa.offsets[1];

      atoms.push({
        id: atomId,
        element: sa.element,
        x: baseX + ox,
        y: baseY + oy,
        z: baseZ + oz,
        residueName: resName,
        residueId: r + 1,
        atomName: sa.name,
      });
      sidechainIds.push(atomId);
      atomId++;
    }

    if (sidechainIds.length > 0) {
      bonds.push({ atom1Id: backboneIds[1], atom2Id: sidechainIds[0], order: 1 });
      for (let i = 1; i < sidechainIds.length; i++) {
        bonds.push({ atom1Id: sidechainIds[i - 1], atom2Id: sidechainIds[i], order: 1 });
      }
    }

    const hCount = resName === 'GLY' ? 2 : resName === 'ALA' ? 3 : Math.floor(Math.random() * 3) + 2;
    for (let h = 0; h < hCount && atomId < 520; h++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.4 + Math.random() * 0.3;
      const parentIdx = Math.floor(Math.random() * (backboneIds.length + sidechainIds.length));
      const parentId = parentIdx < backboneIds.length
        ? backboneIds[parentIdx]
        : sidechainIds[parentIdx - backboneIds.length];
      const parent = atoms[parentId];

      atoms.push({
        id: atomId,
        element: 'H',
        x: parent.x + Math.cos(angle) * dist,
        y: parent.y + (Math.random() - 0.5) * dist,
        z: parent.z + Math.sin(angle) * dist,
        residueName: resName,
        residueId: r + 1,
        atomName: `H${h + 1}`,
      });
      bonds.push({ atom1Id: parentId, atom2Id: atomId, order: 1 });
      atomId++;
    }
  }

  for (let i = 0; i < 10; i++) {
    const t1 = Math.random() * helixParams.turns * Math.PI * 2;
    const r1 = Math.floor(Math.random() * numResidues);
    const t = (r1 / numResidues) * helixParams.turns * Math.PI * 2;
    const bx = helixParams.radius * Math.cos(t) + (Math.random() - 0.5) * 2;
    const by = (r1 / numResidues) * helixParams.pitch * helixParams.turns * 2 + (Math.random() - 0.5);
    const bz = helixParams.radius * Math.sin(t) + (Math.random() - 0.5) * 2;

    atoms.push({
      id: atomId,
      element: 'S',
      x: bx,
      y: by,
      z: bz,
      residueName: 'CYS',
      residueId: 100 + i,
      atomName: 'SG',
    });

    const nearestId = findNearestAtom(atoms, atomId, atomId);
    if (nearestId >= 0) {
      bonds.push({ atom1Id: nearestId, atom2Id: atomId, order: 1 });
    }
    atomId++;
  }

  return { atoms, bonds };
}

function findNearestAtom(atoms: AtomType[], skipId: number, count: number): number {
  let minDist = Infinity;
  let nearestId = -1;
  const target = atoms[skipId];
  for (let i = 0; i < Math.min(count - 1, atoms.length); i++) {
    if (atoms[i].id === skipId) continue;
    const dx = atoms[i].x - target.x;
    const dy = atoms[i].y - target.y;
    const dz = atoms[i].z - target.z;
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < minDist) {
      minDist = dist;
      nearestId = atoms[i].id;
    }
  }
  return nearestId;
}

export const mockMoleculeData: MoleculeData = generateMolecule();
