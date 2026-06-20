import { Recipe, RecommendationResult } from './types';

const BASE_URL = '';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`请求失败: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
  }
  return await response.json() as T;
}

export async function getRecipes(): Promise<Recipe[]> {
  const response = await fetch(`${BASE_URL}/api/recipes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<Recipe[]>(response);
}

export async function uploadRecipe(data: Omit<Recipe, 'id' | 'likes'>): Promise<Recipe> {
  const response = await fetch(`${BASE_URL}/api/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Recipe>(response);
}

export async function getRecommendations(ingredients: string[]): Promise<RecommendationResult[]> {
  const queryParam = ingredients.join(',');
  const response = await fetch(`${BASE_URL}/api/recommend?ingredients=${encodeURIComponent(queryParam)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<RecommendationResult[]>(response);
}

export async function likeRecipe(id: string): Promise<Recipe> {
  const response = await fetch(`${BASE_URL}/api/recipes/${encodeURIComponent(id)}/like`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<Recipe>(response);
}
