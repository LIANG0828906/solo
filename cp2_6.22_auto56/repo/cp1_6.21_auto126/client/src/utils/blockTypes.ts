import { BlockType, BlockConfig } from '../types';

export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  [BlockType.WOOD]: {
    type: BlockType.WOOD,
    name: '木头',
    color: '#8D6E63',
    opacity: 1.0,
    transparent: false
  },
  [BlockType.STONE]: {
    type: BlockType.STONE,
    name: '石头',
    color: '#78909C',
    opacity: 1.0,
    transparent: false
  },
  [BlockType.GLASS]: {
    type: BlockType.GLASS,
    name: '玻璃',
    color: '#81D4FA',
    opacity: 0.6,
    transparent: true
  },
  [BlockType.GRASS]: {
    type: BlockType.GRASS,
    name: '草地',
    color: '#4CAF50',
    opacity: 1.0,
    transparent: false
  },
  [BlockType.DIRT]: {
    type: BlockType.DIRT,
    name: '泥土',
    color: '#6D4C41',
    opacity: 1.0,
    transparent: false
  },
  [BlockType.BRICK]: {
    type: BlockType.BRICK,
    name: '砖块',
    color: '#B71C1C',
    opacity: 1.0,
    transparent: false
  },
  [BlockType.TREE_TRUNK]: {
    type: BlockType.TREE_TRUNK,
    name: '树干',
    color: '#795548',
    opacity: 1.0,
    transparent: false
  },
  [BlockType.TREE_LEAVES]: {
    type: BlockType.TREE_LEAVES,
    name: '树叶',
    color: '#388E3C',
    opacity: 1.0,
    transparent: false
  },
  [BlockType.FLOWER]: {
    type: BlockType.FLOWER,
    name: '花朵',
    color: '#FF6B6B',
    opacity: 1.0,
    transparent: false
  }
};

export const TOOLBAR_BLOCKS: BlockType[] = [
  BlockType.WOOD,
  BlockType.STONE,
  BlockType.GLASS,
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.BRICK
];

export function getBlockColor(type: BlockType, customColor?: string): string {
  if (type === BlockType.FLOWER && customColor) {
    return customColor;
  }
  return BLOCK_CONFIGS[type]?.color || '#FFFFFF';
}

export function getBlockOpacity(type: BlockType): number {
  return BLOCK_CONFIGS[type]?.opacity || 1.0;
}

export function isBlockTransparent(type: BlockType): boolean {
  return BLOCK_CONFIGS[type]?.transparent || false;
}
