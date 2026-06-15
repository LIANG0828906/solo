import axios from 'axios';
import type { Recipe, Experiment } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const recipeApi = {
  getAll: () => api.get<Recipe[]>('/recipes'),
  getById: (id: string) => api.get<Recipe>(`/recipes/${id}`),
  create: (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'latestRating'>) =>
    api.post<Recipe>('/recipes', data),
  update: (id: string, data: Partial<Recipe>) =>
    api.put<Recipe>(`/recipes/${id}`, data),
  delete: (id: string) => api.delete(`/recipes/${id}`),
};

export const experimentApi = {
  getByRecipeId: (recipeId: string) =>
    api.get<Experiment[]>(`/recipes/${recipeId}/experiments`),
  create: (recipeId: string, data: Omit<Experiment, 'id' | 'recipeId' | 'createdAt'>) =>
    api.post<Experiment>(`/recipes/${recipeId}/experiments`, data),
  update: (id: string, data: Partial<Experiment>) =>
    api.put<Experiment>(`/experiments/${id}`, data),
  delete: (id: string) => api.delete(`/experiments/${id}`),
};

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ url: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
