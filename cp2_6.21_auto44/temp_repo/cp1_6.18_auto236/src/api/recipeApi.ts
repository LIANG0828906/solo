import axios from 'axios';

export interface Ingredient {
  id: string;
  name: string;
  category: 'vegetable' | 'seafood' | 'staple' | 'meat';
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  cookTime: number;
  matchPercentage: number;
  missingIngredients: string[];
  existingIngredients: string[];
}

export interface RecommendResponse {
  recipes: Recipe[];
}

const api = axios.create({
  baseURL: '/api',
  timeout: 2000,
});

export const getRecommendations = async (ingredients: string[]): Promise<Recipe[]> => {
  const response = await api.post<RecommendResponse>('/guess', { ingredients });
  return response.data.recipes;
};

export const getAllRecipes = async (): Promise<Recipe[]> => {
  const response = await api.get<RecommendResponse>('/recipes');
  return response.data.recipes;
};

export const addIngredientApi = async (name: string): Promise<{ success: boolean }> => {
  return { success: true };
};
