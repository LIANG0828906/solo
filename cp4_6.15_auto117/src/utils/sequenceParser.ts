import { v4 as uuidv4 } from 'uuid';

export type BaseType = 'A' | 'T' | 'G' | 'C';

export interface BasePair {
  id: string;
  index: number;
  base1: BaseType;
  base2: BaseType;
  position: [number, number, number];
  rotation: [number, number, number];
  helixAngle: number;
}

export const HELIX_RADIUS = 2;
export const HELIX_PITCH = 3.5;
export const BASES_PER_TURN = 10;
export const BASE_PAIR_HEIGHT = 0.35;

export const BASE_COLORS: Record<BaseType, string> = {
  A: '#ff4757',
  T: '#3742fa',
  G: '#2ed573',
  C: '#ffa502',
};

const COMPLEMENTARY_BASES: Record<BaseType, BaseType> = {
  A: 'T',
  T: 'A',
  G: 'C',
  C: 'G',
};

export function getComplementaryBase(base: BaseType): BaseType {
  return COMPLEMENTARY_BASES[base];
}

export function calculateBasePairPosition(
  index: number,
  totalBases: number
): {
  position: [number, number, number];
  rotation: [number, number, number];
  helixAngle: number;
} {
  const anglePerBase = (2 * Math.PI) / BASES_PER_TURN;
  const helixAngle = index * anglePerBase;
  const yOffset = (index - (totalBases - 1) / 2) * BASE_PAIR_HEIGHT;

  const x = HELIX_RADIUS * Math.cos(helixAngle);
  const y = yOffset;
  const z = HELIX_RADIUS * Math.sin(helixAngle);

  const position: [number, number, number] = [x, y, z];
  const rotation: [number, number, number] = [0, -helixAngle, 0];

  return { position, rotation, helixAngle };
}

export function parseSequence(sequence: string): BasePair[] {
  if (sequence.length < 50 || sequence.length > 200) {
    throw new Error('Sequence length must be between 50 and 200 bases');
  }

  const validBases = /^[ATGC]+$/;
  if (!validBases.test(sequence)) {
    throw new Error('Sequence can only contain A, T, G, C characters');
  }

  const basePairs: BasePair[] = [];
  const totalBases = sequence.length;

  for (let i = 0; i < sequence.length; i++) {
    const base1 = sequence[i] as BaseType;
    const base2 = getComplementaryBase(base1);
    const { position, rotation, helixAngle } = calculateBasePairPosition(i, totalBases);

    basePairs.push({
      id: uuidv4(),
      index: i,
      base1,
      base2,
      position,
      rotation,
      helixAngle,
    });
  }

  return basePairs;
}
