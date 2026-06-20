import axios from 'axios';
import { Recipe, MixStep, ScoreResult } from '../types';

const API_BASE = '/api';

export const recipeApi = {
  getAllRecipes: async (): Promise<Recipe[]> => {
    const response = await axios.get<Recipe[]>(`${API_BASE}/recipes`);
    return response.data;
  },

  getRecipeById: async (id: string): Promise<Recipe> => {
    const response = await axios.get<Recipe>(`${API_BASE}/recipes/${id}`);
    return response.data;
  },

  getRandomRecipe: async (): Promise<Recipe> => {
    const response = await axios.get<Recipe>(`${API_BASE}/recipes/random`);
    return response.data;
  },

  submitScore: async (recipeId: string, steps: MixStep[], totalTime: number): Promise<ScoreResult> => {
    const response = await axios.post<ScoreResult>(`${API_BASE}/score`, {
      recipeId,
      steps,
      totalTime
    });
    return response.data;
  }
};
