export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  duration?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrls: string[];
  ingredients: Ingredient[];
  steps: Step[];
  totalTime: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];
  createdAt: string;
}

export interface ShoppingListItem {
  name: string;
  totalQuantity: number;
  unit: string;
  recipes: string[];
}

export interface Stats {
  totalRecipes: number;
  totalCollections: number;
  recentAdded: number;
  tagDistribution: { tag: string; count: number }[];
}

export interface CreateRecipeDto {
  name: string;
  description: string;
  imageUrls: string[];
  ingredients: Ingredient[];
  steps: Step[];
  totalTime: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface UpdateRecipeDto extends Partial<CreateRecipeDto> {}

export interface CreateCollectionDto {
  name: string;
  description: string;
  recipeIds: string[];
}

export interface UpdateCollectionDto extends Partial<CreateCollectionDto> {}
