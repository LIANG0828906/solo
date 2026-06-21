import axios from 'axios';
import type { Recipe, ShareInfo, CookTimeRange } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const recipeApi = {
  getRecipes: async (params?: {
    search?: string;
    tags?: string;
    cookTimeRange?: CookTimeRange;
  }): Promise<Recipe[]> => {
    const { data } = await api.get('/recipes', { params });
    return data;
  },

  getRecipe: async (id: string): Promise<Recipe> => {
    const { data } = await api.get(`/recipes/${id}`);
    return data;
  },

  createRecipe: async (formData: FormData): Promise<Recipe> => {
    const { data } = await api.post('/recipes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  updateRecipe: async (id: string, formData: FormData): Promise<Recipe> => {
    const { data } = await api.put(`/recipes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  deleteRecipe: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/recipes/${id}`);
    return data;
  },

  getSuggestions: async (keyword: string): Promise<string[]> => {
    const { data } = await api.get('/recipes/search/suggestions', {
      params: { keyword }
    });
    return data;
  }
};

export const favoriteApi = {
  getFavorites: async (): Promise<Recipe[]> => {
    const { data } = await api.get('/favorites');
    return data;
  },

  addFavorite: async (id: string): Promise<{ success: boolean; isFavorite: boolean }> => {
    const { data } = await api.post(`/favorites/${id}`);
    return data;
  },

  removeFavorite: async (id: string): Promise<{ success: boolean; isFavorite: boolean }> => {
    const { data } = await api.delete(`/favorites/${id}`);
    return data;
  }
};

export const shareApi = {
  getShareInfo: async (id: string): Promise<ShareInfo> => {
    const { data } = await api.get(`/share/${id}`);
    return data;
  },

  getSharedRecipe: async (id: string): Promise<Recipe> => {
    const { data } = await api.get(`/share/recipe/${id}`);
    return data;
  }
};
