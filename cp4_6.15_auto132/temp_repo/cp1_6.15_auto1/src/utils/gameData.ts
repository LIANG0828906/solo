export type PlanetType = 'ice' | 'volcano' | 'forest' | 'desert' | 'ocean';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ParticleType = 'ice_crystal' | 'fire_spark' | 'leaf' | 'sand' | 'bubble' | 'star';

export interface ParticleConfig {
  type: ParticleType;
  emoji: string;
  count: number;
  color: string;
  speed: number;
  lifetime: number;
}

export interface PlanetVisualEffects {
  particle: ParticleConfig;
  ambientGradient: string;
  ambientAnimationSpeed: number;
  gridBorderColor: string;
  cellHoverGlow: string;
}

export interface Planet {
  id: string;
  name: string;
  type: PlanetType;
  description: string;
  emoji: string;
  gradient: string;
  exploreCooldown: number;
  growthModifier: number;
  preferredPlants: string[];
  visualEffects: PlanetVisualEffects;
  breatheSpeed: number;
}

export interface PlantColorVariant {
  emoji: string;
  glow: string;
  color1: string;
  color2: string;
  textShadow: string;
  breatheSpeed: number;
}

export interface PlantType {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  baseGrowthTime: number;
  baseExp: number;
  baseCoins: number;
  description: string;
  colorVariants: Record<PlanetType, PlantColorVariant>;
  nativePlanets: PlanetType[];
}

export interface Seed {
  plantTypeId: string;
  quantity: number;
}

export interface PlantedPlant {
  id: string;
  plantTypeId: string;
  planetType: PlanetType;
  plantedAt: number;
  gridIndex: number;
}

export const PLANET_VISUAL_EFFECTS: Record<PlanetType, PlanetVisualEffects> = {
  ice: {
    particle: {
      type: 'ice_crystal',
      emoji: '❄️',
      count: 8,
      color: '#a8edea',
      speed: 1.5,
      lifetime: 3000
    },
    ambientGradient: 'radial-gradient(circle at 30% 30%, rgba(168,237,234,0.12) 0%, rgba(102,126,234,0.06) 50%, transparent 70%)',
    ambientAnimationSpeed: 0.7,
    gridBorderColor: 'rgba(168,237,234,0.2)',
    cellHoverGlow: '0 0 15px rgba(168,237,234,0.4)'
  },
  volcano: {
    particle: {
      type: 'fire_spark',
      emoji: '✨',
      count: 10,
      color: '#ff6b6b',
      speed: 2.5,
      lifetime: 2000
    },
    ambientGradient: 'radial-gradient(circle at 70% 70%, rgba(245,87,108,0.12) 0%, rgba(240,147,251,0.06) 50%, transparent 70%)',
    ambientAnimationSpeed: 1.6,
    gridBorderColor: 'rgba(255,107,107,0.2)',
    cellHoverGlow: '0 0 15px rgba(255,107,107,0.4)'
  },
  forest: {
    particle: {
      type: 'leaf',
      emoji: '🍃',
      count: 6,
      color: '#43e97b',
      speed: 1.0,
      lifetime: 4000
    },
    ambientGradient: 'radial-gradient(circle at 50% 40%, rgba(67,233,123,0.1) 0%, rgba(56,249,215,0.05) 50%, transparent 70%)',
    ambientAnimationSpeed: 1.0,
    gridBorderColor: 'rgba(67,233,123,0.15)',
    cellHoverGlow: '0 0 15px rgba(67,233,123,0.3)'
  },
  desert: {
    particle: {
      type: 'sand',
      emoji: '💫',
      count: 5,
      color: '#fbbf24',
      speed: 1.2,
      lifetime: 3500
    },
    ambientGradient: 'radial-gradient(circle at 60% 30%, rgba(250,112,154,0.08) 0%, rgba(254,225,64,0.08) 50%, transparent 70%)',
    ambientAnimationSpeed: 0.9,
    gridBorderColor: 'rgba(251,191,36,0.15)',
    cellHoverGlow: '0 0 15px rgba(251,191,36,0.35)'
  },
  ocean: {
    particle: {
      type: 'bubble',
      emoji: '🫧',
      count: 7,
      color: '#4facfe',
      speed: 0.8,
      lifetime: 4500
    },
    ambientGradient: 'radial-gradient(circle at 40% 60%, rgba(79,172,254,0.12) 0%, rgba(0,242,254,0.06) 50%, transparent 70%)',
    ambientAnimationSpeed: 0.85,
    gridBorderColor: 'rgba(79,172,254,0.2)',
    cellHoverGlow: '0 0 15px rgba(79,172,254,0.4)'
  }
};

