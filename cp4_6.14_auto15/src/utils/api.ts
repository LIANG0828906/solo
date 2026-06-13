import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  Recipe,
  RecipeListResponse,
  Comment,
  IngredientDetail,
} from '../types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export interface GetRecipesParams {
  page?: number;
  pageSize?: number;
  cuisine?: string;
  difficulty?: string;
  keyword?: string;
}

export function getRecipes(params?: GetRecipesParams): Promise<RecipeListResponse> {
  return api.get('/recipes', { params });
}

export function getRecipeById(id: string): Promise<Recipe> {
  return api.get(`/recipes/${id}`);
}

export function getComments(recipeId: string): Promise<Comment[]> {
  return api.get(`/recipes/${recipeId}/comments`);
}

export interface PostCommentData {
  author: string;
  content: string;
  rating: number;
}

export function postComment(recipeId: string, data: PostCommentData): Promise<Comment> {
  return api.post(`/recipes/${recipeId}/comments`, data);
}

export function postRating(recipeId: string, rating: number): Promise<{ rating: number; ratingCount: number }> {
  return api.post(`/recipes/${recipeId}/rating`, { rating });
}

export function getIngredientDetail(name: string): Promise<IngredientDetail> {
  return api.get('/ingredients/detail', { params: { name } });
}

export function getRecommendations(recipeId: string): Promise<Recipe[]> {
  return api.get(`/recipes/${recipeId}/recommendations`);
}

export default api;
