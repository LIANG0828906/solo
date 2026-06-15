import { Molecule, Atom, VibrationFrame, VibrationMode } from '../types/molecule';

export function calculateVibration(
  molecule: Molecule,
  mode: VibrationMode,
  time: number,
  amplitude: number
): VibrationFrame {
  const displacements: Record<string, { x: number; y: number; z: number }> = {};
  const omega = 2 * Math.PI * mode.frequency;
  const phase = omega * time;

  const center = calculateCenter(molecule.atoms);

  molecule.atoms.forEach((atom) => {
    const displacement = calculateAtomDisplacement(atom, molecule, mode, phase, amplitude, center);
    displacements[atom.id] = displacement;
  });

  return {
    time,
    displacements,
  };
}

function calculateCenter(atoms: Atom[]): { x: number; y: number; z: number } {
  if (atoms.length === 0) return { x: 0, y: 0, z: 0 };

  const sum = atoms.reduce(
    (acc, atom) => ({
      x: acc.x + atom.x,
      y: acc.y + atom.y,
      z: acc.z + atom.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / atoms.length,
    y: sum.y / atoms.length,
    z: sum.z / atoms.length,
  };
}

function calculateAtomDisplacement(
  atom: Atom,
  molecule: Molecule,
  mode: VibrationMode,
  phase: number,
  amplitude: number,
  center: { x: number; y: number; z: number }
): { x: number; y: number; z: number } {
  const amp = amplitude * 0.5;
  const sinVal = Math.sin(phase);
  const cosVal = Math.cos(phase);

  const dx = atom.x - center.x;
  const dy = atom.y - center.y;
  const dz = atom.z - center.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  switch (mode.id) {
    case 'symmetric-stretch':
      return {
        x: (dx / dist) * amp * sinVal,
        y: (dy / dist) * amp * sinVal,
        z: (dz / dist) * amp * sinVal,
      };

    case 'asymmetric-stretch': {
      const bondedAtoms = getBondedAtoms(atom.id, molecule);
      if (bondedAtoms.length === 0) return { x: 0, y: 0, z: 0 };

      const totalDisp = bondedAtoms.reduce(
        (acc, bonded) => {
          const bdx = bonded.x - atom.x;
          const bdy = bonded.y - atom.y;
          const bdz = bonded.z - atom.z;
          const bdist = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz) || 1;
          return {
            x: acc.x + (bdx / bdist),
            y: acc.y + (bdy / bdist),
            z: acc.z + (bdz / bdist),
          };
        },
        { x: 0, y: 0, z: 0 }
      );

      const tdist = Math.sqrt(totalDisp.x ** 2 + totalDisp.y ** 2 + totalDisp.z ** 2) || 1;
      return {
        x: (totalDisp.x / tdist) * amp * sinVal,
        y: (totalDisp.y / tdist) * amp * sinVal,
        z: (totalDisp.z / tdist) * amp * sinVal,
      };
    }

    case 'bending': {
      const perpX = -dy / dist;
      const perpY = dx / dist;
      const perpZ = 0;
      const pdist = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
      return {
        x: (perpX / pdist) * amp * sinVal * 0.5,
        y: (perpY / pdist) * amp * sinVal * 0.5,
        z: amp * cosVal * 0.5,
      };
    }

    case 'scissoring': {
      const angle = Math.atan2(dy, dx);
      const perpAngle = angle + Math.PI / 2;
      return {
        x: Math.cos(perpAngle) * amp * sinVal * 0.5,
        y: Math.sin(perpAngle) * amp * sinVal * 0.5,
        z: 0,
      };
    }

    case 'rocking': {
      const rockAngle = sinVal * 0.2 * amplitude;
      const cosR = Math.cos(rockAngle);
      const sinR = Math.sin(rockAngle);
      return {
        x: dx * (cosR - 1) - dz * sinR,
        y: 0,
        z: dx * sinR + dz * (cosR - 1),
      };
    }

    case 'twisting': {
      const twistAngle = sinVal * 0.3 * amplitude;
      const cosT = Math.cos(twistAngle);
      const sinT = Math.sin(twistAngle);
      const heightFactor = dz / Math.max(dist, 1);
      return {
        x: dx * (cosT - 1) * heightFactor - dy * sinT * heightFactor,
        y: dx * sinT * heightFactor + dy * (cosT - 1) * heightFactor,
        z: 0,
      };
    }

    default:
      return {
        x: dx * amp * sinVal * 0.1,
        y: dy * amp * sinVal * 0.1,
        z: dz * amp * sinVal * 0.1,
      };
  }
}

function getBondedAtoms(atomId: string, molecule: Molecule): Atom[] {
  const bondedIds = new Set<string>();
  molecule.bonds.forEach((bond) => {
    if (bond.atom1Id === atomId) bondedIds.add(bond.atom2Id);
    if (bond.atom2Id === atomId) bondedIds.add(bond.atom1Id);
  });
  return molecule.atoms.filter((a) => bondedIds.has(a.id));
}

export function generateTrajectoryPoints(
  atom: Atom,
  molecule: Molecule,
  mode: VibrationMode,
  amplitude: number,
  numPoints: number = 60
): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = [];
  const center = calculateCenter(molecule.atoms);

  for (let i = 0; i <= numPoints; i++) {
    const phase = (i / numPoints) * Math.PI * 2;
    const displacement = calculateAtomDisplacement(atom, molecule, mode, phase, amplitude, center);
    points.push({
      x: atom.x + displacement.x,
      y: atom.y + displacement.y,
      z: atom.z + displacement.z,
    });
  }

  return points;
}

export function getBackgroundColorGradient(time: number, isVibrating: boolean): string {
  if (!isVibrating) {
    return 'linear-gradient(180deg, #0a0e27 0%, #1a1a3e 100%)';
  }

  const t = (Math.sin(time * 0.5) + 1) / 2;
  const r1 = Math.round(10 + t * 10);
  const g1 = Math.round(14 + t * 5);
  const b1 = Math.round(39 + t * 30);
  const r2 = Math.round(26 + t * 20);
  const g2 = Math.round(26 + t * 10);
  const b2 = Math.round(62 + t * 40);

  return `linear-gradient(180deg, rgb(${r1}, ${g1}, ${b1}) 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`;
}
