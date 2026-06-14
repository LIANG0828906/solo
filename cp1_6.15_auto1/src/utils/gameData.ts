export type PlanetType = 'ice' | 'volcano' | 'forest' | 'desert' | 'ocean';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

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
  colorVariants: Record<PlanetType, { emoji: string; glow: string }>;
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
    preferredPlants: ['frost-lily', 'crystal-moss', 'glacial-cactus']
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
    preferredPlants: ['fire-bloom', 'ash-root', 'lava-vine']
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
    preferredPlants: ['star-flower', 'moon-fruit', 'rainbow-leaf']
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
    preferredPlants: ['sun-thorn', 'sand-pearl', 'dune-bloom']
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
    preferredPlants: ['coral-sprout', 'abyss-kelp', 'pearl-lotus']
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
      ice: { emoji: '❄️', glow: '#a8edea' },
      volcano: { emoji: '💧', glow: '#f5576c' },
      forest: { emoji: '🌸', glow: '#43e97b' },
      desert: { emoji: '🏵️', glow: '#fee140' },
      ocean: { emoji: '🪷', glow: '#4facfe' }
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
      ice: { emoji: '🔴', glow: '#f5576c' },
      volcano: { emoji: '🔥', glow: '#ff6b6b' },
      forest: { emoji: '🌺', glow: '#43e97b' },
      desert: { emoji: '☀️', glow: '#fee140' },
      ocean: { emoji: '🔶', glow: '#4facfe' }
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
      ice: { emoji: '💎', glow: '#a8edea' },
      volcano: { emoji: '⭐', glow: '#f5576c' },
      forest: { emoji: '✨', glow: '#38f9d7' },
      desert: { emoji: '🌟', glow: '#fee140' },
      ocean: { emoji: '💫', glow: '#4facfe' }
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
      ice: { emoji: '💠', glow: '#a8edea' },
      volcano: { emoji: '🟢', glow: '#f5576c' },
      forest: { emoji: '🌿', glow: '#43e97b' },
      desert: { emoji: '🟡', glow: '#fee140' },
      ocean: { emoji: '🔵', glow: '#4facfe' }
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
      ice: { emoji: '🧊', glow: '#a8edea' },
      volcano: { emoji: '🌵', glow: '#f5576c' },
      forest: { emoji: '🌿', glow: '#43e97b' },
      desert: { emoji: '☀️', glow: '#fbbf24' },
      ocean: { emoji: '🪸', glow: '#4facfe' }
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
      ice: { emoji: '🩵', glow: '#a8edea' },
      volcano: { emoji: '🟧', glow: '#f5576c' },
      forest: { emoji: '🪸', glow: '#43e97b' },
      desert: { emoji: '🟠', glow: '#fee140' },
      ocean: { emoji: '🪸', glow: '#00f2fe' }
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
      ice: { emoji: '🔮', glow: '#a8edea' },
      volcano: { emoji: '🍒', glow: '#f5576c' },
      forest: { emoji: '🍇', glow: '#38f9d7' },
      desert: { emoji: '🫐', glow: '#fee140' },
      ocean: { emoji: '🫧', glow: '#4facfe' }
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
      ice: { emoji: '🧊', glow: '#667eea' },
      volcano: { emoji: '🟤', glow: '#f5576c' },
      forest: { emoji: '🌵', glow: '#43e97b' },
      desert: { emoji: '🏜️', glow: '#fee140' },
      ocean: { emoji: '💧', glow: '#4facfe' }
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
      ice: { emoji: '🌈', glow: '#a8edea' },
      volcano: { emoji: '🌈', glow: '#f5576c' },
      forest: { emoji: '🌈', glow: '#38f9d7' },
      desert: { emoji: '🌈', glow: '#fee140' },
      ocean: { emoji: '🌈', glow: '#4facfe' }
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
      ice: { emoji: '🌑', glow: '#a8edea' },
      volcano: { emoji: '🌱', glow: '#ff6b6b' },
      forest: { emoji: '🌿', glow: '#43e97b' },
      desert: { emoji: '🪨', glow: '#fee140' },
      ocean: { emoji: '🪨', glow: '#4facfe' }
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
      ice: { emoji: '🔴', glow: '#a8edea' },
      volcano: { emoji: '🪴', glow: '#ff6b6b' },
      forest: { emoji: '🌿', glow: '#43e97b' },
      desert: { emoji: '🟥', glow: '#fee140' },
      ocean: { emoji: '🟪', glow: '#4facfe' }
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
      ice: { emoji: '💎', glow: '#a8edea' },
      volcano: { emoji: '🟡', glow: '#f5576c' },
      forest: { emoji: '💛', glow: '#43e97b' },
      desert: { emoji: '💎', glow: '#fbbf24' },
      ocean: { emoji: '🫧', glow: '#4facfe' }
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
      ice: { emoji: '🤍', glow: '#a8edea' },
      volcano: { emoji: '🌼', glow: '#f5576c' },
      forest: { emoji: '🌼', glow: '#43e97b' },
      desert: { emoji: '🌼', glow: '#fbbf24' },
      ocean: { emoji: '🤍', glow: '#4facfe' }
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
      ice: { emoji: '🩵', glow: '#a8edea' },
      volcano: { emoji: '🟢', glow: '#f5576c' },
      forest: { emoji: '🌿', glow: '#43e97b' },
      desert: { emoji: '🟩', glow: '#fee140' },
      ocean: { emoji: '🌿', glow: '#00f2fe' }
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
      ice: { emoji: '🪷', glow: '#a8edea' },
      volcano: { emoji: '🪷', glow: '#f5576c' },
      forest: { emoji: '🪷', glow: '#38f9d7' },
      desert: { emoji: '🪷', glow: '#fee140' },
      ocean: { emoji: '🪷', glow: '#00f2fe' }
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

export function getPlantTypeById(id: string): PlantType | undefined {
  return PLANT_TYPES.find(p => p.id === id);
}

export function getPlanetById(id: string): Planet | undefined {
  return PLANETS.find(p => p.id === id);
}

export function generateSeedsFromExploration(planet: Planet): Seed[] {
  const count = Math.floor(Math.random() * 3) + 1;
  const result: Seed[] = [];
  const usedPlantIds = new Set<string>();

  const eligiblePlants = PLANT_TYPES.filter(p => {
    const isNative = p.nativePlanets.includes(planet.type);
    const isPreferred = planet.preferredPlants.includes(p.id);
    return isNative || isPreferred || Math.random() < 0.2;
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

    let random = Math.random() * totalWeight;
    let selectedPlant = weightedPlants[0];
    
    for (const plant of weightedPlants) {
      let weight = RARITY_WEIGHTS[plant.rarity];
      if (plant.nativePlanets.includes(planet.type)) weight *= 2;
      if (planet.preferredPlants.includes(plant.id)) weight *= 1.5;
      random -= weight;
      if (random <= 0) {
        selectedPlant = plant;
        break;
      }
    }

    usedPlantIds.add(selectedPlant.id);
    const quantity = Math.floor(Math.random() * 3) + 1;
    result.push({
      plantTypeId: selectedPlant.id,
      quantity
    });
  }

  return result;
}

export function calculateGrowthTime(plantType: PlantType, planetType: PlanetType): number {
  const planet = PLANETS.find(p => p.type === planetType);
  let modifier = planet ? planet.growthModifier : 1;
  
  if (plantType.nativePlanets.includes(planetType)) {
    modifier *= 0.8;
  }

  return Math.round(plantType.baseGrowthTime / modifier);
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