export const PLANETS: Planet[] = [
  {
    id: 'ice-1',
    name: '霜晶星',
    type: 'ice',
    description: '永恒的冰雪世界，冰晶在星光下闪烁，适合耐寒植物生长',
    emoji: '❄️',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #667eea 100%)',
    exploreCooldown: 8000,
    growthModifier: 0.7,
    preferredPlants: ['frost-lily', 'crystal-moss', 'glacial-cactus'],
    visualEffects: PLANET_VISUAL_EFFECTS.ice,
    breatheSpeed: 0.6
  },
  {
    id: 'volcano-1',
    name: '炎狱星',
    type: 'volcano',
    description: '熔岩流淌的炽热星球，只有最坚韧的植物才能在此繁荣',
    emoji: '🌋',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    exploreCooldown: 10000,
    growthModifier: 1.3,
    preferredPlants: ['fire-bloom', 'ash-root', 'lava-vine'],
    visualEffects: PLANET_VISUAL_EFFECTS.volcano,
    breatheSpeed: 1.6
  },
  {
    id: 'forest-1',
    name: '翡翠星',
    type: 'forest',
    description: '茂密的外星森林覆盖整个星球，空气中弥漫着孢子的芬芳',
    emoji: '🌲',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    exploreCooldown: 6000,
    growthModifier: 1.0,
    preferredPlants: ['star-flower', 'moon-fruit', 'rainbow-leaf'],
    visualEffects: PLANET_VISUAL_EFFECTS.forest,
    breatheSpeed: 1.0
  },
  {
    id: 'desert-1',
    name: '砂砾星',
    type: 'desert',
    description: '无尽的金色沙丘下埋藏着古老的植物种子',
    emoji: '🏜️',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    exploreCooldown: 9000,
    growthModifier: 0.85,
    preferredPlants: ['sun-thorn', 'sand-pearl', 'dune-bloom'],
    visualEffects: PLANET_VISUAL_EFFECTS.desert,
    breatheSpeed: 0.85
  },
  {
    id: 'ocean-1',
    name: '深蓝星',
    type: 'ocean',
    description: '整个星球被温暖的海洋覆盖，水面下生长着发光植物',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    exploreCooldown: 7000,
    growthModifier: 1.15,
    preferredPlants: ['coral-sprout', 'abyss-kelp', 'pearl-lotus'],
    visualEffects: PLANET_VISUAL_EFFECTS.ocean,
    breatheSpeed: 0.9
  }
];

