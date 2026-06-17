import type { Nutrients, Food } from '../data/foods';

export interface MealItem {
  id: string;
  foodId: string;
  foodName: string;
  amount: number;
  nutrients: Nutrients;
}

export interface DailyRecord {
  date: string;
  items: MealItem[];
}

export const DRV: Nutrients = {
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 300,
  fiber: 25,
  sodium: 2000,
};

export const NUTRIENT_LABELS: Record<keyof Nutrients, string> = {
  calories: '热量',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水',
  fiber: '膳食纤维',
  sodium: '钠',
};

export const NUTRIENT_UNITS: Record<keyof Nutrients, string> = {
  calories: 'kcal',
  protein: 'g',
  fat: 'g',
  carbs: 'g',
  fiber: 'g',
  sodium: 'mg',
};

export const NUTRIENT_COLORS: Record<keyof Nutrients, string> = {
  calories: '#FF6B35',
  protein: '#4ECDC4',
  fat: '#FFD166',
  carbs: '#6C5CE7',
  fiber: '#00CEC9',
  sodium: '#E17055',
};

export const NUTRIENT_ORDER: (keyof Nutrients)[] = [
  'calories',
  'protein',
  'fat',
  'carbs',
  'fiber',
  'sodium',
];

export function scaleNutrients(food: Food, amount: number): Nutrients {
  const scale = amount / 100;
  return {
    calories: Math.round(food.nutrients.calories * scale * 10) / 10,
    protein: Math.round(food.nutrients.protein * scale * 10) / 10,
    fat: Math.round(food.nutrients.fat * scale * 10) / 10,
    carbs: Math.round(food.nutrients.carbs * scale * 10) / 10,
    fiber: Math.round(food.nutrients.fiber * scale * 10) / 10,
    sodium: Math.round(food.nutrients.sodium * scale * 10) / 10,
  };
}

export function calculateTotalNutrients(items: MealItem[]): Nutrients {
  const total: Nutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0,
  };

  for (const item of items) {
    total.calories += item.nutrients.calories;
    total.protein += item.nutrients.protein;
    total.fat += item.nutrients.fat;
    total.carbs += item.nutrients.carbs;
    total.fiber += item.nutrients.fiber;
    total.sodium += item.nutrients.sodium;
  }

  return {
    calories: Math.round(total.calories * 10) / 10,
    protein: Math.round(total.protein * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    fiber: Math.round(total.fiber * 10) / 10,
    sodium: Math.round(total.sodium * 10) / 10,
  };
}

export function calculatePercentage(nutrients: Nutrients): Record<keyof Nutrients, number> {
  return {
    calories: Math.round((nutrients.calories / DRV.calories) * 100),
    protein: Math.round((nutrients.protein / DRV.protein) * 100),
    fat: Math.round((nutrients.fat / DRV.fat) * 100),
    carbs: Math.round((nutrients.carbs / DRV.carbs) * 100),
    fiber: Math.round((nutrients.fiber / DRV.fiber) * 100),
    sodium: Math.round((nutrients.sodium / DRV.sodium) * 100),
  };
}

export function getMaxNutrients(foodsList: Food[]): Nutrients {
  const max: Nutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0,
  };

  for (const food of foodsList) {
    max.calories = Math.max(max.calories, food.nutrients.calories);
    max.protein = Math.max(max.protein, food.nutrients.protein);
    max.fat = Math.max(max.fat, food.nutrients.fat);
    max.carbs = Math.max(max.carbs, food.nutrients.carbs);
    max.fiber = Math.max(max.fiber, food.nutrients.fiber);
    max.sodium = Math.max(max.sodium, food.nutrients.sodium);
  }

  return max;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLast7Days(from: Date = new Date()): string[] {
  const days: string[] = [];
  const base = new Date(from);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
