export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id: string;
  foodId: string;
  foodName: string;
  amount: number;
  mealType: MealType;
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface DailyNutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}
