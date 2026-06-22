import { Recipe, RecipeDetail, RecipeListResponse, SearchResponse, MatchByIngredientsResponse, CommentsResponse, Comment } from '@/types';

const BASE_URL = '/api';

function getAuthHeader(): { Authorization?: string } {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    register: (username: string, email: string, password: string) =>
      request<{ token: string; user: { id: number; username: string; email: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),

    login: (username: string, password: string) =>
      request<{ token: string; user: { id: number; username: string; email: string; avatar?: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    getMe: () =>
      request<{ id: number; username: string; email: string; avatar?: string }>('/auth/me'),
  },

  recipes: {
    getList: (page = 1, limit = 20, tag?: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (tag) params.append('tag', tag);
      return request<RecipeListResponse>(`/recipes?${params.toString()}`);
    },

    getById: (id: number) =>
      request<RecipeDetail>(`/recipes/${id}`),

    search: (q: string) =>
      request<SearchResponse>(`/recipes/search?q=${encodeURIComponent(q)}`),

    getSuggestions: (prefix: string) =>
      request<{ suggestions: string[] }>(`/recipes/suggestions?prefix=${encodeURIComponent(prefix)}`),

    matchByIngredients: (ingredients: string[]) =>
      request<MatchByIngredientsResponse>('/recipes/match-by-ingredients', {
        method: 'POST',
        body: JSON.stringify({ ingredients }),
      }),

    getAllIngredients: () =>
      request<{ ingredients: string[] }>('/recipes/ingredients'),

    getRelated: (id: number) =>
      request<{ recipes: Recipe[] }>(`/recipes/${id}/related`),

    create: (data: {
      title: string;
      description: string;
      coverImage: string;
      ingredients: { name: string; quantity: string }[];
      steps: { order: number; content: string; image?: string }[];
      tags: string[];
    }) =>
      request<RecipeDetail>('/recipes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    rate: (id: number, rating: number) =>
      request<{ newRating: number; ratingCount: number }>(`/recipes/${id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      }),

    toggleFavorite: (id: number) =>
      request<{ isFavorited: boolean; favoriteCount: number }>(`/recipes/${id}/favorite`, {
        method: 'POST',
      }),

    isFavorited: (id: number) =>
      request<{ isFavorited: boolean }>(`/recipes/${id}/favorite`),
  },

  comments: {
    getByRecipeId: (recipeId: number) =>
      request<CommentsResponse>(`/recipes/${recipeId}/comments`),

    create: (recipeId: number, content: string) =>
      request<Comment>(`/recipes/${recipeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },
};
