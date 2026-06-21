import type { Recipe, CreateRecipeDto } from './types';

const BASE_URL = '';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const response = await fetch(`${BASE_URL}/api/recipes`);
  return handleResponse<Recipe[]>(response);
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const response = await fetch(`${BASE_URL}/api/recipes/search?q=${encodeURIComponent(query)}`);
  return handleResponse<Recipe[]>(response);
}

export async function createRecipe(data: CreateRecipeDto): Promise<Recipe> {
  const response = await fetch(`${BASE_URL}/api/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Recipe>(response);
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Recipe> {
  const response = await fetch(`${BASE_URL}/api/recipes/${id}/favorite`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isFavorite }),
  });
  return handleResponse<Recipe>(response);
}

export async function deleteRecipe(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${BASE_URL}/api/recipes/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ success: boolean }>(response);
}
