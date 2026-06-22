import type {
  Ingredient,
  Recipe,
  ShoppingItem,
  ShoppingListData,
} from '../types';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchIngredients(): Promise<Ingredient[]> {
  return request<Ingredient[]>('/api/ingredients');
}

export function addIngredient(
  data: Omit<Ingredient, 'id' | 'createdAt'>
): Promise<Ingredient> {
  return request<Ingredient>('/api/ingredients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateIngredient(
  id: string,
  data: Partial<Omit<Ingredient, 'id' | 'createdAt'>>
): Promise<Ingredient> {
  return request<Ingredient>(`/api/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteIngredient(id: string): Promise<void> {
  return request<void>(`/api/ingredients/${id}`, {
    method: 'DELETE',
  });
}

export function recommendRecipes(
  ingredients: Ingredient[],
  preferences: string[]
): Promise<Recipe[]> {
  return request<Recipe[]>('/api/recipes', {
    method: 'POST',
    body: JSON.stringify({ ingredients, preferences }),
  });
}

export function saveShoppingList(data: {
  recipeId: string;
  recipeName: string;
  items: ShoppingItem[];
}): Promise<{ id: string }> {
  return request<{ id: string }>('/api/shopping-list', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getSharedShoppingList(
  id: string
): Promise<ShoppingListData | null> {
  return request<ShoppingListData | null>(`/api/shopping-list/${id}`);
}
