import { Atom, ScoreResult, LigandPosition } from './types';

const VDW_EPSILON = 0.1;
const COULOMB_CONSTANT = 332.0;
const SOLVATION_COEFF = -0.005;

const PARTIAL_CHARGES: Record<string, number> = {
  H: 0.05,
  C: -0.05,
  N: -0.3,
  O: -0.4,
  S: -0.2,
  P: 0.3,
};

function getLigandAtomWorldPosition(
  ligandAtom: Atom,
  position: LigandPosition
): { x: number; y: number; z: number } {
  let { x, y, z } = ligandAtom;

  const cx = Math.cos(position.rotationX);
  const sx = Math.sin(position.rotationX);
  const cy = Math.cos(position.rotationY);
  const sy = Math.sin(position.rotationY);
  const cz = Math.cos(position.rotationZ);
  const sz = Math.sin(position.rotationZ);

  let y1 = y * cx - z * sx;
  let z1 = y * sx + z * cx;

  let x2 = x * cy + z1 * sy;
  let z2 = -x * sy + z1 * cy;

  let x3 = x2 * cz - y1 * sz;
  let y3 = x2 * sz + y1 * cz;

  return {
    x: x3 + position.x,
    y: y3 + position.y,
    z: z2 + position.z,
  };
}

export function calculateScore(
  proteinAtoms: Atom[],
  ligandAtoms: Atom[],
  ligandPosition: LigandPosition
): ScoreResult {
  let vdwEnergy = 0;
  let electrostaticEnergy = 0;
  let vdwConflicts = 0;
  const conflictAtomPairs: ScoreResult['conflictAtomPairs'] = [];

  const ligandWorldPositions = ligandAtoms.map(atom =>
    getLigandAtomWorldPosition(atom, ligandPosition)
  );

  for (let i = 0; i < proteinAtoms.length; i++) {
    const pAtom = proteinAtoms[i];
    const pCharge = PARTIAL_CHARGES[pAtom.element] || 0;

    for (let j = 0; j < ligandAtoms.length; j++) {
      const lAtom = ligandAtoms[j];
      const lPos = ligandWorldPositions[j];
      const lCharge = PARTIAL_CHARGES[lAtom.element] || 0;

      const dx = pAtom.x - lPos.x;
      const dy = pAtom.y - lPos.y;
      const dz = pAtom.z - lPos.z;
      const distanceSq = dx * dx + dy * dy + dz * dz;
      const distance = Math.sqrt(distanceSq);

      if (distance < 0.01) continue;

      const vdwSum = pAtom.vdwRadius + lAtom.vdwRadius;

      if (distance < vdwSum * 0.9) {
        vdwConflicts++;
        conflictAtomPairs.push({
          proteinAtomIndex: i,
          ligandAtomIndex: j,
          distance,
        });
      }

      const sigOverR = vdwSum / distance;
      const sigOverR6 = sigOverR * sigOverR * sigOverR * sigOverR * sigOverR * sigOverR;
      const sigOverR12 = sigOverR6 * sigOverR6;
      vdwEnergy += 4 * VDW_EPSILON * (sigOverR12 - sigOverR6);

      if (pCharge !== 0 && lCharge !== 0) {
        electrostaticEnergy += (COULOMB_CONSTANT * pCharge * lCharge) / distance;
      }
    }
  }

  const solvationEnergy = calculateSolvationEnergy(proteinAtoms, ligandWorldPositions);
  const totalBindingEnergy = vdwEnergy + electrostaticEnergy + solvationEnergy;

  return {
    vdwConflicts,
    vdwEnergy,
    electrostaticEnergy,
    solvationEnergy,
    totalBindingEnergy,
    conflictAtomPairs,
  };
}

function calculateSolvationEnergy(
  proteinAtoms: Atom[],
  ligandPositions: Array<{ x: number; y: number; z: number }>
): number {
  let buriedSurface = 0;
  const probeRadius = 1.4;

  for (const lPos of ligandPositions) {
    let neighborCount = 0;
    for (const pAtom of proteinAtoms) {
      const dx = pAtom.x - lPos.x;
      const dy = pAtom.y - lPos.y;
      const dz = pAtom.z - lPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < 5) {
        neighborCount++;
      }
    }
    buriedSurface += neighborCount * 0.1;
  }

  return SOLVATION_COEFF * buriedSurface;
}

export function localEnergyMinimization(
  proteinAtoms: Atom[],
  ligandAtoms: Atom[],
  initialPosition: LigandPosition,
  options: {
    stepSize?: number;
    maxIterations?: number;
    onProgress?: (progress: number) => void;
  } = {}
): LigandPosition {
  const { stepSize = 0.1, maxIterations = 100, onProgress } = options;

  let position = { ...initialPosition };
  let bestScore = calculateScore(proteinAtoms, ligandAtoms, position).totalBindingEnergy;

  const directions = [
    { x: stepSize, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
    { x: -stepSize, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
    { x: 0, y: stepSize, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
    { x: 0, y: -stepSize, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
    { x: 0, y: 0, z: stepSize, rotationX: 0, rotationY: 0, rotationZ: 0 },
    { x: 0, y: 0, z: -stepSize, rotationX: 0, rotationY: 0, rotationZ: 0 },
  ];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let improved = false;

    for (const dir of directions) {
      const newPosition: LigandPosition = {
        x: position.x + dir.x,
        y: position.y + dir.y,
        z: position.z + dir.z,
        rotationX: position.rotationX + dir.rotationX,
        rotationY: position.rotationY + dir.rotationY,
        rotationZ: position.rotationZ + dir.rotationZ,
      };

      const newScore = calculateScore(proteinAtoms, ligandAtoms, newPosition).totalBindingEnergy;

      if (newScore < bestScore) {
        bestScore = newScore;
        position = newPosition;
        improved = true;
      }
    }

    if (onProgress) {
      onProgress((iteration + 1) / maxIterations);
    }

    if (!improved) {
      break;
    }
  }

  return position;
}

export function normalizeScoreForRadar(score: ScoreResult): {
  vdw: number;
  electrostatic: number;
  solvation: number;
} {
  const vdwScore = Math.max(0, Math.min(1, 1 - Math.abs(score.vdwEnergy) / 50));
  const electrostaticScore = Math.max(0, Math.min(1, 1 - Math.abs(score.electrostaticEnergy) / 50));
  const solvationScore = Math.max(0, Math.min(1, 1 - Math.abs(score.solvationEnergy) / 10));

  return { vdw: vdwScore, electrostatic: electrostaticScore, solvation: solvationScore };
}
