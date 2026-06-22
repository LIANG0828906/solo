import type { LevelData } from '../types/game';

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: '入门教程',
    startX: 100,
    startY: 300,
    goalX: 700,
    goalY: 300,
    availableBlocks: {
      'n-pole': 2,
      's-pole': 2,
      'neutral': 1,
    },
  },
  {
    id: 2,
    name: '磁场转向',
    startX: 100,
    startY: 100,
    goalX: 700,
    goalY: 500,
    availableBlocks: {
      'n-pole': 3,
      's-pole': 3,
      'neutral': 2,
    },
    obstacles: [
      {
        gridX: 4,
        gridY: 3,
        width: 2,
        height: 2,
      },
    ],
  },
  {
    id: 3,
    name: '精确控制',
    startX: 100,
    startY: 300,
    goalX: 700,
    goalY: 300,
    availableBlocks: {
      'n-pole': 4,
      's-pole': 4,
      'neutral': 3,
    },
    obstacles: [
      {
        gridX: 3,
        gridY: 2,
        width: 1,
        height: 3,
      },
      {
        gridX: 6,
        gridY: 2,
        width: 1,
        height: 3,
      },
    ],
  },
];
