export type IngredientCategory = 'base' | 'liqueur' | 'juice' | 'bitters';

export interface Ingredient {
  id: string;
  name: string;
  nameEn: string;
  category: IngredientCategory;
  color: string;
  glowColor: string;
  alcohol: number;
  sweetness: number;
  sourness: number;
  bitterness: number;
}

export interface RecipeSlot {
  ingredient: Ingredient | null;
  amount: number;
}

export interface FlavorProfile {
  alcohol: number;
  sweetness: number;
  sourness: number;
  bitterness: number;
}

export type EmotionType =
  | 'melancholy_fresh'
  | 'wild_sweet'
  | 'neon_dream'
  | 'dark_velvet'
  | 'electric_sour'
  | 'cosmic_bitter';

export interface CustomerEmotion {
  id: string;
  type: EmotionType;
  label: string;
  target: FlavorProfile;
  tolerance: number;
}

export interface RecipeCard {
  id: string;
  createdAt: number;
  name: string;
  slots: RecipeSlot[];
  profile: FlavorProfile;
  blendedColor: string;
  customerMatch: EmotionType | null;
  matchScore: number;
}

export const INGREDIENTS: Ingredient[] = [
  {
    id: 'vodka',
    name: '量子伏特加',
    nameEn: 'Quantum Vodka',
    category: 'base',
    color: '#E0F7FA',
    glowColor: '#00BCD4',
    alcohol: 95,
    sweetness: 5,
    sourness: 0,
    bitterness: 2,
  },
  {
    id: 'gin',
    name: '霓虹琴酒',
    nameEn: 'Neon Gin',
    category: 'base',
    color: '#C8E6C9',
    glowColor: '#4CAF50',
    alcohol: 90,
    sweetness: 3,
    sourness: 5,
    bitterness: 15,
  },
  {
    id: 'rum',
    name: '暗金朗姆',
    nameEn: 'Dark Gold Rum',
    category: 'base',
    color: '#FFE082',
    glowColor: '#FFB300',
    alcohol: 88,
    sweetness: 20,
    sourness: 0,
    bitterness: 8,
  },
  {
    id: 'tequila',
    name: '银龙舌兰',
    nameEn: 'Silver Tequila',
    category: 'base',
    color: '#B3E5FC',
    glowColor: '#29B6F6',
    alcohol: 92,
    sweetness: 2,
    sourness: 8,
    bitterness: 5,
  },
  {
    id: 'whiskey',
    name: '脉冲威士忌',
    nameEn: 'Pulse Whiskey',
    category: 'base',
    color: '#FFAB91',
    glowColor: '#FF5722',
    alcohol: 85,
    sweetness: 10,
    sourness: 2,
    bitterness: 25,
  },
  {
    id: 'absinthe',
    name: '迷幻苦艾',
    nameEn: 'Cyber Absinthe',
    category: 'base',
    color: '#CCFF90',
    glowColor: '#76FF03',
    alcohol: 98,
    sweetness: 0,
    sourness: 3,
    bitterness: 40,
  },
  {
    id: 'curacao',
    name: '蓝橙利口',
    nameEn: 'Blue Curacao',
    category: 'liqueur',
    color: '#40C4FF',
    glowColor: '#00E5FF',
    alcohol: 35,
    sweetness: 55,
    sourness: 10,
    bitterness: 0,
  },
  {
    id: 'grenadine',
    name: '绯红糖浆',
    nameEn: 'Neon Grenadine',
    category: 'liqueur',
    color: '#FF5252',
    glowColor: '#FF1744',
    alcohol: 5,
    sweetness: 80,
    sourness: 5,
    bitterness: 0,
  },
  {
    id: 'midori',
    name: '数字蜜瓜',
    nameEn: 'Digital Midori',
    category: 'liqueur',
    color: '#69F0AE',
    glowColor: '#00E676',
    alcohol: 30,
    sweetness: 70,
    sourness: 5,
    bitterness: 0,
  },
  {
    id: 'kahlua',
    name: '暗夜咖啡',
    nameEn: 'Night Kahlua',
    category: 'liqueur',
    color: '#5D4037',
    glowColor: '#8D6E63',
    alcohol: 25,
    sweetness: 50,
    sourness: 0,
    bitterness: 35,
  },
  {
    id: 'lemon',
    name: '酸柠能量',
    nameEn: 'Lemon Power',
    category: 'juice',
    color: '#FFEB3B',
    glowColor: '#FFEA00',
    alcohol: 0,
    sweetness: 10,
    sourness: 85,
    bitterness: 5,
  },
  {
    id: 'orange',
    name: '橙光粒子',
    nameEn: 'Orange Particle',
    category: 'juice',
    color: '#FF9100',
    glowColor: '#FF6D00',
    alcohol: 0,
    sweetness: 55,
    sourness: 35,
    bitterness: 5,
  },
  {
    id: 'cranberry',
    name: '蔓越莓液',
    nameEn: 'Cranberry Fluid',
    category: 'juice',
    color: '#E91E63',
    glowColor: '#F50057',
    alcohol: 0,
    sweetness: 40,
    sourness: 50,
    bitterness: 5,
  },
  {
    id: 'pineapple',
    name: '菠萝光波',
    nameEn: 'Pineapple Wave',
    category: 'juice',
    color: '#FFD740',
    glowColor: '#FFC400',
    alcohol: 0,
    sweetness: 65,
    sourness: 20,
    bitterness: 0,
  },
  {
    id: 'angostura',
    name: '安格苦精',
    nameEn: 'Angostura Bitters',
    category: 'bitters',
    color: '#880E4F',
    glowColor: '#AD1457',
    alcohol: 45,
    sweetness: 5,
    sourness: 10,
    bitterness: 95,
  },
  {
    id: 'orange_bitters',
    name: '橙苦精华',
    nameEn: 'Orange Bitters',
    category: 'bitters',
    color: '#BF360C',
    glowColor: '#DD2C00',
    alcohol: 40,
    sweetness: 5,
    sourness: 15,
    bitterness: 85,
  },
];

