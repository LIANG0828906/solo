import type { Ingredient, Nutrition } from '../../types';

const NUTRITION_DATABASE: Record<string, Nutrition> = {
  '鸡蛋': { calories: 155, protein: 13, fat: 11, carbs: 1.1 },
  '牛奶': { calories: 42, protein: 3.4, fat: 1, carbs: 5 },
  '鸡胸肉': { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  '牛肉': { calories: 250, protein: 26, fat: 15, carbs: 0 },
  '猪肉': { calories: 242, protein: 27, fat: 14, carbs: 0 },
  '米饭': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  '面条': { calories: 138, protein: 4.5, fat: 0.7, carbs: 29 },
  '面包': { calories: 265, protein: 9, fat: 3.2, carbs: 49 },
  '番茄': { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
  '黄瓜': { calories: 15, protein: 0.8, fat: 0.1, carbs: 3.6 },
  '土豆': { calories: 77, protein: 2, fat: 0.1, carbs: 17 },
  '胡萝卜': { calories: 41, protein: 0.9, fat: 0.2, carbs: 10 },
  '西兰花': { calories: 34, protein: 2.8, fat: 0.4, carbs: 7 },
  '菠菜': { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6 },
  '苹果': { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
  '香蕉': { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
  '豆腐': { calories: 76, protein: 8, fat: 4.8, carbs: 1.9 },
  '青菜': { calories: 15, protein: 1.8, fat: 0.3, carbs: 2.7 },
  '白菜': { calories: 12, protein: 1.5, fat: 0.1, carbs: 2.2 },
  '洋葱': { calories: 40, protein: 1.1, fat: 0.1, carbs: 9 },
  '大蒜': { calories: 149, protein: 6.4, fat: 0.5, carbs: 33 },
  '生姜': { calories: 80, protein: 1.8, fat: 0.8, carbs: 18 },
  '辣椒': { calories: 40, protein: 1.9, fat: 0.4, carbs: 8.8 },
  '酱油': { calories: 53, protein: 8, fat: 0.3, carbs: 4 },
  '盐': { calories: 0, protein: 0, fat: 0, carbs: 0 },
  '糖': { calories: 387, protein: 0, fat: 0, carbs: 100 },
  '油': { calories: 884, protein: 0, fat: 100, carbs: 0 },
  '醋': { calories: 21, protein: 0, fat: 0, carbs: 5.7 },
  '料酒': { calories: 114, protein: 0, fat: 0, carbs: 3 },
  '味精': { calories: 293, protein: 72, fat: 0, carbs: 0.5 },
  '鸡精': { calories: 250, protein: 40, fat: 10, carbs: 15 },
  '淀粉': { calories: 381, protein: 0.3, fat: 0.1, carbs: 94 },
  '面粉': { calories: 364, protein: 10, fat: 1, carbs: 76 },
  '鸡蛋面': { calories: 348, protein: 11, fat: 2, carbs: 72 },
  '粉丝': { calories: 358, protein: 0.8, fat: 0.1, carbs: 88 },
  '木耳': { calories: 265, protein: 12, fat: 1.5, carbs: 66 },
  '香菇': { calories: 34, protein: 2.2, fat: 0.3, carbs: 6.8 },
  '金针菇': { calories: 26, protein: 2.4, fat: 0.3, carbs: 5.1 },
  '虾': { calories: 99, protein: 24, fat: 0.3, carbs: 0.2 },
  '鱼': { calories: 165, protein: 30, fat: 4.5, carbs: 0 },
  '蟹': { calories: 97, protein: 19, fat: 1.5, carbs: 1.1 },
  '鱿鱼': { calories: 84, protein: 17, fat: 1.4, carbs: 0 },
  '海带': { calories: 38, protein: 1.7, fat: 0.6, carbs: 8.4 },
  '紫菜': { calories: 35, protein: 28, fat: 1.1, carbs: 48 },
  '芝麻': { calories: 573, protein: 21, fat: 49, carbs: 15 },
  '花生': { calories: 567, protein: 25, fat: 49, carbs: 16 },
  '核桃': { calories: 654, protein: 15, fat: 65, carbs: 14 },
  '杏仁': { calories: 575, protein: 21, fat: 50, carbs: 20 },
  '蜂蜜': { calories: 304, protein: 0.3, fat: 0, carbs: 82 },
  '巧克力': { calories: 546, protein: 7.6, fat: 31, carbs: 61 },
  '咖啡': { calories: 2, protein: 0.3, fat: 0, carbs: 0 },
  '茶叶': { calories: 1, protein: 0.2, fat: 0, carbs: 0 },
  '可可粉': { calories: 380, protein: 20, fat: 13, carbs: 48 },
  '奶粉': { calories: 496, protein: 26, fat: 27, carbs: 38 },
  '黄油': { calories: 717, protein: 0.9, fat: 81, carbs: 0.1 },
  '奶油': { calories: 345, protein: 2.1, fat: 37, carbs: 3.2 },
  '芝士': { calories: 402, protein: 25, fat: 33, carbs: 1.3 },
  '酸奶': { calories: 59, protein: 3.5, fat: 3.3, carbs: 4.7 },
  '冰淇淋': { calories: 207, protein: 3.5, fat: 11, carbs: 24 },
  '可乐': { calories: 42, protein: 0, fat: 0, carbs: 11 },
  '果汁': { calories: 46, protein: 0.4, fat: 0.1, carbs: 11 },
  '啤酒': { calories: 43, protein: 0.5, fat: 0, carbs: 3.6 },
  '红酒': { calories: 83, protein: 0.1, fat: 0, carbs: 2.6 },
  '白酒': { calories: 298, protein: 0, fat: 0, carbs: 0 },
};

const DEFAULT_NUTRITION: Nutrition = { calories: 100, protein: 3, fat: 2, carbs: 15 };

export function calculateNutrition(ingredients: Ingredient[]): Nutrition {
  const total: Nutrition = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  
  for (const ing of ingredients) {
    const name = ing.name.trim();
    const nutrition = NUTRITION_DATABASE[name] || findClosestMatch(name) || DEFAULT_NUTRITION;
    const factor = ing.quantity / 100;
    
    total.calories += nutrition.calories * factor;
    total.protein += nutrition.protein * factor;
    total.fat += nutrition.fat * factor;
    total.carbs += nutrition.carbs * factor;
  }
  
  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
  };
}

function findClosestMatch(name: string): Nutrition | null {
  const lowerName = name.toLowerCase();
  for (const key of Object.keys(NUTRITION_DATABASE)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return NUTRITION_DATABASE[key];
    }
  }
  return null;
}

export function calculateTotalCost(ingredients: Ingredient[]): number {
  const total = ingredients.reduce((sum, ing) => sum + ing.quantity * ing.price, 0);
  return Math.round(total * 100) / 100;
}
