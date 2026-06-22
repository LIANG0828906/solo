export interface Food {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  notes: string;
}

export interface MealIngredient {
  name: string;
  amount: number;
  unit: string;
  inStock: boolean;
}

export interface Meal {
  id: string;
  name: string;
  time: 'breakfast' | 'lunch' | 'dinner';
  cookTime: number;
  ingredients: MealIngredient[];
  steps: string[];
  calories: number;
  protein: number;
  fat: number;
  carb: number;
}

export interface UserSettings {
  goalType: 'muscle' | 'fatLoss' | 'balanced';
  dailyCalories: number;
  proteinRatio: number;
  fatRatio: number;
  carbRatio: number;
}

export type MealPlan = {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
};
