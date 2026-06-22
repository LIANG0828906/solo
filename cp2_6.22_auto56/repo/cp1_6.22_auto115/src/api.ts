import axios from 'axios';
import type { Recipe, User } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const recipeApi = {
  async getRecipes(search?: string, category?: string): Promise<Recipe[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const res = await api.get('/recipes', { params });
    return res.data;
  },

  async getRecipe(id: string): Promise<Recipe> {
    const res = await api.get(`/recipes/${id}`);
    return res.data;
  },

  async uploadRecipe(data: {
    name: string;
    category: string;
    cookTime: number;
    steps: string[];
    ingredients: { name: string; amount: string }[];
    authorId: string;
  }): Promise<Recipe> {
    const res = await api.post('/recipes', data);
    return res.data;
  },

  async rateRecipe(
    id: string,
    data: { userId: string; userName: string; score: number; comment: string }
  ): Promise<Recipe> {
    const res = await api.post(`/recipes/${id}/rate`, data);
    return res.data;
  },
};

export const userApi = {
  async login(name: string): Promise<User> {
    const res = await api.post('/login', { name });
    return res.data;
  },
};
