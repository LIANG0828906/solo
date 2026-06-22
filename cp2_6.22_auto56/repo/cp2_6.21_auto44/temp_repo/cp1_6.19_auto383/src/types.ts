export interface Ingredient {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface Step {
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  author: string;
  imageUrl: string;
  ingredients: Ingredient[];
  steps: Step[];
}

export interface MergedIngredient extends Ingredient {
  totalQuantity: number;
  subtotal: number;
  checked: boolean;
  key: string;
}

export interface CategoryGroup {
  category: string;
  ingredients: MergedIngredient[];
}
