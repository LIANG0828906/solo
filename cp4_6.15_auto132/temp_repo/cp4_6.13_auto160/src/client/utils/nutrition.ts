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
  '米饭': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  '白饭': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  '糙米': { calories: 111, protein: 2.6, fat: 0.3, carbs: 23 },
  '糯米': { calories: 112, protein: 2, fat: 0.3, carbs: 24 },
  '小米': { calories: 119, protein: 3.5, fat: 1.2, carbs: 25 },
  '玉米': { calories: 86, protein: 3.4, fat: 1.5, carbs: 19 },
  '燕麦': { calories: 389, protein: 17, fat: 7, carbs: 66 },
  '荞麦': { calories: 343, protein: 13, fat: 3.4, carbs: 71 },
  '红豆': { calories: 329, protein: 20, fat: 0.6, carbs: 63 },
  '绿豆': { calories: 320, protein: 24, fat: 0.8, carbs: 62 },
  '黑豆': { calories: 381, protein: 36, fat: 15.9, carbs: 33.6 },
  '黄豆': { calories: 446, protein: 36, fat: 19, carbs: 30 },
  '豌豆': { calories: 81, protein: 5.4, fat: 0.4, carbs: 14 },
  '蚕豆': { calories: 111, protein: 8.8, fat: 0.4, carbs: 19 },
  '扁豆': { calories: 92, protein: 6, fat: 0.4, carbs: 17 },
  '豆角': { calories: 30, protein: 2.5, fat: 0.2, carbs: 5.8 },
  '茄子': { calories: 25, protein: 1, fat: 0.2, carbs: 5.7 },
  '冬瓜': { calories: 12, protein: 0.4, fat: 0.2, carbs: 2.6 },
  '南瓜': { calories: 26, protein: 1, fat: 0.1, carbs: 6.5 },
  '丝瓜': { calories: 19, protein: 1, fat: 0.2, carbs: 4.2 },
  '苦瓜': { calories: 19, protein: 1, fat: 0.1, carbs: 4.9 },
  '莴笋': { calories: 14, protein: 1, fat: 0.1, carbs: 2.8 },
  '芹菜': { calories: 13, protein: 0.8, fat: 0.1, carbs: 2.5 },
  '韭菜': { calories: 25, protein: 2.1, fat: 0.3, carbs: 3.2 },
  '葱': { calories: 32, protein: 1.7, fat: 0.3, carbs: 6.5 },
  '香菜': { calories: 31, protein: 1.8, fat: 0.4, carbs: 5.6 },
  '苋菜': { calories: 25, protein: 2.8, fat: 0.3, carbs: 3.4 },
  '空心菜': { calories: 20, protein: 2.2, fat: 0.3, carbs: 2.2 },
  '芦笋': { calories: 20, protein: 2.2, fat: 0.1, carbs: 3.9 },
  '竹笋': { calories: 25, protein: 2.6, fat: 0.2, carbs: 3.6 },
  '莲藕': { calories: 74, protein: 2, fat: 0.1, carbs: 17 },
  '红薯': { calories: 86, protein: 1.6, fat: 0.1, carbs: 20 },
  '紫薯': { calories: 82, protein: 1.5, fat: 0.1, carbs: 19 },
  '山药': { calories: 55, protein: 1.9, fat: 0.2, carbs: 12 },
  '芋艿': { calories: 81, protein: 2.4, fat: 0.2, carbs: 18 },
  '木耳菜': { calories: 22, protein: 1.7, fat: 0.3, carbs: 2.6 },
  '娃娃菜': { calories: 12, protein: 1.5, fat: 0.1, carbs: 2.2 },
  '生菜': { calories: 13, protein: 1.3, fat: 0.2, carbs: 2 },
  '油麦菜': { calories: 15, protein: 1.4, fat: 0.3, carbs: 2.1 },
  '茼蒿': { calories: 23, protein: 1.9, fat: 0.3, carbs: 3.1 },
  '荠菜': { calories: 31, protein: 5.2, fat: 0.4, carbs: 4.7 },
  '香椿': { calories: 47, protein: 1.7, fat: 0.4, carbs: 9.1 },
  '蕨菜': { calories: 39, protein: 1.6, fat: 0.3, carbs: 8.8 },
  '马齿苋': { calories: 27, protein: 2.3, fat: 0.3, carbs: 3.4 },
  '枸杞': { calories: 258, protein: 14, fat: 1.7, carbs: 64 },
  '红枣': { calories: 276, protein: 2.1, fat: 0.4, carbs: 67 },
  '桂圆': { calories: 71, protein: 1.2, fat: 0.1, carbs: 17 },
  '荔枝': { calories: 66, protein: 0.9, fat: 0.2, carbs: 17 },
  '龙眼': { calories: 60, protein: 1.2, fat: 0.1, carbs: 15 },
  '芒果': { calories: 60, protein: 0.8, fat: 0.4, carbs: 15 },
  '菠萝': { calories: 48, protein: 0.5, fat: 0.1, carbs: 13 },
  '橙子': { calories: 47, protein: 0.9, fat: 0.1, carbs: 12 },
  '橘子': { calories: 53, protein: 0.8, fat: 0.3, carbs: 13 },
  '柚子': { calories: 38, protein: 0.8, fat: 0.1, carbs: 10 },
  '柠檬': { calories: 29, protein: 1.1, fat: 0.3, carbs: 6 },
  '葡萄': { calories: 69, protein: 0.6, fat: 0.2, carbs: 18 },
  '草莓': { calories: 32, protein: 0.7, fat: 0.3, carbs: 8 },
  '蓝莓': { calories: 57, protein: 0.7, fat: 0.3, carbs: 14 },
  '樱桃': { calories: 50, protein: 1.1, fat: 0.3, carbs: 12 },
  '桃子': { calories: 39, protein: 0.9, fat: 0.1, carbs: 10 },
  '李子': { calories: 46, protein: 0.7, fat: 0.3, carbs: 11 },
  '杏子': { calories: 48, protein: 0.9, fat: 0.1, carbs: 11 },
  '梨子': { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
  '西瓜': { calories: 30, protein: 0.6, fat: 0.2, carbs: 8 },
  '哈密瓜': { calories: 34, protein: 0.8, fat: 0.1, carbs: 8 },
  '甜瓜': { calories: 28, protein: 0.8, fat: 0.1, carbs: 6 },
  '猕猴桃': { calories: 56, protein: 1.1, fat: 0.3, carbs: 14 },
  '火龙果': { calories: 50, protein: 1.1, fat: 0.2, carbs: 13 },
  '榴莲': { calories: 147, protein: 1.5, fat: 5.3, carbs: 27 },
  '山竹': { calories: 73, protein: 0.4, fat: 0.2, carbs: 18 },
  '椰子': { calories: 354, protein: 3.3, fat: 33, carbs: 15 },
  '石榴': { calories: 68, protein: 1.7, fat: 0.4, carbs: 18 },
  '柿子': { calories: 70, protein: 0.7, fat: 0.1, carbs: 19 },
  '山楂': { calories: 98, protein: 0.5, fat: 0.6, carbs: 25 },
  '杨梅': { calories: 30, protein: 0.8, fat: 0.2, carbs: 7 },
  '枇杷': { calories: 41, protein: 0.8, fat: 0.2, carbs: 10 },
  '橄榄': { calories: 115, protein: 0.8, fat: 10.9, carbs: 4 },
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
