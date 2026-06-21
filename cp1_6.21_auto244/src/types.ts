export interface Ingredient {
  name: string;
  amount: string;
}

export interface HistoryEntry {
  id: string;
  author: string;
  authorAvatar: string;
  timestamp: string;
  summary: string;
  changes: {
    ingredients?: Array<{
      name: string;
      oldAmount?: string;
      newAmount?: string;
      note?: string;
      action?: string;
    }>;
    steps?: Array<{
      index: number;
      oldDesc?: string;
      newDesc?: string;
    }>;
  };
}

export interface Recipe {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  cuisine: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  improveCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export interface RecipeSummary {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  cuisine: string;
  description: string;
  improveCount: number;
  updatedAt: string;
}

export interface IngredientChange {
  name: string;
  oldAmount: string;
  newAmount: string;
}

export interface StepChange {
  index: number;
  oldDesc: string;
  newDesc: string;
}

export interface ImproveRequest {
  author: string;
  authorName: string;
  ingredientChanges: IngredientChange[];
  stepChanges: StepChange[];
  summary: string;
}
