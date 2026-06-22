export interface Food {
  id: string;
  name: string;
  category: '主食' | '肉类' | '蔬菜' | '水果' | '乳制品' | '其他';
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  calories: number;
}

export interface FoodRecord {
  id: string;
  foodId: string;
  foodName: string;
  amount: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';
  date: string;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  activityLevel: 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanItem {
  foodId: string;
  foodName: string;
  amount: number;
  calories: number;
}

export interface MealPlanDay {
  breakfast: MealPlanItem[];
  lunch: MealPlanItem[];
  dinner: MealPlanItem[];
  snack1: MealPlanItem[];
  snack2: MealPlanItem[];
}

export type WeeklyMealPlan = MealPlanDay[];

export type MealTypeLabel = '早餐' | '午餐' | '晚餐' | '加餐1' | '加餐2';