export const PLANT_TYPES: PlantType[] = [
  {
    id: 'frost-lily',
    name: '霜晶百合',
    emoji: '🌸',
    rarity: 'common',
    baseGrowthTime: 30000,
    baseExp: 10,
    baseCoins: 5,
    description: '花瓣如冰晶般透明，在寒冷星球上盛开时会发出柔和的蓝光',
    colorVariants: {
      ice: { emoji: '❄️', glow: '#a8edea', color1: '#e0f7fa', color2: '#80deea', textShadow: '0 0 20px #a8edea, 0 0 40px #667eea', breatheSpeed: 2.5 },
      volcano: { emoji: '💧', glow: '#f5576c', color1: '#ffebee', color2: '#ef9a9a', textShadow: '0 0 15px #f5576c', breatheSpeed: 3.5 },
      forest: { emoji: '🌸', glow: '#43e97b', color1: '#f3e5f5', color2: '#ce93d8', textShadow: '0 0 15px #43e97b', breatheSpeed: 3.0 },
      desert: { emoji: '🏵️', glow: '#fee140', color1: '#fff8e1', color2: '#ffe082', textShadow: '0 0 15px #fee140', breatheSpeed: 3.2 },
      ocean: { emoji: '🪷', glow: '#4facfe', color1: '#e3f2fd', color2: '#90caf9', textShadow: '0 0 15px #4facfe', breatheSpeed: 2.8 }
    },
    nativePlanets: ['ice']
  },
  {
    id: 'fire-bloom',
    name: '熔岩花',
    emoji: '🌺',
    rarity: 'uncommon',
    baseGrowthTime: 45000,
    baseExp: 25,
    baseCoins: 15,
    description: '花瓣流淌着熔岩般的光泽，触碰时会感到温暖而非灼热',
    colorVariants: {
      ice: { emoji: '🔴', glow: '#f5576c', color1: '#ffcdd2', color2: '#ef5350', textShadow: '0 0 20px #f5576c', breatheSpeed: 3.0 },
      volcano: { emoji: '🔥', glow: '#ff6b6b', color1: '#ffab91', color2: '#ff5722', textShadow: '0 0 25px #ff6b6b, 0 0 50px #f5576c', breatheSpeed: 4.5 },
      forest: { emoji: '🌺', glow: '#43e97b', color1: '#f8bbd9', color2: '#f48fb1', textShadow: '0 0 15px #43e97b', breatheSpeed: 3.0 },
      desert: { emoji: '☀️', glow: '#fee140', color1: '#ffecb3', color2: '#ffca28', textShadow: '0 0 18px #fee140', breatheSpeed: 3.5 },
      ocean: { emoji: '🔶', glow: '#4facfe', color1: '#ffe0b2', color2: '#ffab40', textShadow: '0 0 15px #4facfe', breatheSpeed: 2.5 }
    },
    nativePlanets: ['volcano']
  },
  {
    id: 'star-flower',
    name: '星辰花',
    emoji: '✨',
    rarity: 'rare',
    baseGrowthTime: 60000,
    baseExp: 50,
    baseCoins: 35,
    description: '每一朵花都蕴含着一小片星空，夜晚会轻轻闪烁',
    colorVariants: {
      ice: { emoji: '💎', glow: '#a8edea', color1: '#b3e5fc', color2: '#4fc3f7', textShadow: '0 0 25px #a8edea, 0 0 50px #667eea', breatheSpeed: 2.0 },
      volcano: { emoji: '⭐', glow: '#f5576c', color1: '#fff59d', color2: '#ffee58', textShadow: '0 0 22px #f5576c', breatheSpeed: 4.0 },
      forest: { emoji: '✨', glow: '#38f9d7', color1: '#e1bee7', color2: '#ba68c8', textShadow: '0 0 25px #38f9d7, 0 0 45px #43e97b', breatheSpeed: 3.0 },
      desert: { emoji: '🌟', glow: '#fee140', color1: '#fff176', color2: '#ffd54f', textShadow: '0 0 22px #fee140, 0 0 40px #fa709a', breatheSpeed: 3.3 },
      ocean: { emoji: '💫', glow: '#4facfe', color1: '#b2ebf2', color2: '#4dd0e1', textShadow: '0 0 25px #4facfe, 0 0 50px #00f2fe', breatheSpeed: 2.5 }
    },
    nativePlanets: ['forest']
  },
  {
    id: 'crystal-moss',
    name: '水晶苔',
    emoji: '💠',
    rarity: 'common',
    baseGrowthTime: 20000,
    baseExp: 8,
    baseCoins: 3,
    description: '覆盖在岩石上的发光苔藓，踩上去会发出清脆的声响',
    colorVariants: {
      ice: { emoji: '💠', glow: '#a8edea', color1: '#e0f2f1', color2: '#80cbc4', textShadow: '0 0 18px #a8edea', breatheSpeed: 4.0 },
      volcano: { emoji: '🟢', glow: '#f5576c', color1: '#c8e6c9', color2: '#81c784', textShadow: '0 0 14px #f5576c', breatheSpeed: 5.0 },
      forest: { emoji: '🌿', glow: '#43e97b', color1: '#dcedc8', color2: '#aed581', textShadow: '0 0 16px #43e97b', breatheSpeed: 3.5 },
      desert: { emoji: '🟡', glow: '#fee140', color1: '#f0f4c3', color2: '#dce775', textShadow: '0 0 14px #fee140', breatheSpeed: 3.8 },
      ocean: { emoji: '🔵', glow: '#4facfe', color1: '#bbdefb', color2: '#64b5f6', textShadow: '0 0 14px #4facfe', breatheSpeed: 3.2 }
    },
    nativePlanets: ['ice', 'forest']
  },
  {
    id: 'sun-thorn',
    name: '阳棘',
    emoji: '🌵',
    rarity: 'uncommon',
    baseGrowthTime: 40000,
    baseExp: 20,
    baseCoins: 12,
    description: '锋利的尖刺折射着阳光，果实甜美多汁',
    colorVariants: {
      ice: { emoji: '🧊', glow: '#a8edea', color1: '#cfd8dc', color2: '#90a4ae', textShadow: '0 0 18px #a8edea', breatheSpeed: 2.2 },
      volcano: { emoji: '🌵', glow: '#f5576c', color1: '#d7ccc8', color2: '#a1887f', textShadow: '0 0 20px #f5576c', breatheSpeed: 3.8 },
      forest: { emoji: '🌿', glow: '#43e97b', color1: '#c5e1a5', color2: '#9ccc65', textShadow: '0 0 16px #43e97b', breatheSpeed: 3.0 },
      desert: { emoji: '☀️', glow: '#fbbf24', color1: '#ffe0b2', color2: '#ffb74d', textShadow: '0 0 20px #fbbf24, 0 0 35px #fa709a', breatheSpeed: 3.2 },
      ocean: { emoji: '🪸', glow: '#4facfe', color1: '#ffccbc', color2: '#ff8a65', textShadow: '0 0 16px #4facfe', breatheSpeed: 2.8 }
    },
    nativePlanets: ['desert']
  },
  {
    id: 'coral-sprout',
    name: '珊瑚芽',
    emoji: '🪸',
    rarity: 'common',
    baseGrowthTime: 25000,
    baseExp: 12,
    baseCoins: 6,
    description: '柔软的海洋植物，随着水流轻轻摇摆',
    colorVariants: {
      ice: { emoji: '🩵', glow: '#a8edea', color1: '#e1f5fe', color2: '#81d4fa', textShadow: '0 0 16px #a8edea', breatheSpeed: 3.5 },
      volcano: { emoji: '🟧', glow: '#f5576c', color1: '#fbe9e7', color2: '#ffab91', textShadow: '0 0 14px #f5576c', breatheSpeed: 4.2 },
      forest: { emoji: '🪸', glow: '#43e97b', color1: '#fce4ec', color2: '#f48fb1', textShadow: '0 0 14px #43e97b', breatheSpeed: 3.2 },
      desert: { emoji: '🟠', glow: '#fee140', color1: '#fff3e0', color2: '#ffcc80', textShadow: '0 0 14px #fee140', breatheSpeed: 3.5 },
      ocean: { emoji: '🪸', glow: '#00f2fe', color1: '#ff8a65', color2: '#ff5252', textShadow: '0 0 20px #00f2fe, 0 0 40px #4facfe', breatheSpeed: 4.0 }
    },
    nativePlanets: ['ocean']
  },
  {
    id: 'moon-fruit',
    name: '月华果',
    emoji: '🍇',
    rarity: 'rare',
    baseGrowthTime: 55000,
    baseExp: 45,
    baseCoins: 30,
    description: '只在月光下结果的神秘植物，果实有着奇异的香气',
    colorVariants: {
      ice: { emoji: '🔮', glow: '#a8edea', color1: '#ede7f6', color2: '#b39ddb', textShadow: '0 0 20px #a8edea, 0 0 40px #667eea', breatheSpeed: 2.2 },
      volcano: { emoji: '🍒', glow: '#f5576c', color1: '#ffcdd2', color2: '#e57373', textShadow: '0 0 20px #f5576c, 0 0 35px #f093fb', breatheSpeed: 3.8 },
      forest: { emoji: '🍇', glow: '#38f9d7', color1: '#e1bee7', color2: '#ba68c8', textShadow: '0 0 22px #38f9d7, 0 0 40px #43e97b', breatheSpeed: 2.8 },
      desert: { emoji: '🫐', glow: '#fee140', color1: '#c5cae9', color2: '#7986cb', textShadow: '0 0 20px #fee140', breatheSpeed: 2.5 },
      ocean: { emoji: '🫧', glow: '#4facfe', color1: '#e8eaf6', color2: '#9fa8da', textShadow: '0 0 22px #4facfe, 0 0 40px #00f2fe', breatheSpeed: 2.4 }
    },
    nativePlanets: ['forest']
  },
  {
    id: 'glacial-cactus',
    name: '冰川仙掌',
    emoji: '🧊',
    rarity: 'uncommon',
    baseGrowthTime: 35000,
    baseExp: 18,
    baseCoins: 10,
    description: '在极寒中生长的仙人掌，内部储存着纯净的冰水',
    colorVariants: {
      ice: { emoji: '🧊', glow: '#667eea', color1: '#e3f2fd', color2: '#64b5f6', textShadow: '0 0 22px #667eea, 0 0 40px #a8edea', breatheSpeed: 2.0 },
      volcano: { emoji: '🟤', glow: '#f5576c', color1: '#d7ccc8', color2: '#a1887f', textShadow: '0 0 15px #f5576c', breatheSpeed: 3.5 },
      forest: { emoji: '🌵', glow: '#43e97b', color1: '#c8e6c9', color2: '#81c784', textShadow: '0 0 18px #43e97b', breatheSpeed: 2.8 },
      desert: { emoji: '🏜️', glow: '#fee140', color1: '#ffe0b2', color2: '#ffb74d', textShadow: '0 0 18px #fee140', breatheSpeed: 2.6 },
      ocean: { emoji: '💧', glow: '#4facfe', color1: '#b3e5fc', color2: '#4fc3f7', textShadow: '0 0 18px #4facfe', breatheSpeed: 2.4 }
    },
    nativePlanets: ['ice']
  },
  {
    id: 'rainbow-leaf',
    name: '虹彩叶',
    emoji: '🌈',
    rarity: 'legendary',
    baseGrowthTime: 90000,
    baseExp: 100,
    baseCoins: 80,
    description: '传说中的植物，每一片叶子都呈现出不同的颜色',
    colorVariants: {
      ice: { emoji: '🌈', glow: '#a8edea', color1: '#e1f5fe', color2: '#b2ebf2', textShadow: '0 0 30px #a8edea, 0 0 60px #667eea, 0 0 90px #ce93d8', breatheSpeed: 1.8 },
      volcano: { emoji: '🌈', glow: '#f5576c', color1: '#ffebee', color2: '#ffccbc', textShadow: '0 0 30px #f5576c, 0 0 60px #f093fb, 0 0 90px #ff6b6b', breatheSpeed: 4.0 },
      forest: { emoji: '🌈', glow: '#38f9d7', color1: '#f3e5f5', color2: '#e1bee7', textShadow: '0 0 30px #38f9d7, 0 0 60px #43e97b, 0 0 90px #ba68c8', breatheSpeed: 2.5 },
      desert: { emoji: '🌈', glow: '#fee140', color1: '#fff8e1', color2: '#ffecb3', textShadow: '0 0 30px #fee140, 0 0 60px #fa709a, 0 0 90px #fbbf24', breatheSpeed: 2.8 },
      ocean: { emoji: '🌈', glow: '#4facfe', color1: '#e3f2fd', color2: '#bbdefb', textShadow: '0 0 30px #4facfe, 0 0 60px #00f2fe, 0 0 90px #7c4dff', breatheSpeed: 2.2 }
    },
    nativePlanets: ['forest', 'ocean']
  },
  {
    id: 'ash-root',
    name: '灰烬根',
    emoji: '🌱',
    rarity: 'common',
    baseGrowthTime: 22000,
    baseExp: 9,
    baseCoins: 4,
    description: '从火山灰中汲取养分的顽强植物',
    colorVariants: {
      ice: { emoji: '🌑', glow: '#a8edea', color1: '#eceff1', color2: '#b0bec5', textShadow: '0 0 12px #a8edea', breatheSpeed: 3.0 },
      volcano: { emoji: '🌱', glow: '#ff6b6b', color1: '#8d6e63', color2: '#5d4037', textShadow: '0 0 18px #ff6b6b, 0 0 30px #f5576c', breatheSpeed: 4.5 },
      forest: { emoji: '🌿', glow: '#43e97b', color1: '#a5d6a7', color2: '#66bb6a', textShadow: '0 0 15px #43e97b', breatheSpeed: 3.2 },
      desert: { emoji: '🪨', glow: '#fee140', color1: '#bcaaa4', color2: '#8d6e63', textShadow: '0 0 14px #fee140', breatheSpeed: 3.0 },
      ocean: { emoji: '🪨', glow: '#4facfe', color1: '#90a4ae', color2: '#607d8b', textShadow: '0 0 14px #4facfe', breatheSpeed: 2.8 }
    },
    nativePlanets: ['volcano']
  },
  {
    id: 'lava-vine',
    name: '熔岩藤',
    emoji: '🪴',
    rarity: 'rare',
    baseGrowthTime: 50000,
    baseExp: 40,
    baseCoins: 25,
    description: '攀附在岩壁上的藤蔓，汁液如同流动的岩浆',
    colorVariants: {
      ice: { emoji: '🔴', glow: '#a8edea', color1: '#ef9a9a', color2: '#e57373', textShadow: '0 0 20px #a8edea', breatheSpeed: 2.8 },
      volcano: { emoji: '🪴', glow: '#ff6b6b', color1: '#ff7043', color2: '#d84315', textShadow: '0 0 25px #ff6b6b, 0 0 45px #f5576c, 0 0 60px #f093fb', breatheSpeed: 4.2 },
      forest: { emoji: '🌿', glow: '#43e97b', color1: '#81c784', color2: '#4caf50', textShadow: '0 0 20px #43e97b', breatheSpeed: 3.0 },
      desert: { emoji: '🟥', glow: '#fee140', color1: '#ff8a65', color2: '#f4511e', textShadow: '0 0 20px #fee140', breatheSpeed: 3.2 },
      ocean: { emoji: '🟪', glow: '#4facfe', color1: '#ce93d8', color2: '#ab47bc', textShadow: '0 0 20px #4facfe', breatheSpeed: 2.6 }
    },
    nativePlanets: ['volcano']
  },
  {
    id: 'sand-pearl',
    name: '沙珍珠',
    emoji: '💎',
    rarity: 'uncommon',
    baseGrowthTime: 38000,
    baseExp: 22,
    baseCoins: 14,
    description: '沙漠深处的植物，结出的果实如同珍珠般闪耀',
    colorVariants: {
      ice: { emoji: '💎', glow: '#a8edea', color1: '#e0f7fa', color2: '#b2ebf2', textShadow: '0 0 18px #a8edea', breatheSpeed: 2.5 },
      volcano: { emoji: '🟡', glow: '#f5576c', color1: '#fff9c4', color2: '#fff176', textShadow: '0 0 18px #f5576c', breatheSpeed: 3.8 },
      forest: { emoji: '💛', glow: '#43e97b', color1: '#fffde7', color2: '#fff59d', textShadow: '0 0 16px #43e97b', breatheSpeed: 2.8 },
      desert: { emoji: '💎', glow: '#fbbf24', color1: '#fff8e1', color2: '#ffe082', textShadow: '0 0 22px #fbbf24, 0 0 40px #fa709a', breatheSpeed: 3.0 },
      ocean: { emoji: '🫧', glow: '#4facfe', color1: '#e1f5fe', color2: '#81d4fa', textShadow: '0 0 18px #4facfe', breatheSpeed: 2.6 }
    },
    nativePlanets: ['desert']
  },
  {
    id: 'dune-bloom',
    name: '沙丘花',
    emoji: '🌼',
    rarity: 'common',
    baseGrowthTime: 28000,
    baseExp: 11,
    baseCoins: 5,
    description: '在沙丘间短暂盛开的小花，花期只有一天',
    colorVariants: {
      ice: { emoji: '🤍', glow: '#a8edea', color1: '#fafafa', color2: '#eeeeee', textShadow: '0 0 16px #a8edea', breatheSpeed: 3.5 },
      volcano: { emoji: '🌼', glow: '#f5576c', color1: '#fff8e1', color2: '#ffe082', textShadow: '0 0 18px #f5576c', breatheSpeed: 4.0 },
      forest: { emoji: '🌼', glow: '#43e97b', color1: '#fff9c4', color2: '#fff59d', textShadow: '0 0 16px #43e97b', breatheSpeed: 3.2 },
      desert: { emoji: '🌼', glow: '#fbbf24', color1: '#fffde7', color2: '#ffeb3b', textShadow: '0 0 20px #fbbf24, 0 0 35px #fee140', breatheSpeed: 3.5 },
      ocean: { emoji: '🤍', glow: '#4facfe', color1: '#f3e5f5', color2: '#e1bee7', textShadow: '0 0 16px #4facfe', breatheSpeed: 3.0 }
    },
    nativePlanets: ['desert']
  },
  {
    id: 'abyss-kelp',
    name: '深渊巨藻',
    emoji: '🌿',
    rarity: 'uncommon',
    baseGrowthTime: 42000,
    baseExp: 24,
    baseCoins: 13,
    description: '生长在深海的巨大藻类，可以长到数百米高',
    colorVariants: {
      ice: { emoji: '🩵', glow: '#a8edea', color1: '#b2dfdb', color2: '#80cbc4', textShadow: '0 0 18px #a8edea', breatheSpeed: 3.2 },
      volcano: { emoji: '🟢', glow: '#f5576c', color1: '#c5e1a5', color2: '#9ccc65', textShadow: '0 0 18px #f5576c', breatheSpeed: 4.0 },
      forest: { emoji: '🌿', glow: '#43e97b', color1: '#a5d6a7', color2: '#66bb6a', textShadow: '0 0 18px #43e97b', breatheSpeed: 3.5 },
      desert: { emoji: '🟩', glow: '#fee140', color1: '#dcedc8', color2: '#aed581', textShadow: '0 0 16px #fee140', breatheSpeed: 3.2 },
      ocean: { emoji: '🌿', glow: '#00f2fe', color1: '#69f0ae', color2: '#00e676', textShadow: '0 0 22px #00f2fe, 0 0 40px #4facfe', breatheSpeed: 3.8 }
    },
    nativePlanets: ['ocean']
  },
  {
    id: 'pearl-lotus',
    name: '珍珠莲',
    emoji: '🪷',
    rarity: 'legendary',
    baseGrowthTime: 85000,
    baseExp: 95,
    baseCoins: 75,
    description: '漂浮在海面上的神奇莲花，中心孕育着珍珠',
    colorVariants: {
      ice: { emoji: '🪷', glow: '#a8edea', color1: '#e8eaf6', color2: '#c5cae9', textShadow: '0 0 25px #a8edea, 0 0 50px #667eea', breatheSpeed: 2.0 },
      volcano: { emoji: '🪷', glow: '#f5576c', color1: '#fce4ec', color2: '#f8bbd9', textShadow: '0 0 25px #f5576c, 0 0 50px #f093fb', breatheSpeed: 3.8 },
      forest: { emoji: '🪷', glow: '#38f9d7', color1: '#f3e5f5', color2: '#e1bee7', textShadow: '0 0 25px #38f9d7, 0 0 50px #43e97b', breatheSpeed: 2.5 },
      desert: { emoji: '🪷', glow: '#fee140', color1: '#fff8e1', color2: '#ffecb3', textShadow: '0 0 25px #fee140, 0 0 50px #fa709a', breatheSpeed: 2.8 },
      ocean: { emoji: '🪷', glow: '#00f2fe', color1: '#e1f5fe', color2: '#b3e5fc', textShadow: '0 0 28px #00f2fe, 0 0 55px #4facfe, 0 0 80px #7c4dff', breatheSpeed: 2.2 }
    },
    nativePlanets: ['ocean']
  }
];

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 12,
  legendary: 3
};

