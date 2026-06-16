export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
}

export interface Step {
  order: number;
  description: string;
}

export interface Comment {
  id: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  cookTime: number;
  difficulty: number;
  gradientColors: string[];
  ingredients: Ingredient[];
  steps: Step[];
  comments: Comment[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  price: number;
  purchased: boolean;
}

export interface Favorite {
  recipeId: string;
  addedAt: string;
}

export interface HistoryItem {
  recipeId: string;
  viewedAt: string;
}

export interface IngredientSuggestion {
  name: string;
  emoji: string;
}
