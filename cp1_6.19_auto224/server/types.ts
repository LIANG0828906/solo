export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface Recipe {
  id: string;
  name: string;
  timeMinutes: number;
  difficulty: number;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  matchScore?: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  shareId: string;
  items: ShoppingItem[];
  createdAt: string;
}

export interface RecommendRequest {
  ingredients: Ingredient[];
  preferences?: {
    tags?: string[];
    maxTimeMinutes?: number;
    maxDifficulty?: number;
  };
}