export const COOLDOWN_STORAGE_KEY = 'stellar_garden_cooldowns_v1';

export function getPlantTypeById(id: string): PlantType | undefined {
  return PLANT_TYPES.find(p => p.id === id);
}

export function getPlanetById(id: string): Planet | undefined {
  return PLANETS.find(p => p.id === id);
}

export function getPlanetByType(type: PlanetType): Planet | undefined {
  return PLANETS.find(p => p.type === type);
}

export function getRarityWeights(): Record<Rarity, number> {
  return { ...RARITY_WEIGHTS };
}

export interface SeedGenerationOptions {
  randomFn?: () => number;
}

export function generateSeedsFromExploration(
  planet: Planet,
  options: SeedGenerationOptions = {}
): Seed[] {
  const random = options.randomFn || Math.random;
  const count = Math.floor(random() * 3) + 1;
  const result: Seed[] = [];
  const usedPlantIds = new Set<string>();

  const eligiblePlants = PLANT_TYPES.filter(p => {
    const isNative = p.nativePlanets.includes(planet.type);
    const isPreferred = planet.preferredPlants.includes(p.id);
    return isNative || isPreferred || random() < 0.2;
  });

  for (let i = 0; i < count && eligiblePlants.length > 0; i++) {
    const weightedPlants = eligiblePlants.filter(p => !usedPlantIds.has(p.id));
    if (weightedPlants.length === 0) break;

    const totalWeight = weightedPlants.reduce((sum, p) => {
      let weight = RARITY_WEIGHTS[p.rarity];
      if (p.nativePlanets.includes(planet.type)) weight *= 2;
      if (planet.preferredPlants.includes(p.id)) weight *= 1.5;
      return sum + weight;
    }, 0);

    let rand = random() * totalWeight;
    let selectedPlant = weightedPlants[0];
    
    for (const plant of weightedPlants) {
      let weight = RARITY_WEIGHTS[plant.rarity];
      if (plant.nativePlanets.includes(planet.type)) weight *= 2;
      if (planet.preferredPlants.includes(plant.id)) weight *= 1.5;
      rand -= weight;
      if (rand <= 0) {
        selectedPlant = plant;
        break;
      }
    }

    usedPlantIds.add(selectedPlant.id);
    const quantity = Math.floor(random() * 3) + 1;
    result.push({
      plantTypeId: selectedPlant.id,
      quantity
    });
  }

  return result;
}

