export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: 'g' | 'ml' | '个' | '勺' | '杯';
  caloriesPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Recipe {
  id: string;
  title: string;
  imageUrl?: string;
  cookTime: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  cuisine: string;
  steps: string;
  ingredients: Ingredient[];
  nutrition: Nutrition;
  isFavorite: boolean;
  rating: number;
  createdAt: string;
}

export interface MealPlan {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeId: string;
}

export interface DailyGoal {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface DailySummary {
  date: string;
  nutrition: Nutrition;
  goal: DailyGoal;
  percentage: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}
