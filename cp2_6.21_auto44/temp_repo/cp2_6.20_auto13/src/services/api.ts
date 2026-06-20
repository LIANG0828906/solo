import axios from 'axios';
import type { Recipe, FavoriteFolder, VersionSnapshot, ReplacementSuggestion, NutritionData, Ingredient } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const recipeApi = {
  list: (params?: { page?: number; search?: string; difficulty?: string }) =>
    api.get<{ recipes: Recipe[]; total: number }>('/recipes', { params }),
  get: (id: string) => api.get<Recipe>(`/recipes/${id}`),
  create: (data: Partial<Recipe>) => api.post<Recipe>('/recipes', data),
  update: (id: string, data: Partial<Recipe>) => api.put<Recipe>(`/recipes/${id}`, data),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  getVersions: (id: string) => api.get<{ versions: VersionSnapshot[] }>(`/recipes/${id}/versions`),
  rate: (id: string, rating: number) => api.post<{ avgRating: number; distribution: number[] }>(`/recipes/${id}/ratings`, { rating }),
  inviteCollaborator: (id: string, identifier: string) =>
    api.post(`/recipes/${id}/collaborators`, { email: identifier }),
  removeCollaborator: (recipeId: string, userId: string) =>
    api.delete(`/recipes/${recipeId}/collaborators/${userId}`),
};

export const nutritionApi = {
  calculate: (ingredients: Pick<Ingredient, 'name' | 'amount' | 'unit'>[]) =>
    api.post<NutritionData>('/nutrition/calculate', { ingredients }),
  getReplacements: (ingredientName: string) =>
    api.get<{ replacements: ReplacementSuggestion[] }>(`/ingredients/${encodeURIComponent(ingredientName)}/replacements`),
};

export const favoriteApi = {
  list: () => api.get<FavoriteFolder[]>('/favorites'),
  create: (name: string) => api.post<FavoriteFolder>('/favorites', { name }),
  rename: (id: string, name: string) => api.patch<FavoriteFolder>(`/favorites/${id}`, { name }),
  delete: (id: string) => api.delete(`/favorites/${id}`),
  addRecipe: (folderId: string, recipeId: string) =>
    api.post(`/favorites/${folderId}/recipes/${recipeId}`),
  removeRecipe: (folderId: string, recipeId: string) =>
    api.delete(`/favorites/${folderId}/recipes/${recipeId}`),
};

export default api;
