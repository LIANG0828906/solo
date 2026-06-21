import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Recipe {
  id: number;
  name: string;
  cookingTime: number;
  steps: string[];
  ingredients: Ingredient[];
  image?: string;
  servings: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
  is_favorite?: boolean;
}

export interface Ingredient {
  id?: number;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  lastUpdated: string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked?: boolean;
}

export interface RecipeParams {
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  is_favorite_only?: boolean;
}

export const getRecipes = (params?: RecipeParams) => {
  return api.get<Recipe[]>('/recipes', { params }).then(res => res.data);
};

export const getRecipe = (id: number) => {
  return api.get<Recipe>(`/recipes/${id}`).then(res => res.data);
};

export const createRecipe = (data: any) => {
  return api.post<Recipe>('/recipes', data).then(res => res.data);
};

export const updateRecipe = (id: number, data: any) => {
  return api.put<Recipe>(`/recipes/${id}`, data).then(res => res.data);
};

export const deleteRecipe = (id: number) => {
  return api.delete<void>(`/recipes/${id}`).then(res => res.data);
};

export const getInventory = () => {
  return api.get<InventoryItem[]>('/inventory').then(res => res.data);
};

export const createInventory = (data: any) => {
  return api.post<InventoryItem>('/inventory', data).then(res => res.data);
};

export const updateInventory = (id: number, data: any) => {
  return api.put<InventoryItem>(`/inventory/${id}`, data).then(res => res.data);
};

export const deleteInventory = (id: number) => {
  return api.delete<void>(`/inventory/${id}`).then(res => res.data);
};

export const getIngredientNames = () => {
  return api.get<string[]>('/ingredients/names').then(res => res.data);
};

export const generateShoppingList = (recipeIds: number[]) => {
  return api.post<ShoppingItem[]>('/shopping-list/generate', { recipeIds }).then(res => res.data);
};

export const toggleFavorite = (id: number) => {
  return api.patch<Recipe>(`/recipes/${id}/favorite`).then(res => res.data);
};

export default api;
