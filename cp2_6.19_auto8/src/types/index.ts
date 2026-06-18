export interface FoodNutrient {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
}

export interface MealEntry {
  id: string;
  foodName: string;
  grams: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  timestamp: number;
  isNew?: boolean;
}

export interface NutritionGoals {
  dailyCalories: number;
  minProtein: number;
  maxFat: number;
  maxCarbs: number;
}

export interface DailyTotal {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

export interface MealFormData {
  foodName: string;
  grams: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface GoalStatus {
  calories: boolean;
  protein: boolean;
  fat: boolean;
  carbs: boolean;
}

export type NutrientType = 'protein' | 'fat' | 'carbs';
