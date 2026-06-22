export enum BlockType {
  GRASS = 'grass',
  DIRT = 'dirt',
  WOOD = 'wood',
  STONE = 'stone',
  GLASS = 'glass',
  BRICK = 'brick',
  TREE_TRUNK = 'tree_trunk',
  TREE_LEAVES = 'tree_leaves',
  FLOWER = 'flower'
}

export interface BlockData {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  color?: string;
}

export interface PlayerData {
  id: string;
  nickname: string;
  avatarColor: string;
  position: { x: number; y: number; z: number };
}

export interface BlockConfig {
  type: BlockType;
  name: string;
  color: string;
  opacity: number;
  transparent: boolean;
}

export interface AnimatedBlock {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  color?: string;
  animation: 'place' | 'remove';
  startTime: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  startTime: number;
}
