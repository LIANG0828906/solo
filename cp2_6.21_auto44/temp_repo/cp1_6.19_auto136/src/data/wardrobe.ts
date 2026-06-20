import { BodyPart, WardrobeItem } from '../types';

export const hairStyles: WardrobeItem[] = [
  { id: 'hair1', name: '短发', color: '#6B4226', part: BodyPart.HAIR },
  { id: 'hair2', name: '长发', color: '#8B4513', part: BodyPart.HAIR },
  { id: 'hair3', name: '卷发', color: '#D2691E', part: BodyPart.HAIR },
  { id: 'hair4', name: '染发', color: '#9C27B0', part: BodyPart.HAIR },
];

export const hats: WardrobeItem[] = [
  { id: 'hat1', name: '棒球帽', color: '#2196F3', part: BodyPart.ACCESSORY },
  { id: 'hat2', name: '礼帽', color: '#333333', part: BodyPart.ACCESSORY },
  { id: 'hat3', name: '皇冠', color: '#FFD700', part: BodyPart.ACCESSORY },
];

export const headwear: WardrobeItem[] = [...hairStyles, ...hats];

export const topColors: WardrobeItem[] = [
  { id: 'top1', name: '天蓝', color: '#4FC3F7', part: BodyPart.TOP },
  { id: 'top2', name: '粉红', color: '#F48FB1', part: BodyPart.TOP },
  { id: 'top3', name: '草绿', color: '#81C784', part: BodyPart.TOP },
  { id: 'top4', name: '橙黄', color: '#FFB74D', part: BodyPart.TOP },
  { id: 'top5', name: '薰衣草', color: '#CE93D8', part: BodyPart.TOP },
];

export const topPatterns: WardrobeItem[] = [
  { id: 'pattern1', name: '条纹', color: '#4FC3F7', part: BodyPart.TOP, pattern: 'stripes' },
  { id: 'pattern2', name: '格子', color: '#81C784', part: BodyPart.TOP, pattern: 'checker' },
];

export const tops: WardrobeItem[] = [...topColors, ...topPatterns];

export const bottomColors: WardrobeItem[] = [
  { id: 'bottom1', name: '深蓝', color: '#3949AB', part: BodyPart.BOTTOM },
  { id: 'bottom2', name: '卡其', color: '#8D6E63', part: BodyPart.BOTTOM },
  { id: 'bottom3', name: '黑色', color: '#424242', part: BodyPart.BOTTOM },
  { id: 'bottom4', name: '白色', color: '#FAFAFA', part: BodyPart.BOTTOM },
];

export const shoes: WardrobeItem[] = [
  { id: 'shoes1', name: '运动鞋', color: '#F44336', part: BodyPart.SHOES },
  { id: 'shoes2', name: '皮鞋', color: '#3E2723', part: BodyPart.SHOES },
  { id: 'shoes3', name: '靴子', color: '#5D4037', part: BodyPart.SHOES },
];

export const weapons: WardrobeItem[] = [
  { id: 'weapon1', name: '木剑', color: '#8D6E63', part: BodyPart.WEAPON },
  { id: 'weapon2', name: '魔法杖', color: '#9C27B0', part: BodyPart.WEAPON },
  { id: 'weapon3', name: '光剑', color: '#00E5FF', part: BodyPart.WEAPON },
];

export const shoesAndWeapons: WardrobeItem[] = [...shoes, ...weapons];

export const wardrobeCategories = [
  { title: '头饰', items: headwear },
  { title: '上衣', items: tops },
  { title: '下装', items: bottomColors },
  { title: '鞋子和武器', items: shoesAndWeapons },
];

export const defaultOutfit = {
  [BodyPart.SKIN]: '#FFCCAA',
  [BodyPart.HAIR]: '#6B4226',
  [BodyPart.TOP]: '#4FC3F7',
  [BodyPart.BOTTOM]: '#81C784',
  [BodyPart.SHOES]: '#F44336',
  [BodyPart.WEAPON]: '#8D6E63',
  [BodyPart.ACCESSORY]: 'transparent',
};
