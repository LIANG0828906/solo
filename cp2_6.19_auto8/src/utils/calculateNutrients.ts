import type { FoodNutrient, MealEntry, MealFormData, DailyTotal } from '../types';

const foodDatabase: Record<string, FoodNutrient> = {
  '米饭': { name: '米饭', caloriesPer100g: 130, proteinPer100g: 2.6, fatPer100g: 0.3, carbsPer100g: 28 },
  '面条': { name: '面条', caloriesPer100g: 138, proteinPer100g: 4.5, fatPer100g: 0.5, carbsPer100g: 29 },
  '面包': { name: '面包', caloriesPer100g: 312, proteinPer100g: 8.3, fatPer100g: 5.1, carbsPer100g: 58 },
  '燕麦': { name: '燕麦', caloriesPer100g: 389, proteinPer100g: 16.9, fatPer100g: 6.9, carbsPer100g: 66 },
  '鸡胸肉': { name: '鸡胸肉', caloriesPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbsPer100g: 0 },
  '牛肉': { name: '牛肉', caloriesPer100g: 250, proteinPer100g: 26, fatPer100g: 15, carbsPer100g: 0 },
  '鸡蛋': { name: '鸡蛋', caloriesPer100g: 155, proteinPer100g: 13, fatPer100g: 11, carbsPer100g: 1.1 },
  '豆腐': { name: '豆腐', caloriesPer100g: 76, proteinPer100g: 8, fatPer100g: 4.8, carbsPer100g: 1.9 },
  '三文鱼': { name: '三文鱼', caloriesPer100g: 208, proteinPer100g: 20, fatPer100g: 13, carbsPer100g: 0 },
  '苹果': { name: '苹果', caloriesPer100g: 52, proteinPer100g: 0.3, fatPer100g: 0.2, carbsPer100g: 14 },
  '香蕉': { name: '香蕉', caloriesPer100g: 89, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 23 },
  '西兰花': { name: '西兰花', caloriesPer100g: 34, proteinPer100g: 2.8, fatPer100g: 0.4, carbsPer100g: 7 },
  '番茄': { name: '番茄', caloriesPer100g: 18, proteinPer100g: 0.9, fatPer100g: 0.2, carbsPer100g: 4 },
  '牛奶': { name: '牛奶', caloriesPer100g: 42, proteinPer100g: 3.4, fatPer100g: 1, carbsPer100g: 5 },
  '酸奶': { name: '酸奶', caloriesPer100g: 59, proteinPer100g: 10, fatPer100g: 0.7, carbsPer100g: 3.6 },
  '奶酪': { name: '奶酪', caloriesPer100g: 402, proteinPer100g: 25, fatPer100g: 33, carbsPer100g: 1.3 },
  '杏仁': { name: '杏仁', caloriesPer100g: 579, proteinPer100g: 21, fatPer100g: 50, carbsPer100g: 22 },
  '核桃': { name: '核桃', caloriesPer100g: 654, proteinPer100g: 15, fatPer100g: 65, carbsPer100g: 14 },
  '橄榄油': { name: '橄榄油', caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbsPer100g: 0 },
  '土豆': { name: '土豆', caloriesPer100g: 77, proteinPer100g: 2, fatPer100g: 0.1, carbsPer100g: 17 },
  '红薯': { name: '红薯', caloriesPer100g: 86, proteinPer100g: 1.6, fatPer100g: 0.1, carbsPer100g: 20 },
  '菠菜': { name: '菠菜', caloriesPer100g: 23, proteinPer100g: 2.9, fatPer100g: 0.4, carbsPer100g: 3.6 },
  '胡萝卜': { name: '胡萝卜', caloriesPer100g: 41, proteinPer100g: 0.9, fatPer100g: 0.2, carbsPer100g: 10 },
  '鸡腿': { name: '鸡腿', caloriesPer100g: 184, proteinPer100g: 24, fatPer100g: 9.5, carbsPer100g: 0 },
  '虾': { name: '虾', caloriesPer100g: 99, proteinPer100g: 21, fatPer100g: 0.3, carbsPer100g: 0.2 },
  '鲤鱼': { name: '鲤鱼', caloriesPer100g: 127, proteinPer100g: 17.6, fatPer100g: 4.1, carbsPer100g: 0.5 },
  '巧克力': { name: '巧克力', caloriesPer100g: 546, proteinPer100g: 7.6, fatPer100g: 31, carbsPer100g: 57 },
  '饼干': { name: '饼干', caloriesPer100g: 453, proteinPer100g: 6.2, fatPer100g: 16, carbsPer100g: 71 },
};

const cache = new Map<string, MealEntry>();

export function getFoodList(): string[] {
  return Object.keys(foodDatabase);
}

export function calculateMealNutrients(data: MealFormData): MealEntry | null {
  const cacheKey = `${data.foodName}-${data.grams}-${data.mealType}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    return {
      ...cached,
      id: generateId(),
      timestamp: Date.now(),
      isNew: true,
    };
  }

  const food = foodDatabase[data.foodName];
  if (!food) {
    return null;
  }

  const factor = data.grams / 100;
  const entry: MealEntry = {
    id: generateId(),
    foodName: data.foodName,
    grams: data.grams,
    mealType: data.mealType,
    calories: Math.round(food.caloriesPer100g * factor * 10) / 10,
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    timestamp: Date.now(),
    isNew: true,
  };

  cache.set(cacheKey, { ...entry, id: '', timestamp: 0, isNew: false });
  
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  return entry;
}

export function calculateDailyTotal(meals: MealEntry[]): DailyTotal {
  return meals.reduce(
    (total, meal) => ({
      totalCalories: Math.round((total.totalCalories + meal.calories) * 10) / 10,
      totalProtein: Math.round((total.totalProtein + meal.protein) * 10) / 10,
      totalFat: Math.round((total.totalFat + meal.fat) * 10) / 10,
      totalCarbs: Math.round((total.totalCarbs + meal.carbs) * 10) / 10,
    }),
    { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 }
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getMealTypeLabel(type: MealEntry['mealType']): string {
  const labels: Record<MealEntry['mealType'], string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };
  return labels[type];
}

export function getMealTypeIcon(type: MealEntry['mealType']): string {
  const icons: Record<MealEntry['mealType'], string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
  };
  return icons[type];
}
