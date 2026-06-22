export interface Material {
  id: string;
  name: string;
  icon: string;
  count: number;
  tempMin: number;
  tempMax: number;
  description: string;
}

export type PotionType = 'healing' | 'explosion' | 'invisibility' | 'unknown';
export type PotionQuality = 'normal' | 'good' | 'perfect';

export interface Potion {
  id: string;
  name: string;
  type: PotionType;
  quality: PotionQuality;
  icon: string;
  effect: string;
  power: number;
  createdAt: number;
}

export interface BrewingParams {
  temperature: number;
  stirCount: number;
  materials: string[];
}

export interface ExperimentRecord {
  id: string;
  timestamp: number;
  materials: { name: string; icon: string; count: number }[];
  temperatureCurve: number[];
  stirCount: number;
  resultPotionName: string | null;
  quality: PotionQuality | null;
  success: boolean;
  failureReason?: string;
}

export interface Recipe {
  id: string;
  name: string;
  temperature: number;
  stirCount: number;
  materialIds: string[];
  starred: boolean;
  createdAt: number;
}

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'herb',
    name: '月光草',
    icon: '🌿',
    count: 10,
    tempMin: 30,
    tempMax: 120,
    description: '散发柔和银光的草药，常用于治疗药剂',
  },
  {
    id: 'crystal',
    name: '火焰晶石',
    icon: '💎',
    count: 8,
    tempMin: 80,
    tempMax: 250,
    description: '蕴含火焰能量的晶石，爆炸药剂必备',
  },
  {
    id: 'mushroom',
    name: '暗影菇',
    icon: '🍄',
    count: 6,
    tempMin: 20,
    tempMax: 100,
    description: '生长于暗处的蘑菇，可扭曲光线',
  },
  {
    id: 'feather',
    name: '凤凰羽毛',
    icon: '🪶',
    count: 5,
    tempMin: 100,
    tempMax: 280,
    description: '稀有的凤凰羽毛，增强药剂效力',
  },
  {
    id: 'water',
    name: '星辰之水',
    icon: '💧',
    count: 15,
    tempMin: 0,
    tempMax: 200,
    description: '蕴含星光魔力的纯净水',
  },
  {
    id: 'powder',
    name: '龙鳞粉',
    icon: '✨',
    count: 7,
    tempMin: 50,
    tempMax: 220,
    description: '研磨成龙鳞的粉末，强化药剂效果',
  },
  {
    id: 'flower',
    name: '幽影花',
    icon: '🌸',
    count: 9,
    tempMin: 10,
    tempMax: 90,
    description: '可短暂遮蔽气息的神秘花朵',
  },
  {
    id: 'essence',
    name: '生命精华',
    icon: '❤️',
    count: 4,
    tempMin: 40,
    tempMax: 150,
    description: '浓缩的生命能量，强效治疗剂核心',
  },
];

export const BASE_POTIONS: Record<string, { name: string; type: PotionType; icon: string; effect: string }> = {
  'herb+water': { name: '初级治疗药剂', type: 'healing', icon: '🧪', effect: '恢复少量生命值' },
  'herb+essence': { name: '强效治疗药剂', type: 'healing', icon: '💚', effect: '大量恢复生命值' },
  'herb+water+essence': { name: '圣光药剂', type: 'healing', icon: '🌟', effect: '完全恢复生命并净化' },
  'crystal+water': { name: '小型爆炸药剂', type: 'explosion', icon: '💣', effect: '小范围爆炸伤害' },
  'crystal+feather': { name: '烈焰药剂', type: 'explosion', icon: '🔥', effect: '大范围火焰爆炸' },
  'crystal+powder+feather': { name: '龙息药剂', type: 'explosion', icon: '🐲', effect: '毁天灭地的龙焰' },
  'mushroom+water': { name: '模糊药剂', type: 'invisibility', icon: '👻', effect: '身形变得半透明' },
  'mushroom+flower': { name: '隐身药剂', type: 'invisibility', icon: '🫥', effect: '完全隐身30秒' },
  'mushroom+flower+powder': { name: '幻影药剂', type: 'invisibility', icon: '🌫️', effect: '隐身并留下幻象' },
};

export const POTION_GRADIENTS: Record<PotionType, string> = {
  healing: 'linear-gradient(135deg, #A8E6CF 0%, #ffffff 100%)',
  explosion: 'linear-gradient(135deg, #FF8A80 0%, #ffffff 100%)',
  invisibility: 'linear-gradient(135deg, #B39DDB 0%, #ffffff 100%)',
  unknown: 'linear-gradient(135deg, #9e9e9e 0%, #ffffff 100%)',
};

export const QUALITY_STARS: Record<PotionQuality, number> = {
  normal: 1,
  good: 2,
  perfect: 3,
};
