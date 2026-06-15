export interface Spice {
  id: string;
  name: string;
  description: string;
  color: string;
  particleColor: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: { spiceId: string; percentage: number }[];
  color: string;
  tolerance: number;
  particleColors: string[];
}

export const SPICES: Spice[] = [
  {
    id: 'chenxiang',
    name: '沉香',
    description: '沉水香，温而不燥',
    color: '#5C3A21',
    particleColor: '#8B6B4C'
  },
  {
    id: 'tanxiang',
    name: '檀香',
    description: '白檀，香气醇厚',
    color: '#8B4513',
    particleColor: '#C4783A'
  },
  {
    id: 'longnao',
    name: '龙脑',
    description: '冰片，清凉通透',
    color: '#E0E8F0',
    particleColor: '#D8E4F0'
  },
  {
    id: 'shexiang',
    name: '麝香',
    description: '麝脐香，开窍醒神',
    color: '#6B4423',
    particleColor: '#A06840'
  },
  {
    id: 'dingxiang',
    name: '丁香',
    description: '鸡舌香，温中暖肾',
    color: '#A0522D',
    particleColor: '#D06A30'
  },
  {
    id: 'ruxiang',
    name: '乳香',
    description: '马尾香，活血行气',
    color: '#DEB887',
    particleColor: '#E8CA98'
  }
];

export const RECIPES: Recipe[] = [
  {
    id: 'longyanxiang',
    name: '龙涎香',
    description: '龙涎香，千年名香，白如灵脂',
    ingredients: [
      { spiceId: 'chenxiang', percentage: 40 },
      { spiceId: 'shexiang', percentage: 30 },
      { spiceId: 'ruxiang', percentage: 30 }
    ],
    color: '#D4C5A9',
    tolerance: 15,
    particleColors: ['#D4C5A9', '#F0E6CE', '#E8DCC4', '#C9B896']
  },
  {
    id: 'elezhangzhong',
    name: '鹅梨帐中香',
    description: '江南李主帐中香，梨汁蒸沉香',
    ingredients: [
      { spiceId: 'chenxiang', percentage: 50 },
      { spiceId: 'tanxiang', percentage: 25 },
      { spiceId: 'ruxiang', percentage: 25 }
    ],
    color: '#F5DEB3',
    tolerance: 15,
    particleColors: ['#F5DEB3', '#FFE4C4', '#FFEFD5', '#F5E6C8']
  },
  {
    id: 'ersujiuju',
    name: '二苏旧局',
    description: '苏轼苏辙兄弟合制，沉静内敛',
    ingredients: [
      { spiceId: 'chenxiang', percentage: 30 },
      { spiceId: 'tanxiang', percentage: 30 },
      { spiceId: 'dingxiang', percentage: 40 }
    ],
    color: '#5C3A21',
    tolerance: 15,
    particleColors: ['#5C3A21', '#8B5A2B', '#6B4423', '#4A2C18']
  }
];

export function getSpiceById(id: string): Spice | undefined {
  return SPICES.find(s => s.id === id);
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id);
}

export const AGEING_DURATION_DEFAULT = 60;
export const AGEING_DURATION_FAST = 15;
export const MAX_SELECTED_SPICES = 3;
export const GRINDING_BOWL_RADIUS = 50;
export const GRINDING_CENTER_X = 140;
export const GRINDING_CENTER_Y = 140;
export const PARTICLE_COUNT = 150;
export const PARTICLE_SPREAD_RADIUS = 300;
export const PARTICLE_DURATION = 5000;
export const SCALE_MIN = 768;
export const SCALE_MAX = 1920;
