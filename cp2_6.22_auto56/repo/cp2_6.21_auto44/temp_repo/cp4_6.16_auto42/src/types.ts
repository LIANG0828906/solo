export interface CoffeeRecord {
  id: string;
  name: string;
  variety: string;
  roastDate: string;
  brewMethod: string;
  flavorTags: string[];
  rating: number;
  notes: string;
  createdAt: string;
}

export interface TagFrequency {
  [tag: string]: number;
}

export interface MonthlyStat {
  month: string;
  count: number;
}

export const COFFEE_VARIETIES = [
  '阿拉比卡',
  '罗布斯塔',
  '利比里亚',
  '艺伎',
  '波旁',
  '铁皮卡',
  '卡杜拉',
  '卡杜艾',
  '新世界',
  '其他'
];

export const BREW_METHODS = [
  '手冲',
  '意式浓缩',
  '冷萃',
  '法压壶',
  '摩卡壶',
  '爱乐压',
  '虹吸壶',
  '挂耳包',
  '美式滴滤',
  '其他'
];

export const FLAVOR_TAGS = [
  '花香',
  '果酸',
  '坚果',
  '巧克力',
  '焦糖',
  '柑橘',
  '莓果',
  '草本',
  '酒香',
  '烟熏'
];

export const RATING_RANGES = [
  { label: '全部评分', min: 0, max: 100 },
  { label: '80-100 (优秀)', min: 80, max: 100 },
  { label: '50-79 (良好)', min: 50, max: 79 },
  { label: '0-49 (一般)', min: 0, max: 49 }
];
