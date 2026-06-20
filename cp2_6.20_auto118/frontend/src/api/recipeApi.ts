import axios from 'axios';
import { Ingredient, Recipe, MealPlan, DailyGoal, DailySummary } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getIngredients = async (search?: string): Promise<Ingredient[]> => {
  const response = await api.get('/ingredients', { params: { search } });
  return response.data;
};

export const getRecipes = async (params?: {
  cuisine?: string;
  maxCookTime?: number;
  difficulty?: number;
  search?: string;
  favorite?: boolean;
}): Promise<Recipe[]> => {
  const response = await api.get('/recipes', { params });
  return response.data;
};

export const getRecipe = async (id: string): Promise<Recipe> => {
  const response = await api.get(`/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (data: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> => {
  const response = await api.post('/recipes', data);
  return response.data;
};

export const updateRecipe = async (id: string, data: Partial<Recipe>): Promise<Recipe> => {
  const response = await api.put(`/recipes/${id}`, data);
  return response.data;
};

export const deleteRecipe = async (id: string): Promise<void> => {
  await api.delete(`/recipes/${id}`);
};

export const toggleFavorite = async (id: string): Promise<Recipe> => {
  const response = await api.post(`/recipes/${id}/favorite`);
  return response.data;
};

export const getMealPlans = async (weekStart: string): Promise<MealPlan[]> => {
  const response = await api.get('/meal-plans', { params: { weekStart } });
  return response.data;
};

export const addMealPlan = async (data: Omit<MealPlan, 'id'>): Promise<MealPlan> => {
  const response = await api.post('/meal-plans', data);
  return response.data;
};

export const removeMealPlan = async (id: string): Promise<void> => {
  await api.delete(`/meal-plans/${id}`);
};

export const getDailyGoal = async (): Promise<DailyGoal> => {
  const response = await api.get('/daily-goal');
  return response.data;
};

export const updateDailyGoal = async (data: DailyGoal): Promise<DailyGoal> => {
  const response = await api.put('/daily-goal', data);
  return response.data;
};

export const getDailySummary = async (date: string): Promise<DailySummary> => {
  const response = await api.get('/daily-summary', { params: { date } });
  return response.data;
};
