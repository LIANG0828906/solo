export interface Ingredient {
  name: string;
  quantity: string;
  category: string;
}

export interface Recipe {
  id: number;
  name: string;
  duration: number;
  difficulty: string;
  image_url: string | null;
  steps: string | null;
  ingredients: Ingredient[];
  matched_ingredients?: string[];
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}
