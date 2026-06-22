export type BlockType = 'I4' | 'L4' | 'T4' | 'Z4' | 'SQUARE' | 'I3' | 'L3';

export type GravityDirection = 'down' | 'left' | 'up' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface Block {
  id: string;
  type: BlockType;
  position: Position;
  rotation: number;
  color: string;
}

export interface TargetArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  gridSize: number;
  obstacles: Position[];
  blocks: { type: BlockType; position: Position; rotation: number }[];
  targetArea: TargetArea;
}

export const BLOCK_COLORS: Record<BlockType, string> = {
  I4: '#ff4444',
  L4: '#4488ff',
  T4: '#44cc44',
  Z4: '#ffcc00',
  SQUARE: '#aa44ff',
  I3: '#00cccc',
  L3: '#ff8844',
};

export const BLOCK_SHAPES: Record<BlockType, Position[]> = {
  I4: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ],
  L4: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  T4: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
  ],
  Z4: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  SQUARE: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  I3: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ],
  L3: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
};

export const GRAVITY_ORDER: GravityDirection[] = ['down', 'left', 'up', 'right'];
