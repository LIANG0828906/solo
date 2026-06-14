import type {
  Recipe,
  Comment,
  RecipeListResponse,
  RateResponse,
  AddCommentRequest,
} from './types';

const BASE_URL = '/api';

const buildQueryString = (params: Record<string, string | number | undefined>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const fetchRecipes = (
  category?: string,
  page?: number,
  limit?: number,
): Promise<RecipeListResponse> => {
  const query = buildQueryString({ category, page, limit });
  return fetch(`${BASE_URL}/recipes${query}`).then(handleResponse<RecipeListResponse>);
};

export const fetchRecipe = (id: string): Promise<Recipe> => {
  return fetch(`${BASE_URL}/recipes/${id}`).then(handleResponse<Recipe>);
};

export const rateRecipe = (
  id: string,
  rating: number,
  userId: string,
): Promise<RateResponse> => {
  return fetch(`${BASE_URL}/recipes/${id}/rate`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rating, userId }),
  }).then(handleResponse<RateResponse>);
};

export const fetchComments = (recipeId: string): Promise<Comment[]> => {
  return fetch(`${BASE_URL}/recipes/${recipeId}/comments`).then(handleResponse<Comment[]>);
};

export const addComment = (
  recipeId: string,
  comment: AddCommentRequest,
): Promise<Comment> => {
  return fetch(`${BASE_URL}/recipes/${recipeId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(comment),
  }).then(handleResponse<Comment>);
};

export const fetchRankRecipes = (limit?: number): Promise<Recipe[]> => {
  const query = buildQueryString({ limit });
  return fetch(`${BASE_URL}/rank${query}`).then(handleResponse<Recipe[]>);
};