export function calculateGrowthTime(plantType: PlantType, planetType: PlanetType): number {
  const planet = getPlanetByType(planetType);
  let modifier = planet ? planet.growthModifier : 1;
  
  if (plantType.nativePlanets.includes(planetType)) {
    modifier *= 1.25;
  }

  return Math.round(plantType.baseGrowthTime / modifier);
}

export function calculateGrowthProgress(
  plantType: PlantType,
  planetType: PlanetType,
  plantedAt: number,
  now: number
): number {
  const totalTime = calculateGrowthTime(plantType, planetType);
  const elapsed = now - plantedAt;
  return Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
}

export function isPlantMature(
  plantType: PlantType,
  planetType: PlanetType,
  plantedAt: number,
  now: number
): boolean {
  return calculateGrowthProgress(plantType, planetType, plantedAt, now) >= 100;
}

export function calculateRewards(plantType: PlantType, planetType: PlanetType): { exp: number; coins: number } {
  let expMultiplier = 1;
  let coinMultiplier = 1;

  if (plantType.nativePlanets.includes(planetType)) {
    expMultiplier = 1.5;
    coinMultiplier = 1.3;
  }

  return {
    exp: Math.round(plantType.baseExp * expMultiplier),
    coins: Math.round(plantType.baseCoins * coinMultiplier)
  };
}

