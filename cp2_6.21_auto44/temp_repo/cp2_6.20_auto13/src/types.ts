export interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  order: number;
  nutritionPerUnit?: NutritionData;
}

export interface Step {
  id: string;
  title: string;
  content: string;
  images: string[];
  timerSeconds: number;
  order: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  images: string[];
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  steps: Step[];
  nutrition: NutritionData;
  avgRating: number;
  ratingCount: number;
  ratingDistribution: number[];
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export interface Collaborator {
  userId: string;
  username: string;
  avatar: string;
  cursorPosition?: { section: string; id: string };
  color: string;
}

export interface FavoriteFolder {
  id: string;
  name: string;
  recipeIds: string[];
}

export interface VersionSnapshot {
  id: string;
  recipeId: string;
  snapshotJson: string;
  createdBy: string;
  createdAt: string;
}

export interface ReplacementSuggestion {
  name: string;
  nutritionPerUnit: NutritionData;
  unit: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
