import { v4 as uuidv4 } from 'uuid';
import type { BaseType, BasePair } from './sequenceParser';
import { calculateBasePairPosition } from './sequenceParser';

export type MutationType = 'point' | 'insertion' | 'deletion';

export interface MutationEffect {
  position: number;
  twistOffset: number;
  affectedRange: [number, number];
  intensity: number;
}

const COMPLEMENTARY_BASES: Record<BaseType, BaseType> = {
  A: 'T',
  T: 'A',
  G: 'C',
  C: 'G',
};

export function getComplementaryBase(base: BaseType): BaseType {
  return COMPLEMENTARY_BASES[base];
}

export function calculateTwistOffset(
  mutationPosition: number,
  distance: number,
  mutationType: MutationType
): number {
  const baseIntensity = mutationType === 'deletion' ? 0.8 : mutationType === 'insertion' ? 0.6 : 0.4;
  const decayRate = 0.15;
  const oscillationFrequency = 0.5;

  const exponentialDecay = Math.exp(-decayRate * Math.abs(distance));
  const sineOscillation = Math.sin(oscillationFrequency * Math.abs(distance));
  const twist = baseIntensity * exponentialDecay * (1 + 0.3 * sineOscillation);

  return distance >= 0 ? twist : -twist;
}

function recalculatePositions(basePairs: BasePair[]): BasePair[] {
  const totalBases = basePairs.length;
  return basePairs.map((bp, index) => {
    const { position, rotation, helixAngle } = calculateBasePairPosition(index, totalBases);
    return {
      ...bp,
      index,
      position,
      rotation,
      helixAngle,
    };
  });
}

export function applyPointMutation(
  basePairs: BasePair[],
  position: number,
  newBase: BaseType
): { basePairs: BasePair[]; effect: MutationEffect } {
  if (position < 0 || position >= basePairs.length) {
    throw new Error('Mutation position is out of bounds');
  }

  const newBasePairs = basePairs.map((bp, index) => {
    if (index === position) {
      return {
        ...bp,
        base1: newBase,
        base2: getComplementaryBase(newBase),
      };
    }
    return bp;
  });

  const effect: MutationEffect = {
    position,
    twistOffset: calculateTwistOffset(position, 0, 'point'),
    affectedRange: [Math.max(0, position - 5), Math.min(basePairs.length - 1, position + 5)],
    intensity: 0.4,
  };

  return { basePairs: newBasePairs, effect };
}

export function applyInsertion(
  basePairs: BasePair[],
  position: number,
  bases: BaseType[]
): { basePairs: BasePair[]; effect: MutationEffect } {
  if (position < 0 || position > basePairs.length) {
    throw new Error('Insertion position is out of bounds');
  }

  if (bases.length === 0) {
    throw new Error('No bases provided for insertion');
  }

  const newBasePairs: BasePair[] = [...basePairs];

  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const insertPosition = position + i;
    const newBasePair: BasePair = {
      id: uuidv4(),
      index: insertPosition,
      base1: base,
      base2: getComplementaryBase(base),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      helixAngle: 0,
    };
    newBasePairs.splice(insertPosition, 0, newBasePair);
  }

  const recalculated = recalculatePositions(newBasePairs);

  const effect: MutationEffect = {
    position,
    twistOffset: calculateTwistOffset(position, 0, 'insertion'),
    affectedRange: [Math.max(0, position - 10), Math.min(recalculated.length - 1, position + bases.length + 10)],
    intensity: 0.6,
  };

  return { basePairs: recalculated, effect };
}

export function applyDeletion(
  basePairs: BasePair[],
  position: number,
  count: number
): { basePairs: BasePair[]; deleted: BasePair[]; effect: MutationEffect } {
  if (position < 0 || position >= basePairs.length) {
    throw new Error('Deletion position is out of bounds');
  }

  if (count <= 0) {
    throw new Error('Deletion count must be greater than 0');
  }

  if (position + count > basePairs.length) {
    throw new Error('Deletion range exceeds sequence length');
  }

  const deleted = basePairs.slice(position, position + count);
  const newBasePairs = [...basePairs];
  newBasePairs.splice(position, count);

  const recalculated = recalculatePositions(newBasePairs);

  const effect: MutationEffect = {
    position,
    twistOffset: calculateTwistOffset(position, 0, 'deletion'),
    affectedRange: [Math.max(0, position - 10), Math.min(recalculated.length - 1, position + 10)],
    intensity: 0.8,
  };

  return { basePairs: recalculated, deleted, effect };
}
