export type PipeType = 'water' | 'power' | 'gas';

export interface PipeData {
  id: string;
  type: PipeType;
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  radius: number;
  depth: number;
}

export interface CollisionPair {
  pipeA: PipeData;
  pipeB: PipeData;
  closestPoint: { x: number; y: number; z: number };
  minDistance: number;
}

export interface RawPipeInput {
  id?: string;
  type: PipeType;
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  radius: number;
  depth?: number;
}

export const PIPE_COLORS: Record<PipeType, number> = {
  water: 0x2196F3,
  power: 0xFFEB3B,
  gas: 0xFF9800,
};

export const PIPE_LABELS: Record<PipeType, string> = {
  water: '供水 Water',
  power: '电力 Power',
  gas: '燃气 Gas',
};

export const PIPE_ABBR: Record<PipeType, string> = {
  water: 'W',
  power: 'P',
  gas: 'G',
};
