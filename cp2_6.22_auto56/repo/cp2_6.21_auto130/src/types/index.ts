export interface User {
  id: string;
  nickname: string;
  avatarUrl: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'vegetable' | 'meat' | 'spice' | 'dairy' | 'grain' | 'seafood' | 'other';
  estimatedPrice?: number;
}

export interface Recipe {
  id: string;
  name: string;
  authorId: string;
  author?: User;
  thumbnail?: string;
  heroImage?: string;
  cookTimeMinutes: number;
  difficulty: 1 | 2 | 3;
  mainIngredients: string[];
  ingredients: Ingredient[];
  steps: string[];
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MealPlanEntry {
  id: string;
  day: WeekDay;
  slot: MealSlot;
  recipeId: string;
  recipe?: Recipe;
  addedBy: string;
}

export type SupermarketZone =
  | 'produce'
  | 'meat_seafood'
  | 'dairy_eggs'
  | 'seasoning'
  | 'staples'
  | 'other';

export interface ShoppingItem {
  ingredientId: string;
  name: string;
  totalQuantity: number;
  unit: string;
  category: Ingredient['category'];
  supermarketZone: SupermarketZone;
  estimatedPrice?: number;
  purchased: boolean;
  purchasedBy?: string;
}

export interface ShoppingList {
  weekStartDate: string;
  items: ShoppingItem[];
  lastUpdatedAt: string;
  updatedBy: string;
}

export interface WsMealPlanUpdated {
  entry: MealPlanEntry | null;
  action: 'add' | 'remove' | 'move';
  by: User;
  fromDay?: WeekDay;
  fromSlot?: MealSlot;
  toDay?: WeekDay;
  toSlot?: MealSlot;
}

export interface WsShoppingListChecked {
  ingredientId: string;
  purchased: boolean;
  by: User;
}

export interface WsToastNotify {
  message: string;
  type: 'info' | 'success' | 'warning';
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}
