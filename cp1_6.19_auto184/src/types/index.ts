export type IngredientCategory = 'vegetables' | 'meat' | 'seasoning' | 'drygoods' | 'other';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  name: string;
  coverColor: string;
  ingredients: Ingredient[];
  steps: string[];
  createdAt: Date;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  checked: boolean;
  sourceRecipes: string[];
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

export interface CategoryGroup {
  category: IngredientCategory;
  categoryName: string;
  items: GroceryItem[];
}
