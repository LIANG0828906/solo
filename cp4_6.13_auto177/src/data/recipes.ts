import { Recipe } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: 'stone_axe',
    name: '石斧',
    iconColor: '#95a5a6',
    requirements: {
      stone: 4,
      wood: 2,
    },
  },
  {
    id: 'stone_pickaxe',
    name: '石镐',
    iconColor: '#7f8c8d',
    requirements: {
      stone: 3,
      wood: 2,
    },
  },
  {
    id: 'leather_boots',
    name: '皮靴',
    iconColor: '#d35400',
    requirements: {
      leather: 1,
      string: 4,
    },
  },
  {
    id: 'iron_sword',
    name: '铁剑',
    iconColor: '#ecf0f1',
    requirements: {
      iron: 3,
      wood: 1,
    },
  },
  {
    id: 'leather_armor',
    name: '皮甲',
    iconColor: '#e67e22',
    requirements: {
      leather: 5,
      string: 2,
    },
  },
  {
    id: 'bow',
    name: '弓',
    iconColor: '#8b4513',
    requirements: {
      wood: 3,
      string: 3,
    },
  },
];
