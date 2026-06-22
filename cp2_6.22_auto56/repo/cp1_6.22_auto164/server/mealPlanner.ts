import type { Ingredient, Nutrition, Recipe, MealCategory, WeekPlan, DailyNutrition, WeeklyNutrition } from './types';

const ingredientNutritionDB: Record<string, Nutrition> = {
  '鸡蛋': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  '牛奶': { calories: 54, protein: 3.2, carbs: 5, fat: 3.2 },
  '燕麦': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  '鸡胸肉': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  '米饭': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  '西兰花': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  '牛肉': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  '面条': { calories: 270, protein: 9, carbs: 55, fat: 2 },
  '番茄': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  '黄瓜': { calories: 15, protein: 0.8, carbs: 3.6, fat: 0.1 },
  '苹果': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  '香蕉': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  '面包': { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  '黄油': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  '橄榄油': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  '豆腐': { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  '菠菜': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  '三文鱼': { calories: 208, protein: 20, carbs: 0, fat: 13 },
  '土豆': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  '胡萝卜': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
};

export function calculateNutrition(ingredients: Ingredient[]): Nutrition {
  const total: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const ing of ingredients) {
    const per100g = ingredientNutritionDB[ing.name] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const factor = ing.grams / 100;
    total.calories += per100g.calories * factor;
    total.protein += per100g.protein * factor;
    total.carbs += per100g.carbs * factor;
    total.fat += per100g.fat * factor;
  }
  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
  };
}

export function filterRecipes(recipes: Recipe[], category?: MealCategory, search?: string): Recipe[] {
  return recipes.filter(r => {
    const matchCategory = !category || r.category === category;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });
}

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function calculateDailyNutrition(dayMeals: { breakfast: Recipe | null; lunch: Recipe | null; dinner: Recipe | null; snack: Recipe | null }, dayIndex: number): DailyNutrition {
  const meals = [dayMeals.breakfast, dayMeals.lunch, dayMeals.dinner, dayMeals.snack];
  const total: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of meals) {
    if (meal) {
      total.calories += meal.nutrition.calories;
      total.protein += meal.nutrition.protein;
      total.carbs += meal.nutrition.carbs;
      total.fat += meal.nutrition.fat;
    }
  }
  return {
    day: dayNames[dayIndex],
    calories: Math.round(total.calories),
    protein: Math.round(total.protein * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
  };
}

export function calculateWeeklyNutrition(weekPlan: WeekPlan): WeeklyNutrition {
  const daily: DailyNutrition[] = weekPlan.map((day, idx) => calculateDailyNutrition(day, idx));
  const total: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const d of daily) {
    total.calories += d.calories;
    total.protein += d.protein;
    total.carbs += d.carbs;
    total.fat += d.fat;
  }
  return {
    daily,
    total: {
      calories: Math.round(total.calories),
      protein: Math.round(total.protein * 10) / 10,
      carbs: Math.round(total.carbs * 10) / 10,
      fat: Math.round(total.fat * 10) / 10,
    },
  };
}

export function formatChartData(weekly: WeeklyNutrition) {
  const barData = weekly.daily.map(d => ({
    day: d.day,
    热量: d.calories,
    蛋白质: d.protein,
    碳水: d.carbs,
    脂肪: d.fat,
  }));
  const pieData = [
    { name: '热量', value: weekly.total.calories, color: '#F59E0B' },
    { name: '蛋白质', value: weekly.total.protein, color: '#10B981' },
    { name: '碳水', value: weekly.total.carbs, color: '#3B82F6' },
    { name: '脂肪', value: weekly.total.fat, color: '#EF4444' },
  ];
  return { barData, pieData };
}
