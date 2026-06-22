export type ElementType = 'nature' | 'magic' | 'darkness';
export type ReactionType = 'explosion' | 'heal' | 'shadow' | 'light' | 'storm' | 'love';
export type MotionType = 'outward' | 'upward' | 'spiral' | 'twinkle';
export type ParticleType = 'spark' | 'bubble' | 'smoke' | 'light';
export type Rarity = 1 | 2 | 3 | 4 | 5;

export interface Ingredient {
  id: string;
  color: string;
  name: string;
  elementType: ElementType;
}

export interface ParticleParams {
  count: number;
  duration: number;
  motionType: MotionType;
  colors: string[];
  particleType: ParticleType;
}

export interface ReactionRule {
  id: string;
  requiredIngredientIds: string[];
  reactionType: ReactionType;
  color: string;
  glowColor: string;
  potionName: string;
  effect: string;
  rarity: Rarity;
  icon: string;
  particleParams: ParticleParams;
}

export interface PotionRecord {
  id: string;
  name: string;
  ingredients: string[];
  ingredientColors: string[];
  rarity: Rarity;
  color: string;
  icon: string;
  timestamp: number;
}

export const INGREDIENTS: Ingredient[] = [
  { id: 'red', color: '#FF3333', name: '火焰精华', elementType: 'darkness' },
  { id: 'blue', color: '#3366FF', name: '水晶之泪', elementType: 'magic' },
  { id: 'green', color: '#33CC66', name: '生命之泉', elementType: 'nature' },
  { id: 'purple', color: '#9933FF', name: '星辰粉末', elementType: 'magic' },
  { id: 'yellow', color: '#FFCC00', name: '太阳花蜜', elementType: 'nature' },
  { id: 'black', color: '#333333', name: '暗影精华', elementType: 'darkness' },
];

export const REACTION_RULES: ReactionRule[] = [
  {
    id: 'explosion',
    requiredIngredientIds: ['red', 'blue'],
    reactionType: 'explosion',
    color: '#9933FF',
    glowColor: '#CC66FF',
    potionName: '爆炸弹',
    effect: '在接触点产生剧烈爆炸',
    rarity: 3,
    icon: '💥',
    particleParams: {
      count: 150,
      duration: 2.5,
      motionType: 'outward',
      colors: ['#FF3333', '#FF6600', '#FFCC00', '#9933FF', '#FFFFFF'],
      particleType: 'spark',
    },
  },
  {
    id: 'heal',
    requiredIngredientIds: ['green', 'yellow'],
    reactionType: 'heal',
    color: '#FFD700',
    glowColor: '#FFF8DC',
    potionName: '治愈药水',
    effect: '恢复生命力，治愈伤口',
    rarity: 2,
    icon: '✨',
    particleParams: {
      count: 150,
      duration: 3,
      motionType: 'upward',
      colors: ['#33CC66', '#FFD700', '#FFFFFF', '#98FB98', '#FFFF99'],
      particleType: 'light',
    },
  },
  {
    id: 'shadow',
    requiredIngredientIds: ['purple', 'black'],
    reactionType: 'shadow',
    color: '#4A0E4E',
    glowColor: '#9933FF',
    potionName: '隐身烟雾',
    effect: '让使用者在暗影中隐匿',
    rarity: 4,
    icon: '🌑',
    particleParams: {
      count: 150,
      duration: 3,
      motionType: 'spiral',
      colors: ['#333333', '#9933FF', '#660066', '#1A0A2E', '#4B0082'],
      particleType: 'smoke',
    },
  },
  {
    id: 'light',
    requiredIngredientIds: ['red', 'yellow'],
    reactionType: 'light',
    color: '#FF6B00',
    glowColor: '#FFAA00',
    potionName: '烈焰药剂',
    effect: '释放灼热的火焰光芒',
    rarity: 2,
    icon: '🔥',
    particleParams: {
      count: 150,
      duration: 2.5,
      motionType: 'upward',
      colors: ['#FF3333', '#FF6600', '#FFCC00', '#FFFF00', '#FFFFFF'],
      particleType: 'spark',
    },
  },
  {
    id: 'storm',
    requiredIngredientIds: ['blue', 'green'],
    reactionType: 'storm',
    color: '#00CED1',
    glowColor: '#7FFFD4',
    potionName: '风暴药水',
    effect: '召唤狂风暴雨的力量',
    rarity: 3,
    icon: '⚡',
    particleParams: {
      count: 150,
      duration: 2.5,
      motionType: 'outward',
      colors: ['#3366FF', '#33CC66', '#00CED1', '#87CEEB', '#FFFFFF'],
      particleType: 'bubble',
    },
  },
  {
    id: 'love',
    requiredIngredientIds: ['red', 'purple', 'yellow'],
    reactionType: 'love',
    color: '#FF69B4',
    glowColor: '#FFB6C1',
    potionName: '爱情魔药',
    effect: '终极药剂，激发爱的力量',
    rarity: 5,
    icon: '💕',
    particleParams: {
      count: 200,
      duration: 3,
      motionType: 'twinkle',
      colors: ['#FF3333', '#FF69B4', '#FFCC00', '#9933FF', '#FFFFFF', '#FF1493'],
      particleType: 'light',
    },
  },
];

export class ReactionEngine {
  public matchReaction(ingredientIds: string[]): ReactionRule | null {
    const uniqueIds = [...new Set(ingredientIds)];

    let bestMatch: ReactionRule | null = null;
    let bestMatchCount = 0;

    for (const rule of REACTION_RULES) {
      const requiredSet = new Set(rule.requiredIngredientIds);
      let matchCount = 0;
      for (const id of uniqueIds) {
        if (requiredSet.has(id)) {
          matchCount++;
        }
      }
      if (matchCount === rule.requiredIngredientIds.length && matchCount > bestMatchCount) {
        bestMatch = rule;
        bestMatchCount = matchCount;
      }
    }

    return bestMatch;
  }

  public getReactions(): ReactionRule[] {
    return REACTION_RULES;
  }

  public getIngredientById(id: string): Ingredient | undefined {
    return INGREDIENTS.find((i) => i.id === id);
  }

  public getAllIngredients(): Ingredient[] {
    return INGREDIENTS;
  }
}