export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'uncommon': return '#4ade80';
    case 'rare': return '#60a5fa';
    case 'legendary': return '#fbbf24';
  }
}

export function getRarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case 'common': return '普通';
    case 'uncommon': return '稀有';
    case 'rare': return '珍稀';
    case 'legendary': return '传说';
  }
}

export function formatTime(ms: number): string {
  if (ms <= 0) return '已完成';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
}

export function getRemainingCooldown(
  planetId: string,
  cooldowns: Record<string, number>,
  now: number
): number {
  const endTime = cooldowns[planetId] || 0;
  return Math.max(0, endTime - now);
}

export function isPlanetOnCooldown(
  planetId: string,
  cooldowns: Record<string, number>,
  now: number
): boolean {
  return getRemainingCooldown(planetId, cooldowns, now) > 0;
}

export interface CooldownStorageData {
  version: number;
  savedAt: number;
  cooldowns: Record<string, number>;
}

export function saveCooldownsToStorage(
  cooldowns: Record<string, number>,
  storage: Pick<Storage, 'setItem'> = typeof localStorage !== 'undefined' ? localStorage : { setItem: () => {} }
): void {
  try {
    const data: CooldownStorageData = {
      version: 1,
      savedAt: Date.now(),
      cooldowns
    };
    storage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
  }
}

