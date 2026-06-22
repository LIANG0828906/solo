import type { Recipe, RecipeSummary, CreateRecipeRequest } from '../../types';

const BASE_URL = '/api/recipes';

export async function getRecipes(search?: string): Promise<RecipeSummary[]> {
  const url = search ? `${BASE_URL}?search=${encodeURIComponent(search)}` : BASE_URL;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }
  return response.json();
}

export async function getRecipe(id: string): Promise<Recipe> {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Recipe not found');
    }
    throw new Error('Failed to fetch recipe');
  }
  return response.json();
}

export async function createRecipe(data: CreateRecipeRequest): Promise<{ id: string }> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create recipe' }));
    throw new Error(errorData.error || 'Failed to create recipe');
  }
  return response.json();
}

export async function likeRecipe(id: string): Promise<{ likes: number }> {
  const response = await fetch(`${BASE_URL}/${id}/like`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to like recipe');
  }
  return response.json();
}
