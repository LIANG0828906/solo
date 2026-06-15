import { Part, PartType } from '../types';

export const PARTS: Record<PartType, Part[]> = {
  head: [
    {
      id: 'head-1',
      type: 'head',
      name: '圆顶头盔',
      stats: { attack: 5, defense: 12, speed: 3, energy: 10 },
      color: 0x4a6fa5,
      shape: { head: 'round', torso: 'bulky', arms: 'cannon', legs: 'tank' }
    },
    {
      id: 'head-2',
      type: 'head',
      name: '棱角战盔',
      stats: { attack: 10, defense: 6, speed: 8, energy: 6 },
      color: 0x6b5b95,
      shape: { head: 'angular', torso: 'bulky', arms: 'cannon', legs: 'tank' }
    },
    {
      id: 'head-3',
      type: 'head',
      name: '全景面罩',
      stats: { attack: 6, defense: 5, speed: 15, energy: 4 },
      color: 0x88b04b,
      shape: { head: 'visor', torso: 'bulky', arms: 'cannon', legs: 'tank' }
    }
  ],
  torso: [
    {
      id: 'torso-1',
      type: 'torso',
      name: '重装胸甲',
      stats: { attack: 8, defense: 25, speed: -5, energy: 12 },
      color: 0x5b5ea6,
      shape: { head: 'round', torso: 'bulky', arms: 'cannon', legs: 'tank' }
    },
    {
      id: 'torso-2',
      type: 'torso',
      name: '轻型机甲',
      stats: { attack: 5, defense: 10, speed: 12, energy: 8 },
      color: 0xf7786b,
      shape: { head: 'round', torso: 'slim', arms: 'cannon', legs: 'tank' }
    },
    {
      id: 'torso-3',
      type: 'torso',
      name: '泰坦躯干',
      stats: { attack: 15, defense: 20, speed: -8, energy: 18 },
      color: 0x955251,
      shape: { head: 'round', torso: 'titan', arms: 'cannon', legs: 'tank' }
    }
  ],
  arms: [
    {
      id: 'arms-1',
      type: 'arms',
      name: '等离子炮',
      stats: { attack: 25, defense: 3, speed: -3, energy: -5 },
      color: 0xe15d44,
      shape: { head: 'round', torso: 'bulky', arms: 'cannon', legs: 'tank' }
    },
    {
      id: 'arms-2',
      type: 'arms',
      name: '高频刀刃',
      stats: { attack: 20, defense: 2, speed: 10, energy: 2 },
      color: 0xd65079,
      shape: { head: 'round', torso: 'bulky', arms: 'blade', legs: 'tank' }
    },
    {
      id: 'arms-3',
      type: 'arms',
      name: '能量护盾',
      stats: { attack: 5, defense: 22, speed: -2, energy: 10 },
      color: 0x009473,
      shape: { head: 'round', torso: 'bulky', arms: 'shield', legs: 'tank' }
    }
  ],
  legs: [
    {
      id: 'legs-1',
      type: 'legs',
      name: '履带底盘',
      stats: { attack: 3, defense: 15, speed: -8, energy: 5 },
      color: 0x6c5b7b,
      shape: { head: 'round', torso: 'bulky', arms: 'cannon', legs: 'tank' }
    },
    {
      id: 'legs-2',
      type: 'legs',
      name: '多足支架',
      stats: { attack: 8, defense: 8, speed: 5, energy: 6 },
      color: 0x355c7d,
      shape: { head: 'round', torso: 'bulky', arms: 'cannon', legs: 'spider' }
    },
    {
      id: 'legs-3',
      type: 'legs',
      name: '双足推进',
      stats: { attack: 6, defense: 5, speed: 20, energy: -3 },
      color: 0xc06c84,
      shape: { head: 'round', torso: 'bulky', arms: 'cannon', legs: 'bipedal' }
    }
  ]
};

export const STAT_MAX = {
  attack: 100,
  defense: 100,
  speed: 100,
  energy: 100
};

export const STAT_WEIGHTS = {
  attack: 1.5,
  defense: 1.2,
  speed: 1.0,
  energy: 0.8
};

export const BASE_HP = 500;
export const MAX_ROUNDS = 10;
export const ROUND_INTERVAL = 3000;