export function loadCooldownsFromStorage(
  storage: Pick<Storage, 'getItem'> = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null }
): Record<string, number> {
  try {
    const raw = storage.getItem(COOLDOWN_STORAGE_KEY);
    if (!raw) return {};
    
    const data: CooldownStorageData = JSON.parse(raw);
    if (data.version !== 1 || !data.cooldowns) return {};
    
    const now = Date.now();
    const elapsed = now - (data.savedAt || now);
    
    const adjusted: Record<string, number> = {};
    for (const [planetId, endTime] of Object.entries(data.cooldowns)) {
      const adjustedEnd = endTime + elapsed;
      if (adjustedEnd > now) {
        adjusted[planetId] = adjustedEnd;
      }
    }
    
    return adjusted;
  } catch (e) {
    return {};
  }
}

export interface FPSControllerConfig {
  targetFPS: number;
}

export class FPSController {
  private targetFrameInterval: number;
  private lastFrameTime = -1;
  private accumulator = 0;
  private updateCount = 0;
  private fpsUpdateTime = 0;
  private currentFPS = 0;

  constructor(config: FPSControllerConfig) {
    this.targetFrameInterval = 1000 / config.targetFPS;
  }

  public shouldUpdate(currentTime: number): boolean {
    if (this.lastFrameTime < 0) {
      this.lastFrameTime = currentTime;
      this.fpsUpdateTime = currentTime;
      this.updateCount = 1;
      return true;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.accumulator += deltaTime;

    let didUpdate = false;
    if (this.accumulator >= this.targetFrameInterval) {
      this.accumulator = 0;
      didUpdate = true;
      this.updateCount++;
    }

    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.currentFPS = this.updateCount;
      this.updateCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    return didUpdate;
  }

  public getFPS(): number {
    return this.currentFPS;
  }

  public reset(): void {
    this.lastFrameTime = -1;
    this.accumulator = 0;
    this.updateCount = 0;
    this.fpsUpdateTime = 0;
    this.currentFPS = 0;
  }
}
