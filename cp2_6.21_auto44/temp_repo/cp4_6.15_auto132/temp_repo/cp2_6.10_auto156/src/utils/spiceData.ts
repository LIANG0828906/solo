import type { Spice } from '../types';

export const SPICES: Spice[] = [
  {
    id: 'pepper',
    name: 'Pepper',
    nameCN: '胡椒',
    color: '#8B4513',
    scentTags: ['辛烈', '温暖', '醒神'],
    description: '来自波斯的黑色珍珠，辛辣中带着木质香气',
    origin: '波斯国'
  },
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    nameCN: '肉桂',
    color: '#D2691E',
    scentTags: ['甘甜', '温暖', '醇厚'],
    description: '天竺国进贡的珍贵香料，甜香浓郁',
    origin: '天竺国'
  },
  {
    id: 'clove',
    name: 'Clove',
    nameCN: '丁香',
    color: '#8B0000',
    scentTags: ['浓烈', '芳香', '辛甜'],
    description: '摩鹿加群岛的丁香花蕾，香气逼人',
    origin: '摩鹿加'
  },
  {
    id: 'cardamom',
    name: 'Cardamom',
    nameCN: '豆蔻',
    color: '#9ACD32',
    scentTags: ['清新', '柠檬香', '柔和'],
    description: '西域小国的神秘香料，清香宜人',
    origin: '西域诸国'
  },
  {
    id: 'saffron',
    name: 'Saffron',
    nameCN: '藏红花',
    color: '#DC143C',
    scentTags: ['珍贵', '花香', '奇异'],
    description: '波斯高原的红色黄金，价比黄金',
    origin: '波斯高原'
  }
];

export const getSpiceById = (id: string): Spice | undefined => {
  return SPICES.find(s => s.id === id);
};
