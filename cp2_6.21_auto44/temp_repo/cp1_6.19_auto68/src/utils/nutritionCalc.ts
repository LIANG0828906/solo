import type { IngredientEntry, NutritionInfo } from '../types';

export interface FoodData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  emoji: string;
  color: string;
}

const FOOD_DATABASE: Record<string, FoodData> = {
  '鸡胸肉': { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, emoji: '🍗', color: '#F5A623' },
  '牛肉': { calories: 250, protein: 26, fat: 15, carbs: 0, fiber: 0, emoji: '🥩', color: '#E74C3C' },
  '猪肉': { calories: 242, protein: 27, fat: 14, carbs: 0, fiber: 0, emoji: '🥓', color: '#C0392B' },
  '五花肉': { calories: 349, protein: 14, fat: 35, carbs: 0, fiber: 0, emoji: '🥩', color: '#E74C3C' },
  '排骨': { calories: 264, protein: 18, fat: 20, carbs: 0, fiber: 0, emoji: '🍖', color: '#C0392B' },
  '三文鱼': { calories: 208, protein: 20, fat: 13, carbs: 0, fiber: 0, emoji: '🐟', color: '#E67E22' },
  '鲈鱼': { calories: 105, protein: 19, fat: 3.3, carbs: 0, fiber: 0, emoji: '🐟', color: '#5DADE2' },
  '虾': { calories: 99, protein: 24, fat: 0.3, carbs: 0.2, fiber: 0, emoji: '🦐', color: '#F39C12' },
  '鸡蛋': { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, emoji: '🥚', color: '#F1C40F' },
  '豆腐': { calories: 76, protein: 8, fat: 4.8, carbs: 1.9, fiber: 0.3, emoji: '🟨', color: '#FFFDD0' },
  '大米': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4, emoji: '🍚', color: '#ECF0F1' },
  '面条': { calories: 138, protein: 4.5, fat: 2.1, carbs: 25, fiber: 1.8, emoji: '🍜', color: '#FAD7A0' },
  '西兰花': { calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6, emoji: '🥦', color: '#27AE60' },
  '胡萝卜': { calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8, emoji: '🥕', color: '#E67E22' },
  '番茄': { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2, emoji: '🍅', color: '#E74C3C' },
  '洋葱': { calories: 40, protein: 1.1, fat: 0.1, carbs: 9, fiber: 1.7, emoji: '🧅', color: '#8E44AD' },
  '土豆': { calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.2, emoji: '🥔', color: '#D4AC0D' },
  '菠菜': { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2, emoji: '🥬', color: '#2ECC71' },
  '花生': { calories: 567, protein: 26, fat: 49, carbs: 16, fiber: 8.5, emoji: '🥜', color: '#D4AC0D' },
  '大蒜': { calories: 149, protein: 6.4, fat: 0.5, carbs: 33, fiber: 2.1, emoji: '🧄', color: '#F5F5DC' },
  '生姜': { calories: 80, protein: 1.8, fat: 0.8, carbs: 18, fiber: 2, emoji: '🫚', color: '#FAD7A0' },
  '香菇': { calories: 34, protein: 2.2, fat: 0.3, carbs: 7, fiber: 2.5, emoji: '🍄', color: '#795548' },
  '青椒': { calories: 20, protein: 0.9, fat: 0.2, carbs: 4.6, fiber: 1.7, emoji: '🫑', color: '#27AE60' },
  '牛奶': { calories: 42, protein: 3.4, fat: 1, carbs: 5, fiber: 0, emoji: '🥛', color: '#ECF0F1' },
  '奶酪': { calories: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0, emoji: '🧀', color: '#F1C40F' },
  '黄油': { calories: 717, protein: 0.9, fat: 81, carbs: 0.1, fiber: 0, emoji: '🧈', color: '#F9E79F' },
  '酱油': { calories: 53, protein: 8, fat: 0.6, carbs: 5, fiber: 0.8, emoji: '🫗', color: '#5D4E37' },
  '白糖': { calories: 387, protein: 0, fat: 0, carbs: 100, fiber: 0, emoji: '🍬', color: '#FDFEFE' },
  '食用油': { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0, emoji: '🫒', color: '#F4D03F' },
  '玉米': { calories: 86, protein: 3.3, fat: 1.4, carbs: 19, fiber: 2.7, emoji: '🌽', color: '#F1C40F' },
};

export function calculateNutrition(ingredients: IngredientEntry[]): NutritionInfo {
  const result: NutritionInfo = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  for (const ing of ingredients) {
    const food = FOOD_DATABASE[ing.name];
    if (!food) continue;
    const ratio = ing.grams / 100;
    result.calories += food.calories * ratio;
    result.protein += food.protein * ratio;
    result.fat += food.fat * ratio;
    result.carbs += food.carbs * ratio;
    result.fiber += food.fiber * ratio;
  }
  result.calories = Math.round(result.calories * 10) / 10;
  result.protein = Math.round(result.protein * 10) / 10;
  result.fat = Math.round(result.fat * 10) / 10;
  result.carbs = Math.round(result.carbs * 10) / 10;
  result.fiber = Math.round(result.fiber * 10) / 10;
  return result;
}

export function searchFood(query: string): string[] {
  if (!query.trim()) return Object.keys(FOOD_DATABASE);
  return Object.keys(FOOD_DATABASE).filter(name => name.includes(query.trim()));
}

export function getFoodData(name: string): FoodData | undefined {
  return FOOD_DATABASE[name];
}

export function getAllFoodNames(): string[] {
  return Object.keys(FOOD_DATABASE);
}
