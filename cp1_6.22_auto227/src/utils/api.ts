import type {
  InventoryItem,
  Recipe,
  RecipeRecommendation,
  CookingHistory,
} from './types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getInventory(): Promise<InventoryItem[]> {
  return request<InventoryItem[]>('/inventory');
}

export function addInventory(
  item: Omit<InventoryItem, 'id' | 'createdAt'>
): Promise<InventoryItem> {
  return request<InventoryItem>('/inventory', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function deleteInventory(id: string): Promise<void> {
  return request<void>(`/inventory/${id}`, {
    method: 'DELETE',
  });
}

export function getRecipes(): Promise<Recipe[]> {
  return request<Recipe[]>('/recipes');
}

export function getRecipeById(id: string): Promise<Recipe> {
  return request<Recipe>(`/recipes/${id}`);
}

export function getRecommendations(): Promise<RecipeRecommendation[]> {
  return request<RecipeRecommendation[]>('/recommendations');
}

export function getHistory(): Promise<CookingHistory[]> {
  return request<CookingHistory[]>('/history');
}

export function addHistory(
  history: Omit<CookingHistory, 'id'>
): Promise<CookingHistory> {
  return request<CookingHistory>('/history', {
    method: 'POST',
    body: JSON.stringify(history),
  });
}
