export interface Ingredient {
  id: string;
  name: string;
  type: 'chicken' | 'fish' | 'vegetable' | 'spice';
  optimalHeat: number;
  cookTime: number;
  color: string;
}

export interface Seasoning {
  id: string;
  name: string;
  type: 'salt' | 'vinegar' | 'sauce' | 'wine' | 'sugar';
  flavor: { salty: number; sour: number; umami: number; sweet: number };
  color: string;
}

export interface FoodInPot {
  ingredient: Ingredient;
  addedTime: number;
  doneness: number;
}

export interface FlavorProfile {
  salty: number;
  sour: number;
  umami: number;
  sweet: number;
}

export interface DishEvaluation {
  quality: number;
  rating: '生涩' | '刚好' | '焦糊' | '绝味';
  comment: string;
}

export interface FinishedDish {
  foods: FoodInPot[];
  seasonings: FlavorProfile;
  evaluation: DishEvaluation;
  cookTime: number;
  averageHeat: number;
}

export const INGREDIENTS: Ingredient[] = [
  {
    id: 'chicken',
    name: '鸡肉',
    type: 'chicken',
    optimalHeat: 65,
    cookTime: 25,
    color: '#f5deb3',
  },
  {
    id: 'fish',
    name: '鲜鱼',
    type: 'fish',
    optimalHeat: 50,
    cookTime: 15,
    color: '#e0e0e0',
  },
  {
    id: 'vegetable',
    name: '时蔬',
    type: 'vegetable',
    optimalHeat: 70,
    cookTime: 10,
    color: '#81c784',
  },
  {
    id: 'spice',
    name: '香料',
    type: 'spice',
    optimalHeat: 40,
    cookTime: 8,
    color: '#a1887f',
  },
];

export const SEASONINGS: Seasoning[] = [
  {
    id: 'salt',
    name: '盐',
    type: 'salt',
    flavor: { salty: 15, sour: 0, umami: 5, sweet: 0 },
    color: '#ffffff',
  },
  {
    id: 'vinegar',
    name: '醋',
    type: 'vinegar',
    flavor: { salty: 0, sour: 18, umami: 3, sweet: 2 },
    color: '#8d6e63',
  },
  {
    id: 'sauce',
    name: '酱',
    type: 'sauce',
    flavor: { salty: 10, sour: 0, umami: 18, sweet: 3 },
    color: '#5d4037',
  },
  {
    id: 'wine',
    name: '酒',
    type: 'wine',
    flavor: { salty: 0, sour: 2, umami: 8, sweet: 5 },
    color: '#d7ccc8',
  },
  {
    id: 'sugar',
    name: '糖',
    type: 'sugar',
    flavor: { salty: 0, sour: 0, umami: 2, sweet: 20 },
    color: '#fff8e1',
  },
];

export function calculateDoneness(
  heat: number,
  elapsedTime: number,
  optimalHeat: number,
  baseCookTime: number
): number {
  const heatFactor = heat / optimalHeat;
  const progress = (elapsedTime * heatFactor) / (baseCookTime * 60);
  return Math.min(150, progress * 100);
}

export function calculateFlavor(
  existingFlavor: FlavorProfile,
  seasoning: Seasoning,
  amount: number = 1
): FlavorProfile {
  return {
    salty: Math.min(100, existingFlavor.salty + seasoning.flavor.salty * amount),
    sour: Math.min(100, existingFlavor.sour + seasoning.flavor.sour * amount),
    umami: Math.min(100, existingFlavor.umami + seasoning.flavor.umami * amount),
    sweet: Math.min(100, existingFlavor.sweet + seasoning.flavor.sweet * amount),
  };
}

export function evaluateDish(
  foods: FoodInPot[],
  flavor: FlavorProfile,
  cookTime: number,
  averageHeat: number
): DishEvaluation {
  if (foods.length === 0) {
    return { quality: 0, rating: '生涩', comment: '锅中尚无食材，请放入食材开始烹饪。' };
  }

  let donenessScore = 0;
  foods.forEach((food) => {
    const optimalDoneness = 70;
    const deviation = Math.abs(food.doneness - optimalDoneness);
    if (deviation < 15) {
      donenessScore += 25;
    } else if (deviation < 30) {
      donenessScore += 15;
    } else if (food.doneness > 100) {
      donenessScore += 5;
    } else {
      donenessScore += 10;
    }
  });
  donenessScore = (donenessScore / foods.length) * (4 / 10);

  const flavorValues = [flavor.salty, flavor.sour, flavor.umami, flavor.sweet];
  const hasFlavor = flavorValues.some((v) => v > 0);
  let flavorScore = 0;
  if (hasFlavor) {
    const targetFlavor = 30;
    flavorValues.forEach((value) => {
      if (value > 0) {
        const deviation = Math.abs(value - targetFlavor);
        if (deviation < 15) {
          flavorScore += 25;
        } else if (deviation < 30) {
          flavorScore += 15;
        } else if (value > 70) {
          flavorScore += 5;
        } else {
          flavorScore += 10;
        }
      }
    });
    flavorScore = (flavorScore / 4) * (3 / 10);
  }

  const heatDeviation = Math.abs(averageHeat - 55);
  let heatScore = 0;
  if (heatDeviation < 20) {
    heatScore = 15;
  } else if (heatDeviation < 35) {
    heatScore = 10;
  } else {
    heatScore = 5;
  }
  heatScore = heatScore * (1.5 / 10);

  const varietyScore = foods.length >= 2 ? 15 : foods.length === 1 ? 8 : 0;

  const totalScore = Math.round(donenessScore + flavorScore + heatScore + varietyScore);
  const quality = Math.min(100, Math.max(0, totalScore));

  const avgDoneness = foods.reduce((sum, f) => sum + f.doneness, 0) / foods.length;
  let rating: '生涩' | '刚好' | '焦糊' | '绝味';
  let comment: string;

  if (quality >= 85) {
    rating = '绝味';
    comment = '此菜只应天上有，人间能得几回尝！火候精准，调味精妙，色香味俱全，堪称绝品！';
  } else if (quality >= 65) {
    rating = '刚好';
    comment = '烹饪得法，味道适中，食材鲜嫩多汁，是一道合格的佳肴。';
  } else if (avgDoneness > 100) {
    rating = '焦糊';
    comment = '火候过大，食材已焦，苦味过重，难以入口。请适当降低火候或缩短烹饪时间。';
  } else if (avgDoneness < 40) {
    rating = '生涩';
    comment = '火候不足，食材尚未熟透，腥味未除，还需继续烹饪。';
  } else {
    rating = '生涩';
    comment = '调味稍有偏差，或可再斟酌一下咸酸甜鲜的配比，以臻完美。';
  }

  return { quality, rating, comment };
}

export function getDonenessColor(doneness: number, baseColor: string): string {
  if (doneness < 40) {
    return baseColor;
  } else if (doneness < 70) {
    return blendColors(baseColor, '#8d6e63', (doneness - 40) / 30);
  } else if (doneness < 100) {
    return blendColors('#8d6e63', '#5d4037', (doneness - 70) / 30);
  } else {
    return blendColors('#3e2723', '#1a1a1a', Math.min(1, (doneness - 100) / 50));
  }
}

function blendColors(color1: string, color2: string, ratio: number): string {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function getHeatLevelName(heat: number): string {
  if (heat < 35) return '低火';
  if (heat < 70) return '中火';
  return '高火';
}

export function getFlameHeight(heat: number): number {
  if (heat < 35) return 40;
  if (heat < 70) return 80;
  return 120;
}
