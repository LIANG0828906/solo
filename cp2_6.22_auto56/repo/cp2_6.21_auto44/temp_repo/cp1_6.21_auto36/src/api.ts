import { Recipe, InventoryItem, Comment } from './types';

const BASE = '/api';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data as T;
}

export const api = {
  getRecipes: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Recipe[]>(`/recipes${query}`);
  },
  getRecipe: (id: string) => request<Recipe>(`/recipes/${id}`),
  createRecipe: (data: Partial<Recipe>) =>
    request<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
  updateRecipe: (id: string, data: Partial<Recipe>) =>
    request<Recipe>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecipe: (id: string) =>
    request<{ message: string }>(`/recipes/${id}`, { method: 'DELETE' }),
  addComment: (id: string, data: Partial<Comment>) =>
    request<Comment>(`/recipes/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  getComments: (id: string) => request<Comment[]>(`/recipes/${id}/comments`),

  getInventory: () => request<InventoryItem[]>('/inventory'),
  getInventoryItem: (id: string) => request<InventoryItem>(`/inventory/${id}`),
  createInventory: (data: Partial<InventoryItem>) =>
    request<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventory: (id: string, data: Partial<InventoryItem>) =>
    request<InventoryItem>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventory: (id: string) =>
    request<{ message: string }>(`/inventory/${id}`, { method: 'DELETE' }),
  getRecommendedRecipes: () =>
    request<Array<{ recipe: Recipe; canMake: boolean; missingCount: number; ingredientStatus: any[] }>>(
      '/inventory/recommend/recipes'
    ),
  consumeRecipe: (recipeId: string) =>
    request<{ message: string; consumed: any[]; remainingInventory: InventoryItem[] }>(
      `/inventory/consume/recipe/${recipeId}`,
      { method: 'POST' }
    ),
};
