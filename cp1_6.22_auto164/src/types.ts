export interface Ingredient {
  name: string;
  grams: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Recipe {
  id: string;
  name: string;
  category: MealCategory;
  ingredients: Ingredient[];
  steps: string[];
  nutrition: Nutrition;
}

export interface DayMeals {
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
  snack: Recipe | null;
}

export type WeekPlan = DayMeals[];

export interface DailyNutrition {
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeeklyNutrition {
  daily: DailyNutrition[];
  total: Nutrition;
}

export interface ChartData {
  barData: Array<{
    day: string;
    热量: number;
    蛋白质: number;
    碳水: number;
    脂肪: number;
  }>;
  pieData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface WeekPlanResponse {
  plan: WeekPlan;
  nutrition: WeeklyNutrition;
  chartData: ChartData;
}
