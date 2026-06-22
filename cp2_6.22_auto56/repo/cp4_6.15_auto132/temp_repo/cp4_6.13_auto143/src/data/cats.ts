export type Rarity = 'common' | 'rare' | 'legendary';
export type SpotType = 'bar' | 'bookshelf' | 'carpet' | 'windowsill';
export type CatBehavior = 'sleeping' | 'grooming' | 'playing' | 'sitting' | 'yawning' | 'lying';

export interface CatBreed {
  id: string;
  name: string;
  rarity: Rarity;
  rarityProbability: number;
  personalities: string[];
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  emoji: string;
}

export interface SpawnedCat {
  id: string;
  breedId: string;
  position: SpotType;
  behavior: CatBehavior;
  spawnedAt: number;
  currentPersonality: string;
}

export interface CatCollection {
  [breedId: string]: {
    unlocked: boolean;
    unlockedAt?: number;
    count: number;
  };
}

export const CAT_BREEDS: CatBreed[] = [
  {
    id: 'ragdoll',
    name: '布偶猫',
    rarity: 'rare',
    rarityProbability: 0.3,
    personalities: ['温柔粘人', '安静优雅', '喜欢被抱抱', '性格温顺', '爱撒娇'],
    colorTheme: { primary: '#E8D4C4', secondary: '#D4C4B0', accent: '#8B7355' },
    emoji: '🐱'
  },
  {
    id: 'siamese',
    name: '暹罗猫',
    rarity: 'common',
    rarityProbability: 0.6,
    personalities: ['活泼好动', '好奇心强', '话唠一枚', '喜欢互动', '聪明伶俐'],
    colorTheme: { primary: '#C4A484', secondary: '#8B6914', accent: '#4A3728' },
    emoji: '😺'
  },
  {
    id: 'american-shorthair',
    name: '美短',
    rarity: 'common',
    rarityProbability: 0.6,
    personalities: ['独立自信', '适应力强', '温和友善', '爱玩闹', '偶尔调皮'],
    colorTheme: { primary: '#A0826D', secondary: '#6B5344', accent: '#2D2218' },
    emoji: '😸'
  },
  {
    id: 'british-shorthair',
    name: '英短',
    rarity: 'common',
    rarityProbability: 0.6,
    personalities: ['沉稳内敛', '圆脸圆脸', '喜欢安静', '独立不粘人', '优雅高贵'],
    colorTheme: { primary: '#708090', secondary: '#4A5568', accent: '#2D3748' },
    emoji: '😻'
  },
  {
    id: 'scottish-fold',
    name: '折耳猫',
    rarity: 'rare',
    rarityProbability: 0.3,
    personalities: ['软萌可爱', '耳朵折折', '性格温顺', '喜欢坐着', '粘人精'],
    colorTheme: { primary: '#DEB887', secondary: '#D2691E', accent: '#8B4513' },
    emoji: '🙀'
  },
  {
    id: 'sphynx',
    name: '无毛猫',
    rarity: 'legendary',
    rarityProbability: 0.1,
    personalities: ['外星来客', '皮肤暖暖', '性格独特', '喜欢撒娇', '聪明调皮'],
    colorTheme: { primary: '#F5DEB3', secondary: '#DAA520', accent: '#8B4513' },
    emoji: '😹'
  },
  {
    id: 'bengal',
    name: '豹猫',
    rarity: 'legendary',
    rarityProbability: 0.1,
    personalities: ['野性十足', '豹纹花纹', '精力充沛', '喜欢攀爬', '捕猎达人'],
    colorTheme: { primary: '#DAA520', secondary: '#8B4513', accent: '#2D1810' },
    emoji: '😼'
  },
  {
    id: 'orange-tabby',
    name: '橘猫',
    rarity: 'common',
    rarityProbability: 0.6,
    personalities: ['十橘九胖', '吃货担当', '懒洋洋', '性格随和', '超级能吃'],
    colorTheme: { primary: '#FF8C00', secondary: '#D2691E', accent: '#8B4513' },
    emoji: '😽'
  },
  {
    id: 'black-cat',
    name: '黑猫',
    rarity: 'rare',
    rarityProbability: 0.3,
    personalities: ['神秘优雅', '黑夜精灵', '偶尔傲娇', '其实很软', '默默陪伴'],
    colorTheme: { primary: '#2D2D2D', secondary: '#4A4A4A', accent: '#FFD700' },
    emoji: '🐈‍⬛'
  },
  {
    id: 'calico',
    name: '三花猫',
    rarity: 'legendary',
    rarityProbability: 0.1,
    personalities: ['三色毛球', '古灵精怪', '小公主脾气', '聪明狡黠', '独一无二'],
    colorTheme: { primary: '#FFFFFF', secondary: '#FF8C00', accent: '#2D2D2D' },
    emoji: '🐾'
  }
];

export const BEHAVIOR_DESCRIPTIONS: Record<CatBehavior, string> = {
  sleeping: '正在呼呼大睡 💤',
  grooming: '认真舔毛中 🧹',
  playing: '玩毛线球 🧶',
  sitting: '蹲坐甩尾巴 〰️',
  yawning: '打哈欠 😴',
  lying: '躺平晒太阳 ☀️'
};

export const SPOT_POSITIONS: Record<SpotType, { x: number; y: number; name: string }> = {
  bar: { x: 25, y: 30, name: '吧台' },
  bookshelf: { x: 70, y: 25, name: '书架' },
  carpet: { x: 40, y: 65, name: '地毯' },
  windowsill: { x: 75, y: 70, name: '窗台' }
};

export const ADJACENT_SPOTS: Record<SpotType, SpotType[]> = {
  bar: ['bookshelf', 'carpet'],
  bookshelf: ['bar', 'windowsill'],
  carpet: ['bar', 'windowsill'],
  windowsill: ['bookshelf', 'carpet']
};

export const RARITY_BORDER: Record<Rarity, string> = {
  common: '#C0C0C0',
  rare: '#FFD700',
  legendary: 'linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4, #A855F7, #FF6B6B)'
};

export const RARITY_STARS: Record<Rarity, number> = {
  common: 1,
  rare: 3,
  legendary: 5
};

export const getRandomBreed = (): CatBreed => {
  const rand = Math.random();
  let targetRarity: Rarity;
  if (rand < 0.1) {
    targetRarity = 'legendary';
  } else if (rand < 0.4) {
    targetRarity = 'rare';
  } else {
    targetRarity = 'common';
  }
  const breeds = CAT_BREEDS.filter(b => b.rarity === targetRarity);
  return breeds[Math.floor(Math.random() * breeds.length)];
};

export const getRandomPersonality = (breed: CatBreed): string => {
  return breed.personalities[Math.floor(Math.random() * breed.personalities.length)];
};

export const getRandomBehavior = (): CatBehavior => {
  const behaviors: CatBehavior[] = ['sleeping', 'grooming', 'playing', 'yawning', 'lying'];
  return behaviors[Math.floor(Math.random() * behaviors.length)];
};

export const getRandomAdjacentSpot = (currentSpot: SpotType): SpotType => {
  const adjacent = ADJACENT_SPOTS[currentSpot];
  return adjacent[Math.floor(Math.random() * adjacent.length)];
};

export const getBreedById = (id: string): CatBreed | undefined => {
  return CAT_BREEDS.find(b => b.id === id);
};