export const EMOTIONS: CustomerEmotion[] = [
  {
    id: 'e1',
    type: 'melancholy_fresh',
    label: '带点忧郁的清爽',
    target: { alcohol: 40, sweetness: 25, sourness: 55, bitterness: 35 },
    tolerance: 0.25,
  },
  {
    id: 'e2',
    type: 'wild_sweet',
    label: '狂野的甜味',
    target: { alcohol: 65, sweetness: 75, sourness: 15, bitterness: 10 },
    tolerance: 0.25,
  },
  {
    id: 'e3',
    type: 'neon_dream',
    label: '霓虹梦境',
    target: { alcohol: 50, sweetness: 60, sourness: 30, bitterness: 20 },
    tolerance: 0.25,
  },
  {
    id: 'e4',
    type: 'dark_velvet',
    label: '暗夜丝绒',
    target: { alcohol: 70, sweetness: 45, sourness: 10, bitterness: 55 },
    tolerance: 0.25,
  },
  {
    id: 'e5',
    type: 'electric_sour',
    label: '电光酸涩',
    target: { alcohol: 55, sweetness: 30, sourness: 80, bitterness: 25 },
    tolerance: 0.25,
  },
  {
    id: 'e6',
    type: 'cosmic_bitter',
    label: '宇宙苦旅',
    target: { alcohol: 60, sweetness: 15, sourness: 35, bitterness: 75 },
    tolerance: 0.25,
  },
];

export const CUSTOMER_NAMES = [
  '霓虹猎人', '数据幽灵', '量子浪人', '暗网行者', '记忆碎片', '芯片游民',
];

export const CUSTOMER_AVATAR_COLORS = [
  ['#FF4081', '#7C4DFF'],
  ['#00E5FF', '#651FFF'],
  ['#76FF03', '#1DE9B6'],
  ['#FFEA00', '#FF6E40'],
  ['#E040FB', '#304FFE'],
];
