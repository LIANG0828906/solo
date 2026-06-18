import axios from 'axios';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
  created_at: string;
}

export interface RecipesListResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  page_size: number;
}

export interface RecipeCreateRequest {
  title: string;
  description: string;
  image_url: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
}

export interface Favorite {
  id: string;
  recipe_id: string;
  created_at: string;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const recipesApi = {
  async getRecipes(params?: {
    tags?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<RecipesListResponse> {
    try {
      const response = await api.get('/recipes', { params });
      return response.data;
    } catch {
      return {
        recipes: [],
        total: 0,
        page: params?.page ?? 1,
        page_size: params?.page_size ?? 12,
      };
    }
  },

  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const response = await api.get(`/recipes/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getRandomRecipe(): Promise<Recipe | null> {
    try {
      const response = await api.get('/recipes/random');
      return response.data;
    } catch {
      return null;
    }
  },

  async addRecipe(data: RecipeCreateRequest): Promise<Recipe | null> {
    try {
      const response = await api.post('/recipes', data);
      return response.data;
    } catch {
      return null;
    }
  },

  async addFavorite(recipe_id: string): Promise<Favorite | null> {
    try {
      const response = await api.post('/favorites', { recipe_id });
      return response.data;
    } catch {
      return null;
    }
  },

  async removeFavorite(id: string): Promise<boolean> {
    try {
      await api.delete(`/favorites/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getFavorites(): Promise<Favorite[]> {
    try {
      const response = await api.get('/favorites');
      return response.data;
    } catch {
      return [];
    }
  },

  async getRecommendations(): Promise<Recipe[]> {
    try {
      const response = await api.get('/recommendations');
      return response.data;
    } catch {
      return [];
    }
  },
};
