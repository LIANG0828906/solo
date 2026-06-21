export interface Ingredient {
  name: string;
  amount: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

export interface NutritionPer100g {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

export interface Rating {
  userId: string;
  userName: string;
  score: number;
  comment: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: '中餐' | '西餐' | '甜品' | '其他';
  cookTime: number;
  steps: string[];
  ingredients: Ingredient[];
  nutritionPer100g: NutritionPer100g;
  author: string;
  authorId: string;
  authorAvatar: string;
  coverGradient: string;
  ratings: Rating[];
  avgRating: number;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}
