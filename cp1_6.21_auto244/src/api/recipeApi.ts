import axios from 'axios';
import type { Recipe, RecipeSummary, ImproveRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const recipeApi = {
  async getRecipes(): Promise<RecipeSummary[]> {
    const response = await api.get<RecipeSummary[]>('/recipes');
    return response.data;
  },

  async getRecipe(id: string): Promise<Recipe> {
    const response = await api.get<Recipe>(`/recipes/${id}`);
    return response.data;
  },

  async improveRecipe(id: string, data: ImproveRequest): Promise<Recipe> {
    const response = await api.post<Recipe>(`/recipes/${id}/improve`, data);
    return response.data;
  },
};
