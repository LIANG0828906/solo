export interface Ingredient {
  name: string;
  amount: string;
}

export interface Editor {
  name: string;
  avatar: string;
  editTime: Date;
}

export interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  likes: number;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
  editors: Editor[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  freshnessDays: number;
  lastUpdated: Date;
}

export interface PredictionResult {
  shortageItems: InventoryItem[];
  purchaseList: { name: string; recommendedAmount: number }[];
  healthScore: number;
}

export interface AppState {
  recipes: Recipe[];
  inventory: InventoryItem[];
}

export type AppAction =
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string }
  | { type: 'UPDATE_RECIPE'; payload: Recipe }
  | { type: 'LIKE_RECIPE'; payload: string }
  | { type: 'ADD_INVENTORY'; payload: InventoryItem }
  | { type: 'UPDATE_INVENTORY'; payload: { id: string; quantity?: number; freshnessDays?: number } }
  | { type: 'DELETE_INVENTORY'; payload: string }
  | { type: 'INCREMENT_INVENTORY'; payload: { name: string; amount?: number } }
  | { type: 'DECREMENT_INVENTORY'; payload: string };

export enum EventType {
  INGREDIENT_CLICK = 'ingredient:click',
  INVENTORY_UPDATED = 'inventory:updated',
  RECIPE_LIKED = 'recipe:liked',
}

export interface FlyingIngredient {
  name: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
