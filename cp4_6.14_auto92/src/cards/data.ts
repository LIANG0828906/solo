import { CardEffect } from './effects';

export const cardTemplates: CardEffect[] = [
  {
    id: 'draw-1',
    name: '抽牌术',
    type: 'draw',
    priority: 3,
    params: { count: 2 },
    description: '从牌库抽2张牌'
  },
  {
    id: 'buff-attack',
    name: '力量增幅',
    type: 'buff',
    priority: 5,
    params: { stat: 'attack', value: 3 },
    description: '攻击力+3'
  },
  {
    id: 'buff-defense',
    name: '护盾术',
    type: 'buff',
    priority: 4,
    params: { stat: 'defense', value: 2 },
    description: '防御力+2'
  },
  {
    id: 'copy-card',
    name: '镜像复制',
    type: 'copy',
    priority: 2,
    params: { targetIndex: 0 },
    description: '复制场上第1张卡牌'
  },
  {
    id: 'transform',
    name: '形态转化',
    type: 'transform',
    priority: 1,
    params: { from: 'attack', to: 'defense', ratio: 0.5 },
    description: '将50%攻击力转化为防御力'
  },
  {
    id: 'clear-buffs',
    name: '净化之光',
    type: 'clear',
    priority: 6,
    params: { target: 'all' },
    description: '清除所有增益效果'
  },
  {
    id: 'draw-2',
    name: '灵感涌现',
    type: 'draw',
    priority: 4,
    params: { count: 3 },
    description: '从牌库抽3张牌'
  },
  {
    id: 'big-buff',
    name: '狂暴之力',
    type: 'buff',
    priority: 2,
    params: { stat: 'attack', value: 5 },
    description: '攻击力+5'
  }
];

export const getCardById = (id: string): CardEffect | undefined => {
  return cardTemplates.find(card => card.id === id);
};
