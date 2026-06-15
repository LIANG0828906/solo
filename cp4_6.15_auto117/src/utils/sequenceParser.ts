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

export const DEFAULT_HELIX_RADIUS = 2;
export const DEFAULT_HELIX_PITCH = 3.5;
export const DEFAULT_BASES_PER_TURN = 10;
export const DEFAULT_BASE_PAIR_HEIGHT = 0.35;

export const HELIX_RADIUS = DEFAULT_HELIX_RADIUS;
export const HELIX_PITCH = DEFAULT_HELIX_PITCH;
export const BASES_PER_TURN = DEFAULT_BASES_PER_TURN;
export const BASE_PAIR_HEIGHT = DEFAULT_BASE_PAIR_HEIGHT;

export function getDynamicHelixParams(totalBases: number): {
  radius: number;
  pitch: number;
  basesPerTurn: number;
  basePairHeight: number;
} {
  const minBases = 50;
  const maxBases = 200;
  const t = Math.max(0, Math.min(1, (totalBases - minBases) / (maxBases - minBases)));

  const radius = DEFAULT_HELIX_RADIUS * (0.8 + t * 0.6);
  const pitch = DEFAULT_HELIX_PITCH * (0.85 + t * 0.3);
  const basesPerTurn = DEFAULT_BASES_PER_TURN;
  const basePairHeight = pitch / basesPerTurn;

  return { radius, pitch, basesPerTurn, basePairHeight };
}

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
  totalBases: number,
  customRadius?: number,
  customBasePairHeight?: number,
  customBasesPerTurn?: number
): {
  position: [number, number, number];
  rotation: [number, number, number];
  helixAngle: number;
} {
  const radius = customRadius ?? HELIX_RADIUS;
  const basePairHeight = customBasePairHeight ?? BASE_PAIR_HEIGHT;
  const basesPerTurn = customBasesPerTurn ?? BASES_PER_TURN;

  const anglePerBase = (2 * Math.PI) / basesPerTurn;
  const helixAngle = index * anglePerBase;
  const yOffset = (index - (totalBases - 1) / 2) * basePairHeight;

  const x = radius * Math.cos(helixAngle);
  const y = yOffset;
  const z = radius * Math.sin(helixAngle);

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
  const { radius, basePairHeight, basesPerTurn } = getDynamicHelixParams(totalBases);

  for (let i = 0; i < sequence.length; i++) {
    const base1 = sequence[i] as BaseType;
    const base2 = getComplementaryBase(base1);
    const { position, rotation, helixAngle } = calculateBasePairPosition(
      i,
      totalBases,
      radius,
      basePairHeight,
      basesPerTurn
    );

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
